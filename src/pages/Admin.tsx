import { useEffect, useState } from 'react';
import { Link, NavLink, useParams } from 'react-router';
import { Package, Tags, Percent, Plus, Pencil, Trash2, RefreshCw, ArrowUpRight, LogOut, Search } from 'lucide-react';
import { useSession } from '../stores/session';
import { useCatalog, isDemo } from '../lib/CatalogProvider';
import { ApiError, errorMessage } from '../lib/api';
import { loadInventory, loadProfile, imageUrl, type AdminProduct, type Category, type Campaign } from '../lib/admin';
import { money, normalizeSearch } from '../lib/catalog';
import { ProductEditor, TaxonomyEditor, DeleteConfirmation } from '../components/admin/Editors';

type Inventory = Awaited<ReturnType<typeof loadInventory>>;
type Editor = { kind: 'product'; item?: AdminProduct } | { kind: 'category'; item?: Category } | { kind: 'campaign'; item?: Campaign };
type DeleteItem = { kind: 'product' | 'category' | 'campaign'; item: { id: number; name: string } };
export function Admin() {
  const { token, profile, logout } = useSession();
  // The profile was fetched from the authenticated API after login. All writes
  // also enforce ADMIN at the API, independently of this presentation guard.
  if (!token) return <div className="shell empty-state"><span className="eyebrow">KADO MODA · YÖNETİM</span><h1>Yönetici girişi</h1><p>Mağazanızı yönetmek için yönetici hesabınızla giriş yapın.</p><Link to="/hesabim" className="btn btn-primary">Giriş yap</Link></div>;
  if (profile?.role !== 'ADMIN') return <div className="shell empty-state"><h1>Erişim yetkiniz bulunmuyor</h1><p>Bu alan yalnızca mağaza yöneticilerine açıktır.</p><Link to="/hesabim" className="btn btn-primary">Hesabıma dön</Link></div>;
  return <AdminWorkspace key={token} token={token} name={profile.name ?? profile.email} logout={logout} />;
}
function AdminWorkspace({ token, name, logout }: { token: string; name: string; logout: () => void }) {
  const { section } = useParams();
  const kind = section === 'kategoriler' ? 'category' : section === 'kampanyalar' ? 'campaign' : 'product';
  const [data, setData] = useState<Inventory>({ products: [], categories: [], campaigns: [] });
  const [loading, setLoading] = useState(true), [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0), [q, setQ] = useState(''), [demoOnly, setDemoOnly] = useState(false);
  const [editor, setEditor] = useState<Editor | null>(null), [deleting, setDeleting] = useState<DeleteItem | null>(null);
  const catalog = useCatalog();
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(null);
    // Revalidate this user's role without retrieving other customer profiles.
    loadProfile(token).then(user => { if (user.role !== 'ADMIN') throw new ApiError(403, 'Bu işlemi yapmak için yetkiniz bulunmuyor.'); return loadInventory(token, controller.signal); })
      .then(result => { if (!controller.signal.aborted) setData(result); })
      .catch(e => { if (!controller.signal.aborted) { if (e instanceof ApiError && e.status === 401) logout(); setError(errorMessage(e)); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [token, revision, logout]);
  useEffect(() => { setQ(''); setDemoOnly(false); setEditor(null); setDeleting(null); }, [kind]);
  const saved = () => { setEditor(null); setDeleting(null); setRevision(r => r + 1); catalog.retry(); };
  const products = data.products.filter(p => normalizeSearch(`${p.name} ${p.category.name} ${p.variant}`).includes(normalizeSearch(q)) && (!demoOnly || p.isDemo));
  const items = (kind === 'category' ? data.categories : data.campaigns).filter(c => normalizeSearch(c.name).includes(normalizeSearch(q)));
  const title = kind === 'product' ? 'Ürünler' : kind === 'category' ? 'Kategoriler' : 'Kampanyalar';
  const addLabel = kind === 'product' ? 'Yeni ürün' : kind === 'category' ? 'Yeni kategori' : 'Yeni kampanya';
  return <div className="admin-shell shell"><div className="admin-heading"><div><span className="eyebrow">MAĞAZA YÖNETİMİ</span><h1>Her detay sizin elinizde.</h1><p>Hoş geldiniz, {name}.</p></div><div className="admin-heading-actions"><Link to="/koleksiyon" className="btn btn-outline">Mağazayı gör <ArrowUpRight size={16} /></Link><button className="icon-button" aria-label="Çıkış yap" onClick={logout}><LogOut size={20} /></button></div></div>
    {isDemo && <p className="notice">Mağaza ön izleme modunda. Buradaki işlemler gerçek API kayıtlarını değiştirir. Mağazada görmek için canlı katalog moduyla yayınlayın.</p>}
    <div className="admin-stats"><div><Package size={20} /><span>Toplam ürün<strong>{loading ? '—' : data.products.length}</strong></span></div><div><Tags size={20} /><span>Kategori<strong>{loading ? '—' : data.categories.length}</strong></span></div><div><Percent size={20} /><span>Kampanya<strong>{loading ? '—' : data.campaigns.length}</strong></span></div><div><span>Örnek ürün<strong>{loading ? '—' : data.products.filter(p => p.isDemo).length}</strong></span><small>İstediğiniz zaman düzenleyin veya silin.</small></div></div>
    <nav className="admin-nav" aria-label="Yönetim bölümleri"><NavLink end to="/yonetim"><Package size={17} /> Ürünler</NavLink><NavLink to="/yonetim/kategoriler"><Tags size={17} /> Kategoriler</NavLink><NavLink to="/yonetim/kampanyalar"><Percent size={17} /> Kampanyalar</NavLink></nav>
    <section className="admin-content"><div className="admin-section-heading"><div><h2>{title}</h2><p className="muted">{kind === 'product' ? 'Koleksiyonunuzu düzenleyin; görselleri, fiyatları ve stokları güncelleyin.' : kind === 'category' ? 'Koleksiyonunuzu müşterileriniz için kolayca keşfedilir hale getirin.' : 'Ürünlere bağladığınız kampanyaların indirimlerini yönetin.'}</p></div><button className="btn btn-primary" disabled={loading || !!error || (kind === 'product' && !data.categories.length)} onClick={() => setEditor({ kind })}><Plus size={17} /> {addLabel}</button></div>
    <div className="admin-toolbar"><label className="admin-search"><Search size={18} /><input className="input" type="search" aria-label={`${title} içinde ara`} placeholder={`${title} içinde ara…`} value={q} onChange={e => setQ(e.target.value)} /></label>{kind === 'product' && <label className="admin-check"><input type="checkbox" className="checkbox checkbox-sm" checked={demoOnly} onChange={e => setDemoOnly(e.target.checked)} /> Yalnızca örnek ürünler</label>}<button disabled={loading} className="icon-button" aria-label="Listeyi yenile" onClick={() => setRevision(r => r + 1)}><RefreshCw size={18} /></button></div>
    {loading ? <div className="catalog-loading" role="status"><span className="loading loading-spinner" /> Kayıtlar yükleniyor…</div> : error ? <div role="alert" className="empty-state"><h2>Kayıtlar yüklenemedi</h2><p>{error}</p><button className="btn btn-outline" onClick={() => setRevision(r => r + 1)}>Tekrar dene</button></div> : <>
    {kind === 'product' ? products.length ? <div className="admin-products">{products.map(p => <article className="admin-product-row" key={p.id}><img src={imageUrl(p.images[0])} alt={p.name} onError={e => { e.currentTarget.src = '/assets/product-placeholder.svg'; }} /><div className="admin-product-info"><span className="eyebrow">{p.category.name}</span><h3>{p.name}</h3><p>{p.variant} · {p.sizes.join(' / ')}</p>{p.isDemo && <span className="admin-badge">Örnek ürün</span>}</div><div className="admin-product-numbers"><strong>{money(Math.round(Number(p.price) * 100))}</strong><span className={p.total_qty ? '' : 'field-error'}>{p.total_qty ? `${p.total_qty} adet stok` : 'Stok tükendi'}</span>{p.campaign && <small>%{p.campaign.discount} indirim</small>}</div><div className="admin-row-actions"><button className="icon-button" aria-label={`${p.name}: düzenle`} onClick={() => setEditor({ kind: 'product', item: p })}><Pencil size={17} /></button><button className="icon-button" aria-label={`${p.name}: sil`} onClick={() => setDeleting({ kind: 'product', item: p })}><Trash2 size={17} /></button></div></article>)}</div> : <div className="empty-state"><Package size={32} /><h2>{q || demoOnly ? 'Sonuç bulunamadı' : 'İlk ürününüze yer açtık.'}</h2><p>{q || demoOnly ? 'Arama veya filtreyi değiştirin.' : data.categories.length ? 'Yeni ürün ekleyerek koleksiyonunuzu oluşturmaya başlayın.' : 'Önce bir kategori oluşturun, ardından ürünlerinizi ekleyin.'}</p>{!data.categories.length && <Link to="/yonetim/kategoriler" className="btn btn-outline">Kategorilere git</Link>}</div>
    : items.length ? <div className="admin-taxonomy-grid">{items.map(item => <article className="admin-taxonomy" key={item.id}>{'image' in item && typeof item.image === 'string' && item.image && <img src={imageUrl(item.image)} alt={item.name} />}<span className="eyebrow">{kind === 'category' ? 'KOLEKSİYON' : 'KAMPANYA'}</span><h3>{item.name}</h3><p>{'discount' in item ? `%${item.discount} indirim · ` : ''}{data.products.filter(p => kind === 'category' ? p.categoryId === item.id : p.campaignId === item.id).length} ürün</p><div className="admin-card-actions"><button className="text-link" onClick={() => setEditor(kind === 'category' ? { kind, item } : { kind, item: item as Campaign })}><Pencil size={14} /> Düzenle</button><button className="icon-button" aria-label={`${item.name}: sil`} onClick={() => setDeleting({ kind, item })}><Trash2 size={17} /></button></div></article>)}</div> : <div className="empty-state"><Tags size={32} /><h2>{q ? 'Sonuç bulunamadı' : 'Henüz kayıt yok'}</h2><p>{q ? 'Farklı bir kelimeyle aramayı deneyin.' : `Başlamak için “${addLabel}” düğmesini kullanın.`}</p></div>}
    </>}
    </section><p className="admin-footnote">Değişiklikler kaydedildiğinde mağazaya yansır. Sipariş ve ödeme işlemleri henüz açık değildir. Sayfayı yenilediğinizde tekrar giriş yapmanız gerekir.</p>
    {editor?.kind === 'product' && <ProductEditor product={editor.item} categories={data.categories} campaigns={data.campaigns} token={token} close={() => setEditor(null)} saved={saved} />}
    {editor && editor.kind !== 'product' && <TaxonomyEditor kind={editor.kind} item={editor.item} token={token} close={() => setEditor(null)} saved={saved} />}
    {deleting && <DeleteConfirmation {...deleting} token={token} close={() => setDeleting(null)} saved={saved} />}
  </div>;
}
