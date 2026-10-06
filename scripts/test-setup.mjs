import { build } from "esbuild";
export default async function () {
  await build({
    entryPoints: ["src/marketplaces/shopee-ph/parser.ts"],
    bundle: true,
    format: "iife",
    globalName: "testParser",
    outfile: "tests/.generated/parser.js",
  });
}
