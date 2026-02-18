import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const svgPath = resolve(root, 'public/icons/icon.svg');
const svg = readFileSync(svgPath);

const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  // Android adaptive icon sizes
  { name: 'icon-48.png', size: 48 },
  { name: 'icon-72.png', size: 72 },
  { name: 'icon-96.png', size: 96 },
  { name: 'icon-144.png', size: 144 },
  { name: 'icon-foreground-432.png', size: 432 },
];

const outDir = resolve(root, 'public/icons');
mkdirSync(outDir, { recursive: true });

for (const { name, size } of sizes) {
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(resolve(outDir, name));
  console.log(`Generated ${name} (${size}x${size})`);
}

// Also generate a splash screen (2732x2732 for max size)
const splashSvg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2732 2732">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a"/>
      <stop offset="100%" style="stop-color:#1e293b"/>
    </linearGradient>
  </defs>
  <rect width="2732" height="2732" fill="url(#bg)"/>
  <g transform="translate(1366,1200)" stroke="white" stroke-width="40" stroke-linecap="round" fill="none">
    <line x1="0" y1="-200" x2="0" y2="200"/>
    <line x1="-50" y1="-150" x2="0" y2="-200"/>
    <line x1="50" y1="-150" x2="0" y2="-200"/>
    <line x1="-50" y1="150" x2="0" y2="200"/>
    <line x1="50" y1="150" x2="0" y2="200"/>
    <line x1="-173" y1="-100" x2="173" y2="100"/>
    <line x1="-173" y1="-100" x2="-123" y2="-100"/>
    <line x1="-173" y1="-100" x2="-173" y2="-50"/>
    <line x1="173" y1="100" x2="123" y2="100"/>
    <line x1="173" y1="100" x2="173" y2="50"/>
    <line x1="173" y1="-100" x2="-173" y2="100"/>
    <line x1="173" y1="-100" x2="123" y2="-100"/>
    <line x1="173" y1="-100" x2="173" y2="-50"/>
    <line x1="-173" y1="100" x2="-123" y2="100"/>
    <line x1="-173" y1="100" x2="-173" y2="50"/>
  </g>
  <text x="1366" y="1550" text-anchor="middle" fill="white" font-family="Inter, Arial, sans-serif" font-weight="700" font-size="96">Snowflake Training</text>
  <text x="1366" y="1640" text-anchor="middle" fill="#29b5e8" font-family="Inter, Arial, sans-serif" font-weight="500" font-size="48">by Hamzah Javaid</text>
</svg>
`);

await sharp(splashSvg)
  .resize(2732, 2732)
  .png()
  .toFile(resolve(root, 'public/icons/splash.png'));
console.log('Generated splash.png (2732x2732)');

console.log('Done!');
