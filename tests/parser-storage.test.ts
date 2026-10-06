import { it, expect } from "vitest";
import {
  parseDisplayedPrice,
  supportedPage,
} from "../src/marketplaces/shopee-ph/parser";
import { sanitizeProfile } from "../src/ui/storage";
import { VERSION } from "../src/marketplaces/shopee-ph/fee-config";
it.each(["https://shopee.ph/item-i.1.2", "https://shopee.ph/product/1/2?x=1"])(
  "supports only product URL %s",
  (url) => expect(supportedPage(url)).toBe(true),
);
it.each([
  "http://shopee.ph/item-i.1.2",
  "https://shopee.ph.evil.test/item-i.1.2",
  "https://seller.shopee.ph/product/1/2",
  "https://shopee.ph/search",
  "garbage",
])("rejects unsupported URL %s", (url) =>
  expect(supportedPage(url)).toBe(false),
);
it.each([
  ["₱1,234.50", 123450],
  [" ₱ 799 ", 79900],
  ["₱799–899", null],
  ["12,34", null],
  ["₱0", null],
  ["₱1000001", null],
  ["₱20 after voucher", null],
])("strict price %s", (v, expected) =>
  expect(parseDisplayedPrice(v as string)).toBe(expected),
);
it("profile whitelist excludes prices and URL, stale assumptions lose confirmation", () => {
  const p = sanitizeProfile({
    version: 1,
    feeVersion: "old",
    savedOn: "2025-01-01",
    values: { price: "100", url: "secret", packaging: "20", reviewed: true },
  });
  expect(p?.values).toEqual({ packaging: "20", reviewed: false });
});
it("valid recent profile and invalid profile branches", () => {
  expect(
    sanitizeProfile({
      version: 1,
      feeVersion: VERSION,
      savedOn: new Date().toISOString(),
      values: { reviewed: true, packaging: "20", category: "x".repeat(101) },
    })?.values,
  ).toEqual({ packaging: "20", reviewed: true });
  for (const v of [
    null,
    "x",
    {},
    { version: 1, savedOn: "invalid", values: {} },
    { version: 1, savedOn: new Date().toISOString() },
  ])
    expect(sanitizeProfile(v)).toBeNull();
});
