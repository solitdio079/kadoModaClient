import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router';
import { Toaster } from 'sonner';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/playfair-display/500.css';
import '@fontsource/playfair-display/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/plus-jakarta-sans/800.css';
import './styles.css';
import { Layout } from './components/Layout';
import { CatalogProvider } from './lib/CatalogProvider';
import { EmptyState } from './components/Products';
import { Home } from './pages/Home';
import { Catalog } from './pages/Catalog';
import { ProductPage } from './pages/Product';
import { Cart, Favorites } from './pages/Cart';
import { Account } from './pages/Account';
import { Help } from './pages/Help';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <div className="empty-state" role="alert"><h1>Bir sorun oluştu</h1><p>Lütfen sayfayı yenileyerek tekrar deneyin.</p><button className="btn btn-primary" onClick={() => window.location.reload()}>Sayfayı yenile</button></div> : this.props.children; }
}
function PageTitle() {
  const { pathname } = useLocation();
  useEffect(() => { const names: Record<string, string> = { '/': 'Yeni Sezon', '/koleksiyon': 'Kadın Koleksiyonu', '/sepetim': 'Sepetim', '/favorilerim': 'Favorilerim', '/hesabim': 'Hesabım', '/yardim': 'Yardım' }; document.title = `${names[pathname] ?? 'Koleksiyon'} | Kado Moda Butik`; }, [pathname]);
  return null;
}

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><ErrorBoundary><BrowserRouter><PageTitle /><CatalogProvider><Routes><Route element={<Layout />}><Route index element={<Home />} /><Route path="koleksiyon" element={<Catalog />} /><Route path="urun/:id" element={<ProductPage />} /><Route path="sepetim" element={<Cart />} /><Route path="favorilerim" element={<Favorites />} /><Route path="hesabim" element={<Account />} /><Route path="yardim" element={<Help />} /><Route path="*" element={<EmptyState title="Sayfa bulunamadı" message="Aradığınız sayfa taşınmış veya kaldırılmış olabilir." />} /></Route></Routes></CatalogProvider><Toaster position="bottom-right" richColors closeButton containerAriaLabel="Bildirimler" toastOptions={{ className: 'kado-toast', closeButtonAriaLabel: 'Bildirimi kapat' }} /></BrowserRouter></ErrorBoundary></React.StrictMode>);
