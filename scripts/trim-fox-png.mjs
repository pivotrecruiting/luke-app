/**
 * Trims transparent padding from review-fox.png using Sharp.
 * Overwrites the original file.
 */
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const inputPath = path.join(__dirname, "..", "assets", "images", "review-fox.png");

async function main() {
  const buffer = await sharp(inputPath)
    .trim({ threshold: 10 })
    .png()
    .toBuffer();

  const meta = await sharp(buffer).metadata();
  fs.writeFileSync(inputPath, buffer);
  console.log(`Trimmed review-fox.png: ${meta.width}x${meta.height}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
