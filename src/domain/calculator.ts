import type { Estimate, FeeConfiguration, FeeRule, OrderInput } from "./types";
import { integer, MAX_MONEY, roundedRatio } from "./money";
export function validate(input: OrderInput, config: FeeConfiguration): void {
  for (const key of [
    "price",
    "quantity",
    "productCost",
    "packaging",
    "advertising",
    "discount",
    "shipping",
    "buyerShipping",
    "affiliateBps",
    "affiliateFixed",
    "miscellaneous",
    "targetBps",
  ] as const)
    integer(
      input[key],
      key === "quantity" ? 1000 : key.endsWith("Bps") ? 10000 : MAX_MONEY,
      key,
    );
  if (input.quantity < 1 || input.targetBps >= 10000)
    throw new Error(
      "Use a quantity from 1 to 1,000 and a target margin below 100%.",
    );
  if (input.discount > input.price * input.quantity)
    throw new Error(
      "Your seller discount cannot be higher than the total selling price.",
    );
  if (!config.reviewed)
    throw new Error("Review fee assumptions before using this estimate.");
  if (config.rules.length > 30) throw new Error("Too many fee assumptions.");
  for (const rule of config.rules) {
    integer(rule.bps, 10000, rule.label);
    integer(rule.fixed, MAX_MONEY, rule.label);
    if (rule.min !== undefined) integer(rule.min, MAX_MONEY, rule.label);
    if (rule.cap !== undefined) integer(rule.cap, MAX_MONEY, rule.label);
    if (rule.min !== undefined && rule.cap !== undefined && rule.min > rule.cap)
      throw new Error("A fee minimum cannot exceed its cap.");
    if (
      !["settlement", "buyer"].includes(rule.base) ||
      !["order", "item"].includes(rule.scope) ||
      !["centavo", "peso"].includes(rule.rounding)
    )
      throw new Error("Review the fee calculation method.");
  }
}
function fee(rule: FeeRule, input: OrderInput, settlement: number): number {
  const base = settlement + (rule.base === "buyer" ? input.buyerShipping : 0);
  const count = rule.scope === "item" ? input.quantity : 1;
  // Identical items; seller discount is allocated equally for per-item assumptions.
  const divisor = BigInt(10000 * count * (rule.rounding === "peso" ? 100 : 1));
  let each =
    roundedRatio(BigInt(base) * BigInt(rule.bps), divisor) *
      (rule.rounding === "peso" ? 100 : 1) +
    rule.fixed;
  each = Math.max(rule.min ?? 0, each);
  each = Math.min(rule.cap ?? Number.MAX_SAFE_INTEGER, each);
  return each * count;
}
export function calculate(
  input: OrderInput,
  config: FeeConfiguration,
): Estimate {
  validate(input, config);
  const gross = input.price * input.quantity;
  const settlement = gross - input.discount;
  const fees = config.rules.map((rule) => {
    const base =
      rule.base === "settlement"
        ? Math.round(settlement / 100) * 100
        : settlement;
    return { label: rule.label, amount: fee(rule, input, base) };
  });
  const affiliate =
    roundedRatio(BigInt(settlement) * BigInt(input.affiliateBps), 10000n) +
    input.affiliateFixed;
  const lines = [
    { label: "Product cost", amount: input.productCost * input.quantity },
    ...fees,
    { label: "Packaging", amount: input.packaging },
    { label: "Advertising", amount: input.advertising },
    { label: "Seller discount", amount: input.discount },
    { label: "Shipping contribution", amount: input.shipping },
    { label: "Affiliate", amount: affiliate },
    { label: "Other costs", amount: input.miscellaneous },
  ];
  const costs = lines.reduce((sum, line) => sum + line.amount, 0);
  const profit = gross - costs;
  const invested =
    input.productCost * input.quantity +
    input.packaging +
    input.advertising +
    input.shipping +
    input.affiliateFixed +
    input.miscellaneous;
  const margin = gross === 0 ? null : (profit / gross) * 100;
  return {
    gross,
    settlement,
    fees,
    lines,
    costs,
    invested,
    profit,
    margin,
    roi: invested === 0 ? null : (profit / invested) * 100,
    status:
      profit <= 0
        ? "POSSIBLE LOSS"
        : profit * 10000 < gross * input.targetBps
          ? "LOW MARGIN"
          : "PROFITABLE",
  };
}
// Conservative envelope removes rounding discontinuities. Prices are estimates,
// no more than the rounding allowance above the continuous break-even root.
function upperCosts(
  input: OrderInput,
  config: FeeConfiguration,
  price: number,
): number {
  const settlement = Math.max(0, price * input.quantity - input.discount);
  const fees = config.rules.reduce((sum, rule) => {
    const count = rule.scope === "item" ? input.quantity : 1;
    const base =
      settlement + (rule.base === "buyer" ? input.buyerShipping : 50);
    const rounding = rule.rounding === "peso" ? 50 : 0.5;
    let each = ((base / count) * rule.bps) / 10000 + rounding + rule.fixed;
    each = Math.max(rule.min ?? 0, each);
    each = Math.min(rule.cap ?? Number.MAX_SAFE_INTEGER, each);
    return sum + each * count;
  }, 0);
  return (
    input.productCost * input.quantity +
    input.packaging +
    input.advertising +
    input.discount +
    input.shipping +
    input.affiliateFixed +
    input.miscellaneous +
    (settlement * input.affiliateBps) / 10000 +
    0.5 +
    fees
  );
}
export function priceForMargin(
  input: OrderInput,
  config: FeeConfiguration,
  targetBps: number,
): number | null {
  validate(input, config);
  integer(targetBps, 9999, "target margin");
  let low = Math.ceil(input.discount / input.quantity),
    high = MAX_MONEY;
  const sufficient = (price: number) =>
    price * input.quantity * (1 - targetBps / 10000) >=
    upperCosts(input, config, price);
  if (!sufficient(high)) return null;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (sufficient(mid)) high = mid;
    else low = mid + 1;
  }
  return low;
}
export function advanced(input: OrderInput, config: FeeConfiguration) {
  const withoutAds = calculate({ ...input, advertising: 0 }, config);
  const maxAds = Math.max(0, withoutAds.profit);
  return {
    breakEven: priceForMargin(input, config, 0),
    targetPrice: priceForMargin(input, config, input.targetBps),
    maxAds,
    roas: maxAds > 0 ? withoutAds.gross / maxAds : null,
  };
}
export function promote(
  input: OrderInput,
  config: FeeConfiguration,
  bps: number,
) {
  integer(bps, 10000, "promotion");
  const price = roundedRatio(BigInt(input.price) * BigInt(10000 - bps), 10000n);
  return { price, estimate: calculate({ ...input, price }, config) };
}
