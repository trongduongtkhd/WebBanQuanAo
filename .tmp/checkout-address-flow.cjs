// Production UI with isolated HTTP fixtures. Never creates a real account, address or order.
const { chromium } = require('./chatbot-e2e/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const output = path.join(__dirname, 'checkout-address-results');
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' });
  const report = { checks: [], pageErrors: [] };
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const user = { userId: 999999, fullName: 'Khách kiểm thử', email: 'checkout@test.invalid', roles: ['Customer'] };
    await context.addInitScript(user => localStorage.setItem('clothing_current_user', JSON.stringify(user)), user);
    let addresses = [], failSave = true, addressPosts = 0;
    const wrap = data => ({ success: true, message: '', data });
    const item = { cartItemId: 1, variantId: 4152, productId: 99, productName: 'Khăn kiểm thử', colorName: 'Trắng', sizeName: 'M',
      quantity: 2, unitPrice: 119000, totalPrice: 238000, stockQuantity: 10, isAvailable: true, isForSale: true };
    await context.route('**/api/**', async route => {
      const request = route.request(), url = new URL(request.url()), endpoint = url.pathname;
      const json = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
      if (endpoint === '/api/auth/refresh') return json(wrap({ accessToken: 'isolated-ui-fixture', user }));
      if (endpoint === '/api/cart') return json(wrap({ items: [item], subtotal: 238000, totalQuantity: 2, shippingFee: 30000, freeShippingThreshold: 500000 }));
      if (endpoint === '/api/wishlist') return json(wrap([]));
      if (endpoint === '/api/payments/vnpay/configuration') return json({ enabled: true });
      if (endpoint === '/api/products/slug/checkout-test-item') return json(wrap({ productId: 99, productName: 'Khăn kiểm thử', images: [], variants: [
        { variantId: 4152, isActive: true, stockQuantity: 10, colorName: 'Trắng', sizeName: 'M', effectivePrice: 119000 },
      ] }));
      if (endpoint === '/api/coupons/validate') return json(wrap({ couponId: 1, couponCode: 'SAVE10', couponName: 'Mã kiểm thử', discountAmount: 10000 }));
      if (endpoint === '/api/addresses') {
        if (request.method() === 'GET') return json(wrap(addresses));
        if (request.method() === 'POST') {
          addressPosts++;
          if (failSave) return json({ success: false, message: 'Không thể lưu địa chỉ kiểm thử' }, 400);
          const address = { ...request.postDataJSON(), addressId: 42, createdAt: new Date().toISOString() };
          addresses = [address]; return json(wrap(address));
        }
      }
      if (request.method() !== 'GET') throw new Error('Unexpected mutation: ' + endpoint);
      return route.continue();
    });
    const page = await context.newPage();
    page.on('pageerror', error => report.pageErrors.push(error.message));
    await page.goto('http://localhost:4200/checkout?buyNow=4152&qty=2&slug=checkout-test-item&coupon=SAVE10');
    await page.locator('a.alert-link').waitFor();
    await page.locator('textarea').first().fill('Giao buổi sáng');
    await page.locator('.payment-option').filter({ hasText: 'QR' }).locator('input').check();
    const handoff = new URL(await page.locator('a.alert-link').getAttribute('href'), page.url());
    const returnUrl = new URL(handoff.searchParams.get('returnUrl'), 'http://localhost:4200');
    assert.equal(returnUrl.searchParams.get('buyNow'), '4152');
    assert.equal(returnUrl.searchParams.get('qty'), '2');
    assert.equal(returnUrl.searchParams.get('slug'), 'checkout-test-item');
    await page.screenshot({ path: path.join(output, 'checkout-empty-address.png') });
    await page.locator('a.alert-link').click();
    await page.locator('.address-form-card').waitFor();
    await page.reload();
    await page.locator('.address-form-card').waitFor();
    report.checks.push('Address page refresh retains the pending checkout draft');
    await page.locator('[formcontrolname=receiverName]').fill('Nguyễn Văn An');
    await page.locator('[formcontrolname=receiverPhone]').fill('0901234567');
    await page.locator('[formcontrolname=addressDetail]').fill('123 Đường Kiểm Thử');
    await page.locator('[formcontrolname=province]').fill('Hà Nội');
    await page.getByRole('button', { name: 'Lưu và tiếp tục thanh toán', exact: true }).click();
    await page.locator('.address-form-card [role=alert]').waitFor();
    assert(new URL(page.url()).pathname === '/account/addresses');
    report.checks.push('Save failure keeps address form and checkout context');
    failSave = false;
    await page.getByRole('button', { name: 'Lưu và tiếp tục thanh toán', exact: true }).click();
    await page.waitForURL(url => url.pathname === '/checkout' && url.searchParams.get('addressId') === '42');
    await page.locator('.address-option input:checked').waitFor();
    assert.equal(new URL(page.url()).searchParams.get('buyNow'), '4152');
    assert.equal(new URL(page.url()).searchParams.get('qty'), '2');
    assert.equal(new URL(page.url()).searchParams.get('coupon'), 'SAVE10');
    assert.equal(await page.locator('textarea').first().inputValue(), 'Giao buổi sáng');
    assert(await page.locator('.payment-option').filter({ hasText: 'QR' }).locator('input').isChecked());
    assert((await page.locator('.address-option.active').innerText()).includes('Nguyễn Văn An'));
    assert((await page.locator('.order-summary').innerText()).match(/258[,.]000/));
    assert.equal(addressPosts, 2);
    await page.screenshot({ path: path.join(output, 'checkout-resumed.png') });
    report.checks.push('Buy-now context, quantity, coupon, note, payment and new address survive round trip');
    await page.reload();
    await page.locator('.address-option input:checked').waitFor();
    assert.equal(await page.locator('textarea').first().inputValue(), 'Giao buổi sáng');
    report.checks.push('Checkout draft survives refresh of the returned history entry');

    addresses = [];
    await page.goto('http://localhost:4200/checkout');
    await page.locator('a.alert-link').click();
    await page.locator('.address-form-card').waitFor();
    await page.getByRole('button', { name: 'Hủy', exact: true }).click();
    await page.getByRole('button', { name: /Quay lại thanh toán/ }).click();
    await page.waitForURL(url => url.pathname === '/checkout');
    assert.equal(new URL(page.url()).searchParams.get('buyNow'), null);
    await page.locator('a.alert-link').waitFor();
    assert.equal(addressPosts, 2);
    report.checks.push('Normal cart checkout can cancel address entry and return without writing an address');

    await page.goto('http://localhost:4200/products?categoryId=1&gender=Female&sort=priceAsc');
    await page.waitForURL(url => !url.searchParams.has('gender'));
    await page.locator('app-product-card').first().waitFor();
    assert(!(await page.locator('aside').innerText()).includes('Giới tính'));
    assert.equal(new URL(page.url()).searchParams.get('categoryId'), '1');
    assert.equal(new URL(page.url()).searchParams.get('sort'), 'priceAsc');
    await page.screenshot({ path: path.join(output, 'filters-without-gender.png') });
    report.checks.push('Legacy gender URL cleaned; category and sorting retained; gender field removed');
    assert.deepEqual(report.pageErrors, []);
    report.passed = true;
  } catch (error) { report.passed = false; report.failure = error.stack; process.exitCode = 1; }
  finally { await browser.close(); fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2)); console.log(JSON.stringify(report, null, 2)); }
})();
