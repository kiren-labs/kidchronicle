/**
 * generate-icons.js
 * Converts icon.svg → icon-192.png and icon-512.png
 *
 * Run from repo root:
 *   node assets/icons/generate-icons.js
 *
 * Requires: npm install sharp (one-time, not a runtime dependency)
 */

const fs   = require('fs');
const path = require('path');

const ICON_DIR = path.join(__dirname);
const SVG_PATH = path.join(ICON_DIR, 'icon.svg');

async function generate() {
  // Try sharp first (best quality)
  try {
    const sharp = require('sharp');
    const svg   = fs.readFileSync(SVG_PATH);

    await sharp(svg).resize(192, 192).png().toFile(path.join(ICON_DIR, 'icon-192.png'));
    console.log('✅ icon-192.png written');

    await sharp(svg).resize(512, 512).png().toFile(path.join(ICON_DIR, 'icon-512.png'));
    console.log('✅ icon-512.png written');

    // Also generate Apple touch icon (180×180) and favicon (32×32)
    await sharp(svg).resize(180, 180).png().toFile(path.join(ICON_DIR, 'apple-touch-icon.png'));
    console.log('✅ apple-touch-icon.png written');

    await sharp(svg).resize(32, 32).png().toFile(path.join(ICON_DIR, 'favicon-32.png'));
    console.log('✅ favicon-32.png written');

    console.log('\nAll icons generated. Add to manifest.json and index.html.');
    return;
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      console.log('sharp not installed. Trying canvas fallback...\n');
    } else {
      throw err;
    }
  }

  // Fallback: canvas
  try {
    const { createCanvas, loadImage } = require('canvas');

    async function renderAt(size, filename) {
      const canvas = createCanvas(size, size);
      const ctx    = canvas.getContext('2d');
      const img    = await loadImage(SVG_PATH);
      ctx.drawImage(img, 0, 0, size, size);
      fs.writeFileSync(path.join(ICON_DIR, filename), canvas.toBuffer('image/png'));
      console.log(`✅ ${filename} written`);
    }

    await renderAt(192, 'icon-192.png');
    await renderAt(512, 'icon-512.png');
    await renderAt(180, 'apple-touch-icon.png');
    await renderAt(32,  'favicon-32.png');
    return;
  } catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') throw err;
  }

  // Neither available — print manual instructions
  console.log('Neither sharp nor canvas is installed.\n');
  console.log('Option 1 — install sharp and rerun:');
  console.log('  npm install sharp');
  console.log('  node assets/icons/generate-icons.js\n');
  console.log('Option 2 — convert manually (free online):');
  console.log('  https://svgtopng.com  or  https://cloudconvert.com/svg-to-png');
  console.log('  Upload: assets/icons/icon.svg');
  console.log('  Export at: 192×192 → icon-192.png');
  console.log('             512×512 → icon-512.png');
  console.log('             180×180 → apple-touch-icon.png');
  console.log('\n  Place all files in: assets/icons/');
}

generate().catch(console.error);
