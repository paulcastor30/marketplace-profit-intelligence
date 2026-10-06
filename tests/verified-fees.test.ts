import { it, expect } from "vitest";
import { CATEGORY_RATES } from "../src/marketplaces/shopee-ph/category-rates";
import { feeConfiguration } from "../src/marketplaces/shopee-ph/fee-config";
import { calculate } from "../src/domain/calculator";
const settings = {
  sellerType: "marketplace",
  category: "Cameras & Drones",
  commission: 850,
  growth: 100,
  platformShipping: 560,
  shippingCap: 10000,
  program: 0,
  programCap: null,
  transaction: 224,
  processingWaived: false,
  reviewed: true,
};
const order = {
  price: 100000,
  quantity: 1,
  productCost: 50000,
  packaging: 0,
  advertising: 0,
  discount: 0,
  shipping: 0,
  buyerShipping: 0,
  affiliateBps: 0,
  affiliateFixed: 0,
  miscellaneous: 0,
  targetBps: 2000,
};
it.each([
  ["Cameras & Drones", 850, 100],
  ["Mobile & Gadgets — Mobile Phones", 850, 100],
  ["Mobile & Gadgets — Accessories", 900, 100],
  ["Computers & Accessories", 900, 100],
  ["Food & Beverages", 950, 100],
  ["Beauty", 1000, 150],
  ["Pets", 1000, 100],
  ["Books & Magazines", 1050, 150],
  ["Women Clothes", 1050, 100],
  ["Travel & Luggage", 1050, 150],
])("primary category vector %s", (category, commission, growth) => {
  expect(CATEGORY_RATES.find((r) => r.category === category)).toEqual({
    category,
    commission,
    growth,
  });
});
it("separate MDV/Live caps, enrollment discount and spike assumption", () => {
  const f = feeConfiguration({ ...settings, mdv: true, live: true });
  const r = calculate(order, f);
  expect(r.fees.find((f) => f.label === "Mega Discount Voucher")?.amount).toBe(
    4000,
  );
  expect(r.fees.find((f) => f.label.startsWith("Live Xtra"))?.amount).toBe(
    2360,
  );
  expect(r.profit).toBe(25840);
  const capped = calculate({ ...order, price: 1000000, quantity: 2 }, f);
  expect(
    capped.fees.find((f) => f.label === "Mega Discount Voucher")?.amount,
  ).toBe(40000);
  expect(capped.fees.find((f) => f.label.startsWith("Live Xtra"))?.amount).toBe(
    20000,
  );
  expect(
    feeConfiguration({ ...settings, mdv: true, spike: true }).rules.find(
      (f) => f.id === "mdv",
    )?.verified,
  ).toBe(false);
  expect(
    calculate(
      order,
      feeConfiguration({ ...settings, mdv: true, spike: true }),
    ).fees.find((f) => f.label === "Mega Discount Voucher")?.amount,
  ).toBe(5000);
});
it("standalone Live, pre-order and new-seller conditions", () => {
  const f = feeConfiguration({
    ...settings,
    live: true,
    preOrder: true,
    newSeller: true,
  });
  const r = calculate(order, f);
  expect(r.fees.find((f) => f.label.startsWith("Live Xtra"))?.amount).toBe(
    3360,
  );
  expect(
    r.fees.find((f) => f.label === "Non-customized pre-order")?.amount,
  ).toBe(2000);
  expect(
    r.fees
      .filter((f) =>
        [
          "Marketplace commission",
          "Seller growth support fee",
          "Order processing fee",
        ].includes(f.label),
      )
      .map((f) => f.amount),
  ).toEqual([0, 0, 0]);
});
it("manual overrides and Mall are never labeled verified commission", () => {
  expect(
    feeConfiguration({ ...settings, commission: 700 }).rules[0]?.verified,
  ).toBe(false);
  expect(
    feeConfiguration({ ...settings, sellerType: "mall", platformShipping: 448 })
      .rules[0]?.verified,
  ).toBe(false);
  expect(
    feeConfiguration({
      ...settings,
      sellerType: "mall",
      platformShipping: 448,
    }).rules.find((f) => f.id === "shipping")?.verified,
  ).toBe(true);
});
