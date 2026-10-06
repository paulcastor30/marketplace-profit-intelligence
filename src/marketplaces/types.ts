import type { FeeConfiguration } from "../domain/types";
export interface ProductSnapshot {
  marketplace: "shopee-ph";
  url: string;
  name: string;
  price: number | null;
  reason: string;
}
export interface MarketplaceAdapter {
  id: string;
  name: string;
  country: string;
  currency: string;
  isSupportedPage(url: string): boolean;
  extractProduct(document: Document, url: string): ProductSnapshot;
  getFeeConfiguration(): FeeConfiguration | null;
}
