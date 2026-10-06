export const MAX_MONEY = 100_000_000; // ₱1m per monetary field.
export function parseMoney(text: string, optional = false): number {
  if (optional && text.trim() === "") return 0;
  if (!/^\d+(\.\d{1,2})?$/.test(text.trim()))
    throw new Error(
      "Enter a positive amount or zero, using at most two decimal places.",
    );
  const [whole = "", fraction = ""] = text.trim().split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents > MAX_MONEY)
    throw new Error("Enter an amount no higher than ₱1,000,000.");
  return cents;
}
export function integer(value: number, max: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 0 || value > max)
    throw new Error(
      `Check ${name}: use a valid value within the supported range.`,
    );
}
export function percent(text: string, max = 100): number {
  const value = parseMoney(text);
  if (value > max * 100)
    throw new Error(`Enter a percentage from 0 to ${max}.`);
  return value;
}
export function roundedRatio(numerator: bigint, denominator: bigint): number {
  return Number((numerator + denominator / 2n) / denominator);
}
export const formatMoney = (cents: number | null): string =>
  cents === null || !Number.isFinite(cents)
    ? "Not available for these assumptions"
    : new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
      }).format(cents / 100);
export const formatPercent = (value: number | null): string =>
  value === null || !Number.isFinite(value)
    ? "Not applicable"
    : `${value.toFixed(1)}%`;
