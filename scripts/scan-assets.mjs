#!/usr/bin/env node
/**
 * Broken-image / asset integrity scan for migration slice 2 acceptance.
 * Fails if any `@/assets/...` import lacks a non-empty file, if Lovable
 * CDN/`__l5e` / `.asset.json` refs remain under `src/`, or if `/og-image.png`
 * is missing from `public/`.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, extname, relative } from "node:path";

const root = process.cwd();
const src = join(root, "src");
const assetsDir = join(src, "assets");
const og = join(root, "public", "og-image.png");

const codeExt = new Set([".ts", ".tsx", ".js", ".jsx", ".css", ".md"]);
const badPatterns = [/__l5e/, /\.asset\.json/, /pub-bb2e103a32db4e198524a2e9ed8f35b4\.r2\.dev/];
const importRe = /['"]@\/assets\/([^'"]+)['"]/g;

function walk(dir, out = []) {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) {
      if (name.name === "node_modules" || name.name === ".git") continue;
      walk(p, out);
    } else out.push(p);
  }
  return out;
}

const errors = [];
const imports = new Set();

for (const file of walk(src)) {
  if (!codeExt.has(extname(file))) continue;
  const text = readFileSync(file, "utf8");
  for (const re of badPatterns) {
    if (re.test(text)) errors.push(`Forbidden Lovable/CDN asset ref in ${relative(root, file)}`);
  }
  for (const m of text.matchAll(importRe)) imports.add(m[1]);
}

if (!existsSync(og) || statSync(og).size < 50) {
  errors.push("Missing or empty public/og-image.png");
} else {
  console.log(`OK public/og-image.png (${statSync(og).size} bytes)`);
}

for (const rel of [...imports].sort()) {
  const f = join(assetsDir, rel);
  if (!existsSync(f)) errors.push(`Missing asset file: src/assets/${rel}`);
  else if (statSync(f).size < 50) errors.push(`Empty/too-small asset: src/assets/${rel}`);
  else console.log(`OK src/assets/${rel} (${statSync(f).size} bytes)`);
}

const leftover = existsSync(assetsDir)
  ? readdirSync(assetsDir).filter((n) => n.endsWith(".asset.json"))
  : [];
if (leftover.length) errors.push(`Leftover manifests: ${leftover.join(", ")}`);

if (errors.length) {
  console.error("\nBROKEN_IMAGE_SCAN_FAIL");
  for (const e of errors) console.error(`- ${e}`);
  process.exit(1);
}

console.log(`\nBROKEN_IMAGE_SCAN_PASS (${imports.size} imports checked)`);
