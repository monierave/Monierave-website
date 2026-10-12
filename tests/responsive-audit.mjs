import { chromium } from 'playwright';
import { readdir } from 'node:fs/promises';

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:4173';
const pages = (await readdir(process.cwd())).filter((file) => file.endsWith('.html')).sort();
const viewports = [
  { width: 320, height: 740 }, { width: 360, height: 800 },
  { width: 390, height: 844 }, { width: 430, height: 932 },
  { width: 768, height: 1024 }, { width: 900, height: 900 },
  { width: 1024, height: 768 }, { width: 1280, height: 800 },
  { width: 1440, height: 900 },
];
const browser = await chromium.launch({ headless: true });
const failures = [];
const pageErrors = [];
let checks = 0;

try {
  for (const file of pages) {
    const page = await browser.newPage({ viewport: viewports[0] });
    page.on('pageerror', (error) => pageErrors.push(`${file}: ${error.message}`));
    const response = await page.goto(`${baseURL}/${file}`, { waitUntil: 'domcontentloaded' });
    if (!response || !response.ok()) {
      failures.push(`${file}: HTTP ${response?.status() ?? 'no response'}`);
      await page.close();
      continue;
    }
    await page.waitForTimeout(150);
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(50);
      const audit = await page.evaluate(() => {
        const visible = (el) => {
          const style = getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' &&
            Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0;
        };
        const overflow = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth;
        const interactive = [...document.querySelectorAll('a,button,input,select,textarea,summary,[role="button"]')]
          .filter(visible)
          .map((el) => ({ el, r: el.getBoundingClientRect() }))
          .filter(({ r }) => r.width > 2 && r.height > 2);
        const overlaps = [];
        for (let i = 0; i < interactive.length; i++) {
          for (let j = i + 1; j < interactive.length; j++) {
            const a = interactive[i], b = interactive[j];
            if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
            const w = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
            const h = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
            if (w > 5 && h > 5) {
              const sameNav = a.el.closest('nav') && a.el.closest('nav') === b.el.closest('nav');
              if (!sameNav) overlaps.push(`${a.el.tagName.toLowerCase()} "${a.el.textContent.trim().slice(0,18)}" / ${b.el.tagName.toLowerCase()} "${b.el.textContent.trim().slice(0,18)}"`);
            }
          }
        }
        return { overflow, overlaps: overlaps.slice(0, 5) };
      });
      checks++;
      if (audit.overflow > 1) failures.push(`${file} at ${viewport.width}px: horizontal overflow ${audit.overflow}px`);
      if (audit.overlaps.length) failures.push(`${file} at ${viewport.width}px: interactive overlap: ${audit.overlaps.join('; ')}`);
    }
    await page.close();
  }
} finally {
  await browser.close();
}

if (pageErrors.length) failures.push(...pageErrors.map((e) => `JavaScript error: ${e}`));
console.log(`Responsive audit: ${pages.length} pages × 9 viewport sizes = ${checks} layout checks.`);
if (failures.length) {
  console.error(`FAIL: ${failures.length} issue(s) found:`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log('PASS: no horizontal overflow, interactive overlap, HTTP errors, or page JavaScript errors detected.');
}
