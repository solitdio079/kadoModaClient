import { useState, type FormEvent } from 'react';
import { Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from './Editors';
import { ApiError } from '../../lib/api';
import type { Category, Campaign } from '../../lib/admin';
import { commitImport, previewImport, importPayload, validateImportFile, importError, importLabels, importReasons, importPreviewSchema, type ImportPreview } from '../../lib/productImport';

export function BulkUpload({ token, categories, campaigns, close, saved }: { token: string; categories: Category[]; campaigns: Campaign[]; close: () => void; saved: () => void }) {
  const [file, setFile] = useState<File>();
  const [categoryId, setCategoryId] = useState(''), [campaignId, setCampaignId] = useState('');
  const [preview, setPreview] = useState<ImportPreview | null>(null), [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const reset = () => { setPreview(null); setFailure(null); };
  async function check(event: FormEvent) {
    event.preventDefault(); reset();
    const issue = validateImportFile(file);
    if (issue) { setFailure(issue); return; }
    if (!categoryId) { setFailure('Bu dosyadaki ürünler için bir kategori seçin.'); return; }
    setBusy(true);
    try { setPreview(await previewImport(token, importPayload(file!, categoryId, campaignId))); }
    catch (e) { setFailure(importError(e)); }
    finally { setBusy(false); }
  }
  async function save() {
    if (!file || !preview?.valid || busy) return;
    setBusy(true); setFailure(null);
    try {
      const result = await commitImport(token, importPayload(file, categoryId, campaignId));
      toast.success(`${result.count} ürün eklendi. Düzenle düğmesinden fotoğraflarını yükleyebilirsiniz.`);
      saved();
    } catch (e) {
      const report = e instanceof ApiError ? importPreviewSchema.safeParse(e.payload) : null;
      setPreview(report?.success ? report.data : null);
      setFailure(importError(e));
    } finally { setBusy(false); }
  }
  return <Modal title="Excel ile toplu ürün ekle" close={close} busy={busy}>
    <form onSubmit={check} className="admin-fields">
      <p>Şablondaki Urunler sayfasını doldurun. Fotoğrafları yükleme tamamlandıktan sonra her ürünün Düzenle düğmesinden ekleyin.</p>
      <a className="btn btn-outline" href="/templates/kado-moda-urun-sablonu.xlsx" download><Download size={17} /> Excel şablonunu indir</a>
      <p className="notice">Her dosya tek kategoriye eklenir. Farklı kategoriler için ayrı yükleme yapın. En fazla 1000 ürün ve 5 MB. Mevcut ürünler güncellenmez. Fotoğrafsız ürünler mağazada yer tutucu görselle görünür.</p>
      <fieldset disabled={busy} className="admin-fields bulk-inputs">
        <div className="admin-form-grid">
          <div className="admin-field"><label htmlFor="bulk-category">Yüklenecek kategori</label><select id="bulk-category" className="select" value={categoryId} onChange={e => { setCategoryId(e.target.value); reset(); }}><option value="">Kategori seçin</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div className="admin-field"><label htmlFor="bulk-campaign">Kampanya (isteğe bağlı)</label><select id="bulk-campaign" className="select" value={campaignId} onChange={e => { setCampaignId(e.target.value); reset(); }}><option value="">Kampanya yok</option>{campaigns.map(c => <option key={c.id} value={c.id}>{c.name} · %{c.discount}</option>)}</select></div>
        </div>
        <div className="admin-field"><label htmlFor="bulk-file">Doldurulmuş Excel dosyası</label><input id="bulk-file" className="input bulk-file" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={e => { setFile(e.target.files?.[0]); reset(); }} /></div>
        <button className="btn btn-outline" type="submit"><Upload size={17} /> {busy ? 'Kontrol ediliyor…' : 'Dosyayı ön izle'}</button>
      </fieldset>
      {failure && <p role="alert" className="field-error">{failure}</p>}
      {preview && <section className="bulk-preview" aria-label="Yükleme ön izlemesi" aria-live="polite">
        {preview.valid ? <><h3>{preview.count} ürün eklenmeye hazır</h3><p>Henüz kaydedilmedi. Onayladığınızda ürünler fotoğrafsız oluşturulacak.</p></> : <><h3>Dosyayı düzeltip tekrar yükleyin</h3><p>Hiçbir ürün eklenmedi. {preview.issueCount} alan veya satır hatası bulundu.</p><ul>{preview.issues.map((issue, i) => <li key={i}><strong>Satır {issue.row}, {importLabels[issue.field]}:</strong> {importReasons[issue.reason]}</li>)}</ul>{preview.issueCount > preview.issues.length && <p>İlk {preview.issues.length} hata gösteriliyor.</p>}</>}
        {preview.rows.length > 0 && <><div className="bulk-table-wrap"><table><thead><tr><th>Satır</th><th>Ürün</th><th>Renk</th><th>Bedenler</th><th>Stok</th><th>Fiyat (₺)</th></tr></thead><tbody>{preview.rows.slice(0, 20).map(row => <tr key={row.row}><td>{row.row}</td><td>{row.name}</td><td>{row.variant}</td><td>{row.sizes.join(', ')}</td><td>{row.total_qty}</td><td>{row.price}</td></tr>)}</tbody></table></div>{preview.rows.length > 20 && <p>İlk 20 ürün gösteriliyor. Onayladığınızda toplam {preview.count} ürün eklenecek.</p>}</>}
      </section>}
      <footer className="admin-form-actions"><button type="button" className="btn btn-outline" disabled={busy} onClick={close}>Vazgeç</button><button type="button" className="btn btn-primary" disabled={busy || !preview?.valid} onClick={save}>{busy ? 'İşleniyor…' : `${preview?.valid ? preview.count + ' ürünü' : 'Ürünleri'} ekle`}</button></footer>
    </form>
  </Modal>;
}
