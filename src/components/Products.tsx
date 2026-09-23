import { Link } from 'react-router';
import { Heart, ArrowRight, SearchX } from 'lucide-react';
import { toast } from 'sonner';
import { useShop } from '../stores/shop';
import { money, type Product } from '../lib/catalog';
import { useCatalog } from '../lib/CatalogProvider';

export function ProductImage({ product, index = 0, eager = false }: { product: Product; index?: number; eager?: boolean }) {
  return <img src={product.images[index]} alt={`${product.name} — ${product.color}`} loading={eager ? 'eager' : 'lazy'} decoding="async" width="600" height="800" onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/assets/product-placeholder.svg'; }} />;
}

export function FavoriteButton({ product }: { product: Product }) {
  const selected = useShop(s => s.favorites.includes(product.id));
  const toggle = useShop(s => s.toggleFavorite);
  return <button className={`favorite-button icon-button ${selected ? 'selected' : ''}`} aria-label={`${product.name}: ${selected ? 'favorilerden çıkar' : 'favorilere ekle'}`} aria-pressed={selected} onClick={() => {
    toggle(product.id); toast.success(selected ? 'Ürün favorilerinizden çıkarıldı.' : 'Ürün favorilerinize eklendi.');
  }}><Heart size={19} fill={selected ? 'currentColor' : 'none'} /></button>;
}

export function ProductCard({ product }: { product: Product }) {
  return <article className="product-card"><div className="product-photo"><Link to={`/urun/${product.id}`} tabIndex={-1} aria-hidden="true"><ProductImage product={product} /></Link>{product.label && <span className="product-tag">{product.label}</span>}<FavoriteButton product={product} /></div>
    <div className="product-info"><span className="product-category">{product.category}</span><h3><Link to={`/urun/${product.id}`}>{product.name}</Link></h3><div className="product-meta"><span>{product.color}</span><strong>{money(product.price)}</strong></div></div>
  </article>;
}

export function ProductGrid({ products }: { products: Product[] }) {
  return <div className="product-grid">{products.map(p => <ProductCard key={p.id} product={p} />)}</div>;
}

export function CatalogStatus() {
  const { loading, error, retry } = useCatalog();
  if (loading) return <div className="catalog-loading" role="status"><span className="loading loading-spinner" /> Koleksiyon yükleniyor…</div>;
  if (error) return <div className="empty-state" role="alert"><h2>Koleksiyon yüklenemedi</h2><p>{error}</p><button className="btn btn-primary" onClick={retry}>Tekrar dene</button><Link to="/hesabim" className="text-link">Hesabıma giriş yap <ArrowRight size={16} /></Link></div>;
  return null;
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return <div className="empty-state"><SearchX size={32} strokeWidth={1} /><h2>{title}</h2><p>{message}</p><Link className="btn btn-primary" to="/koleksiyon">Koleksiyonu keşfet <ArrowRight size={16} /></Link></div>;
}
