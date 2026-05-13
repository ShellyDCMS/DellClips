import fs from "fs";
import path from "path";
import sharp from "sharp";

// ============================================
// CONFIGURATION
// ============================================

// Source logo — must be square, at least 1024x1024
// Update this path to your logo file
const SOURCE_LOGO = path.join(process.cwd(), "public/icons/logo-source.png");
const OUTPUT_DIR = path.join(process.cwd(), "public/icons");

// Brand color for maskable icon backgrounds
const BRAND_COLOR = { r: 6, g: 114, b: 203, alpha: 1 }; // Dell Blue #0672CB

// All icon sizes needed for PWA across all platforms
const ICONS = [
  // ---- Favicons (Browser Tabs) ----
  { name: "favicon-16x16.png", size: 16, purpose: "favicon" },
  { name: "favicon-32x32.png", size: 32, purpose: "favicon" },
  { name: "favicon.png", size: 32, purpose: "favicon" },
  { name: "favicon-48x48.png", size: 48, purpose: "favicon" },

  // ---- Standard PWA Icons (Android Chrome, Desktop) ----
  { name: "icon-72.png", size: 72, purpose: "standard" },
  { name: "icon-96.png", size: 96, purpose: "standard" },
  { name: "icon-128.png", size: 128, purpose: "standard" },
  { name: "icon-144.png", size: 144, purpose: "standard" },
  { name: "icon-152.png", size: 152, purpose: "standard" },
  { name: "icon-192.png", size: 192, purpose: "standard" },
  { name: "icon-256.png", size: 256, purpose: "standard" },
  { name: "icon-384.png", size: 384, purpose: "standard" },
  { name: "icon-512.png", size: 512, purpose: "standard" },

  // ---- Maskable Icons (Android Adaptive Icons) ----
  // These need extra padding so the logo isn't clipped
  // by circular, squircle, or rounded square masks
  { name: "icon-maskable-192.png", size: 192, purpose: "maskable" },
  { name: "icon-maskable-512.png", size: 512, purpose: "maskable" },

  // ---- Apple Touch Icons (iOS Home Screen) ----
  { name: "apple-touch-icon.png", size: 180, purpose: "apple" },
  { name: "apple-touch-icon-120.png", size: 120, purpose: "apple" },
  { name: "apple-touch-icon-152.png", size: 152, purpose: "apple" },
  { name: "apple-touch-icon-167.png", size: 167, purpose: "apple" },
  { name: "apple-touch-icon-180.png", size: 180, purpose: "apple" },

  // ---- Windows Tiles ----
  { name: "mstile-70x70.png", size: 70, purpose: "windows" },
  { name: "mstile-150x150.png", size: 150, purpose: "windows" },
  { name: "mstile-310x310.png", size: 310, purpose: "windows" },

  // ---- Large source for any future use ----
  { name: "icon-1024.png", size: 1024, purpose: "standard" },
];

// ============================================
// GENERATE ICONS
// ============================================

async function generateIcons() {
  // Verify source file exists
  if (!fs.existsSync(SOURCE_LOGO)) {
    console.error(`❌ Source logo not found: ${SOURCE_LOGO}`);
    console.error(`\nPlace your square logo (at least 1024x1024 PNG) at:`);
    console.error(`  ${SOURCE_LOGO}\n`);
    process.exit(1);
  }

  // Verify source dimensions
  const metadata = await sharp(SOURCE_LOGO).metadata();
  console.log(
    `📐 Source logo: ${metadata.width}x${metadata.height} ${metadata.format}\n`
  );

  if (!metadata.width || !metadata.height) {
    console.error("❌ Could not read source image dimensions");
    process.exit(1);
  }

  if (metadata.width < 512 || metadata.height < 512) {
    console.warn(
      `⚠️  Warning: Source logo is smaller than 512x512. Icons may appear blurry.`
    );
    console.warn(`   Recommended: at least 1024x1024\n`);
  }

  if (metadata.width !== metadata.height) {
    console.warn(
      `⚠️  Warning: Source logo is not square (${metadata.width}x${metadata.height}).`
    );
    console.warn(`   The logo will be resized to fit within a square.\n`);
  }

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log(`🎨 Generating ${ICONS.length} icons...\n`);

  const results = {
    favicons: [] as string[],
    standard: [] as string[],
    maskable: [] as string[],
    apple: [] as string[],
    windows: [] as string[],
  };

  for (const icon of ICONS) {
    try {
      if (icon.purpose === "maskable") {
        // Maskable icons: add 20% padding with brand color background
        // The safe zone for maskable icons is 80% of the total area
        const padding = Math.round(icon.size * 0.1);
        const innerSize = icon.size - padding * 2;

        await sharp(SOURCE_LOGO)
          .resize(innerSize, innerSize, {
            fit: "contain",
            background: BRAND_COLOR,
          })
          .extend({
            top: padding,
            bottom: padding,
            left: padding,
            right: padding,
            background: BRAND_COLOR,
          })
          .png()
          .toFile(path.join(OUTPUT_DIR, icon.name));
      } else {
        // Standard, apple, favicon, windows: resize directly
        await sharp(SOURCE_LOGO)
          .resize(icon.size, icon.size, {
            fit: "contain",
            background: { r: 0, g: 0, b: 0, alpha: 0 }, // Transparent
          })
          .png()
          .toFile(path.join(OUTPUT_DIR, icon.name));
      }

      const category =
        icon.purpose === "favicon"
          ? "favicons"
          : icon.purpose === "maskable"
            ? "maskable"
            : icon.purpose === "apple"
              ? "apple"
              : icon.purpose === "windows"
                ? "windows"
                : "standard";

      results[category].push(icon.name);

      console.log(
        `  ✅ ${icon.name.padEnd(30)} ${icon.size}x${icon.size}  (${icon.purpose})`
      );
    } catch (err) {
      console.error(`  ❌ ${icon.name.padEnd(30)} FAILED: ${(err as Error).message}`);
    }
  }

  // ============================================
  // GENERATE SVG FAVICON (for modern browsers)
  // ============================================
  try {
    // If source is SVG, copy it directly
    if (metadata.format === "svg") {
      fs.copyFileSync(SOURCE_LOGO, path.join(OUTPUT_DIR, "icon.svg"));
      console.log(`  ✅ ${"icon.svg".padEnd(30)} (copied from source)`);
    } else {
      // If source is PNG, create a simple SVG wrapper
      // Modern browsers prefer SVG favicons
      console.log(`  ℹ️  ${"icon.svg".padEnd(30)} Skipped (source is PNG, not SVG)`);
    }
  } catch (err) {
    console.warn(`  ⚠️  Could not create SVG favicon: ${(err as Error).message}`);
  }

  // ============================================
  // SUMMARY
  // ============================================
  console.log(`\n${"=".repeat(60)}`);
  console.log(`📊 GENERATION SUMMARY`);
  console.log(`${"=".repeat(60)}`);
  console.log(`  Favicons (browser tabs):     ${results.favicons.length} icons`);
  console.log(`  Standard (PWA/Android/Desktop): ${results.standard.length} icons`);
  console.log(`  Maskable (Android adaptive):  ${results.maskable.length} icons`);
  console.log(`  Apple (iOS home screen):      ${results.apple.length} icons`);
  console.log(`  Windows (tiles):              ${results.windows.length} icons`);
  console.log(
    `  TOTAL:                        ${
      results.favicons.length +
      results.standard.length +
      results.maskable.length +
      results.apple.length +
      results.windows.length
    } icons`
  );
  console.log(`${"=".repeat(60)}\n`);

  // ============================================
  // VERIFY CRITICAL FILES
  // ============================================
  const criticalFiles = [
    "icon-192.png",
    "icon-512.png",
    "icon-maskable-192.png",
    "icon-maskable-512.png",
    "apple-touch-icon.png",
    "favicon-32x32.png",
  ];

  console.log(`🔍 Verifying critical files:`);
  let allCriticalPresent = true;

  for (const file of criticalFiles) {
    const filePath = path.join(OUTPUT_DIR, file);
    const exists = fs.existsSync(filePath);
    const size = exists ? fs.statSync(filePath).size : 0;
    const sizeKB = (size / 1024).toFixed(1);

    if (exists) {
      console.log(`  ✅ ${file.padEnd(30)} ${sizeKB} KB`);
    } else {
      console.log(`  ❌ ${file.padEnd(30)} MISSING!`);
      allCriticalPresent = false;
    }
  }

  if (!allCriticalPresent) {
    console.error(`\n❌ Some critical files are missing! PWA may not install correctly.`);
    process.exit(1);
  }

  // ============================================
  // NEXT STEPS
  // ============================================
  console.log(`\n✨ All icons generated successfully!\n`);
  console.log(`📋 Next steps:`);
  console.log(`  1. Verify maskable icons at https://maskable.app/editor`);
  console.log(`     Upload: ${path.join(OUTPUT_DIR, "icon-maskable-512.png")}`);
  console.log(`  2. Verify manifest.ts references all icon sizes`);
  console.log(`  3. Verify layout.tsx has correct <link> tags`);
  console.log(`  4. Bump service worker cache version in public/sw.js`);
  console.log(`  5. Push and redeploy`);
  console.log(`  6. On mobile: uninstall old PWA, reinstall to get new icons\n`);

  // ============================================
  // AUTO-VERIFY manifest.ts and layout.tsx
  // ============================================
  console.log(`🔍 Checking manifest.ts and layout.tsx...\n`);

  // Check manifest.ts
  const manifestPath = path.join(process.cwd(), "app/manifest.ts");
  if (fs.existsSync(manifestPath)) {
    const manifestContent = fs.readFileSync(manifestPath, "utf-8");
    const missingInManifest = [];

    if (!manifestContent.includes("icon-192.png")) missingInManifest.push("icon-192.png");
    if (!manifestContent.includes("icon-512.png")) missingInManifest.push("icon-512.png");
    if (!manifestContent.includes("icon-maskable-192.png"))
      missingInManifest.push("icon-maskable-192.png");
    if (!manifestContent.includes("icon-maskable-512.png"))
      missingInManifest.push("icon-maskable-512.png");

    if (missingInManifest.length > 0) {
      console.log(`  ⚠️  manifest.ts is missing references to:`);
      missingInManifest.forEach((f) => console.log(`     - ${f}`));
    } else {
      console.log(`  ✅ manifest.ts — all critical icons referenced`);
    }
  } else {
    console.log(`  ⚠️  manifest.ts not found at expected location`);
  }

  // Check layout.tsx
  const layoutPath = path.join(process.cwd(), "app/layout.tsx");
  if (fs.existsSync(layoutPath)) {
    const layoutContent = fs.readFileSync(layoutPath, "utf-8");
    const missingInLayout = [];

    if (!layoutContent.includes("apple-touch-icon"))
      missingInLayout.push("apple-touch-icon link tag");
    if (!layoutContent.includes("favicon")) missingInLayout.push("favicon link tag");

    if (missingInLayout.length > 0) {
      console.log(`  ⚠️  layout.tsx is missing:`);
      missingInLayout.forEach((f) => console.log(`     - ${f}`));
    } else {
      console.log(`  ✅ layout.tsx — favicon and apple-touch-icon tags present`);
    }
  } else {
    console.log(`  ⚠️  layout.tsx not found at expected location`);
  }

  console.log("");
}

generateIcons().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
