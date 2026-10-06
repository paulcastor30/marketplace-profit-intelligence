import type { MarketplaceAdapter } from "../types";
import { extractProduct, supportedPage } from "./parser";
export const ShopeePhilippinesAdapter: MarketplaceAdapter = {
  id: "shopee-ph",
  name: "Shopee Philippines",
  country: "PH",
  currency: "PHP",
  isSupportedPage: supportedPage,
  extractProduct,
  getFeeConfiguration: () => null,
};
