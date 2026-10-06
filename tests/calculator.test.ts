import { describe, it, expect } from "vitest";
import {
  calculate,
  advanced,
  priceForMargin,
  promote,
} from "../src/domain/calculator";
import {
  parseMoney,
  percent,
  formatMoney,
  formatPercent,
} from "../src/domain/money";
import {
  feeConfiguration,
  rule,
} from "../src/marketplaces/shopee-ph/fee-config";
import type { OrderInput, FeeConfiguration } from "../src/domain/types";
const order: OrderInput = {
  price: 100000,
  quantity: 1,
  productCost: 50000,
  packaging: 1000,
  advertising: 2000,
  discount: 0,
  shipping: 0,
  buyerShipping: 0,
  affiliateBps: 0,
  affiliateFixed: 0,
  miscellaneous: 0,
  targetBps: 2000,
};
const config: FeeConfiguration = {
  version: "test",
  verifiedOn: "2026-10-07",
  sellerType: "marketplace",
  category: "test",
  reviewed: true,
  rules: [],
};
describe("auditable financial vectors", () => {
  it("ordinary sale, margin, explicit ROI base and line reconciliation", () => {
    const r = calculate(order, config);
    expect(r.profit).toBe(47000);
    expect(r.margin).toBe(47);
    expect(r.roi).toBeCloseTo((47000 / 53000) * 100);
    expect(r.lines.reduce((s, l) => s + l.amount, 0) + r.profit).toBe(r.gross);
  });
  it("verified peso rounding differs from centavo rounding", () => {
    const f = feeConfiguration({
      sellerType: "marketplace",
      category: "manual",
      commission: 0,
      growth: 0,
      platformShipping: 0,
      shippingCap: null,
      program: 0,
      programCap: null,
      transaction: 224,
      processingWaived: false,
      reviewed: true,
    });
    const r = calculate(order, f);
    expect(r.fees.find((f) => f.label === "Transaction fee")?.amount).toBe(
      2200,
    );
    expect(r.fees.find((f) => f.label === "Order processing fee")?.amount).toBe(
      500,
    );
    expect(r.profit).toBe(44300);
  });
  it("half-peso rounding boundary", () => {
    const tx = {
      ...rule("tx", "tx", 100, 0, "buyer"),
      rounding: "peso" as const,
    };
    for (const [price, amount] of [
      [4999, 0],
      [5000, 100],
      [5001, 100],
    ])
      expect(
        calculate({ ...order, price: price! }, { ...config, rules: [tx] })
          .fees[0]?.amount,
      ).toBe(amount);
  });
  it("commission base rounded to pesos before applying rate", () => {
    expect(
      calculate(
        { ...order, price: 1050 },
        { ...config, rules: [rule("c", "commission", 1000)] },
      ).fees[0]?.amount,
    ).toBe(110);
  });
  it("fixed per order versus per item, minimum and cap", () => {
    const r = calculate(
      { ...order, quantity: 3 },
      {
        ...config,
        rules: [
          { ...rule("cap", "cap", 1000), scope: "item", cap: 5000 },
          { ...rule("minimum", "minimum", 0), min: 800 },
          { ...rule("fixed", "fixed", 0, 500), scope: "order" },
        ],
      },
    );
    expect(r.fees.map((f) => f.amount)).toEqual([15000, 800, 500]);
  });
  it("per-item fixed, zero cap and minimum without cap", () => {
    expect(
      calculate(
        { ...order, quantity: 2 },
        {
          ...config,
          rules: [
            { ...rule("f", "f", 0, 500), scope: "item" },
            { ...rule("z", "z", 5000), cap: 0 },
          ],
        },
      ).fees.map((f) => f.amount),
    ).toEqual([1000, 0]);
  });
  it("seller voucher deducted once, platform rebate not modeled, buyer shipping only in transaction base", () => {
    const r = calculate(
      { ...order, discount: 10000, buyerShipping: 5000 },
      {
        ...config,
        rules: [
          rule("c", "commission", 1000),
          rule("t", "transaction", 224, 0, "buyer"),
        ],
      },
    );
    expect(r.settlement).toBe(90000);
    expect(r.fees.map((f) => f.amount)).toEqual([9000, 2128]);
    expect(r.profit).toBe(25872);
  });
  it("affiliate percent and fixed payment on post-voucher amount", () => {
    const r = calculate(
      { ...order, discount: 10000, affiliateBps: 1000, affiliateFixed: 500 },
      config,
    );
    expect(r.lines.find((l) => l.label === "Affiliate")?.amount).toBe(9500);
    expect(r.invested).toBe(53500);
  });
  it.each([100, 10000, 10000000])(
    "low and high prices %i never leak nonfinite values",
    (price) => {
      const r = calculate(
        { ...order, price, productCost: 0, advertising: 0, packaging: 0 },
        config,
      );
      expect(Number.isFinite(r.profit)).toBe(true);
      expect(r.profit).toBe(price);
    },
  );
  it("zero revenue, investment and ad budget safely reported", () => {
    const r = calculate(
      { ...order, price: 0, productCost: 0, packaging: 0, advertising: 0 },
      config,
    );
    expect(r.margin).toBeNull();
    expect(r.roi).toBeNull();
    expect(r.status).toBe("POSSIBLE LOSS");
    expect(advanced({ ...order, price: 0 }, config).roas).toBeNull();
  });
  it("low margin and profitable thresholds", () => {
    expect(calculate({ ...order, productCost: 80000 }, config).status).toBe(
      "LOW MARGIN",
    );
    expect(calculate({ ...order, productCost: 77000 }, config).status).toBe(
      "PROFITABLE",
    );
    expect(calculate({ ...order, productCost: 100000 }, config).status).toBe(
      "POSSIBLE LOSS",
    );
  });
  it("promotion recalculates fees and costs", () => {
    const r = promote(
      order,
      { ...config, rules: [rule("c", "c", 1000)] },
      1000,
    );
    expect(r.price).toBe(90000);
    expect(r.estimate.profit).toBe(28000);
    expect(() => promote(order, config, -1)).toThrow();
    expect(() =>
      promote({ ...order, discount: 1000 }, config, 10000),
    ).toThrow();
  });
  it("max ads includes all other costs, current ad spend excluded", () => {
    const a = advanced(order, config);
    expect(a.maxAds).toBe(49000);
    expect(a.roas).toBeCloseTo(100000 / 49000);
  });
  it("fee combinations are evaluated independently", () => {
    const r = calculate(order, {
      ...config,
      rules: [
        rule("commission", "c", 700),
        rule("growth", "g", 100),
        { ...rule("program", "p", 400), cap: 20000 },
      ],
    });
    expect(r.fees.map((f) => f.amount)).toEqual([7000, 1000, 4000]);
  });
  it("quantity multiplies product cost, not order costs", () => {
    const r = calculate({ ...order, quantity: 2 }, config);
    expect(r.gross).toBe(200000);
    expect(r.profit).toBe(97000);
  });
});
describe("conservative rounded inverse prices", () => {
  it("accounts for percentage fees at both zero and target margin", () => {
    const f = { ...config, rules: [rule("c", "c", 1000)] };
    const a = advanced(order, f);
    expect(a.breakEven).toBeGreaterThanOrEqual(58889);
    expect(a.breakEven).toBeLessThan(58910);
    for (const target of [0, 1000, 2000, 3000, 4000]) {
      const price = priceForMargin(order, f, target)!;
      const r = calculate({ ...order, price }, f);
      expect(r.profit * 10000).toBeGreaterThanOrEqual(r.gross * target);
    }
  });
  it("caps allow a target even when uncapped fee rate exceeds it", () => {
    const f = { ...config, rules: [{ ...rule("c", "c", 9000), cap: 5000 }] };
    expect(priceForMargin(order, f, 2000)).not.toBeNull();
  });
  it("reports unattainable prices rather than Infinity", () => {
    const f = { ...config, rules: [rule("all", "all", 10000)] };
    expect(priceForMargin(order, f, 2000)).toBeNull();
    expect(
      priceForMargin({ ...order, productCost: 100000000 }, config, 9999),
    ).toBeNull();
  });
  it("includes seller vouchers, per-item caps and buyer shipping", () => {
    const o = { ...order, quantity: 4, discount: 5000, buyerShipping: 3000 };
    const f = {
      ...config,
      rules: [
        { ...rule("p", "p", 1000), scope: "item" as const, cap: 2000 },
        { ...rule("t", "t", 224, 0, "buyer"), rounding: "peso" as const },
      ],
    };
    const price = priceForMargin(o, f, 3000)!;
    const r = calculate({ ...o, price }, f);
    expect(r.margin).toBeGreaterThanOrEqual(30);
  });
  it("deterministic randomized rounding/cap regressions", () => {
    for (let i = 1; i <= 250; i++) {
      const o = {
        ...order,
        price: i * 1234,
        productCost: i * 213,
        quantity: (i % 7) + 1,
        discount: i,
        affiliateBps: 123,
      };
      const f = {
        ...config,
        rules: [
          { ...rule("t", "t", 224, 0, "buyer"), rounding: "peso" as const },
          { ...rule("c", "c", i % 1500), scope: "item" as const, cap: 5000 },
        ],
      };
      const price = priceForMargin(o, f, 2000)!;
      const result = calculate({ ...o, price }, f);
      expect(result.profit * 10000).toBeGreaterThanOrEqual(result.gross * 2000);
    }
  });
});
describe("invalid inputs fail visibly", () => {
  it.each([
    "",
    "-1",
    "1.999",
    "1e3",
    "NaN",
    "Infinity",
    "1,000",
    "abc",
    "1000001",
  ])("rejects %s", (v) => expect(() => parseMoney(v)).toThrow());
  it("accepts decimal centavos, optional empty and zero", () => {
    expect(parseMoney("12.34")).toBe(1234);
    expect(parseMoney("", true)).toBe(0);
    expect(parseMoney("0")).toBe(0);
    expect(percent("99.99")).toBe(9999);
    expect(() => percent("101")).toThrow();
  });
  it.each([NaN, Infinity, -1, 1.5, 100000001])(
    "rejects engine boundary %s",
    (v) => expect(() => calculate({ ...order, price: v }, config)).toThrow(),
  );
  it("blocks unreviewed, discount excess, quantity, target, invalid rules", () => {
    expect(() => calculate(order, { ...config, reviewed: false })).toThrow();
    expect(() => calculate({ ...order, discount: 100001 }, config)).toThrow();
    for (const quantity of [0, 1001, 1.5])
      expect(() => calculate({ ...order, quantity }, config)).toThrow();
    expect(() => calculate({ ...order, targetBps: 10000 }, config)).toThrow();
    expect(() =>
      calculate(order, {
        ...config,
        rules: [{ ...rule("a", "a", 0), min: 100, cap: 50 }],
      }),
    ).toThrow();
    expect(() =>
      calculate(order, { ...config, rules: Array(31).fill(rule("a", "a", 0)) }),
    ).toThrow();
  });
  it("rejects missing fields and unsafe rule enums", () => {
    expect(() =>
      calculate(
        { ...order, price: undefined } as unknown as OrderInput,
        config,
      ),
    ).toThrow();
    expect(() =>
      calculate(order, {
        ...config,
        rules: [
          {
            ...rule("x", "x", 0),
            base: "invalid",
          } as unknown as FeeConfiguration["rules"][number],
        ],
      }),
    ).toThrow();
  });
  it("safe unavailable formatting", () => {
    expect(formatMoney(null)).toContain("Not available");
    expect(formatPercent(null)).toBe("Not applicable");
    expect(formatPercent(25)).toBe("25.0%");
  });
});
