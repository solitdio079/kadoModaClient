import { Link } from 'react-router';
import { Minus, Plus, Trash2, ArrowLeft, LockKeyhole } from 'lucide-react';
import { toast } from 'sonner';
import { useShop, lineKey, cartTotal } from '../stores/shop';
import { isDemo, useCatalog } from '../lib/CatalogProvider';
import { money } from '../lib/catalog';
import { ProductImage, EmptyState, ProductGrid, CatalogStatus } from '../components/Products';

export function Cart() {
  const { lines: allLines, quantity, remove } = useShop();
  const lines = allLines.filter(l => l.product.demo === isDemo);
  return <div className="shell section"><div className="breadcrumbs"><Link to="/">Ana sayfa</Link><span>/</span><span>Sepetim</span></div><div className="section-head"><h1>Alışveriş sepetim</h1><span className="muted">{lines.reduce((n, l) => n + l.quantity, 0)} ürün</span></div>{!lines.length ? <EmptyState title="Sepetiniz sizi bekliyor" message="Beğendiğiniz parçaları keşfedin, seçkinizi oluşturun." /> : <div className="cart-layout"><div><div className="cart-head"><span>ÜRÜN</span><span>TUTAR</span></div>{lines.map(line => {
    const key = lineKey(line.product, line.size);
    return <article className="cart-line" key={key}><Link to={`/urun/${line.product.id}`} className="cart-image"><ProductImage product={line.product} /></Link><div className="cart-description"><Link to={`/urun/${line.product.id}`}><h2>{line.product.name}</h2></Link><p>{line.product.color} · Beden: {line.size}</p><div className="quantity-control"><button aria-label={`${line.product.name} adedini azalt`} disabled={line.quantity <= 1} onClick={() => quantity(key, line.quantity - 1)}><Minus size={14} /></button><output aria-label={`${line.product.name} adedi`}>{line.quantity}</output><button aria-label={`${line.product.name} adedini artır`} onClick={() => { if (!quantity(key, line.quantity + 1)) toast.error('Bu ürün için stok sınırına ulaştınız.'); }}><Plus size={14} /></button></div><button className="remove-button" onClick={() => { remove(key); toast.success('Ürün sepetinizden çıkarıldı.'); }}><Trash2 size={13} /> Kaldır</button></div><strong className="line-total">{money(line.product.price * line.quantity)}</strong></article>;
  })}<Link to="/koleksiyon" className="text-link continue-shopping"><ArrowLeft size={16} /> Alışverişe devam et</Link></div><aside className="cart-summary"><h2>Sepet özeti</h2><div className="summary-row"><span>Ürünler toplamı</span><span>{money(cartTotal(lines))}</span></div><div className="summary-row"><span>Kargo</span><span>Henüz hesaplanmadı</span></div><div className="summary-total"><span>Ara toplam</span><strong>{money(cartTotal(lines))}</strong></div><button className="btn btn-primary" disabled><LockKeyhole size={16} /> Satın alma henüz açık değil</button><p className="notice">Mağazamız hazırlanıyor. Bu aşamada ödeme alınmaz ve sipariş oluşturulmaz. Sepetiniz bu cihazda saklanır.</p></aside></div>}</div>;
}

export function Favorites() {
  const favorites = useShop(s => s.favorites);
  const { products, loading, error } = useCatalog();
  const saved = products.filter(p => favorites.includes(p.id));
  return <div className="shell section"><div className="section-head"><div><span className="eyebrow">SİZE ÖZEL SEÇKİ</span><h1>Favorilerim</h1></div><span className="muted">{saved.length} ürün</span></div><CatalogStatus />{!loading && !error && (saved.length ? <ProductGrid products={saved} /> : <EmptyState title="Biraz ilham, biraz siz" message="Kalp simgesine dokunarak beğendiğiniz parçaları burada biriktirin." />)}</div>;
}
