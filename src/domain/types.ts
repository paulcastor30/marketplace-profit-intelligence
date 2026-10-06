export type Money = number; // Integer centavos; bounded and validated at every public entry point.
export interface FeeRule {
  id: string;
  label: string;
  bps: number;
  fixed: Money;
  base: "settlement" | "buyer";
  scope: "order" | "item";
  rounding: "centavo" | "peso";
  min?: Money;
  cap?: Money;
  source: string;
  effectiveDate: string | null;
  verified: boolean;
  sellerTypes?: string[];
  categories?: string[];
  program?: string;
  taxInclusive: boolean;
}
export interface FeeConfiguration {
  version: string;
  verifiedOn: string;
  sellerType: string;
  category: string;
  reviewed: boolean;
  rules: FeeRule[];
}
export interface OrderInput {
  price: Money;
  quantity: number;
  productCost: Money;
  packaging: Money;
  advertising: Money;
  discount: Money;
  shipping: Money;
  buyerShipping: Money;
  affiliateBps: number;
  affiliateFixed: Money;
  miscellaneous: Money;
  targetBps: number;
}
export interface Line {
  label: string;
  amount: Money;
}
export interface Estimate {
  gross: Money;
  settlement: Money;
  costs: Money;
  invested: Money;
  profit: Money;
  margin: number | null;
  roi: number | null;
  fees: Line[];
  lines: Line[];
  status: "PROFITABLE" | "LOW MARGIN" | "POSSIBLE LOSS";
}
