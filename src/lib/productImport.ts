import { z } from 'zod';
import { ApiError, apiRequest, errorMessage } from './api';

export const importPreviewSchema = z.object({
  valid: z.boolean(), count: z.number().int().min(0).max(1000), issueCount: z.number().int().nonnegative(),
  issues: z.array(z.object({ row: z.number().int().min(2).max(1001), field: z.enum(['name', 'details', 'sizes', 'total_qty', 'price', 'variant']), reason: z.enum(['invalid', 'cell_type', 'duplicate', 'exists']) })),
  rows: z.array(z.object({ row: z.number().int(), name: z.string(), sizes: z.array(z.string()), total_qty: z.number().int(), price: z.string(), variant: z.string() })),
});
export type ImportPreview = z.infer<typeof importPreviewSchema>;
export const importLabels = { name: 'Ürün adı', details: 'Açıklama', sizes: 'Bedenler', total_qty: 'Stok', price: 'Fiyat', variant: 'Renk / varyant' };
export const importReasons = {
  invalid: 'Değeri ve şablondaki kuralları kontrol edin.',
  cell_type: 'Formül, tarih veya bağlantı yerine düz metin ya da sayı yazın.',
  duplicate: 'Aynı ad ve renkte bir ürün bu dosyada tekrarlanıyor.',
  exists: 'Aynı ad ve renkte bir ürün bu kategoride zaten var. Mevcut ürünü düzenleyin.',
};
export function validateImportFile(file?: File) {
  if (!file) return 'Bir Excel dosyası seçin.';
  if (!/\.xlsx$/i.test(file.name)) return 'Yalnızca .xlsx dosyası seçin.';
  if (!file.size || file.size > 5 * 1024 * 1024) return 'Dosya boş olmamalı ve en fazla 5 MB olmalıdır.';
  return null;
}
export function importPayload(file: File, categoryId: string, campaignId: string) {
  const body = new FormData();
  body.append('categoryId', categoryId);
  if (campaignId) body.append('campaignId', campaignId);
  body.append('file', file);
  return body;
}
const importErrors: Record<string, string> = {
  FILE_REQUIRED: 'Bir Excel dosyası seçin.', INVALID_FILE: 'Dosya okunamadı. Excel çalışma kitabını .xlsx biçiminde kaydedin.',
  INVALID_COLUMNS: 'Şablondaki altı sütun başlığını değiştirmeyin. Ürünleri Urunler sayfasına yazın.',
  ROW_LIMIT: 'En fazla 1000 ürün ekleyin. İlk satır başlıklara ayrılmıştır.', EMPTY_FILE: 'Dosyada ürün bulunamadı. Urunler sayfasını doldurun.',
  INVALID_CATEGORY: 'Kategori artık mevcut değil. Listeyi yenileyip tekrar seçin.', INVALID_CAMPAIGN: 'Kampanya artık mevcut değil. Listeyi yenileyip tekrar seçin.',
  INVALID_UPLOAD: 'Dosya türünü, sayısını ve 5 MB sınırını kontrol edin.',
};
export function importError(error: unknown) {
  if (error instanceof ApiError) {
    const parsed = z.object({ code: z.string() }).safeParse(error.payload);
    if (parsed.success && importErrors[parsed.data.code]) return importErrors[parsed.data.code];
    if (error.status === 0 || error.status >= 500) return 'İşlemin sonucu doğrulanamadı. Ürün listesini kontrol edin, ardından dosyayı yeniden ön izleyin. Tekrar yükleme mevcut ürünleri değiştirmez.';
  }
  return errorMessage(error);
}
export async function previewImport(token: string, body: FormData) {
  return importPreviewSchema.parse(await apiRequest('/product/bulk/preview', { token, method: 'POST', body, timeoutMs: 60000 }));
}
export async function commitImport(token: string, body: FormData) {
  return z.object({ count: z.number().int().positive().max(1000) }).parse(await apiRequest('/product/bulk', { token, method: 'POST', body, timeoutMs: 60000 }));
}
