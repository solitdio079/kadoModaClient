export class ApiError extends Error {
  constructor(public status: number, message: string, public payload?: unknown) { super(message); }
}

// Never render server text: it may be English, HTML, sensitive, or untrusted.
export function apiMessage(status: number, context: 'login' | 'general' = 'general') {
  if (status === 401) return context === 'login'
    ? 'E-posta adresiniz veya şifreniz hatalı.'
    : 'Bu işlem için giriş yapmanız gerekiyor. Oturumunuz sona ermiş olabilir.';
  if (status === 403) return 'Bu işlemi yapmak için yetkiniz bulunmuyor.';
  if (status === 404) return 'Aradığınız kayıt bulunamadı.';
  if (status === 409) return 'Kayıt başka bir yerde kullanılıyor, zaten mevcut veya değiştirilmiş olabilir. Bilgileri kontrol edip tekrar deneyin.';
  if (status === 413) return 'Dosyaların toplam boyutu çok büyük. Daha küçük görseller seçin.';
  if (status === 429) return 'Çok fazla deneme yaptınız. Lütfen biraz sonra tekrar deneyin.';
  if (status === 400 || status === 422) return 'Bilgilerinizi kontrol ederek tekrar deneyin.';
  if (status >= 500) return 'Şu anda hizmet veremiyoruz. Lütfen biraz sonra tekrar deneyin.';
  return 'İşlem tamamlanamadı. Lütfen tekrar deneyin.';
}

export async function apiRequest<T>(path: string, options: RequestInit & { token?: string; context?: 'login' | 'general'; timeoutMs?: number } = {}): Promise<T> {
  const { token, context, timeoutMs = 15000, ...init } = options;
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  let response: Response;
  try {
    const timeout = AbortSignal.timeout(timeoutMs);
    const signal = init.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
    response = await fetch(`/api${path}`, { ...init, headers, signal });
  } catch (error) {
    if (init.signal?.aborted) throw error;
    throw new ApiError(0, 'Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.');
  }
  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    const categoryMessages: Record<string, string> = {
      CATEGORY_IN_USE: 'Önce bu kategorinin alt kategorilerini ve ürünlerini taşıyın veya kaldırın.',
      CATEGORY_CYCLE: 'Bir kategori kendisinin veya alt kategorisinin altına taşınamaz.',
      INVALID_CATEGORY_PARENT: 'Üst kategori artık mevcut değil. Listeyi yenileyip tekrar seçin.',
    };
    const code = payload && typeof payload === 'object' && 'code' in payload && typeof payload.code === 'string' ? payload.code : '';
    throw new ApiError(response.status, categoryMessages[code] ?? apiMessage(response.status, context), payload);
  }
  try { return await response.json() as T; }
  catch { throw new ApiError(0, 'Sunucudan beklenmeyen bir yanıt alındı. Lütfen tekrar deneyin.'); }
}

export const errorMessage = (error: unknown) => error instanceof ApiError
  ? error.message : 'Beklenmeyen bir sorun oluştu. Lütfen tekrar deneyin.';
