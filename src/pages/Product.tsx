import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useCatalog } from '../lib/CatalogProvider';
import { money } from '../lib/catalog';
import { useShop } from '../stores/shop';
import { FavoriteButton, ProductImage, ProductGrid, CatalogStatus, EmptyState } from '../components/Products';
import { categoryLink } from '../components/Layout';

export function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, loading, error } = useCatalog();
  const product = products.find(p => String(p.id) === id);
  const [selection, setSelection] = useState<{ id: number; size: string } | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const add = useShop(s => s.add);
  const [sizeError, setSizeError] = useState(false);
  if (loading || error) return <div className="shell section"><CatalogStatus /></div>;
  if (!product) return <EmptyState title="Ürün bulunamadı" message="Bu ürün kaldırılmış veya bağlantısı değişmiş olabilir." />;
  const size = selection?.id === product.id ? selection.size : product.sizes.length === 1 ? product.sizes[0] : '';
  const addToCart = () => {
    if (!size) { setSizeError(true); toast.error('Lütfen bir beden seçin.'); return; }
    if (!add(product, size)) { toast.error('Bu ürün için stok sınırına ulaştınız.'); return; }
    toast.success('Ürün sepetinize eklendi.', { description: `${product.name} · ${size}`, action: { label: 'Sepeti gör', onClick: () => navigate('/sepetim') } });
  };
  return <div className="shell section"><div className="breadcrumbs"><Link to="/">Ana sayfa</Link><span>/</span><Link to={categoryLink(product.category)}>{product.category}</Link><span>/</span><span>{product.name}</span></div><div className="product-detail"><div className="product-gallery"><div className="detail-image"><ProductImage product={product} index={Math.min(imageIndex, product.images.length - 1)} eager /></div>{product.images.length > 1 && <div className="thumbnails">{product.images.map((url, i) => <button key={url} onClick={() => setImageIndex(i)} aria-label={`${i + 1}. görseli göster`} aria-pressed={i === imageIndex}><img src={url} alt="" /></button>)}</div>}</div><div className="product-panel"><span className="eyebrow">KADO MODA BUTİK</span><h1>{product.name}</h1><p className="detail-color">{product.color}</p><div className="detail-price">{money(product.price)}</div><p className="detail-description">{product.details}</p><fieldset className="sizes"><legend>Beden seçin</legend><div className="size-row">{product.sizes.map(s => <button key={s} type="button" className={`size-button ${size === s ? 'active' : ''}`} aria-pressed={size === s} onClick={() => { setSelection({ id: product.id, size: s }); setSizeError(false); }}>{s}</button>)}</div>{sizeError && !size && <p className="field-error" role="alert">Lütfen bir beden seçin.</p>}</fieldset><div className="purchase-actions"><button className="btn btn-primary" onClick={addToCart} disabled={!product.stock}><ShoppingBag size={19} />{product.stock ? 'Sepete ekle' : 'Stokta yok'}</button><FavoriteButton product={product} /></div><p className="stock-note">{product.stock ? 'Stokta mevcut' : 'Bu ürün şu anda stokta bulunmuyor.'}</p>{product.demo && <div className="notice">Bu ürün ön izleme için hazırlanmıştır. Görseller, fiyatlar ve stok bilgileri örnektir. Satın alma henüz açık değildir.</div>}<details className="product-disclosure"><summary>Ürün bilgisi</summary><p>{product.details}</p><p>Renk: {product.color}<br />Kategori: {product.category}</p></details><details className="product-disclosure"><summary>Teslimat ve iade</summary><p>Mağaza satışa açılmadan önce teslimat seçenekleri, ücretler ve iade koşulları burada yayınlanacaktır.</p></details></div></div><section className="related-products"><div className="section-head"><h2>Seçkinizi tamamlayın</h2><Link className="text-link" to="/koleksiyon">Koleksiyona dön <ArrowRight size={17} /></Link></div><ProductGrid products={products.filter(p => p.id !== product.id).slice(0, 4)} /></section></div>;
}
