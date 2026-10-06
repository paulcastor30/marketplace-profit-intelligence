import { build } from "esbuild";
import { mkdir, rm, cp } from "node:fs/promises";
await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
await cp("public", "dist", { recursive: true });
await build({
  entryPoints: {
    panel: "src/ui/panel.ts",
    background: "src/extension/background.ts",
    content: "src/extension/content.ts",
  },
  outdir: "dist",
  bundle: true,
  target: "chrome116",
  minify: true,
  legalComments: "none",
});
