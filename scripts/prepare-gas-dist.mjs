import { copyFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");
const filesToCopy = [
  ["server/dist/main.js", "gas/dist/Code.js"],
  ["frontend/dist/index.html", "gas/dist/Index.html"],
  ["gas/appsscript.json", "gas/dist/appsscript.json"],
];

mkdirSync(path.join(rootDir, "gas/dist"), { recursive: true });

for (const [source, destination] of filesToCopy) {
  copyFileSync(path.join(rootDir, source), path.join(rootDir, destination));
  console.log(`${source} -> ${destination}`);
}
