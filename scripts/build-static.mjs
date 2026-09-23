#!/usr/bin/env node
/**
 * Builds the static site for STRATO.
 *
 *   NEXT_PUBLIC_FORM_API_BASE=https://your-api-deployment npm run build:static
 *
 * Next refuses to combine `output: export` with API route handlers, so the
 * api directory is moved aside for the duration of the build and put back
 * afterwards — including if the build fails or the process is interrupted,
 * so the working tree is never left missing its API routes.
 *
 * Result: out/ — upload its CONTENTS to STRATO's web root.
 */

import { execSync } from "node:child_process";
import { existsSync, renameSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const apiDir = resolve(root, "src/app/api");
const stash = resolve(root, ".api-stash-during-static-build");

if (!process.env.NEXT_PUBLIC_FORM_API_BASE) {
  console.warn(
    "\n⚠  NEXT_PUBLIC_FORM_API_BASE is not set.\n" +
      "   The forms will POST to a relative /api/... path, which does not\n" +
      "   exist on static hosting — every submission would 404.\n" +
      "   Set it to the URL of the deployment that runs the API, e.g.\n" +
      "     NEXT_PUBLIC_FORM_API_BASE=https://flinkfreight-api.vercel.app\n"
  );
}

let moved = false;
function restore() {
  if (moved && existsSync(stash)) {
    renameSync(stash, apiDir);
    moved = false;
  }
}
// Put the API routes back even on Ctrl-C or an unexpected exit.
process.on("exit", restore);
process.on("SIGINT", () => { restore(); process.exit(130); });
process.on("SIGTERM", () => { restore(); process.exit(143); });

try {
  rmSync(resolve(root, "out"), { recursive: true, force: true });
  rmSync(resolve(root, ".next"), { recursive: true, force: true });

  if (existsSync(apiDir)) {
    renameSync(apiDir, stash);
    moved = true;
  }

  execSync("npx next build", {
    stdio: "inherit",
    env: { ...process.env, BUILD_TARGET: "static" },
  });
} finally {
  restore();
}

console.log("\n✓ Static site built to out/");
console.log("  Upload the CONTENTS of out/ to STRATO's web root.\n");
