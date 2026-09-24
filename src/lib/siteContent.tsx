import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { z } from 'zod';
import { apiRequest, errorMessage } from './api';
export const contentPages = { about: { title: 'Hakkımızda', path: '/hakkimizda' }, privacy: { title: 'Gizlilik politikası', path: '/gizlilik' }, 'distance-sales': { title: 'Mesafeli satış sözleşmesi', path: '/mesafeli-satis-sozlesmesi' }, delivery: { title: 'Teslimat koşulları', path: '/teslimat' }, returns: { title: 'İptal ve iade koşulları', path: '/iptal-ve-iade' } } as const;
export type PageSlug = keyof typeof contentPages;
export const slugSchema = z.enum(['business', 'about', 'privacy', 'distance-sales', 'delivery', 'returns']);
export type ContentSlug = z.infer<typeof slugSchema>;
export const businessLabels = {
  legalName: 'Ticari unvan / işletme sahibinin adı', address: 'İşletmenin açık adresi', email: 'Müşteri hizmetleri e-posta adresi', phone: 'Müşteri hizmetleri telefon numarası', returnAddress: 'İade adresi', taxOffice: 'Vergi dairesi', taxNumber: 'Vergi kimlik numarası', mersis: 'MERSİS numarası (varsa)', kep: 'KEP adresi (varsa)', chamber: 'Kayıtlı olunan meslek odası', professionalRules: 'Mesleki kurallar ve erişim bilgileri (uygunsa)', shippingFee: 'Kargo ücreti ve ücretsiz kargo koşulları', dispatchTime: 'Siparişi kargoya verme süresi', deliveryTime: 'Tahmini teslimat süresi',
} as const;
const short = z.string().max(2000, 'En fazla 2000 karakter yazabilirsiniz.');
export const businessSchema = z.object({ legalName: short, address: short, email: short, phone: short, returnAddress: short, taxOffice: short, taxNumber: short, mersis: short, kep: short, chamber: short, professionalRules: short, shippingFee: short, dispatchTime: short, deliveryTime: short });
export type Business = z.infer<typeof businessSchema>;
export const pageSchema = z.object({ body: z.string().max(25000, 'Metin en fazla 25000 karakter olabilir.') });
const contentSchema = z.union([businessSchema, pageSchema]);
export const adminContentSchema = z.object({ slug: slugSchema, draft: contentSchema, published: contentSchema.nullable(), revision: z.number().int().nonnegative(), publishedAt: z.string().nullable(), updatedAt: z.string().nullable() });
export type ContentRecord = z.infer<typeof adminContentSchema>;
const publicSchema = z.object({ data: z.array(z.object({ slug: slugSchema, content: contentSchema, publishedAt: z.string() })) });
type PublicContent = z.infer<typeof publicSchema>['data'];
const Context = createContext<{ records: PublicContent; loading: boolean; error: string | null; reload: () => void }>({ records: [], loading: true, error: null, reload: () => {} });
export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<PublicContent>([]), [loading, setLoading] = useState(true), [error, setError] = useState<string | null>(null), [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision(r => r + 1), []);
  useEffect(() => { const controller = new AbortController(); setLoading(true); setError(null);
    apiRequest('/site-content', { signal: controller.signal }).then(body => { if (!controller.signal.aborted) setRecords(publicSchema.parse(body).data); }).catch(e => { if (!controller.signal.aborted) { setRecords([]); setError(errorMessage(e)); } }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [revision]);
  return <Context.Provider value={{ records, loading, error, reload }}>{children}</Context.Provider>;
}
export const useSiteContent = () => useContext(Context);
export function publicationErrors(slug: ContentSlug, content: Business | { body: string }): Record<string, string> {
  if (slug !== 'business') return 'body' in content && content.body.trim().length >= 100 ? {} : { body: 'Yayımlamak için en az 100 karakter içeren, işletmenize uygun tamamlanmış bir metin girin.' };
  const parsed = businessSchema.safeParse(content); if (!parsed.success) return { root: 'İşletme bilgilerini kontrol edin.' };
  const b = parsed.data, errors: Record<string, string> = {};
  for (const key of ['legalName', 'taxOffice', 'shippingFee', 'dispatchTime', 'deliveryTime'] as const) if (b[key].trim().length < 2) errors[key] = 'Yayımlamak için bu alanı doldurun.';
  for (const key of ['address', 'returnAddress'] as const) if (b[key].trim().length < 10) errors[key] = 'En az 10 karakter içeren açık adresi yazın.';
  if (!z.string().email().safeParse(b.email.trim()).success) errors.email = 'Geçerli bir e-posta adresi girin.';
  if (!/^\+?[\d ()-]{7,40}$/.test(b.phone.trim())) errors.phone = 'Geçerli bir telefon numarası girin.';
  if (!/^\d{10,11}$/.test(b.taxNumber.trim())) errors.taxNumber = '10 veya 11 haneli kimlik numarasını girin.';
  if (b.kep && !z.string().email().safeParse(b.kep.trim()).success) errors.kep = 'Geçerli bir KEP adresi girin.';
  return errors;
}
