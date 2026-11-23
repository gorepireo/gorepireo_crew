const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const indexHtml = path.join(distDir, 'index.html');

if (!fs.existsSync(indexHtml)) {
  console.error('[POSTBUILD] dist/index.html not found!');
  process.exit(1);
}

const targets = [
  '404.html',
  'login.html',
  'login/index.html',
  'worker/index.html',
  'worker/home/index.html',
  'leader/index.html',
  'leader/dashboard/index.html',
  'admin/index.html',
  'admin/dashboard/index.html',
];

for (const target of targets) {
  const destPath = path.join(distDir, target);
  const parentDir = path.dirname(destPath);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }
  fs.copyFileSync(indexHtml, destPath);
  console.log(`[POSTBUILD] Generated fallback: ${target}`);
}

console.log('[POSTBUILD] All SPA fallback routes generated successfully.');
