import { describe, expect, it } from 'vitest';
import { demoProducts } from '../src/data/products';
import { addCartLine, cartTotal } from '../src/stores/shop';
import { filterProducts, parseApiProducts } from '../src/lib/catalog';
import { apiMessage, apiRequest } from '../src/lib/api';
import { vi, afterEach } from 'vitest';

describe('Cart boundaries', () => {
  it('requires a valid size and respects total stock across sizes', () => {
    const product = { ...demoProducts[0], stock: 2 };
    expect(addCartLine([], product, 'XXL')).toBeNull();
    const one = addCartLine([], product, 'S')!;
    const two = addCartLine(one, product, 'M')!;
    expect(addCartLine(two, product, 'L')).toBeNull();
    expect(cartTotal(two)).toBe(378000);
  });
  it('merges the same size while keeping different sizes separate', () => {
    const one = addCartLine([], demoProducts[0], 'M')!;
    const two = addCartLine(one, demoProducts[0], 'M')!;
    expect(two).toHaveLength(1);
    expect(two[0].quantity).toBe(2);
    expect(addCartLine(two, demoProducts[0], 'S')).toHaveLength(2);
  });
  it('never treats demo and real records as the same cart line', () => {
    const one = addCartLine([], demoProducts[0], 'M')!;
    expect(addCartLine(one, { ...demoProducts[0], demo: false }, 'M')).toHaveLength(2);
  });
});

describe('Turkish product discovery', () => {
  it('matches Turkish upper-case letters and common keyboard variants', () => {
    expect(filterProducts(demoProducts, { q: 'FİYONK' })[0].id).toBe(-3);
    expect(filterProducts(demoProducts, { q: 'GUL KURUSU' })[0].id).toBe(-4);
  });
  it('combines filters and sorts without changing the input', () => {
    const sorted = filterProducts(demoProducts, { category: 'Elbiseler', size: 'M', sort: 'price-desc' });
    expect(sorted.map(p => p.id)).toEqual([-6, -1]);
    expect(demoProducts[0].id).toBe(-1);
  });
});

describe('API boundary', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('adapts database decimal prices and uploaded filenames', () => {
    const result = parseApiProducts({ data: [{ id: 1, name: 'Elbise', details: '', sizes: ['M'], total_qty: 2, price: '19.99', images: ['dress 1.jpg'], variant: 'Siyah', category: { name: 'Elbiseler' } }] });
    expect(result[0].price).toBe(1999);
    expect(result[0].images[0]).toBe('/api/dress%201.jpg');
    expect(result[0].demo).toBe(false);
  });
  it('rejects malformed payloads instead of substituting demo products', () => {
    expect(() => parseApiProducts({ data: 'not products' })).toThrow();
  });
  it('does not leak raw English server errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('Unauthorized: internal info', { status: 401 })));
    await expect(apiRequest('/auth/login', { context: 'login' })).rejects.toThrow('E-posta adresiniz veya şifreniz hatalı.');
    expect(apiMessage(500)).toMatch('Şu anda');
  });
  it('localizes network failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(apiRequest('/product')).rejects.toThrow('Sunucuya ulaşılamadı.');
  });
});
