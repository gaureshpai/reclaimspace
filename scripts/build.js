import { build } from "esbuild";

await build({
  entryPoints: ["bin/reclaimspace.js"],
  bundle: true,
  minify: true,
  platform: "node",
  format: "esm",
  outfile: "dist/reclaimspace.min.js",
  banner: { js: "#!/usr/bin/env node" },
});
