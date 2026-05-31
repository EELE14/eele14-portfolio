/* Copyright (c) 2026 eele14. All Rights Reserved. */
import {
  mkdirSync,
  existsSync,
  readFileSync,
  writeFileSync,
  copyFileSync,
} from "fs";
import { transpileModule, ModuleKind, ScriptTarget } from "typescript";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const TESTED_UV_VERSION = "2.0.0";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const uvDist = resolve(
  root,
  "node_modules/@titaniumnetwork-dev/ultraviolet/dist",
);
const uvPublic = resolve(root, "public/uv");
const scripts = resolve(__dirname, "browser");

function compileTs(file: string): string {
  const src = readFileSync(resolve(scripts, file), "utf8");
  return transpileModule(src, {
    compilerOptions: { target: ScriptTarget.ES2017, module: ModuleKind.None },
  }).outputText;
}

const pkg = JSON.parse(
  readFileSync(
    resolve(root, "node_modules/@titaniumnetwork-dev/ultraviolet/package.json"),
    "utf8",
  ),
) as { version: string };
const [installedMajor] = pkg.version.split(".");
const [testedMajor] = TESTED_UV_VERSION.split(".");

if (installedMajor !== testedMajor) {
  console.error(
    `ERROR: UV major version mismatch.\n` +
      `  Tested against: ${TESTED_UV_VERSION}\n` +
      `  Installed:      ${pkg.version}\n` +
      `Verify the uv.handler.js patch still applies, then update TESTED_UV_VERSION.`,
  );
  process.exit(1);
}

if (!existsSync(uvPublic)) mkdirSync(uvPublic, { recursive: true });

const rawFiles = [
  "uv.bundle.js",
  "uv.bundle.js.map",
  "uv.sw.js",
  "uv.sw.js.map",
  "uv.client.js",
  "uv.client.js.map",
];

for (const file of rawFiles) {
  copyFileSync(resolve(uvDist, file), resolve(uvPublic, file));
  console.log(`Copied ${file} → public/uv/${file}`);
}

const PATCH_TARGET =
  '"serviceWorker"in i.navigator&&delete i.Navigator.prototype.serviceWorker';

const PATCH_REPLACEMENT = compileTs("handler-patch.ts")
  .replace(/^\/\*[\s\S]*?\*\/\n?/, "")
  .trimEnd()
  .replace(/;$/, "");

let handlerSrc = readFileSync(resolve(uvDist, "uv.handler.js"), "utf8");

if (!handlerSrc.includes(PATCH_TARGET)) {
  console.error(
    "ERROR: uv.handler.js patch target not found — UV may have changed.\n" +
      "Search for the serviceWorker deletion and update PATCH_TARGET in copy-uv.ts.",
  );
  process.exit(1);
}

handlerSrc = handlerSrc.replace(PATCH_TARGET, PATCH_REPLACEMENT);
writeFileSync(resolve(uvPublic, "uv.handler.js"), handlerSrc);
console.log(
  "Patched uv.handler.js (serviceWorker stub) → public/uv/uv.handler.js",
);

copyFileSync(
  resolve(uvDist, "uv.handler.js.map"),
  resolve(uvPublic, "uv.handler.js.map"),
);
console.log("Copied uv.handler.js.map → public/uv/uv.handler.js.map");

writeFileSync(resolve(uvPublic, "sw.js"), compileTs("sw.ts"));
console.log("Compiled scripts/browser/sw.ts → public/uv/sw.js");

writeFileSync(resolve(uvPublic, "uv.config.js"), compileTs("uv.config.ts"));
console.log("Compiled scripts/browser/uv.config.ts → public/uv/uv.config.js");
