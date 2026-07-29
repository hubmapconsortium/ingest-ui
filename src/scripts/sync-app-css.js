#!/usr/bin/env node

const {spawnSync} = require("child_process");
const {writeFileSync} = require("fs");
const {resolve} = require("path");

const repoRoot = resolve(__dirname, "..", "..");
const sourcePath = "src/src/App.css";
const targetPath = "src/src/assets/App.css";

function runGit(args, options = {}) {
  const result = spawnSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    ...options,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(result.stderr || `git ${args.join(" ")} failed`);
  }

  return result.stdout;
}

try {
  const stagedFiles = runGit([
    "diff",
    "--cached",
    "--name-only",
    "--diff-filter=ACMR",
    "--",
    sourcePath,
  ]);

  if (!stagedFiles.split(/\r?\n/).includes(sourcePath)) {
    process.exit(0);
  }

  const stagedCss = runGit(["show", `:${sourcePath}`], {encoding: null});
  writeFileSync(resolve(repoRoot, targetPath), stagedCss);
  runGit(["add", "--", targetPath]);
  console.log(`Synced ${sourcePath} to ${targetPath}`);
} catch (error) {
  console.error(`Unable to sync App.css: ${error.message}`);
  process.exit(1);
}
