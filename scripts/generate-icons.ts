// This script requires sharp: npm install -D sharp
import fs from "fs";
import path from "path";
import sharp from "sharp";

const SVG_PATH = path.join(process.cwd(), "public/icons/icon.svg");
const OUTPUT_DIR = path.join(process.cwd(), "public/icons");

const sizes = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "icon-maskable-192.png", size: 192 },
  { name: "icon-maskable-512.png", size: 512 },
];

async function generate() {
  const svgBuffer = fs.readFileSync(SVG_PATH);

  for (const { name, size } of sizes) {
    await sharp(svgBuffer).resize(size, size).png().toFile(path.join(OUTPUT_DIR, name));

    console.log(`✅ Generated ${name} (${size}x${size})`);
  }

  console.log("\n🎨 All icons generated!");
}

generate().catch(console.error);
