import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./scripts/test-setup.mjs",
  timeout: 30000,
  workers: 1,
  use: { headless: true, viewport: { width: 380, height: 900 } },
  webServer: {
    command: "node scripts/serve.mjs",
    url: "http://127.0.0.1:58763/sidepanel.html",
    reuseExistingServer: false,
  },
});
