import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { demoProducts } from '../data/products';
import { parseApiProducts, type Product } from './catalog';
import { apiRequest, errorMessage } from './api';
import { useSession } from '../stores/session';

const mode = import.meta.env.VITE_CATALOG_MODE ?? 'demo';
if (!['demo', 'live'].includes(mode)) throw new Error('VITE_CATALOG_MODE must be demo or live');
export const isDemo = mode === 'demo';
const CatalogContext = createContext<{ products: Product[]; loading: boolean; error: string | null; retry: () => void }>({ products: [], loading: true, error: null, retry: () => {} });

export function CatalogProvider({ children }: { children: ReactNode }) {
  const token = useSession(s => s.token);
  const [products, setProducts] = useState<Product[]>(isDemo ? demoProducts : []);
  const [loading, setLoading] = useState(!isDemo);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const retry = useCallback(() => setRevision(x => x + 1), []);
  useEffect(() => {
    if (isDemo) return;
    const controller = new AbortController();
    setLoading(true); setError(null); setProducts([]);
    apiRequest('/product', { token: token ?? undefined, signal: controller.signal })
      .then(body => { if (!controller.signal.aborted) setProducts(parseApiProducts(body)); })
      .catch(e => { if (!controller.signal.aborted) setError(errorMessage(e)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [token, revision]);
  return <CatalogContext.Provider value={{ products, loading, error, retry }}>{children}</CatalogContext.Provider>;
}

export const useCatalog = () => useContext(CatalogContext);
