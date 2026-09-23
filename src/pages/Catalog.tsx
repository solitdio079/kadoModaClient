import { useSearchParams, Link } from 'react-router';
import { SlidersHorizontal, X } from 'lucide-react';
import { useCatalog } from '../lib/CatalogProvider';
import { filterProducts } from '../lib/catalog';
import { ProductGrid, CatalogStatus, EmptyState } from '../components/Products';
import { departments } from '../components/Layout';

export function Catalog() {
  const [params, setParams] = useSearchParams();
  const { products, loading, error } = useCatalog();
  const category = params.get('kategori') ?? '';
  const q = params.get('q') ?? '';
  const size = params.get('beden') ?? '';
  const sort = params.get('sirala') ?? '';
  const filtered = filterProducts(products, { category, q, size, sort });
  const update = (key: string, value: string) => { const next = new URLSearchParams(params); if (value) next.set(key, value); else next.delete(key); setParams(next); };
  const categories = [...new Set([...departments, ...products.map(p => p.category)])];
  return <div className="shell section catalog-page"><div className="breadcrumbs"><Link to="/">Ana sayfa</Link><span>/</span><span>Kadın</span>{category && <><span>/</span><span>{category}</span></>}</div>
    <div className="section-head"><div><span className="eyebrow">KADO MODA KOLEKSİYONU</span><h1>{q ? `“${q}” için sonuçlar` : category || (params.get('secim') === 'yeni' ? 'Yeni gelenler' : 'Kadın koleksiyonu')}</h1></div><span className="muted" aria-live="polite">{filtered.length} ürün</span></div>
    <div className="catalog-toolbar"><div className="category-filters" aria-label="Kategori filtresi"><button className={`btn btn-sm ${!category ? 'btn-primary' : 'btn-outline'}`} onClick={() => update('kategori', '')}>Tümü</button>{categories.map(name => <button key={name} className={`btn btn-sm ${category === name ? 'btn-primary' : 'btn-outline'}`} aria-pressed={category === name} onClick={() => update('kategori', name)}>{name}</button>)}</div>
      <div className="select-filters"><SlidersHorizontal size={17} aria-hidden="true" /><label><span className="sr-only">Beden filtresi</span><select className="select" value={size} onChange={e => update('beden', e.target.value)}><option value="">Tüm bedenler</option>{[...new Set(products.flatMap(p => p.sizes))].map(s => <option key={s}>{s}</option>)}</select></label><label><span className="sr-only">Ürünleri sırala</span><select className="select" value={sort} onChange={e => update('sirala', e.target.value)}><option value="">Öne çıkanlar</option><option value="price-asc">Fiyat: düşükten yükseğe</option><option value="price-desc">Fiyat: yüksekten düşüğe</option><option value="name">Ürün adı: A–Z</option></select></label></div>
    </div>
    {(category || size || q) && <button className="clear-filters" onClick={() => setParams({})}><X size={14} /> Filtreleri temizle</button>}
    <CatalogStatus />{!loading && !error && (filtered.length ? <ProductGrid products={filtered} /> : <EmptyState title="Aradığınız parça bulunamadı" message="Farklı bir kelime veya filtreyle tekrar deneyebilirsiniz." />)}
  </div>;
}
