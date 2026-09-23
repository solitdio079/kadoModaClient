import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadProfile, productFormSchema, productPayload, validateImages } from '../src/lib/admin';
import { parseApiProducts } from '../src/lib/catalog';
import { reconcileCart } from '../src/stores/shop';
import { demoProducts } from '../src/data/products';
import { apiRequest } from '../src/lib/api';
const values = { name: 'İpek Elbise', details: 'Uzun kollu ipek elbise.', sizesString: 'S, M, L', total_qty: '12', price: '1299,90', variant: 'Siyah', categoryId: '2', campaignId: '' };
afterEach(() => vi.unstubAllGlobals());
describe('Admin boundaries', () => {
  it('accepts Turkish decimal prices and sends only editable fields', () => {
    const body = productPayload(values, []);
    expect(body.get('price')).toBe('1299.90');
    expect(body.get('campaignId')).toBe('');
    expect(body.has('isDemo')).toBe(false);
    expect(body.has('id')).toBe(false);
  });
  it('rejects fractional stock, invalid amounts, duplicate sizes and missing category', () => {
    for (const change of [{ total_qty: '2.5' }, { price: '1.999,99' }, { sizesString: 'M, M' }, { categoryId: '' }]) expect(productFormSchema.safeParse({ ...values, ...change }).success).toBe(false);
  });
  it('requires photos for new products and rejects oversized or unsupported uploads', () => {
    expect(validateImages([], true)).toBeTruthy();
    expect(validateImages([], false)).toBeNull();
    expect(validateImages([new File(['x'], 'bad.svg', { type: 'image/svg+xml' })])).toContain('JPG');
    expect(validateImages([new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.jpg', { type: 'image/jpeg' })])).toContain('5 MB');
  });
  it('gets the role from the authenticated API, not JWT role claims', async () => {
    const token = `header.${btoa(JSON.stringify({ id: 7, role: 'ADMIN' }))}.signature`;
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: { id: 7, name: 'Müşteri', email: 'test@example.com', role: 'USER' } })));
    vi.stubGlobal('fetch', fetcher);
    expect((await loadProfile(token)).role).toBe('USER');
    expect(fetcher.mock.calls[0][0]).toBe('/api/users/7');
    expect(fetcher.mock.calls[0][1].headers.get('Authorization')).toBe(`Bearer ${token}`);
  });
  it('lets the browser set multipart boundaries while keeping authorization', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('{"data":{}}'));
    vi.stubGlobal('fetch', fetcher);
    await apiRequest('/product', { method: 'POST', body: productPayload(values, []), token: 'test' });
    const headers = fetcher.mock.calls[0][1].headers;
    expect(headers.has('Content-Type')).toBe(false);
    expect(headers.get('Authorization')).toBe('Bearer test');
  });
  it('matches server discount rounding and distinguishes seeded records from local fixtures', () => {
    const p = parseApiProducts({ data: [{ id: 1, name: 'Elbise', details: '', sizes: ['M'], total_qty: 2, price: '19.99', images: [], variant: 'Siyah', category: { name: 'Elbiseler' }, campaign: { name: 'Sezon', discount: 50 }, isDemo: true }] })[0];
    expect(p.price).toBe(1000);
    expect(p.originalPrice).toBe(1999);
    expect(p.demo).toBe(false);
    expect(p.label).toBe('Örnek ürün');
  });
});

it('refreshes cart prices and caps total stock after admin changes, preserving local preview lines', () => {
  const product = { ...demoProducts[0], id: 1, demo: false };
  const lines = [{ product, size: 'S', quantity: 2 }, { product, size: 'M', quantity: 2 }, { product: demoProducts[0], size: 'S', quantity: 1 }];
  const updated = reconcileCart(lines, [{ ...product, price: 100, stock: 3 }], false);
  expect(updated.map(l => l.quantity)).toEqual([2, 1, 1]);
  expect(updated[0].product.price).toBe(100);
  expect(reconcileCart(lines, [], false)).toHaveLength(1);
});
