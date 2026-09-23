import { z } from 'zod';

export const productSchema = z.object({
  id: z.number().int(), name: z.string(), details: z.string(),
  sizes: z.array(z.string()), stock: z.number().int().nonnegative(),
  price: z.number().int().nonnegative(), // integer kuruş, never floating-point totals
  images: z.array(z.string()).min(1), category: z.string(), color: z.string(),
  originalPrice: z.number().int().nonnegative().optional(), label: z.string().optional(), demo: z.boolean(),
});
export type Product = z.infer<typeof productSchema>;
export const money = (kurus: number) => new Intl.NumberFormat('tr-TR', {
  style: 'currency', currency: 'TRY', maximumFractionDigits: 2,
}).format(kurus / 100);

export const normalizeSearch = (value: string) => value.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i');

export function filterProducts(products: Product[], filters: { q?: string; category?: string; size?: string; sort?: string }) {
  const terms = normalizeSearch(filters.q ?? '').trim().split(/\s+/).filter(Boolean);
  const result = products.filter(p =>
    terms.every(term => normalizeSearch(`${p.name} ${p.category} ${p.color}`).includes(term)) &&
    (!filters.category || p.category === filters.category) &&
    (!filters.size || p.sizes.includes(filters.size)),
  );
  if (filters.sort === 'price-asc') result.sort((a, b) => a.price - b.price);
  if (filters.sort === 'price-desc') result.sort((a, b) => b.price - a.price);
  if (filters.sort === 'name') result.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  return result;
}

const apiProductSchema = z.object({
  id: z.number().int(), name: z.string(), details: z.string(), sizes: z.array(z.string()),
  total_qty: z.number().int().nonnegative(), price: z.union([z.string(), z.number()]),
  images: z.array(z.string()), variant: z.string(),
  category: z.object({ name: z.string() }).nullable().optional(),
  campaign: z.object({ name: z.string(), discount: z.number().int().min(0).max(100) }).nullable().optional(),
  isDemo: z.boolean().optional(),
});

export function parseApiProducts(body: unknown): Product[] {
  return z.object({ data: z.array(apiProductSchema) }).parse(body).data.map(p => {
    const price = Math.round(Number(p.price) * 100);
    if (!Number.isSafeInteger(price) || price < 0) throw new Error('Invalid price');
    return {
      id: p.id, name: p.name, details: p.details, sizes: p.sizes, stock: p.total_qty, price: Math.round(price * (100 - (p.campaign?.discount ?? 0)) / 100),
      originalPrice: p.campaign?.discount ? price : undefined,
      label: p.isDemo ? 'Örnek ürün' : p.campaign?.discount ? `%${p.campaign.discount} indirim` : undefined,
      images: p.images.length ? p.images.map(image => {
        if (/^https:\/\//.test(image)) return image;
        return `/api/${encodeURIComponent(image)}`;
      }) : ['/assets/product-placeholder.svg'],
      category: p.category?.name ?? 'Koleksiyon', color: p.variant, demo: false,
    };
  });
}
