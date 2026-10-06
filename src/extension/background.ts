import { supportedPage } from "../marketplaces/shopee-ph/parser";
import type { ProductSnapshot } from "../marketplaces/types";
void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
void chrome.storage.local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" });
void chrome.storage.session.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" });
chrome.runtime.onMessage.addListener((message: unknown, sender, respond) => {
  if (!message || typeof message !== "object" || !("type" in message)) return;
  if (
    message.type === "PRODUCT" &&
    sender.tab?.id !== undefined &&
    sender.id === chrome.runtime.id &&
    sender.url &&
    supportedPage(sender.url)
  ) {
    if (
      !("product" in message) ||
      !message.product ||
      typeof message.product !== "object"
    )
      return;
    const p = message.product as Partial<ProductSnapshot>;
    if (
      typeof p.url !== "string" ||
      p.url !== sender.url.split(/[?#]/)[0] ||
      typeof p.name !== "string" ||
      p.name.length > 180 ||
      !(
        p.price === null ||
        (Number.isSafeInteger(p.price) &&
          (p.price ?? 0) > 0 &&
          (p.price ?? 0) <= 100000000)
      )
    )
      return;
    const safe: ProductSnapshot = {
      marketplace: "shopee-ph",
      url: sender.url.split(/[?#]/)[0]!,
      name: p.name,
      price: p.price ?? null,
      reason:
        p.price === null
          ? "We could not reliably detect the selling price. Please enter it manually."
          : "Detected a displayed price. Check the selected variant and seller discounts.",
    };
    void chrome.storage.session.set({ ["product-" + sender.tab.id]: safe });
    return;
  }
  if (
    message.type === "GET_PRODUCT" &&
    sender.id === chrome.runtime.id &&
    sender.url === chrome.runtime.getURL("sidepanel.html")
  ) {
    void chrome.tabs
      .query({ active: true, currentWindow: true })
      .then(async (tabs) => {
        const id = tabs[0]?.id;
        if (id === undefined) {
          respond(null);
          return;
        }
        const data = await chrome.storage.session.get("product-" + id);
        respond(data["product-" + id] ?? null);
      })
      .catch(() => respond(null));
    return true;
  }
});
chrome.tabs.onRemoved.addListener((id) => {
  void chrome.storage.session.remove("product-" + id);
});
chrome.tabs.onUpdated.addListener((id, change) => {
  if (change.status === "loading" || change.url !== undefined)
    void chrome.storage.session.remove("product-" + id);
});
