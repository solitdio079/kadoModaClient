import { useSearchParams, Link } from 'react-router';
import { SlidersHorizontal, X } from 'lucide-react';
import { useCatalog } from '../lib/CatalogProvider';
import { filterProducts } from '../lib/catalog';
import { ProductGrid, CatalogStatus, EmptyState } from '../components/Products';
import { categoryTree, categoryHref, categoryOptions, categoryLabel, categoryPath, resolveCategory, productsForCategory } from '../lib/categories';

export function Catalog() {
  const [params, setParams] = useSearchParams();
  const { products, categories, loading, error } = useCatalog();
  const selected = resolveCategory(categories, params);
  const legacyName = params.get('kategori') ?? '';
  const category = selected?.name ?? legacyName;
  const q = params.get('q') ?? '', size = params.get('beden') ?? '', sort = params.get('sirala') ?? '';
  const candidates = selected ? productsForCategory(products, categories, selected) : params.has('kategoriId') ? [] : products;
  const filtered = filterProducts(candidates, { category: selected ? '' : legacyName, q, size, sort });
  const update = (key: string, value: string) => { const next = new URLSearchParams(params); if (value) next.set(key, value); else next.delete(key); setParams(next); };
  const chooseCategory = (id: string) => { const next = new URLSearchParams(params); next.delete('kategori'); next.delete('secim'); if (id) next.set('kategoriId', id); else next.delete('kategoriId'); setParams(next); };
  const roots = categoryTree(categories);
  const ancestors = selected ? categoryPath(categories, selected.id) : [];
  return <div className="shell section catalog-page"><div className="breadcrumbs"><Link to="/">Ana sayfa</Link><span>/</span><Link to="/koleksiyon">Kadın</Link>{ancestors.map(c => <span key={c.id} className="category-crumb"><span>/</span><Link to={categoryHref(c)}>{c.name}</Link></span>)}{!selected && category && <><span>/</span><span>{category}</span></>}</div>
    <div className="section-head"><div><span className="eyebrow">KADO MODA KOLEKSİYONU</span><h1>{q ? `“${q}” için sonuçlar` : category || (params.has('kategoriId') ? 'Kategori' : params.get('secim') === 'yeni' ? 'Yeni gelenler' : 'Kadın koleksiyonu')}</h1></div><span className="muted" aria-live="polite">{filtered.length} ürün</span></div>
    <div className="catalog-toolbar"><div className="category-filters" aria-label="Kategori filtresi"><button className={`btn btn-sm ${!category && !params.has('kategoriId') ? 'btn-primary' : 'btn-outline'}`} onClick={() => chooseCategory('')}>Tümü</button>{roots.map(c => <button key={c.id} className={`btn btn-sm ${ancestors[0]?.id === c.id ? 'btn-primary' : 'btn-outline'}`} aria-pressed={ancestors[0]?.id === c.id} onClick={() => chooseCategory(String(c.id))}>{c.name}</button>)}</div>
      <div className="select-filters"><SlidersHorizontal size={17} aria-hidden="true" /><label><span className="sr-only">Kategori ve alt kategori</span><select className="select category-select" value={selected?.id ?? ''} onChange={e => chooseCategory(e.target.value)}><option value="">Tüm kategoriler</option>{categoryOptions(categories).map(c => <option key={c.id} value={c.id}>{categoryLabel(categories, c.id)}</option>)}</select></label><label><span className="sr-only">Beden filtresi</span><select className="select" value={size} onChange={e => update('beden', e.target.value)}><option value="">Tüm bedenler</option>{[...new Set(products.flatMap(p => p.sizes))].map(s => <option key={s}>{s}</option>)}</select></label><label><span className="sr-only">Ürünleri sırala</span><select className="select" value={sort} onChange={e => update('sirala', e.target.value)}><option value="">Öne çıkanlar</option><option value="price-asc">Fiyat: düşükten yükseğe</option><option value="price-desc">Fiyat: yüksekten düşüğe</option><option value="name">Ürün adı: A–Z</option></select></label></div>
    </div>
    {(category || params.has('kategoriId') || size || q) && <button className="clear-filters" onClick={() => setParams({})}><X size={14} /> Filtreleri temizle</button>}
    <CatalogStatus />{!loading && !error && (filtered.length ? <ProductGrid products={filtered} /> : <EmptyState title="Aradığınız parça bulunamadı" message="Farklı bir kelime veya filtreyle tekrar deneyebilirsiniz." />)}
  </div>;
}
