import { useEffect, useRef } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Heart, Menu, Search, ShoppingBag, UserRound, X, ArrowUpRight } from 'lucide-react';
import { useShop } from '../stores/shop';
import { contentPages, useSiteContent } from '../lib/siteContent';
import { useSession } from '../stores/session';
import { isDemo } from '../lib/CatalogProvider';

export const departments = ['Elbiseler', 'Ceketler', 'Üst Giyim', 'Takımlar', 'Dış Giyim', 'Aksesuar'];
export const categoryLink = (name: string) => `/koleksiyon?kategori=${encodeURIComponent(name)}`;

export function Logo() {
  return <Link to="/" className="brand" aria-label="Kado Moda — Ana sayfa">
    <img src="/assets/kado-logo.jpeg" alt="" width="42" height="56" />
    <span>KADO MODA<small>B U T İ K</small></span>
  </Link>;
}

const searchSchema = z.object({ q: z.string().trim().min(2, 'Lütfen en az 2 karakter yazın.').max(100, 'En fazla 100 karakter yazabilirsiniz.') });
function SearchForm() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof searchSchema>>({ resolver: zodResolver(searchSchema) });
  return <form role="search" className="search-form" noValidate onSubmit={handleSubmit(({ q }) => navigate(`/koleksiyon?q=${encodeURIComponent(q)}`))}>
    <div className="search-box"><input className="input" {...register('q')} type="search" aria-label="Ürün veya kategori ara" placeholder="Ürün veya kategori ara" aria-invalid={!!errors.q} aria-describedby={errors.q ? 'search-error' : undefined} /><button type="submit" className="icon-button" aria-label="Ara"><Search size={19} /></button></div>
    {errors.q && <span className="field-error search-error" id="search-error" role="alert">{errors.q.message}</span>}
  </form>;
}

export function Layout() {
  const location = useLocation();
  const site = useSiteContent();
  const profile = useSession(s => s.profile);
  const menu = useRef<HTMLDialogElement>(null);
  const main = useRef<HTMLElement>(null);
  const initial = useRef(true);
  const lines = useShop(s => s.lines);
  const favorites = useShop(s => s.favorites);
  const count = lines.filter(l => l.product.demo === isDemo).reduce((n, l) => n + l.quantity, 0);
  useEffect(() => {
    menu.current?.close();
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (!initial.current) main.current?.focus({ preventScroll: true });
    initial.current = false;
  }, [location.pathname, location.search]);
  return <>
    <a className="skip-link" href="#main">İçeriğe geç</a>
    <div className="demo-banner">{isDemo ? 'Ön izleme mağazası · Örnek ürünler gösterilmektedir. Sipariş ve ödeme kapalıdır.' : 'Mağazamız hazırlanıyor · Koleksiyonu keşfedebilirsiniz. Sipariş ve ödeme henüz açık değildir.'}</div>
    <div className="utility-bar"><span>KADO MODA BUTİK</span><span>Özenle seçildi. Sizin için.</span><Link to="/yardim">Yardım & bilgi <ArrowUpRight size={12} /></Link></div>
    <header className="header">
      <div className="header-main shell">
        <button className="icon-button mobile-menu" aria-label="Menüyü aç" onClick={() => menu.current?.showModal()}><Menu size={23} /></button>
        <Logo /><SearchForm />
        <div className="header-actions">
          <Link to="/hesabim" className="header-action" aria-label="Hesabım"><UserRound size={21} /><span>Hesabım</span></Link>
          <Link to="/favorilerim" className="header-action favorites-action" aria-label={`Favorilerim (${favorites.length})`}><Heart size={21} /></Link>
          <Link to="/sepetim" className="header-action" aria-label={`Sepetim (${count})`}><ShoppingBag size={21} /><span>Sepetim</span><b className="count">{count}</b></Link>
        </div>
      </div>
      <nav className="department-nav shell" aria-label="Koleksiyonlar">
        <NavLink to="/koleksiyon" end>Kadın</NavLink>
        <Link to="/koleksiyon?secim=yeni">Yeni Gelenler</Link>
        {departments.map(name => <Link key={name} to={categoryLink(name)}>{name}</Link>)}
      </nav>
    </header>
    <dialog ref={menu} className="menu-dialog" aria-labelledby="menu-title" onClick={e => { if (e.target === e.currentTarget) menu.current?.close(); }}>
      <div className="menu-inner"><div className="menu-top"><strong id="menu-title">Koleksiyonlar</strong><button className="icon-button" aria-label="Menüyü kapat" onClick={() => menu.current?.close()}><X /></button></div>
        <Link to="/koleksiyon">Tüm Koleksiyon</Link><Link to="/koleksiyon?secim=yeni">Yeni Gelenler</Link>
        {departments.map(name => <Link key={name} to={categoryLink(name)}>{name}<ArrowUpRight size={17} /></Link>)}
        <Link to="/favorilerim">Favorilerim</Link><Link to="/hesabim">Hesabım</Link>{profile?.role === 'ADMIN' && <Link to="/yonetim">Mağaza yönetimi</Link>}
      </div>
    </dialog>
    <main id="main" ref={main} tabIndex={-1}><Outlet /></main>
    <footer className="footer"><div className="shell footer-grid"><div><Logo /><p>Zamansız bir duruş.<br />Kendinize ait bir stil.</p></div><div><h2>Koleksiyonu keşfedin</h2><Link to="/koleksiyon">Tüm ürünler</Link><Link to={categoryLink('Elbiseler')}>Elbiseler</Link><Link to={categoryLink('Ceketler')}>Ceketler</Link><Link to={categoryLink('Üst Giyim')}>Üst giyim</Link></div><div><h2>Size yardımcı olalım</h2><Link to="/hesabim">Hesabım</Link><Link to="/favorilerim">Favorilerim</Link><Link to="/iletisim">İletişim</Link>{site.records.filter(r => r.slug !== 'business').map(r => { const page = contentPages[r.slug as keyof typeof contentPages]; return <Link key={r.slug} to={page.path}>{page.title}</Link>; })}<Link to="/yardim">Yardım</Link></div><div className="footer-note"><span className="eyebrow">KADO MODA BUTİK</span><p>Günün her anına eşlik eden,<br />özenle seçilmiş parçalar.</p><Link to="/koleksiyon" className="text-link">Koleksiyona göz atın <ArrowUpRight size={16} /></Link></div></div><div className="shell footer-bottom"><span>© {new Date().getFullYear()} Kado Moda Butik</span><span>Türkiye · Türkçe · ₺ TRY</span></div></footer>
  </>;
}
