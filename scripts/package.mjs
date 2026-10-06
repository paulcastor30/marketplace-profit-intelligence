import { readFile, mkdir, readdir, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
const manifest = JSON.parse(await readFile("dist/manifest.json", "utf8"));
if (
  manifest.manifest_version !== 3 ||
  manifest.permissions.join(",") !== "storage,sidePanel" ||
  manifest.content_scripts[0].matches.join(",") !== "https://shopee.ph/*"
)
  throw new Error("Unexpected manifest permissions");
const allowed = new Set([
  "manifest.json",
  "sidepanel.html",
  "privacy.html",
  "panel.css",
  "panel.js",
  "background.js",
  "content.js",
  "icons",
  "LICENSE",
]);
for (const name of await readdir("dist")) {
  if (!allowed.has(name))
    throw new Error("Unexpected distribution file: " + name);
}
await mkdir("artifacts", { recursive: true });
await rm(`artifacts/ecommerce-profit-intelligence-${manifest.version}.zip`, {
  force: true,
});
execFileSync(
  "zip",
  [
    "-q",
    "-r",
    "-X",
    `../artifacts/ecommerce-profit-intelligence-${manifest.version}.zip`,
    ".",
  ],
  { cwd: "dist" },
);
console.log(
  `Created artifacts/ecommerce-profit-intelligence-${manifest.version}.zip`,
);
const sourceName = `artifacts/ecommerce-profit-intelligence-source-${manifest.version}.zip`;
await rm(sourceName, { force: true });
execFileSync("zip", [
  "-q",
  "-r",
  "-X",
  sourceName,
  "src",
  "public",
  "scripts",
  "tests",
  "e2e",
  "docs",
  ".github",
  ".gitignore",
  "LICENSE",
  "README.md",
  "CONTRIBUTING.md",
  "CODE_OF_CONDUCT.md",
  "SECURITY.md",
  "CHANGELOG.md",
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "tsconfig.json",
  "eslint.config.js",
  "vitest.config.ts",
  "playwright.config.ts",
  "release-gate.json",
  "-x",
  "tests/.generated/*",
]);
console.log(`Created ${sourceName}`);
