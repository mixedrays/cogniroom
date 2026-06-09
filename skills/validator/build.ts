/**
 * Builds the standalone CogniRoom content validator.
 *
 * Bundles skills/validator/validate-content.ts together with the app's REAL
 * parsers/schemas (@modules/md-formats, @modules/core, agent content schemas)
 * plus zod and dotenv into a single dependency-free ESM file:
 *
 *   skills/bin/validate-content.mjs
 *
 * The artifact is generated from app source (never hand-forked), so it cannot
 * drift from how the app actually loads content. It runs with bare `node`, with
 * no node_modules and no tsconfig path aliases, which is what makes the skills
 * usable from any agent. Regenerate with `npm run build:validator`; CI guards
 * staleness via `npm run check:validator`.
 */
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..");

await build({
  entryPoints: [resolve(here, "validate-content.ts")],
  outfile: resolve(repoRoot, "skills/bin/validate-content.mjs"),
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node18",
  // esbuild reads compilerOptions.paths from this tsconfig to resolve the
  // @modules/* and @/* aliases at bundle time.
  tsconfig: resolve(repoRoot, "tsconfig.json"),
  // Shebang + a real `require` (via createRequire) so bundled CJS deps such as
  // dotenv can load Node built-ins from the ESM output.
  banner: {
    js: [
      "#!/usr/bin/env node",
      "import { createRequire as __createRequire } from 'node:module';",
      "const require = __createRequire(import.meta.url);",
    ].join("\n"),
  },
  logLevel: "info",
});
