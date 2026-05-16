import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const [, , outputDirArg, ...expectedFiles] = process.argv;

if (!outputDirArg || expectedFiles.length === 0) {
  console.error(
    "Usage: node scripts/assert-build-output.mjs <output-dir> <expected-file> [...expected-file]",
  );
  process.exit(1);
}

const outputDir = path.resolve(process.cwd(), outputDirArg);

function listFiles(dir, baseDir = dir) {
  if (!existsSync(dir)) return [];

  return readdirSync(dir)
    .flatMap((entry) => {
      const fullPath = path.join(dir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        return listFiles(fullPath, baseDir);
      }

      return path.relative(baseDir, fullPath).split(path.sep).join("/");
    })
    .sort();
}

function assertHtmlHasNoRootLocalAssetReferences(filePath) {
  const html = readFileSync(filePath, "utf8");
  const rootAssetReferencePattern =
    /\b(?:src|href)\s*=\s*["']\/(?!\/|https?:|data:|mailto:|tel:)([^"']+)["']/gi;
  const matches = [...html.matchAll(rootAssetReferencePattern)].map(
    (match) => `/${match[1]}`,
  );

  if (matches.length > 0) {
    console.error(
      [
        `${path.relative(process.cwd(), filePath)} still references files outside the single HTML bundle:`,
        ...matches.map((match) => `- ${match}`),
        "Import images/assets from src or inline them so Vite can embed them in dist/index.html.",
      ].join("\n"),
    );
    process.exit(1);
  }
}

const actualFiles = listFiles(outputDir);
const expectedSorted = [...expectedFiles].sort();

if (actualFiles.join("\n") !== expectedSorted.join("\n")) {
  console.error(
    [
      `Unexpected files in ${path.relative(process.cwd(), outputDir)}.`,
      `Expected exactly: ${expectedSorted.join(", ")}`,
      `Found: ${actualFiles.length > 0 ? actualFiles.join(", ") : "(no files)"}`,
    ].join("\n"),
  );
  process.exit(1);
}

for (const file of actualFiles) {
  if (file.endsWith(".html")) {
    assertHtmlHasNoRootLocalAssetReferences(path.join(outputDir, file));
  }
}

console.log(
  `OK: ${path.relative(process.cwd(), outputDir)} contains exactly ${actualFiles.join(", ")}`,
);
