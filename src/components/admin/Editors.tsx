import { cloneElement, useEffect, useId, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { apiRequest, errorMessage } from '../../lib/api';
import { categoryFormSchema, campaignFormSchema, productFormSchema, productPayload, validateImages, imageUrl, type AdminProduct, type Category, type Campaign, type ProductForm } from '../../lib/admin';

export function Modal({ title, children, close, busy = false }: { title: string; children: ReactNode; close: () => void; busy?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => { const el = ref.current; el?.showModal(); return () => el?.close(); }, []);
  return <dialog ref={ref} className="admin-dialog" aria-labelledby={titleId} onCancel={e => { e.preventDefault(); if (!busy) close(); }}><header><div><span className="eyebrow">KADO MODA · YÖNETİM</span><h2 id={titleId}>{title}</h2></div><button className="icon-button" type="button" aria-label="Pencereyi kapat" disabled={busy} onClick={close}><X /></button></header>{children}</dialog>;
}
function Field({ label, error, children }: { label: string; error?: string; children: ReactElement<Record<string, unknown>> }) {
  const id = useId();
  return <div className="admin-field"><label htmlFor={id}>{label}</label>{cloneElement(children, { id, "aria-invalid": !!error, "aria-describedby": error ? `${id}-error` : undefined })}{error && <span id={`${id}-error`} className="field-error" role="alert">{error}</span>}</div>;
}
function ImagePicker({ files, setFiles, existing, max = 6 }: { files: File[]; setFiles: (files: File[]) => void; existing: string[]; max?: number }) {
  const [previews, setPreviews] = useState<string[]>([]);
  useEffect(() => { const urls = files.map(f => URL.createObjectURL(f)); setPreviews(urls); return () => urls.forEach(URL.revokeObjectURL); }, [files]);
  return <div className="admin-image-picker"><label className="admin-upload"><Upload size={20} /><span>Görsel seç <small>JPG, PNG, WebP · Her biri en fazla 5 MB · En fazla {max} görsel</small></span><input className="sr-only" aria-label="Görsel dosyalarını seç" type="file" accept="image/jpeg,image/png,image/webp" multiple={max > 1} onChange={e => setFiles(Array.from(e.target.files ?? []))} /><span className="admin-file-summary">{files.length ? `${files.length} görsel seçildi: ${files.map(f => f.name).join(', ')}` : 'Henüz yeni görsel seçilmedi.'}</span></label><div className="admin-previews">{(previews.length ? previews : existing.map(imageUrl)).map((src, i) => <img key={src} src={src} alt={`${previews.length ? 'Seçilen' : 'Mevcut'} görsel ${i + 1}`} />)}</div>{existing.length > 0 && <p className="muted">Yeni görsel seçerseniz mevcut görsellerin yerine kaydedilir. Seçmezseniz mevcut görseller korunur.</p>}</div>;
}
const blank: ProductForm = { name: '', details: '', sizesString: 'S, M, L', total_qty: '0', price: '', variant: '', categoryId: '', campaignId: '' };
export function ProductEditor({ product, categories, campaigns, token, close, saved }: { product?: AdminProduct; categories: Category[]; campaigns: Campaign[]; token: string; close: () => void; saved: () => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProductForm>({ resolver: zodResolver(productFormSchema), defaultValues: product ? { name: product.name, details: product.details, sizesString: product.sizes.join(', '), total_qty: String(product.total_qty), price: product.price, variant: product.variant, categoryId: String(product.categoryId), campaignId: product.campaignId ? String(product.campaignId) : '' } : blank });
  const submit = handleSubmit(async values => {
    const issue = validateImages(files, !product); setImageError(issue); if (issue) return;
    setFailure(null);
    try { await apiRequest(product ? `/product/${product.id}` : '/product', { token, method: product ? 'PUT' : 'POST', body: productPayload(values, files) }); toast.success(product ? 'Ürün güncellendi.' : 'Ürün oluşturuldu.'); saved(); }
    catch (e) { const message = errorMessage(e); setFailure(message); toast.error(message); }
  });
  return <Modal title={product ? 'Ürünü düzenle' : 'Yeni ürün'} close={close} busy={isSubmitting}><form noValidate onSubmit={submit}><fieldset disabled={isSubmitting} className="admin-fields"><Field label="Ürün adı" error={errors.name?.message}><input className="input" {...register('name')} /></Field><div className="admin-form-grid"><Field label="Fiyat (₺)" error={errors.price?.message}><input className="input" inputMode="decimal" placeholder="1299,90" {...register('price')} /></Field><Field label="Toplam stok" error={errors.total_qty?.message}><input className="input" inputMode="numeric" {...register('total_qty')} /></Field><Field label="Kategori" error={errors.categoryId?.message}><select className="select" {...register('categoryId')}><option value="">Kategori seçin</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field><Field label="Kampanya" error={errors.campaignId?.message}><select className="select" {...register('campaignId')}><option value="">Kampanya yok</option>{campaigns.map(c => <option key={c.id} value={c.id}>{c.name} · %{c.discount}</option>)}</select></Field><Field label="Renk / varyant" error={errors.variant?.message}><input className="input" {...register('variant')} /></Field><Field label="Bedenler (virgülle ayırın)" error={errors.sizesString?.message}><input className="input" {...register('sizesString')} /></Field></div><Field label="Ürün açıklaması" error={errors.details?.message}><textarea className="textarea" rows={5} {...register('details')} /></Field><ImagePicker files={files} setFiles={setFiles} existing={product?.images ?? []} />{imageError && <p className="field-error" role="alert">{imageError}</p>}<p className="notice">Stok tüm bedenler için toplam adettir. Beden bazlı stok ve ödeme sonraki aşamada açılacaktır.</p>{failure && <p className="field-error" role="alert">{failure}</p>}<footer className="admin-form-actions"><button className="btn btn-outline" type="button" onClick={close}>Vazgeç</button><button className="btn btn-primary" type="submit">{isSubmitting ? 'Kaydediliyor…' : 'Ürünü kaydet'}</button></footer></fieldset></form></Modal>;
}
export function TaxonomyEditor({ kind, item, token, close, saved }: { kind: 'category' | 'campaign'; item?: Category | Campaign; token: string; close: () => void; saved: () => void }) {
  const campaign = kind === 'campaign';
  const [files, setFiles] = useState<File[]>([]);
  const [failure, setFailure] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<{ name: string; discount?: string }>({ resolver: zodResolver(campaign ? campaignFormSchema : categoryFormSchema), defaultValues: { name: item?.name ?? '', discount: item && 'discount' in item ? String(item.discount) : '0' } });
  const submit = handleSubmit(async values => {
    const issue = validateImages(files, false, 1); if (issue) { setFailure(issue); return; }
    setFailure(null);
    const body = new FormData(); body.append('name', values.name); if (campaign) { body.append('discount', values.discount ?? '0'); if (files[0]) body.append('image', files[0]); }
    try { await apiRequest(`/${kind}${item ? `/${item.id}` : ''}`, { token, method: item ? 'PUT' : 'POST', body: campaign ? body : JSON.stringify({ name: values.name }) }); toast.success(campaign ? 'Kampanya kaydedildi.' : 'Kategori kaydedildi.'); saved(); }
    catch (e) { const message = errorMessage(e); setFailure(message); toast.error(message); }
  });
  const noun = campaign ? 'kampanya' : 'kategori';
  return <Modal title={item ? `${campaign ? 'Kampanyayı' : 'Kategoriyi'} düzenle` : `Yeni ${noun}`} close={close} busy={isSubmitting}><form noValidate onSubmit={submit}><fieldset disabled={isSubmitting} className="admin-fields"><Field label={campaign ? 'Kampanya adı' : 'Kategori adı'} error={errors.name?.message}><input className="input" {...register('name')} /></Field>{campaign && <><Field label="İndirim oranı (%)" error={errors.discount?.message}><input className="input" inputMode="numeric" {...register('discount')} /></Field><ImagePicker files={files} setFiles={setFiles} existing={item && 'image' in item && item.image ? [item.image] : []} max={1} /><p className="notice">Bu kampanyaya bağlı ürünlerde indirim hemen uygulanır.</p></>}{failure && <p className="field-error" role="alert">{failure}</p>}<footer className="admin-form-actions"><button type="button" className="btn btn-outline" onClick={close}>Vazgeç</button><button type="submit" className="btn btn-primary">{isSubmitting ? 'Kaydediliyor…' : 'Kaydet'}</button></footer></fieldset></form></Modal>;
}
export function DeleteConfirmation({ kind, item, token, close, saved }: { kind: 'product' | 'category' | 'campaign'; item: { id: number; name: string }; token: string; close: () => void; saved: () => void }) {
  const [busy, setBusy] = useState(false), [failure, setFailure] = useState<string | null>(null);
  const remove = async () => { setBusy(true); setFailure(null); try { await apiRequest(`/${kind}/${item.id}`, { method: 'DELETE', token }); toast.success('Kayıt silindi.'); saved(); } catch (e) { setFailure(errorMessage(e)); } finally { setBusy(false); } };
  return <Modal title="Kaydı sil" close={close} busy={busy}><div className="admin-fields"><p><strong>{item.name}</strong> kalıcı olarak silinecek. Bu işlem geri alınamaz.</p><p className="muted">Başka kayıtlarda kullanılan ürün, kategori veya kampanyalar silinemeyebilir. Önce ilişkili kayıtları kontrol edin.</p>{failure && <p className="field-error" role="alert">{failure}</p>}<footer className="admin-form-actions"><button disabled={busy} className="btn btn-outline" onClick={close}>Vazgeç</button><button disabled={busy} className="btn admin-danger" onClick={remove}>{busy ? 'Siliniyor…' : 'Kalıcı olarak sil'}</button></footer></div></Modal>;
}
