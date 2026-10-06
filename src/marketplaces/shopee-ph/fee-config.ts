import {
  CATEGORY_RATES,
  COMMISSION_SOURCE,
  SELLER_SOURCE,
} from "./category-rates";
import type { FeeConfiguration, FeeRule } from "../../domain/types";
export const SOURCE = "https://help.shopee.ph/portal/4/article/77272";
export const VERIFIED_ON = "2026-10-07";
export const VERSION = "ph-2026-10-07.2";
export function rule(
  id: string,
  label: string,
  bps: number,
  fixed = 0,
  base: FeeRule["base"] = "settlement",
  verified = false,
): FeeRule {
  return {
    id,
    label,
    bps,
    fixed,
    base,
    scope: "order",
    rounding: "centavo",
    source: verified ? SOURCE : "Seller-entered assumption",
    effectiveDate: null,
    verified,
    taxInclusive: true,
  };
}
export interface SellerFees {
  sellerType: string;
  category: string;
  commission: number;
  growth: number;
  platformShipping: number;
  shippingCap: number | null;
  program: number;
  programCap: number | null;
  transaction: number;
  processingWaived: boolean;
  reviewed: boolean;
  mdv?: boolean;
  live?: boolean;
  spike?: boolean;
  preOrder?: boolean;
  newSeller?: boolean;
}
export function feeConfiguration(f: SellerFees): FeeConfiguration {
  const transaction = rule(
    "transaction",
    "Transaction fee",
    f.transaction,
    0,
    "buyer",
    f.transaction === 224,
  );
  transaction.rounding = "peso";
  const preset =
    f.sellerType === "marketplace"
      ? CATEGORY_RATES.find((r) => r.category === f.category)
      : undefined;
  const processing = rule(
    "processing",
    "Order processing fee",
    0,
    f.processingWaived || f.newSeller ? 0 : 500,
    "settlement",
    true,
  );
  processing.effectiveDate = "2025-09-03";
  const shipping = rule(
    "shipping",
    "Platform shipping fee",
    f.platformShipping,
  );
  shipping.verified =
    f.platformShipping === (f.sellerType === "marketplace" ? 560 : 448) &&
    f.shippingCap === 10000;
  shipping.source = SELLER_SOURCE;
  shipping.effectiveDate = null;
  shipping.scope = "item";
  if (f.shippingCap !== null) shipping.cap = f.shippingCap;
  const program = rule("program", "Optional program fees", f.program);
  program.scope = "item";
  if (f.programCap !== null) program.cap = f.programCap;
  const growth = rule(
    "growth",
    "Seller growth support fee",
    f.newSeller ? 0 : f.growth,
  );
  growth.verified = !!preset && f.growth === preset.growth && !f.newSeller;
  growth.source = SELLER_SOURCE;
  growth.effectiveDate = "2026-05-11";
  const commission = rule(
    "commission",
    "Marketplace commission",
    f.newSeller ? 0 : f.commission,
  );
  commission.verified =
    !!preset && f.commission === preset.commission && !f.newSeller;
  commission.source = commission.verified
    ? COMMISSION_SOURCE
    : "Seller-entered assumption";
  commission.effectiveDate = commission.verified ? "2025-06-01" : null;
  const mdv = {
    ...rule("mdv", "Mega Discount Voucher", f.mdv ? (f.spike ? 500 : 400) : 0),
    scope: "item" as const,
    cap: 20000,
    source: SELLER_SOURCE,
    verified: !f.spike,
    effectiveDate: "2026-01-01",
  };
  const live = {
    ...rule(
      "live",
      "Live Xtra (livestream order)",
      f.live ? (f.mdv ? 236 : 336) : 0,
    ),
    scope: "item" as const,
    cap: 10000,
    source: SELLER_SOURCE,
    verified: !f.mdv,
    effectiveDate: "2026-01-01",
  };
  const preOrder = {
    ...rule("preorder", "Non-customized pre-order", f.preOrder ? 200 : 0),
    source: SELLER_SOURCE,
    verified: false,
    effectiveDate: "2026-01-01",
  };
  return {
    version: VERSION,
    verifiedOn: VERIFIED_ON,
    sellerType: f.sellerType,
    category: f.category,
    reviewed: f.reviewed,
    rules: [
      commission,
      transaction,
      processing,
      growth,
      shipping,
      program,
      mdv,
      live,
      preOrder,
    ],
  };
}
