// This script requires sharp: npm install -D sharp
import fs from "fs";
import path from "path";
import sharp from "sharp";

const SOURCE_PATH = path.join(process.cwd(), "public/dell-clips.png");
const ICONS_DIR = path.join(process.cwd(), "public/icons");
const APP_DIR = path.join(process.cwd(), "app");

const icons = [
  { name: "icon-192.png", size: 192, dir: ICONS_DIR },
  { name: "icon-512.png", size: 512, dir: ICONS_DIR },
  { name: "icon-maskable-192.png", size: 192, dir: ICONS_DIR },
  { name: "icon-maskable-512.png", size: 512, dir: ICONS_DIR },
  { name: "icon.png", size: 512, dir: APP_DIR },
  { name: "apple-icon.png", size: 180, dir: APP_DIR },
  { name: "opengraph-image.png", size: 1200, dir: APP_DIR },
];

async function generate() {
  if (!fs.existsSync(SOURCE_PATH)) {
    console.error(`❌ Source image not found: ${SOURCE_PATH}`);
    process.exit(1);
  }

  for (const { name, size, dir } of icons) {
    await sharp(SOURCE_PATH).resize(size, size).png().toFile(path.join(dir, name));
    console.log(`✅ Generated ${name} (${size}x${size})`);
  }

  console.log("\n🎨 All icons generated!");
}

generate().catch(console.error);
