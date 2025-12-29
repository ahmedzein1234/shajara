const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const outputDir = path.join(__dirname, '../public/icons');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// SVG icon - a tree with Islamic green
const svgIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10b981"/>
      <stop offset="100%" style="stop-color:#059669"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="100" fill="url(#grad)"/>
  <g transform="translate(256, 280)">
    <!-- Tree trunk -->
    <rect x="-25" y="50" width="50" height="100" rx="8" fill="#8B4513"/>
    <!-- Tree crown - layered circles -->
    <circle cx="0" cy="-60" r="100" fill="#065f46"/>
    <circle cx="-60" cy="0" r="70" fill="#047857"/>
    <circle cx="60" cy="0" r="70" fill="#047857"/>
    <circle cx="0" cy="-30" r="80" fill="#059669"/>
    <!-- Decorative gold accent -->
    <circle cx="0" cy="-60" r="15" fill="#D4AF37"/>
  </g>
  <!-- Arabic letter ش (Sheen) stylized -->
  <text x="256" y="450" font-family="Arial" font-size="60" font-weight="bold" fill="white" text-anchor="middle">شجرة</text>
</svg>
`;

async function generateIcons() {
  console.log('Generating PWA icons...');

  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);

    await sharp(Buffer.from(svgIcon))
      .resize(size, size)
      .png()
      .toFile(outputPath);

    console.log(`Created: icon-${size}x${size}.png`);
  }

  // Also create shortcut icons
  await sharp(Buffer.from(svgIcon))
    .resize(96, 96)
    .png()
    .toFile(path.join(outputDir, 'tree-shortcut.png'));

  await sharp(Buffer.from(svgIcon))
    .resize(96, 96)
    .png()
    .toFile(path.join(outputDir, 'add-shortcut.png'));

  console.log('Done! Icons generated successfully.');
}

generateIcons().catch(console.error);
