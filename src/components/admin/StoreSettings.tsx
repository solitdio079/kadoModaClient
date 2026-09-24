import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useForm, type Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowUpRight, Check, FileText } from 'lucide-react';
import { apiRequest, ApiError, errorMessage } from '../../lib/api';
import { adminContentSchema, businessLabels, businessSchema, contentPages, pageSchema, publicationErrors, useSiteContent, type ContentRecord, type Business } from '../../lib/siteContent';
import { useSession } from '../../stores/session';
import { Modal } from './Editors';
export function StoreSettings({ token }: { token: string }) {
  const [rows, setRows] = useState<ContentRecord[]>([]), [loading, setLoading] = useState(true), [failure, setFailure] = useState<string | null>(null), [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState<string>('business');
  const [dirty, setDirty] = useState(false), [pending, setPending] = useState<string | null>(null);
  const { reload } = useSiteContent();
  useEffect(() => { const controller = new AbortController(); setLoading(true); setFailure(null);
    apiRequest('/site-content/admin', { token, signal: controller.signal }).then(body => { if (!controller.signal.aborted) setRows(z.object({ data: z.array(adminContentSchema) }).parse(body).data); }).catch(e => { if (!controller.signal.aborted) { if (e instanceof ApiError && e.status === 401) useSession.getState().logout(); setFailure(e instanceof ApiError && e.status === 404 ? 'Mağaza bilgileri için API güncellemesini yayımlayın, ardından tekrar deneyin.' : errorMessage(e)); } }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [token, revision]);
  const row = rows.find(r => r.slug === selected);
  const saved = (record: ContentRecord) => { setRows(old => old.map(r => r.slug === record.slug ? record : r)); reload(); };
  return <div className="admin-shell shell"><div className="admin-heading"><div><span className="eyebrow">MAĞAZA YÖNETİMİ</span><h1>Mağaza bilgileri</h1><p>İşletmenizi tanıtın, müşterilerinizi bilgilendirin.</p></div><Link className="btn btn-outline" to="/yonetim">Ürün yönetimine dön</Link></div><div className="notice">Taslaklar yalnızca yöneticilere görünür. Yayımlanan bilgiler mağazada görünür. Bu bölüm ödeme işlemlerini açmaz ve iyzico onayı vermez.</div>{loading ? <div className="catalog-loading" role="status">Bilgiler yükleniyor…</div> : failure ? <div className="empty-state" role="alert"><p>{failure}</p><button className="btn btn-outline" onClick={() => setRevision(r => r + 1)}>Tekrar dene</button></div> : <div className="settings-layout"><nav className="settings-nav" aria-label="Bilgi sayfaları">{rows.map(r => <button key={r.slug} aria-current={selected === r.slug ? 'page' : undefined} onClick={() => { if (r.slug !== selected && dirty) setPending(r.slug); else setSelected(r.slug); }}><FileText size={17} /><span>{r.slug === 'business' ? 'İşletme ve iletişim' : contentPages[r.slug].title}<small>{r.published ? 'Yayında' : 'Yayımlanmadı'}{r.published && JSON.stringify(r.draft) !== JSON.stringify(r.published) ? ' · Taslak değişti' : ''}</small></span>{r.published && <Check size={15} />}</button>)}<p>{rows.filter(r => r.published).length} / {rows.length} bölüm yayımlandı</p></nav>{row && <ContentEditor key={`${row.slug}:${row.revision}`} record={row} token={token} saved={saved} refresh={() => setRevision(r => r + 1)} onDirty={setDirty} />}</div>}{pending && <Modal title="Kaydedilmemiş değişiklikler" close={() => setPending(null)}><div className="admin-fields"><p>Sayfa değiştirilirse kaydetmediğiniz düzenlemeler kaybolur.</p><div className="admin-form-actions"><button className="btn btn-outline" onClick={() => setPending(null)}>Düzenlemeye dön</button><button className="btn admin-danger" onClick={() => { setSelected(pending); setPending(null); setDirty(false); }}>Değişiklikleri bırak</button></div></div></Modal>}</div>;
}
function ContentEditor({ record, token, saved, refresh, onDirty }: { record: ContentRecord; token: string; saved: (r: ContentRecord) => void; refresh: () => void; onDirty: (dirty: boolean) => void }) {
  const business = record.slug === 'business';
  const [busy, setBusy] = useState(false), [confirmed, setConfirmed] = useState(false), [failure, setFailure] = useState<string | null>(null), [conflict, setConflict] = useState(false), [unpublish, setUnpublish] = useState(false);
  const [preview, setPreview] = useState(false);
  type Fields = Business & { body: string };
  const editorSchema = businessSchema.extend({ body: pageSchema.shape.body });
  const defaults = { ...Object.fromEntries(Object.keys(businessLabels).map(key => [key, ''])), body: '', ...record.draft } as Fields;
  const { register, handleSubmit, setError, getValues, formState: { errors, isDirty } } = useForm<Fields>({ resolver: zodResolver(editorSchema), defaultValues: defaults });
  useEffect(() => { onDirty(isDirty); }, [isDirty, onDirty]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (isDirty) e.preventDefault(); };
    const linkGuard = (e: MouseEvent) => {
      const link = e.target instanceof Element ? e.target.closest('a[href]') as HTMLAnchorElement | null : null;
      if (isDirty && link && link.target !== '_blank' && !e.ctrlKey && !e.metaKey && !e.shiftKey && link.href !== window.location.href && !window.confirm('Kaydedilmemiş değişiklikleriniz kaybolacak. Bu sayfadan ayrılmak istiyor musunuz?')) { e.preventDefault(); e.stopPropagation(); }
    };
    window.addEventListener('beforeunload', warn); document.addEventListener('click', linkGuard, true);
    return () => { window.removeEventListener('beforeunload', warn); document.removeEventListener('click', linkGuard, true); };
  }, [isDirty]);
  const title = business ? 'İşletme ve iletişim' : contentPages[record.slug as keyof typeof contentPages].title;
  const path = business ? '/iletisim' : contentPages[record.slug as keyof typeof contentPages].path;
  const submit = (action: 'save' | 'publish' | 'unpublish') => handleSubmit(async values => {
    setFailure(null); setConflict(false);
    const content = business ? businessSchema.parse(values) : pageSchema.parse(values);
    if (action === 'publish') {
      const issues = publicationErrors(record.slug, content);
      for (const [key, message] of Object.entries(issues)) setError(key as Path<Fields>, { message });
      if (Object.keys(issues).length) return;
      if (!confirmed) { setFailure('Yayımlamadan önce bilgilerin doğruluğunu onaylayın.'); return; }
    }
    setBusy(true);
    try { const result = z.object({ data: adminContentSchema }).parse(await apiRequest(`/site-content/admin/${record.slug}`, { token, method: 'PUT', body: JSON.stringify({ revision: record.revision, action, confirmed, content }) })); saved(result.data); toast.success(action === 'publish' ? 'Bilgiler mağazada yayımlandı.' : action === 'unpublish' ? 'Sayfa yayından kaldırıldı. Taslak korundu.' : 'Taslak kaydedildi.'); }
    catch (e) { setConflict(e instanceof ApiError && e.status === 409); setFailure(e instanceof ApiError && e.status === 409 ? 'Bu içerik başka bir oturumda değişmiş olabilir. Yazdığınız metni kopyalayın, ardından güncel kaydı yükleyin.' : errorMessage(e)); }
    finally { setBusy(false); setUnpublish(false); }
  });
  return <section className="settings-editor"><div className="admin-section-heading"><div><span className="eyebrow">{record.published ? 'YAYINDA' : 'TASLAK'}</span><h2>{title}</h2></div>{record.published && <Link to={path} className="text-link" target="_blank">Sayfayı gör <ArrowUpRight size={15} /></Link>}</div><p className="muted">{business ? 'Yalnızca kamuya açık mağaza bilgilerini girin. İşletme türünüze uygulanmayan isteğe bağlı alanları boş bırakabilirsiniz.' : 'İşletmenize uygun, kontrol edilmiş nihai metni girin. Paragrafları boş satırla ayırabilirsiniz. HTML kodu çalıştırılmaz.'}</p><form onSubmit={submit('save')} noValidate><fieldset disabled={busy} className="settings-fields">{business ? <div className="admin-form-grid">{Object.entries(businessLabels).map(([key, label]) => { const name = key as keyof Business; return <div className="admin-field" key={key}><label htmlFor={`setting-${key}`}>{label}</label>{['address', 'returnAddress', 'professionalRules'].includes(key) ? <textarea className="textarea" id={`setting-${key}`} {...register(name)} aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `error-${key}` : undefined} /> : <input className="input" id={`setting-${key}`} {...register(name)} aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `error-${key}` : undefined} />}{errors[name] && <span id={`error-${key}`} className="field-error" role="alert">{errors[name]?.message}</span>}</div>; })}</div> : <div className="admin-field"><label htmlFor="policy-body">Sayfa metni</label><textarea id="policy-body" className="textarea policy-textarea" {...register('body')} aria-invalid={!!errors.body} aria-describedby={errors.body ? 'policy-error' : undefined} />{errors.body && <span id="policy-error" className="field-error" role="alert">{errors.body.message}</span>}<button className="text-link" type="button" onClick={() => setPreview(true)}>Taslağı ön izle</button></div>}<label className="admin-check publication-confirm"><input className="checkbox checkbox-sm" type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} /> Bilgilerin doğru, güncel ve mağazamıza uygun olduğunu; yayımlandığında ziyaretçilere görüneceğini onaylıyorum.</label>{failure && <div role="alert"><p className="field-error">{failure}</p>{conflict && <button type="button" className="text-link" onClick={refresh}>Yazdıklarımı bırak ve güncel kaydı yükle</button>}</div>}<div className="settings-actions"><button className="btn btn-outline" type="submit">{busy ? 'Kaydediliyor…' : 'Taslağı kaydet'}</button><button className="btn btn-primary" type="button" onClick={submit('publish')}>Mağazada yayımla</button>{record.published && <button className="text-link" type="button" onClick={() => setUnpublish(true)}>Yayından kaldır</button>}</div><p className="muted">Taslağı kaydetmek mevcut yayımlanmış metni değiştirmez. {isDirty ? 'Kaydedilmemiş değişiklikler var.' : ''}</p></fieldset></form>{preview && <Modal title="Taslak ön izlemesi" close={() => setPreview(false)}><div className="admin-fields information-copy"><p className="notice">Bu bir taslaktır. Ziyaretçilere henüz yayımlanmadı.</p>{(getValues('body') || '').split(/\n\s*\n/).map((p, i) => <p key={i}>{p}</p>)}</div></Modal>}{unpublish && <Modal title="Sayfayı yayından kaldır" close={() => setUnpublish(false)} busy={busy}><div className="admin-fields"><p>Bu bilgiler ziyaretçilere gösterilmeyecek. Taslağınız korunacak.</p><div className="admin-form-actions"><button disabled={busy} className="btn btn-outline" onClick={() => setUnpublish(false)}>Vazgeç</button><button disabled={busy} className="btn admin-danger" onClick={submit('unpublish')}>Yayından kaldır</button></div></div></Modal>}</section>;
}
