import { VERSION } from "../marketplaces/shopee-ph/fee-config";
export interface Profile {
  version: 1;
  feeVersion: string;
  savedOn: string;
  values: Record<string, string | boolean>;
}
export const ALLOWED = [
  "packaging",
  "advertising",
  "discount",
  "shipping",
  "buyerShipping",
  "affiliateFixed",
  "affiliatePercent",
  "miscellaneous",
  "sellerType",
  "category",
  "commission",
  "growth",
  "platformShipping",
  "shippingCap",
  "program",
  "programCap",
  "transaction",
  "processingWaived",
  "reviewed",
  "target",
  "largeText",
  "newSeller",
  "mdv",
  "live",
  "spike",
  "preOrder",
];
export function sanitizeProfile(value: unknown): Profile | null {
  if (!value || typeof value !== "object") return null;
  const p = value as Partial<Profile>;
  if (
    p.version !== 1 ||
    typeof p.savedOn !== "string" ||
    !Number.isFinite(Date.parse(p.savedOn)) ||
    !p.values ||
    typeof p.values !== "object"
  )
    return null;
  const values: Record<string, string | boolean> = {};
  for (const key of ALLOWED) {
    const v = p.values[key];
    if (typeof v === "boolean" || (typeof v === "string" && v.length <= 100))
      values[key] = v;
  }
  if (
    p.feeVersion !== VERSION ||
    Date.now() - Date.parse(p.savedOn) > 30 * 86400000 ||
    Date.parse(p.savedOn) > Date.now()
  )
    values.reviewed = false;
  return { version: 1, feeVersion: VERSION, savedOn: p.savedOn, values };
}
export const storage = {
  async read(): Promise<Profile | null> {
    if (!globalThis.chrome?.storage) return null;
    const data = await chrome.storage.local.get("profile");
    return sanitizeProfile(data.profile);
  },
  async write(profile: Profile): Promise<void> {
    if (!globalThis.chrome?.storage)
      throw new Error("Saving is available inside the Chrome extension.");
    await chrome.storage.local.set({ profile });
  },
  async clear(): Promise<void> {
    if (!globalThis.chrome?.storage)
      throw new Error(
        "Saved data controls are available inside the Chrome extension.",
      );
    await chrome.storage.local.clear();
  },
};
