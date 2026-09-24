// Optional browser regression suite: requires Playwright on NODE_PATH and a running Vite server.
// All /api requests are intercepted. This suite never writes to a real API.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    let role = 'ADMIN';
    let failed = false;
    let categories = [{ id: 1, name: 'Elbiseler' }];
    let campaigns = [{ id: 1, name: 'Yeni Sezon', discount: 10, image: null }];
    let products = [{ id: 1, name: 'Saten Midi Elbise', details: 'Zamansız kesimiyle saten midi elbise.', sizes: ['S','M','L'], total_qty: 12, price: '1890', variant: 'Siyah', images: [], categoryId: 1, campaignId: 1, isDemo: true }];
    const writes = [];
    const businessKeys = ['legalName','address','email','phone','returnAddress','taxOffice','taxNumber','mersis','kep','chamber','professionalRules','shippingFee','dispatchTime','deliveryTime'];
    const contentRows = ['business','about','privacy','distance-sales','delivery','returns'].map(slug => ({ slug, draft: slug === 'business' ? Object.fromEntries(businessKeys.map(k => [k, ''])) : { body: '' }, published: null, revision: 0, publishedAt: null, updatedAt: null }));
    const token = `header.${Buffer.from(JSON.stringify({ id: 1 })).toString('base64url')}.sig`;
    await context.route('**/api/**', async route => {
      const req = route.request(), url = new URL(req.url()), path = url.pathname.replace('/api', ''), method = req.method();
      let status = 200, result;
      if (path === '/auth/login') result = { token };
      else if (path === '/users/1') result = { data: { id: 1, name: 'Deneme Yönetici', email: 'admin@example.com', role } };
      else if (method === 'GET') {
        if (path === '/site-content') result = { data: contentRows.filter(r => r.published).map(r => ({ slug: r.slug, content: r.published, publishedAt: r.publishedAt })) };
        else if (path === '/site-content/admin') result = { data: contentRows };
        else if (failed) { status = 500; result = { error: 'INTERNAL SQL SECRET' }; }
        else if (path === '/product') result = { data: products.map(p => ({ ...p, category: categories.find(c => c.id === p.categoryId), campaign: campaigns.find(c => c.id === p.campaignId) ?? null })) };
        else if (path === '/category') result = { data: categories };
        else if (path === '/campaign') result = { data: campaigns };
        else { status = 404; result = {}; }
      } else {
        assert.equal(req.headers().authorization, `Bearer ${token}`);
        writes.push({ path, method, body: req.postData() ?? '' });
        if (path.startsWith('/site-content/admin/')) { const row = contentRows.find(r => r.slug === path.split('/').pop()); const body = JSON.parse(req.postData()); row.draft = body.content; row.revision++; row.updatedAt = new Date().toISOString(); if (body.action === 'publish') { row.published = body.content; row.publishedAt = row.updatedAt; } if (body.action === 'unpublish') { row.published = null; row.publishedAt = null; } result = { data: row }; }
        else if (path === '/category' && method === 'POST') { const item = { id: 2, ...JSON.parse(req.postData()) }; categories.push(item); result = { data: item }; }
        else if (path === '/product/1' && method === 'PUT') { products[0].name = 'Güncellenen Saten Elbise'; result = { data: products[0] }; }
        else if (path.startsWith('/product/') && method === 'DELETE') { products = products.filter(p => p.id !== Number(path.split('/')[2])); result = { message: 'deleted' }; }
        else if (path === '/product' && method === 'POST') { const item = { ...products[0], id: 2, name: 'Yeni Elbise', isDemo: false }; products.push(item); result = { data: item }; }
        else if (path === '/campaign/1' && method === 'PUT') { campaigns[0].discount = 25; result = { data: campaigns[0] }; }
        else { result = { data: {} }; }
      }
      await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(result) });
    });
    const page = await context.newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:5173';
    await page.goto(`${base}/admin`);
    await page.getByRole('heading', { name: 'Yönetici girişi' }).waitFor();
    await page.getByRole('link', { name: 'Giriş yap', exact: true }).click();
    async function login() {
      await page.getByLabel('E-posta adresi', { exact: true }).fill('admin@example.com');
      await page.getByLabel('Şifre', { exact: true }).fill('browser-test-only');
      await page.getByRole('button', { name: 'Giriş yap', exact: true }).click();
    }
    await login();
    await page.getByRole('heading', { name: 'Her detay sizin elinizde.' }).waitFor();
    await page.getByRole('heading', { name: 'Saten Midi Elbise', exact: true }).waitFor();
    await fs.mkdir('/private/tmp/kadomoda-stage2', { recursive: true });
    await page.screenshot({ path: '/private/tmp/kadomoda-stage2/admin-desktop.png', fullPage: true });
    await page.getByRole('button', { name: 'Saten Midi Elbise: düzenle' }).click();
    await page.getByLabel('Ürün adı', { exact: true }).fill('Güncellenen Saten Elbise');
    await page.getByLabel('Fiyat (₺)', { exact: true }).fill('1299,90');
    await page.getByRole('button', { name: 'Ürünü kaydet', exact: true }).click();
    await page.getByRole('heading', { name: 'Güncellenen Saten Elbise' }).waitFor();
    const productWrite = writes.find(w => w.path === '/product/1');
    assert.match(productWrite.body, /1299.90/);
    assert.doesNotMatch(productWrite.body, /name="images"/);
    await page.getByRole('link', { name: 'Kategoriler', exact: true }).click();
    await page.getByRole('button', { name: 'Yeni kategori', exact: true }).click();
    await page.getByLabel('Kategori adı').fill('Ceketler');
    await page.getByRole('button', { name: 'Kaydet', exact: true }).click();
    await page.getByRole('heading', { name: 'Ceketler', exact: true }).waitFor();
    await page.getByRole('link', { name: 'Kampanyalar', exact: true }).click();
    await page.locator('article').filter({ has: page.getByRole('heading', { name: 'Yeni Sezon', exact: true }) }).getByRole('button', { name: 'Düzenle', exact: true }).click();
    await page.getByLabel('İndirim oranı (%)').fill('101');
    await page.getByRole('button', { name: 'Kaydet', exact: true }).click();
    await page.getByText('İndirim 0–100 arasında olmalı.').waitFor();
    await page.getByLabel('İndirim oranı (%)').fill('25');
    await page.getByRole('button', { name: 'Kaydet', exact: true }).click();
    await page.getByText('%25 indirim · 1 ürün').waitFor();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('link', { name: 'Ürünler', exact: true }).click();
    await page.getByRole('heading', { name: 'Güncellenen Saten Elbise' }).waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({ path: '/private/tmp/kadomoda-stage2/admin-mobile.png', fullPage: true });
    await page.getByRole('button', { name: 'Yeni ürün', exact: true }).click();
    await page.getByRole('button', { name: 'Ürünü kaydet' }).click();
    await page.getByText('En az 3 karakter yazın.').waitFor();
    await page.getByLabel('Ürün adı', { exact: true }).fill('Yeni Elbise');
    await page.getByLabel('Fiyat (₺)', { exact: true }).fill('500');
    await page.getByLabel('Kategori', { exact: true }).selectOption('1');
    await page.getByLabel('Renk / varyant').fill('Siyah');
    await page.getByLabel('Ürün açıklaması').fill('Yeni sezon elbise açıklaması.');
    await page.getByRole('button', { name: 'Ürünü kaydet' }).click();
    await page.getByText('En az bir ürün görseli seçin.').waitFor();
    await page.screenshot({ path: '/private/tmp/kadomoda-stage2/editor-mobile.png', fullPage: true });
    await page.locator('input[type=file]').setInputFiles({ name: 'test.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==', 'base64') });
    await page.getByRole('button', { name: 'Ürünü kaydet' }).click();
    await page.getByRole('heading', { name: 'Yeni Elbise', exact: true }).waitFor();
    assert.match(writes.find(w => w.path === '/product' && w.method === 'POST').body, /filename="test.png"/);
    await page.getByLabel('Yalnızca örnek ürünler').check();
    assert.equal(await page.getByRole('heading', { name: 'Yeni Elbise', exact: true }).count(), 0);
    await page.getByLabel('Yalnızca örnek ürünler').uncheck();
    await page.getByRole('button', { name: 'Güncellenen Saten Elbise: sil' }).click();
    await page.getByRole('button', { name: 'Vazgeç', exact: true }).click();
    assert.equal(writes.filter(w => w.method === 'DELETE').length, 0);
    await page.getByRole('button', { name: 'Güncellenen Saten Elbise: sil' }).click();
    await page.getByRole('button', { name: 'Kalıcı olarak sil' }).click();
    await page.getByRole('heading', { name: 'Yeni Elbise', exact: true }).waitFor();
    assert.equal(writes.filter(w => w.method === 'DELETE').length, 1);
    await page.getByRole('button', { name: 'Yeni Elbise: sil' }).click();
    await page.getByRole('button', { name: 'Kalıcı olarak sil' }).click();
    await page.getByRole('heading', { name: 'İlk ürününüze yer açtık.' }).waitFor();
    failed = true;
    await page.getByRole('button', { name: 'Listeyi yenile' }).click();
    await page.getByRole('heading', { name: 'Kayıtlar yüklenemedi' }).waitFor();
    assert.equal((await page.textContent('body')).includes('INTERNAL SQL SECRET'), false);
    failed = false;
    await page.getByRole('button', { name: 'Tekrar dene', exact: true }).click();
    await page.getByRole('heading', { name: 'İlk ürününüze yer açtık.' }).waitFor();
    await page.getByRole('link', { name: 'Mağaza bilgileri', exact: true }).click();
    await page.getByRole('button', { name: 'Hakkımızda Yayımlanmadı' }).click();
    const policy = 'Kado Moda mağazası hakkında onaylanmış test metni. '.repeat(4) + '<script>window.badScript=true</script>';
    await page.getByLabel('Sayfa metni', { exact: true }).fill(policy);
    await page.getByRole('button', { name: 'Taslağı kaydet', exact: true }).click();
    await page.getByText('Taslak kaydedildi.', { exact: true }).waitFor();
    const visitor = await context.newPage();
    await visitor.goto(`${base}/hakkimizda`);
    await visitor.getByText('Bu sayfanın bilgileri henüz yayımlanmadı.', { exact: false }).waitFor();
    await page.getByRole('button', { name: 'Mağazada yayımla' }).click();
    await page.getByText('Yayımlamadan önce bilgilerin doğruluğunu onaylayın.').waitFor();
    await page.getByLabel('Bilgilerin doğru, güncel', { exact: false }).check();
    await page.getByRole('button', { name: 'Mağazada yayımla' }).click();
    await page.getByText('Bilgiler mağazada yayımlandı.', { exact: true }).waitFor();
    await visitor.reload();
    await visitor.getByText(policy, { exact: true }).waitFor();
    assert.equal(await visitor.evaluate(() => window.badScript), undefined);
    await page.getByLabel('Sayfa metni', { exact: true }).fill('Henüz yayımlanmamış yeni taslak');
    await page.getByRole('button', { name: 'Gizlilik politikası Yayımlanmadı' }).click();
    await page.getByRole('heading', { name: 'Kaydedilmemiş değişiklikler' }).waitFor();
    await page.getByRole('button', { name: 'Düzenlemeye dön' }).click();
    await page.getByRole('button', { name: 'Taslağı kaydet', exact: true }).click();
    await page.getByRole('button', { name: 'Hakkımızda Yayında · Taslak değişti' }).waitFor();
    await visitor.reload();
    await visitor.getByText(policy, { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Yayından kaldır', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Yayından kaldır', exact: true }).click();
    await page.getByText('Sayfa yayından kaldırıldı. Taslak korundu.', { exact: true }).waitFor();
    await visitor.reload();
    await visitor.getByText('Bu sayfanın bilgileri henüz yayımlanmadı.', { exact: false }).waitFor();
    await visitor.close();
    await page.getByRole('button', { name: 'İşletme ve iletişim Yayımlanmadı' }).click();
    await page.getByRole('button', { name: 'Mağazada yayımla' }).click();
    await page.getByText('Geçerli bir e-posta adresi girin.').waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({ path: '/private/tmp/kadomoda-stage2/settings-mobile.png', fullPage: true });
    await page.reload();
    await page.getByRole('heading', { name: 'Yönetici girişi' }).waitFor();
    role = 'USER';
    await page.getByRole('link', { name: 'Giriş yap', exact: true }).click();
    await login();
    await page.getByText('admin@example.com', { exact: true }).waitFor();
    assert.equal(await page.getByRole('link', { name: 'Mağazayı yönet' }).count(), 0);
    // SPA navigation retains the real login state; no state injection or role bypass.
    await page.evaluate(() => { history.pushState({}, '', '/yonetim'); dispatchEvent(new PopStateEvent('popstate')); });
    await page.getByRole('heading', { name: 'Erişim yetkiniz bulunmuyor' }).waitFor();
    assert.deepEqual(errors, []);
    console.log('PASS: admin login/guards, edit, category create, campaign validation/edit, mobile layout, image validation, delete cancel/confirm, localized API errors, retry, reload logout, non-admin denial. All API traffic mocked.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
