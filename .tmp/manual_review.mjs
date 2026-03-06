import { chromium } from 'playwright';
import fs from 'node:fs';

const outDir = 'output/manual-review';
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('console', msg => { if (msg.type() === 'error') errors.push({ type: 'console', text: msg.text() }); });
page.on('pageerror', err => errors.push({ type: 'pageerror', text: String(err) }));

async function dismissOverlays() {
  const maskSelectors = ['#ai-mask .btn', '#shop-hint-mask .btn', '#tutorial-hint-mask .btn', '.ai-mask .btn'];
  for (const sel of maskSelectors) {
    const loc = page.locator(sel);
    if (await loc.count()) {
      await loc.first().click({ timeout: 800 }).catch(() => {});
      await page.waitForTimeout(150);
    }
  }
}

await page.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded' });
await page.fill('#player-name-input', 'A');
await page.click('#intro-start-btn');
await page.waitForSelector('#app .scene');
await dismissOverlays();
await page.screenshot({ path: `${outDir}/01-after-start.png`, fullPage: true });

let shotNo = 2;
for (let i = 1; i <= 30; i++) {
  await dismissOverlays();
  const buttons = page.locator('#app .choices .btn');
  const count = await buttons.count();
  if (!count) break;
  await buttons.first().click();
  await page.waitForTimeout(320);
  await dismissOverlays();
  await page.screenshot({ path: `${outDir}/${String(shotNo).padStart(2,'0')}-step.png`, fullPage: true });
  shotNo += 1;
}

await page.screenshot({ path: `${outDir}/final-screen.png`, fullPage: true });

const data = await page.evaluate(() => ({
  title: document.querySelector('#app .scene-title')?.textContent?.trim() || '',
  score: document.getElementById('live-score-value')?.textContent?.trim() || '',
  hasEnding: !!document.querySelector('#app .scene.ending'),
  choicesLeft: document.querySelectorAll('#app .choices .btn').length,
  telemetry: {
    clicks: document.getElementById('stats-clicks')?.textContent?.trim(),
    distance: document.getElementById('stats-distance')?.textContent?.trim(),
    ai: document.getElementById('stats-ai')?.textContent?.trim(),
  }
}));

fs.writeFileSync(`${outDir}/state.json`, JSON.stringify({ data, errors }, null, 2));
await browser.close();
