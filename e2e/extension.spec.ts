import { test, expect, chromium } from "@playwright/test";
import { resolve } from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
test("loaded MV3 extension: content extraction, worker, local profile, export and deletion", async () => {
  const directory = await mkdtemp(resolve(tmpdir(), "profit-extension-"));
  const extension = resolve("dist");
  const context = await chromium.launchPersistentContext(directory, {
    channel: "chromium",
    headless: true,
    args: [
      `--disable-extensions-except=${extension}`,
      `--load-extension=${extension}`,
    ],
    acceptDownloads: true,
  });
  try {
    const worker =
      context.serviceWorkers()[0] ??
      (await context.waitForEvent("serviceworker"));
    const id = worker.url().split("/")[2]!;
    const errors: string[] = [];
    context.on("page", (p) =>
      p.on("pageerror", (error) => errors.push(error.message)),
    );
    await context.route("https://shopee.ph/**", (route) =>
      route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: '<main><h1>Illustrative test product</h1><span data-testid="product-price">₱1,000</span></main>',
      }),
    );
    const product = await context.newPage();
    await product.goto("https://shopee.ph/product/123/456");
    await expect
      .poll(() =>
        worker.evaluate(async () => {
          const data = await chrome.storage.session.get(null);
          return Object.values(data).some(
            (v) => (v as { price: number }).price === 100000,
          );
        }),
      )
      .toBe(true);
    const panel = await context.newPage();
    await panel.goto(`chrome-extension://${id}/sidepanel.html`);
    await product.bringToFront();
    await expect(panel.locator("#product-name")).toHaveText(
      "Illustrative test product",
    );
    await expect(panel.locator("#price")).toHaveValue("1000.00");
    await panel.locator("#productCost").fill("500");
    await panel.locator("#fees summary").click();
    await panel.locator("#category").fill("Test category");
    for (const key of ["commission", "growth", "platformShipping"])
      await panel.locator("#" + key).fill("0");
    await panel.locator("#reviewed").check();
    await panel.getByRole("button", { name: "Calculate my profit" }).click();
    await expect(panel.locator("#profit")).toHaveText("₱473.00");
    await panel.getByText("Settings, data & about", { exact: true }).click();
    await panel.locator("#save").click();
    await expect(panel.locator("#storage-status")).toContainText(
      "saved on this device",
    );
    const saved = (await worker.evaluate(
      async () => await chrome.storage.local.get("profile"),
    )) as { profile: { values: Record<string, string | boolean> } };
    expect(saved.profile.values.price).toBeUndefined();
    expect(saved.profile.values.productCost).toBeUndefined();
    expect(saved.profile.values.category).toBe("Test category");
    const download = panel.waitForEvent("download");
    await panel.locator("#export").click();
    expect((await download).suggestedFilename()).toBe(
      "profit-intelligence-data.json",
    );
    await panel.reload();
    await product.bringToFront();
    await expect(panel.locator("#category")).toHaveValue("Test category");
    await expect(panel.locator("#productCost")).toHaveValue("");
    await panel.getByText("Settings, data & about", { exact: true }).click();
    await panel.locator("#delete").click();
    await panel.locator("#cancel-delete").click();
    expect(
      (
        await worker.evaluate(
          async () => await chrome.storage.local.get("profile"),
        )
      ).profile,
    ).toBeDefined();
    await panel.locator("#delete").click();
    await panel.locator("#confirm-delete").click();
    await expect(panel.locator("#storage-status")).toContainText(
      "All saved data deleted",
    );
    expect(
      await worker.evaluate(async () => await chrome.storage.local.get(null)),
    ).toEqual({});
    await product.goto("https://shopee.ph/search");
    await expect
      .poll(() =>
        worker.evaluate(
          async () =>
            Object.keys(await chrome.storage.session.get(null)).length,
        ),
      )
      .toBe(0);
    await expect(panel.locator("#price")).toHaveValue("");
    expect(errors).toEqual([]);
  } finally {
    await context.close();
    await rm(directory, { recursive: true, force: true });
  }
});
