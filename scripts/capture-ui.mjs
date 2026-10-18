import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const output = resolve(process.argv[2] || 'screenshots');
const baseURL = process.env.ATOMLAB_PREVIEW_URL || 'http://127.0.0.1:5173';
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const errors = [];
const pages = [
  ['home', '/', 1440],
  ['subjects', '/subjects', 1440],
  ['academy', '/academy', 1440],
  ['discovery', '/discover', 1440],
  ['workspace', '/experiments/physics-ohms-law', 1440],
  ['education', '/experiments/chemistry-ph', 1440],
  ['progress', '/progress', 1440],
  ['not-found', '/missing-page', 1440],
  ['home-mobile', '/', 390],
  ['subjects-mobile', '/subjects', 390],
  ['academy-mobile', '/academy', 390],
  ['workspace-mobile', '/experiments/physics-ohms-law', 390],
];
for (const [name, path, width] of pages) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
  page.on('pageerror', (error) => errors.push(`${name}: ${error.message}`));
  await page.goto(`${baseURL}${path}`);
  await page.waitForTimeout(450);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (overflow > 1) errors.push(`${name}: horizontal overflow ${overflow}px`);
  await page.screenshot({ path: resolve(output, `${name}.png`), fullPage: true });
  if (width < 500) await page.screenshot({ path: resolve(output, `${name}-viewport.png`) });
  await page.close();
}
for (const width of [360, 375, 390, 768, 1024, 1440]) {
  for (const path of ['/', '/academy', '/discover', '/experiments/physics-ohms-law']) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    page.on('pageerror', (error) => errors.push(`${width}px ${path}: ${error.message}`));
    await page.goto(`${baseURL}${path}`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (overflow > 1) errors.push(`${width}px ${path}: horizontal overflow ${overflow}px`);
    await page.close();
  }
}
await browser.close();
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log(`Captured ${pages.length} pages in ${output}; 24 viewport checks found no page errors or horizontal overflow.`);
