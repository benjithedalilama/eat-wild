const sharp = require('sharp');
const { readFileSync } = require('fs');
const { join } = require('path');

async function convertLogo() {
  const svgPath = join(__dirname, '..', 'public', 'favicon.svg');
  const pngPath = join(__dirname, '..', 'public', 'logo-email.png');

  // Read SVG file
  const svgBuffer = readFileSync(svgPath);

  // Convert to PNG at 2x resolution (160x160) for retina displays
  await sharp(svgBuffer)
    .resize(160, 160)
    .png()
    .toFile(pngPath);

  console.log('Logo converted successfully to logo-email.png');
}

convertLogo().catch(console.error);
