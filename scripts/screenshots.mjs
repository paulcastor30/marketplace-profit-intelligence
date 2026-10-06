import { chromium } from "@playwright/test";
import { resolve } from "node:path";
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
  });
  await page.goto("file://" + resolve("dist/sidepanel.html"));
  await page.screenshot({ path: "docs/chrome-web-store/setup.png" });
  await page.locator("#price").fill("1000");
  await page.locator("#productCost").fill("500");
  await page.locator("#categoryPreset").selectOption("Cameras & Drones");
  await page.locator("#reviewed").check();
  await page.locator("#fees summary").click();
  await page.getByRole("button", { name: "Calculate my profit" }).click();
  await page.locator("#results").scrollIntoViewIfNeeded();
  await page.screenshot({ path: "docs/chrome-web-store/calculator.png" });
  await page.getByText("Try a promotion", { exact: true }).click();
  await page
    .getByRole("button", { name: "Set promotion to 20 percent" })
    .click();
  await page.locator("#promotion-result").scrollIntoViewIfNeeded();
  await page.screenshot({ path: "docs/chrome-web-store/promotion.png" });
  await page.setViewportSize({ width: 440, height: 280 });
  await page.setContent(
    '<html lang="en"><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;padding:25px;background:#194c42;color:#fff;font:17px/1.5 system-ui}small{color:#d7e7df}h1{font-size:32px;line-height:1.1;letter-spacing:-1px}p{max-width:350px}</style><small>FREE & OPEN SOURCE · LOCAL CALCULATIONS</small><h1>Know what<br>you may earn.</h1><p>Profit Intelligence<br>Shopee Philippines only</p></html>',
  );
  await page.screenshot({ path: "docs/chrome-web-store/promo-tile.png" });
  console.log("Saved actual UI screenshots and original promotional tile.");
} finally {
  await browser.close();
}
