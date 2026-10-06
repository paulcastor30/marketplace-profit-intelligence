import type { ProductSnapshot } from "../types";
import { parseMoney } from "../../domain/money";
export function supportedPage(url: string): boolean {
  try {
    const u = new URL(url);
    return (
      u.protocol === "https:" &&
      u.hostname === "shopee.ph" &&
      (/-i\.\d+\.\d+\/?$/.test(u.pathname) ||
        /^\/product\/\d+\/\d+\/?$/.test(u.pathname))
    );
  } catch {
    return false;
  }
}
export function parseDisplayedPrice(text: string): number | null {
  const normalized = text.replace(/\s/g, "").replace(/^₱/, "");
  if (!/^(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?$/.test(normalized))
    return null;
  try {
    const value = parseMoney(normalized.replaceAll(",", ""));
    return value > 0 ? value : null;
  } catch {
    return null;
  }
}
function visible(node: HTMLElement): boolean {
  if (
    !node.getClientRects().length ||
    node.closest('del, s, [aria-hidden="true"]')
  )
    return false;
  for (
    let current: HTMLElement | null = node;
    current;
    current = current.parentElement
  ) {
    const style = getComputedStyle(current);
    if (
      style.visibility === "hidden" ||
      style.display === "none" ||
      style.opacity === "0"
    )
      return false;
  }
  return true;
}
export function extractProduct(doc: Document, url: string): ProductSnapshot {
  const u = new URL(url);
  u.search = "";
  u.hash = "";
  const result: ProductSnapshot = {
    marketplace: "shopee-ph",
    url: u.href,
    name: "Shopee Philippines product",
    price: null,
    reason:
      "We could not reliably detect the selling price. Please enter it manually.",
  };
  if (!supportedPage(url))
    return {
      ...result,
      reason:
        "Open a Shopee Philippines product, or enter a selling price manually.",
    };
  // Only purpose-specific visible product headings/prices; never body-wide currency matching,
  // hidden metadata, credentials, cookies, private APIs, or network requests.
  const heading = doc.querySelector('main h1, [role="main"] h1, h1');
  if (heading instanceof HTMLElement && visible(heading))
    result.name = (heading.innerText || "").trim().slice(0, 180) || result.name;
  const nodes = [
    ...doc.querySelectorAll(
      '[data-testid="product-price"], [itemprop="price"], .product-price',
    ),
  ];
  const prices = new Set<number>();
  for (const node of nodes) {
    if (!(node instanceof HTMLElement) || !visible(node)) continue;
    const price = parseDisplayedPrice(node.innerText);
    if (price === null) return result;
    prices.add(price);
  }
  if (prices.size === 1) {
    result.price = [...prices][0] ?? null;
    result.reason =
      "Detected a displayed price. Check the selected variant and seller-funded discounts before calculating.";
  }
  return result;
}
