const { chromium } = require('./chatbot-e2e/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const output = path.join(__dirname, 'chat-redesign');
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://localhost:4200/products?categoryId=1');
    await page.locator('app-product-card').first().waitFor();
    const launcher = page.locator('.chat-launcher');
    assert((await launcher.innerText()).includes('Hỏi shop'));
    assert((await launcher.innerText()).includes('AI'));
    assert((await launcher.evaluate(element => getComputedStyle(element).backgroundImage)).includes('linear-gradient'));
    assert.equal(await launcher.evaluate(element => getComputedStyle(element).animationName), 'none');
    await page.screenshot({ path: path.join(output, 'desktop-closed.png') });
    await launcher.click();
    assert.equal(await launcher.getAttribute('aria-expanded'), 'true');
    assert((await page.locator('.chat-header').evaluate(element => getComputedStyle(element).backgroundImage)).includes('linear-gradient'));
    await page.screenshot({ path: path.join(output, 'desktop-open.png') });
    const response = page.waitForResponse(response => response.url().endsWith('/api/chat') && response.request().method() === 'POST');
    await page.locator('.chat-suggestions button').filter({ hasText: 'Phí vận chuyển' }).click();
    assert.equal((await response).status(), 200);
    await page.locator('.thinking').waitFor({ state: 'hidden' });
    assert((await page.locator('.chat-message').last().innerText()).includes('30.000đ'));
    await page.setViewportSize({ width: 390, height: 844 });
    const panel = await page.locator('.shopping-chat').boundingBox();
    assert(panel.x >= 0 && panel.x + panel.width <= 390 && panel.y >= 0 && panel.y + panel.height <= 844);
    await page.screenshot({ path: path.join(output, 'mobile-open.png') });
    await page.locator('.chat-launcher').click();
    const mobile = await launcher.boundingBox();
    assert(mobile.x >= 0 && mobile.x + mobile.width <= 390 && mobile.y + mobile.height <= 844);
    await page.screenshot({ path: path.join(output, 'mobile-closed.png') });
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ passed: true, checks: ['Gradient launcher with AI badge', 'Matching chat header', 'Open/close and live response', 'Desktop/mobile viewport', 'Reduced motion', 'No browser errors'], mobileLauncher: mobile, screenshots: output }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
