import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { demoProducts } from '../data/products';
import { parseApiProducts, type Product } from './catalog';
import { apiRequest, errorMessage } from './api';
import { useShop } from '../stores/shop';
import { useSession } from '../stores/session';
import { z } from 'zod';
import { categorySchema, demoCategories, type Category } from './categories';

const mode = import.meta.env.VITE_CATALOG_MODE ?? 'live';
if (!['demo', 'live'].includes(mode)) throw new Error('VITE_CATALOG_MODE must be demo or live');
export const isDemo = mode === 'demo';
const CatalogContext = createContext<{ products: Product[]; categories: Category[]; loading: boolean; error: string | null; retry: () => void }>({ products: [], categories: [], loading: true, error: null, retry: () => {} });

export function CatalogProvider({ children }: { children: ReactNode }) {
  const token = useSession(s => s.token);
  const [products, setProducts] = useState<Product[]>(isDemo ? demoProducts : []);
  const [categories, setCategories] = useState<Category[]>(isDemo ? demoCategories() : []);
  const [loading, setLoading] = useState(!isDemo);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const retry = useCallback(() => setRevision(x => x + 1), []);
  useEffect(() => {
    if (isDemo) return;
    const controller = new AbortController();
    setLoading(true); setError(null); setProducts([]); setCategories([]);
    Promise.all([apiRequest('/product', { token: token ?? undefined, signal: controller.signal }), apiRequest('/category', { signal: controller.signal })])
      .then(([body, taxonomy]) => { if (!controller.signal.aborted) { const parsed = parseApiProducts(body); setProducts(parsed); setCategories(z.object({ data: z.array(categorySchema) }).parse(taxonomy).data); useShop.getState().reconcile(parsed, false); } })
      .catch(e => { if (!controller.signal.aborted) setError(errorMessage(e)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [token, revision]);
  return <CatalogContext.Provider value={{ products, categories, loading, error, retry }}>{children}</CatalogContext.Provider>;
}

export const useCatalog = () => useContext(CatalogContext);
