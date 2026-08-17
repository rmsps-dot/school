/* eslint-disable @typescript-eslint/no-require-imports */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sourcePath = path.join(__dirname, '../public/logo.jpg');
const publicDir = path.join(__dirname, '../public');
const appDir = path.join(__dirname, '../src/app');

async function generateIcons() {
  if (!fs.existsSync(sourcePath)) {
    console.error('Source logo.jpg not found in public directory!');
    process.exit(1);
  }

  // Generate app/icon.png (32x32)
  await sharp(sourcePath)
    .resize(32, 32)
    .png()
    .toFile(path.join(appDir, 'icon.png'));
  console.log('Generated app/icon.png');

  // Generate app/apple-icon.png (180x180)
  await sharp(sourcePath)
    .resize(180, 180)
    .png()
    .toFile(path.join(appDir, 'apple-icon.png'));
  console.log('Generated app/apple-icon.png');

  // Generate public/icon-192.png
  await sharp(sourcePath)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));
  console.log('Generated public/icon-192.png');

  // Generate public/icon-512.png
  await sharp(sourcePath)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));
  console.log('Generated public/icon-512.png');
}

generateIcons().catch(console.error);
