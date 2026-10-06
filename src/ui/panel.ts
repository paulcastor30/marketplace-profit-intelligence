import { CATEGORY_RATES } from "../marketplaces/shopee-ph/category-rates";
import { calculate, advanced, promote } from "../domain/calculator";
import {
  parseMoney,
  percent,
  formatMoney as money,
  formatPercent,
} from "../domain/money";
import type { OrderInput, FeeConfiguration, Estimate } from "../domain/types";
import {
  feeConfiguration,
  VERIFIED_ON,
  VERSION,
} from "../marketplaces/shopee-ph/fee-config";
import { ALLOWED, storage, type Profile } from "./storage";
import type { ProductSnapshot } from "../marketplaces/types";
function el<T extends HTMLElement = HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error("Missing interface control");
  return node as T;
}
function input(id: string) {
  return el<HTMLInputElement>(id);
}
function text(id: string, value: string) {
  el(id).textContent = value;
}
function addField(
  container: string,
  id: string,
  label: string,
  help: string,
  initial = "",
) {
  const labelNode = document.createElement("label");
  labelNode.htmlFor = id;
  labelNode.textContent = label;
  const control = document.createElement("input");
  control.id = id;
  control.inputMode = "decimal";
  control.value = initial;
  control.defaultValue = initial;
  control.autocomplete = "off";
  control.setAttribute("aria-describedby", id + "-help");
  const note = document.createElement("p");
  note.className = "help";
  note.id = id + "-help";
  note.textContent = help;
  el(container).append(labelNode, control, note);
}
for (const rate of CATEGORY_RATES) {
  const option = document.createElement("option");
  option.value = rate.category;
  option.textContent = rate.category;
  el("categoryPreset").append(option);
}
el("categoryPreset").addEventListener("change", () => {
  const rate = CATEGORY_RATES.find(
    (r) => r.category === value("categoryPreset"),
  );
  if (!rate) return;
  input("sellerType").value = "marketplace";
  input("category").value = rate.category;
  input("commission").value = (rate.commission / 100).toFixed(2);
  input("growth").value = (rate.growth / 100).toFixed(2);
  input("platformShipping").value = "5.60";
  input("shippingCap").value = "100.00";
  input("reviewed").checked = false;
  el<HTMLDetailsElement>("fees").open = true;
  invalidate();
  text("fee-state", "— needs review");
});
for (const [id, label] of [
  ["packaging", "Packaging"],
  ["advertising", "Advertising per order"],
  ["discount", "Extra seller-funded voucher"],
  ["shipping", "Seller shipping contribution"],
  ["buyerShipping", "Shipping paid by buyer"],
  ["affiliateFixed", "Fixed affiliate payment"],
  ["miscellaneous", "Other expenses"],
])
  addField(
    "optional-fields",
    id!,
    `${label} (₱)`,
    id === "buyerShipping"
      ? "Added only to the transaction fee base. Not counted as product revenue."
      : id === "discount"
        ? "Do not enter a discount already included in your selling price."
        : "Per order. Leave blank for zero.",
  );
addField(
  "optional-fields",
  "affiliatePercent",
  "Affiliate payment (%)",
  "Applied after seller vouchers, in addition to any fixed affiliate payment.",
);
for (const [id, label, help, initial] of [
  [
    "commission",
    "Marketplace commission (%)",
    "Use the rate for your category and seller type. Zero only if exempt.",
    "",
  ],
  [
    "growth",
    "Seller growth support fee (%)",
    "Confirm category rate or exemption in Seller Centre.",
    "",
  ],
  [
    "platformShipping",
    "Platform shipping fee (%)",
    "Marketplace fee, separate from your shipping contribution.",
    "",
  ],
  [
    "shippingCap",
    "Platform shipping fee cap per item (₱)",
    "Blank means no cap. Zero means a zero cap.",
    "",
  ],
  [
    "program",
    "Optional program fees (%)",
    "Confirm cashback, voucher, Live and installment program charges. Use only for extra charges beyond the named program checkboxes. Combined rates/caps require identical bases and caps.",
    "0",
  ],
  [
    "programCap",
    "Optional program fee cap per item (₱)",
    "Blank means no cap. Separate program caps cannot be combined; use a confirmed effective rate or include a fixed cost in other expenses.",
    "",
  ],
  [
    "transaction",
    "Transaction fee (%)",
    "Verified standard rate: 2.24%, VAT inclusive. Adjust for applicable installment payments.",
    "2.24",
  ],
])
  addField("fee-fields", id!, label!, help!, initial!);
let latest: {
  order: OrderInput;
  config: FeeConfiguration;
  estimate: Estimate;
} | null = null;
let dirtyPrice = false,
  productKey = "",
  currentSnapshot: ProductSnapshot | null = null;
function value(id: string) {
  return input(id).value;
}
function checked(id: string) {
  return input(id).checked;
}
function monetary(id: string, optional = false) {
  try {
    return parseMoney(value(id), optional);
  } catch (error) {
    input(id).setAttribute("aria-invalid", "true");
    input(id).focus();
    throw new Error(
      `${document.querySelector(`label[for="${id}"]`)?.textContent}: ${(error as Error).message}`,
    );
  }
}
function feeRate(id: string) {
  try {
    return percent(value(id));
  } catch (error) {
    input(id).setAttribute("aria-invalid", "true");
    input(id).focus();
    throw error;
  }
}
function read(): { order: OrderInput; config: FeeConfiguration } {
  for (const node of document.querySelectorAll("[aria-invalid]"))
    node.removeAttribute("aria-invalid");
  const quantity = Number(value("quantity"));
  const order: OrderInput = {
    price: monetary("price"),
    productCost: monetary("productCost"),
    quantity,
    packaging: monetary("packaging", true),
    advertising: monetary("advertising", true),
    discount: monetary("discount", true),
    shipping: monetary("shipping", true),
    buyerShipping: monetary("buyerShipping", true),
    affiliateFixed: monetary("affiliateFixed", true),
    affiliateBps: value("affiliatePercent").trim()
      ? feeRate("affiliatePercent")
      : 0,
    miscellaneous: monetary("miscellaneous", true),
    targetBps: percent(value("target"), 99),
  };
  if (!checked("reviewed")) {
    el<HTMLDetailsElement>("fees").open = true;
    input("commission").focus();
    throw new Error(
      "Review fee assumptions: enter your category rates, check any caps and waivers, then tick the review box.",
    );
  }
  if (!value("category").trim()) {
    el<HTMLDetailsElement>("fees").open = true;
    input("category").focus();
    throw new Error("Enter your product category from Seller Centre.");
  }
  const config = feeConfiguration({
    sellerType: value("sellerType"),
    category: value("category").trim(),
    commission: feeRate("commission"),
    growth: feeRate("growth"),
    platformShipping: feeRate("platformShipping"),
    shippingCap: value("shippingCap").trim() ? monetary("shippingCap") : null,
    program: feeRate("program"),
    programCap: value("programCap").trim() ? monetary("programCap") : null,
    transaction: feeRate("transaction"),
    processingWaived: checked("processingWaived"),
    reviewed: true,
    newSeller: checked("newSeller"),
    mdv: checked("mdv"),
    live: checked("live"),
    spike: checked("spike"),
    preOrder: checked("preOrder"),
  });
  return { order, config };
}
function showError(error: unknown) {
  text(
    "error",
    error instanceof Error
      ? error.message
      : "We could not calculate this estimate. Check your inputs and try again.",
  );
  el("error").hidden = false;
  text(
    "announcement",
    "Calculation needs your attention. " + el("error").textContent,
  );
}
function render(
  order: OrderInput,
  config: FeeConfiguration,
  estimate: Estimate,
) {
  latest = { order, config, estimate };
  el("error").hidden = true;
  el("results").hidden = false;
  text("profit", money(estimate.profit));
  text(
    "unit",
    order.quantity === 1
      ? "per sale"
      : `per order of ${order.quantity} items · ${money(Math.round(estimate.profit / order.quantity))} per item`,
  );
  text("margin", `${formatPercent(estimate.margin)} estimated profit margin`);
  const descriptions = {
    PROFITABLE: "Your estimated selling price leaves a positive margin.",
    "LOW MARGIN":
      "You may still earn a profit, but your estimated margin is below your selected target.",
    "POSSIBLE LOSS":
      "Based on the costs entered, this product may lose money at the current selling price.",
  };
  text("status", `${estimate.profit > 0 ? "✓" : "!"} ${estimate.status}`);
  text(
    "interpretation",
    `${descriptions[estimate.status]} For an order sold at ${money(estimate.gross)}, you may ${estimate.profit < 0 ? "lose" : "keep"} about ${money(Math.abs(estimate.profit))} after the costs included.`,
  );
  text(
    "margin-explanation",
    estimate.margin === null
      ? "Profit margin is not applicable when sales revenue is zero."
      : `About ${money(Math.round(Math.abs(estimate.margin) * 100))} from every ₱100 in sales ${estimate.profit < 0 ? "would be lost" : "remains as estimated profit"}.`,
  );
  el("cost-warning").hidden = order.productCost <= order.price;
  const body = el("breakdown");
  body.replaceChildren();
  for (const line of [
    { label: "Selling price × quantity", amount: estimate.gross },
    ...estimate.lines.map((line) => ({ ...line, amount: -line.amount })),
    { label: "Estimated net profit", amount: estimate.profit },
  ]) {
    const row = document.createElement("tr");
    const label = document.createElement("th");
    label.scope = "row";
    label.textContent = line.label;
    const amount = document.createElement("td");
    amount.textContent = money(line.amount);
    row.append(label, amount);
    body.append(row);
  }
  text(
    "assumption-summary",
    `${config.rules.filter((r) => !r.verified).length} rule(s) use reviewed assumptions. ${config.sellerType} · ${config.category} · ${config.version}. Reference schedule checked on ${VERIFIED_ON}; overrides, account eligibility and unresolved rounding remain your reviewed assumptions. Seller discount is deducted once. Tax credits and income taxes excluded.`,
  );
  const a = advanced(order, config);
  const dl = el("metrics");
  dl.replaceChildren();
  for (const [label, value] of [
    ["Minimum price to avoid a loss (estimated)", money(a.breakEven)],
    [
      "Price needed for your target profit margin (estimated)",
      money(a.targetPrice),
    ],
    ["Maximum ad cost per sale (order)", money(a.maxAds)],
    [
      "Break-even ROAS",
      a.roas === null
        ? "Not attainable with these costs"
        : `${a.roas.toFixed(2)}× sales per peso spent on ads`,
    ],
    ["Return on invested cost (ROI)", formatPercent(estimate.roi)],
  ]) {
    const dt = document.createElement("dt"),
      dd = document.createElement("dd");
    dt.textContent = label!;
    dd.textContent = value!;
    dl.append(dt, dd);
  }
  text(
    "target-result",
    `Estimated price for a ${formatPercent(order.targetBps / 100)} target: ${money(a.targetPrice)}`,
  );
  el("promotion-result").replaceChildren();
  text("promotion-error", "");
  text(
    "announcement",
    `Estimated net profit: ${money(estimate.profit)} ${order.quantity === 1 ? "per sale" : "per order"}. ${estimate.status}. ${formatPercent(estimate.margin)} margin.`,
  );
}
el<HTMLFormElement>("calculator").addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    const { order, config } = read();
    render(order, config, calculate(order, config));
    el("results").focus();
  } catch (error) {
    showError(error);
  }
});
function invalidate() {
  latest = null;
  el("results").hidden = true;
}
el("calculator").addEventListener("input", (event) => {
  invalidate();
  if (event.target === input("price")) dirtyPrice = true;
  if (
    el("fees").contains(event.target as Node) &&
    event.target !== input("reviewed")
  )
    input("reviewed").checked = false;
  text("fee-state", checked("reviewed") ? "— reviewed" : "— needs review");
});
el("apply-target").addEventListener("click", () => {
  if (!latest) return;
  try {
    const targetBps = percent(value("target"), 99);
    const order = { ...latest.order, targetBps };
    render(order, latest.config, calculate(order, latest.config));
  } catch (error) {
    showError(error);
  }
});
function presets(
  container: string,
  field: string,
  values: number[],
  action: string,
) {
  for (const value of values) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = value + "%";
    button.setAttribute("aria-label", `Set ${field} to ${value} percent`);
    button.addEventListener("click", () => {
      input(field).value = String(value);
      el(action).click();
    });
    el(container).append(button);
  }
}
presets("target-presets", "target", [10, 20, 30, 40], "apply-target");
presets("promotion-presets", "promotion", [5, 10, 15, 20], "simulate");
el("simulate").addEventListener("click", () => {
  if (!latest) return;
  try {
    text("promotion-error", "");
    const { order, config, estimate } = latest;
    const promo = promote(order, config, percent(value("promotion")));
    const result = el("promotion-result");
    result.replaceChildren();
    const table = document.createElement("table");
    const caption = document.createElement("caption");
    caption.textContent = "Current price compared with promotion";
    table.append(caption);
    const head = document.createElement("thead"),
      hr = document.createElement("tr");
    for (const label of ["Metric", "Current", "Promotion"]) {
      const th = document.createElement("th");
      th.scope = "col";
      th.textContent = label;
      hr.append(th);
    }
    head.append(hr);
    table.append(head);
    const body = document.createElement("tbody");
    for (const [label, current, next] of [
      ["Selling price", money(order.price), money(promo.price)],
      [
        "Estimated net profit",
        money(estimate.profit),
        money(promo.estimate.profit),
      ],
      [
        "Profit margin",
        formatPercent(estimate.margin),
        formatPercent(promo.estimate.margin),
      ],
      ["ROI", formatPercent(estimate.roi), formatPercent(promo.estimate.roi)],
    ]) {
      const row = document.createElement("tr");
      const th = document.createElement("th");
      th.scope = "row";
      th.textContent = label!;
      row.append(th);
      for (const v of [current, next]) {
        const td = document.createElement("td");
        td.textContent = v!;
        row.append(td);
      }
      body.append(row);
    }
    table.append(body);
    result.append(table);
    if (promo.estimate.status !== "PROFITABLE") {
      const warning = document.createElement("p");
      warning.className = "note";
      warning.textContent =
        "⚠ This promotion may reduce your estimated margin below your target or cause a loss.";
      result.append(warning);
    }
  } catch (error) {
    el("promotion-result").replaceChildren();
    text("promotion-error", (error as Error).message);
  }
});
el("reset").addEventListener("click", () => {
  HTMLFormElement.prototype.reset.call(el<HTMLFormElement>("calculator"));
  for (const node of document.querySelectorAll("[aria-invalid]"))
    node.removeAttribute("aria-invalid");
  el("error").hidden = true;
  invalidate();
  dirtyPrice = false;
  if (currentSnapshot?.price !== null && currentSnapshot?.price !== undefined)
    input("price").value = (currentSnapshot.price / 100).toFixed(2);
  text("announcement", "Calculation reset. Saved defaults are unchanged.");
  input("productCost").focus();
  text("fee-state", "— needs review");
});
input("largeText").addEventListener("change", () =>
  document.documentElement.classList.toggle("large-text", checked("largeText")),
);
function profile(): Profile {
  const values: Record<string, string | boolean> = {};
  for (const key of ALLOWED) {
    const node = input(key);
    values[key] = node.type === "checkbox" ? node.checked : node.value;
  }
  return {
    version: 1,
    feeVersion: VERSION,
    savedOn: new Date().toISOString(),
    values,
  };
}
el("save").addEventListener("click", async () => {
  try {
    read();
    await storage.write(profile());
    text(
      "storage-status",
      "Default costs and fee assumptions saved on this device. Review them for each product category.",
    );
  } catch (error) {
    text("storage-status", (error as Error).message);
  }
});
el("export").addEventListener("click", async () => {
  try {
    const saved = await storage.read();
    const url = URL.createObjectURL(
      new Blob(
        [JSON.stringify(saved ?? { message: "No saved profile" }, null, 2)],
        { type: "application/json" },
      ),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "profit-intelligence-data.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    text(
      "storage-status",
      "Export downloaded. It contains only your saved default costs and preferences.",
    );
  } catch {
    text("storage-status", "We could not export your saved data. Try again.");
  }
});
el("delete").addEventListener("click", () => {
  el("delete-confirm").hidden = false;
  el("confirm-delete").focus();
});
el("cancel-delete").addEventListener("click", () => {
  el("delete-confirm").hidden = true;
  el("delete").focus();
});
el("confirm-delete").addEventListener("click", async () => {
  try {
    await storage.clear();
    el("delete-confirm").hidden = true;
    text(
      "storage-status",
      "All saved data deleted. The current unsaved calculation remains.",
    );
    el("delete").focus();
  } catch {
    text("storage-status", "We could not delete your saved data. Try again.");
  }
});
void storage
  .read()
  .then((saved) => {
    if (!saved) return;
    for (const [key, v] of Object.entries(saved.values)) {
      const node = input(key);
      if (typeof v === "boolean") node.checked = v;
      else node.value = v;
    }
    document.documentElement.classList.toggle(
      "large-text",
      checked("largeText"),
    );
    text(
      "fee-state",
      checked("reviewed") ? "— saved assumptions" : "— needs review",
    );
  })
  .catch(() =>
    text(
      "storage-status",
      "We could not read saved defaults. You can still calculate manually.",
    ),
  );
async function detect() {
  if (!globalThis.chrome?.runtime?.id) return;
  try {
    const product = (await chrome.runtime.sendMessage({
      type: "GET_PRODUCT",
    })) as ProductSnapshot | null;
    const key = product ? `${product.url}|${product.price}` : "";
    if (key === productKey) return;
    const changedProduct = currentSnapshot?.url !== product?.url;
    productKey = key;
    currentSnapshot = product;
    invalidate();
    if (changedProduct) {
      dirtyPrice = false;
      input("productCost").value = "";
      input("reviewed").checked = false;
      text("fee-state", "— needs review");
    }
    text("product-name", product?.name ?? "Manual calculation");
    text(
      "detection",
      product?.reason ??
        "Open a Shopee Philippines product, or enter a selling price manually.",
    );
    if (!dirtyPrice)
      input("price").value = product?.price
        ? (product.price / 100).toFixed(2)
        : "";
  } catch {
    text(
      "detection",
      "We could not read this product. Please enter its selling price manually.",
    );
  }
}
void detect();
setInterval(() => void detect(), 1500);
