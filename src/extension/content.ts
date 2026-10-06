import { extractProduct } from "../marketplaces/shopee-ph/parser";
let previous = "";
let timer: ReturnType<typeof setTimeout>;
function update() {
  const product = extractProduct(document, location.href);
  const serialized = JSON.stringify(product);
  if (serialized === previous) return;
  previous = serialized;
  void chrome.runtime.sendMessage({ type: "PRODUCT", product }).catch(() => {
    /* Extension reload: no page-side errors. */
  });
}
const observer = new MutationObserver(() => {
  clearTimeout(timer);
  timer = setTimeout(update, 500);
});
observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
  characterData: true,
  attributes: true,
  attributeFilter: ["class", "style", "aria-hidden"],
});
window.addEventListener("popstate", update);
update();
// Covers SPA history changes that do not mutate the product DOM immediately.
setInterval(update, 2000);
