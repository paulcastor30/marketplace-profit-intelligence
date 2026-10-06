import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
async function fees(page: Page) {
  await page.locator("#fees summary").click();
  await page.locator("#category").fill("Illustrative category");
  for (const [id, v] of [
    ["commission", "7"],
    ["growth", "1"],
    ["platformShipping", "5.6"],
  ])
    await page.locator("#" + id).fill(v!);
  await page.locator("#reviewed").check();
}
async function calculate(page: Page) {
  await page.locator("#price").fill("1000");
  await page.locator("#productCost").fill("500");
  await fees(page);
  await page.getByRole("button", { name: "Calculate my profit" }).click();
}
test.beforeEach(async ({ page }) => {
  await page.goto("http://127.0.0.1:58763/sidepanel.html");
});
test("first use, result interpretation, auditable breakdown and promotion", async ({
  page,
}) => {
  await calculate(page);
  await expect(page.locator("#profit")).toHaveText("₱337.00");
  await expect(page.locator("#status")).toContainText("PROFITABLE");
  await expect(page.locator("#results")).toBeFocused();
  await page.getByText("See how this was calculated", { exact: true }).click();
  await expect(page.locator("#breakdown")).toContainText("Transaction fee");
  await page.getByText("Try a promotion", { exact: true }).click();
  await page
    .getByRole("button", { name: "Set promotion to 20 percent" })
    .click();
  await expect(page.locator("#promotion-result")).toContainText("₱800.00");
  await page.getByText("Show advanced metrics", { exact: true }).click();
  await expect(page.locator("#metrics")).toContainText("Break-even ROAS");
  await page.locator("#productCost").fill("600");
  await expect(page.locator("#results")).toBeHidden();
});
test("review gate, invalid numbers, waiver, reset defaults and no nonfinite output", async ({
  page,
}) => {
  await page.locator("#price").fill("100");
  await page.locator("#productCost").fill("50");
  await page.getByRole("button", { name: "Calculate my profit" }).click();
  await expect(page.locator("#error")).toContainText("Review fee assumptions");
  await page.locator("#category").fill("test");
  for (const id of ["commission", "growth", "platformShipping"])
    await page.locator("#" + id).fill("0");
  await page.locator("#processingWaived").check();
  await page.locator("#reviewed").check();
  await page.locator("#price").fill("-1");
  await page.getByRole("button", { name: "Calculate my profit" }).click();
  await expect(page.locator("#error")).toContainText("Selling price");
  await expect(page.locator("#price")).toHaveAttribute("aria-invalid", "true");
  await page.locator("#price").fill("100");
  await page.getByRole("button", { name: "Calculate my profit" }).click();
  await expect(page.locator("#profit")).toHaveText("₱48.00");
  await page.getByRole("button", { name: "Reset calculation" }).click();
  await expect(page.locator("#results")).toBeHidden();
  await expect(page.locator("#transaction")).toHaveValue("2.24");
  await expect(page.locator("#reviewed")).not.toBeChecked();
  await expect(page.locator("body")).not.toContainText(
    /NaN|Infinity|undefined/,
  );
});
test("automated accessibility at first use and fully expanded results", async ({
  page,
}) => {
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await calculate(page);
  await page.evaluate(() => {
    for (const d of document.querySelectorAll("details")) d.open = true;
  });
  await page.locator("#simulate").click();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
});
test("keyboard-only basic workflow and visible focus", async ({ page }) => {
  async function tabTo(id: string) {
    for (let n = 0; n < 35; n++) {
      await page.keyboard.press("Tab");
      if (
        await page
          .locator("#" + id)
          .evaluate((el) => el === document.activeElement)
      )
        return;
    }
    throw new Error("Keyboard could not reach " + id);
  }
  await page.keyboard.press("Tab");
  await expect(page.getByText("Skip to calculator")).toBeFocused();
  await page.keyboard.press("Enter");
  await tabTo("price");
  await page.keyboard.type("1000");
  await tabTo("productCost");
  await page.keyboard.type("500");
  await tabTo("categoryPreset");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await tabTo("category");
  await page.keyboard.type("Test category");
  for (const [id, v] of [
    ["commission", "7"],
    ["growth", "1"],
    ["platformShipping", "5.6"],
  ]) {
    await tabTo(id!);
    await page.keyboard.type(v!);
  }
  await tabTo("reviewed");
  await page.keyboard.press("Space");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(page.locator("#results")).toBeFocused();
  await expect(page.locator("#profit")).toHaveText("₱337.00");
});
test("200% equivalent reflow, larger text, reduced motion and forced colors", async ({
  page,
}) => {
  await page.setViewportSize({ width: 190, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce", forcedColors: "active" });
  await calculate(page);
  await page.getByText("Settings, data & about", { exact: true }).click();
  await page.locator("#largeText").check();
  await expect(page.locator("#largeText")).toBeChecked();
  const overflow = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("main *")]
      .filter(
        (node) =>
          node.getClientRects().length &&
          node.getBoundingClientRect().right > window.innerWidth + 1,
      )
      .map((node) => ({
        tag: node.tagName,
        id: node.id,
        width: node.getBoundingClientRect().width,
      })),
  );
  expect(overflow, "Controls must fit the zoomed panel").toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.addStyleTag({
    content: ":root {font-family: Arial, sans-serif;}",
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await expect(
    page.getByRole("button", { name: "Calculate my profit" }),
  ).toBeVisible();
});
test("dynamic visible product extraction fails safely for ranges and hidden values", async ({
  page,
}) => {
  await page.goto("http://127.0.0.1:58763/privacy.html");
  await page.addScriptTag({ path: "tests/.generated/parser.js" });
  await page.setContent(
    '<main><h1>Sample</h1><span data-testid="product-price">₱799</span><span style="display:none" itemprop="price">₱1</span></main>',
  );
  const run = () =>
    page.evaluate(() => {
      const parser = (
        window as unknown as {
          testParser: {
            extractProduct: (
              d: Document,
              u: string,
            ) => { price: number | null };
          };
        }
      ).testParser;
      return parser.extractProduct(document, "https://shopee.ph/product/1/2")
        .price;
    });
  expect(await run()).toBe(79900);
  await page.locator("[data-testid=product-price]").evaluate((el) => {
    el.textContent = "₱799–899";
  });
  expect(await run()).toBeNull();
  await page.locator("[data-testid=product-price]").evaluate((el) => {
    el.textContent = "₱899";
  });
  expect(await run()).toBe(89900);
  await page.locator("main").evaluate((el) => {
    el.insertAdjacentHTML(
      "beforeend",
      '<span class="product-price">₱600</span>',
    );
  });
  expect(await run()).toBeNull();
});

test("verified category presets and separately capped named programs", async ({
  page,
}) => {
  await page.locator("#price").fill("1000");
  await page.locator("#productCost").fill("500");
  await page.locator("#categoryPreset").selectOption("Cameras & Drones");
  await expect(page.locator("#commission")).toHaveValue("8.50");
  await expect(page.locator("#growth")).toHaveValue("1.00");
  await expect(page.locator("#shippingCap")).toHaveValue("100.00");
  await page.locator("#reviewed").check();
  await page.getByRole("button", { name: "Calculate my profit" }).click();
  await expect(page.locator("#profit")).toHaveText("₱322.00");
  await page.locator("#mdv").check();
  await page.locator("#live").check();
  await expect(page.locator("#results")).toBeHidden();
  await page.locator("#reviewed").check();
  await page.getByRole("button", { name: "Calculate my profit" }).click();
  await expect(page.locator("#profit")).toHaveText("₱258.40");
});
