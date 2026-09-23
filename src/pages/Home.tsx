import { Link } from 'react-router';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { useCatalog } from '../lib/CatalogProvider';
import { CatalogStatus, ProductGrid } from '../components/Products';
import { categoryLink } from '../components/Layout';

export function Home() {
  const { products, loading, error } = useCatalog();
  return <>
    <section className="hero" aria-labelledby="hero-title">
      <img className="hero-image" src="/assets/kado-editorial-campaign.png" alt="Kado Moda yeni sezonundan siyah ve şampanya tonlarında iki stil" fetchPriority="high" width="1536" height="1024" />
      <div className="hero-copy"><span className="eyebrow">KADO MODA / SEZON EDİTİ</span><h1 id="hero-title">Yeni sezon.<br />Yeni bir bakış.</h1><p>Sezonun dikkat çeken parçaları<br className="desktop-break" /> tek bir seçkide.</p><Link to="/koleksiyon" className="btn btn-primary">Kadın koleksiyonunu keşfet <ArrowRight size={18} /></Link></div>
      <span className="hero-edition">YENİ SEZON · KADO MODA</span>
    </section>
    <section className="campaign-duo" aria-label="Sezon seçkileri"><Link className="campaign-tile outerwear" to={categoryLink('Dış Giyim')}><img src="/assets/cocoa-trench.png" alt="Kahverengi trençkot seçkisi" loading="lazy" /><div><span className="eyebrow">ZAMANSIZ PARÇALAR</span><h2>Dış giyim seçkisi</h2><span>Ceketler ve sezonun katmanları <ArrowUpRight size={20} /></span></div></Link><Link className="campaign-tile new-in" to="/koleksiyon?secim=yeni"><img src="/assets/kado-sign.jpeg" alt="Kado Moda Butik" loading="lazy" /><div><span className="eyebrow">YAKINDAN KEŞFEDİN</span><h2>Yeni gelenler</h2><span>Bu hafta vitrinde <ArrowUpRight size={20} /></span></div></Link></section>
    <section className="shell section"><div className="section-head"><div><span className="eyebrow">GARDIROBUNUZA YENİ BİR DOKUNUŞ</span><h2>Yeni gelenler</h2></div><Link to="/koleksiyon" className="text-link">Tüm ürünler <ArrowRight size={18} /></Link></div><CatalogStatus />{!loading && !error && <ProductGrid products={products.slice(0, 4)} />}</section>
    <section className="brand-story"><span className="eyebrow">KADO MODA DÜNYASI</span><h2>Stiliniz, sizin hikâyeniz.</h2><p>İyi hissettiren dokular, güçlü silüetler ve zamansız detaylar.<br />Kendinize ait olanı keşfedin.</p><Link to="/koleksiyon" className="text-link">Seçkinizi oluşturun <ArrowUpRight size={17} /></Link></section>
  </>;
}
