import { z } from 'zod';
import { apiRequest } from './api';

const id = z.number().int().positive();
export const categorySchema = z.object({ id, name: z.string() });
export const campaignSchema = categorySchema.extend({ discount: z.number().int().min(0).max(100), image: z.string().nullable().optional() });
export const adminProductSchema = z.object({
  id, name: z.string(), details: z.string(), sizes: z.array(z.string()),
  total_qty: z.number().int().nonnegative(), price: z.union([z.string(), z.number()]).transform(String),
  variant: z.string(), images: z.array(z.string()), categoryId: id,
  campaignId: id.nullable(), isDemo: z.boolean().default(false),
  category: categorySchema, campaign: campaignSchema.nullable(),
});
export type AdminProduct = z.infer<typeof adminProductSchema>;
export type Category = z.infer<typeof categorySchema>;
export type Campaign = z.infer<typeof campaignSchema>;
export const profileSchema = z.object({ id, email: z.string().email(), name: z.string().nullable(), role: z.enum(['USER', 'ADMIN']) });
export type Profile = z.infer<typeof profileSchema>;

// The decoded ID only selects the profile endpoint. The server authenticates the
// token and supplies the role; a client-decoded role is never used for access.
export async function loadProfile(token: string): Promise<Profile> {
  const part = token.split('.')[1];
  const payload = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')));
  const userId = id.parse(payload.id);
  return z.object({ data: profileSchema }).parse(await apiRequest(`/users/${userId}`, { token })).data;
}
export async function loadInventory(token: string, signal?: AbortSignal) {
  const [products, categories, campaigns] = await Promise.all([
    apiRequest('/product', { token, signal }), apiRequest('/category', { token, signal }), apiRequest('/campaign', { token, signal }),
  ]);
  return {
    products: z.object({ data: z.array(adminProductSchema) }).parse(products).data,
    categories: z.object({ data: z.array(categorySchema) }).parse(categories).data,
    campaigns: z.object({ data: z.array(campaignSchema) }).parse(campaigns).data,
  };
}
const text = (min: number, max: number) => z.string().trim().min(min, `En az ${min} karakter yazın.`).max(max, `En fazla ${max} karakter yazabilirsiniz.`);
const integer = z.string().regex(/^\d+$/, 'Sıfır veya pozitif bir tam sayı yazın.').refine(v => Number(v) <= 2147483647, 'Sayı çok büyük.');
export const productFormSchema = z.object({
  name: text(3, 200), details: text(10, 10000), variant: text(1, 100),
  price: z.string().trim().transform(v => v.replace(',', '.')).pipe(z.string().regex(/^\d{1,8}(\.\d{1,2})?$/, 'Geçerli bir fiyat yazın (ör. 1299,90).')),
  total_qty: integer, categoryId: z.string().regex(/^[1-9]\d*$/, 'Bir kategori seçin.'), campaignId: z.string(),
  sizesString: text(1, 200).refine(v => { const sizes = v.split(',').map(s => s.trim()); return sizes.length <= 20 && sizes.every(s => s.length > 0 && s.length <= 20) && new Set(sizes).size === sizes.length; }, 'En fazla 20 farklı bedeni virgülle ayırın (S, M, L).'),
});
export type ProductForm = z.input<typeof productFormSchema>;
export const categoryFormSchema = z.object({ name: text(2, 100) });
export const campaignFormSchema = z.object({ name: text(3, 150), discount: integer.refine(v => Number(v) <= 100, 'İndirim 0–100 arasında olmalı.') });
export const imageUrl = (filename?: string | null) => filename ? `/api/${encodeURIComponent(filename)}` : '/assets/product-placeholder.svg';
export function validateImages(files: File[], required = false, max = 6) {
  if (required && !files.length) return 'En az bir ürün görseli seçin.';
  if (files.length > max) return `En fazla ${max} görsel seçebilirsiniz.`;
  if (files.some(f => !['image/jpeg', 'image/png', 'image/webp'].includes(f.type))) return 'Yalnızca JPG, PNG veya WebP görselleri seçin.';
  if (files.some(f => f.size > 5 * 1024 * 1024)) return 'Her görsel en fazla 5 MB olabilir.';
  return null;
}
export function productPayload(values: ProductForm, files: File[]) {
  const parsed = productFormSchema.parse(values);
  const body = new FormData();
  Object.entries(parsed).forEach(([key, value]) => body.append(key, value));
  files.forEach(file => body.append('images', file));
  return body;
}
