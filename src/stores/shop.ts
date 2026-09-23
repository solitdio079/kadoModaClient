import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { z } from 'zod';
import { productSchema, type Product } from '../lib/catalog';

export const lineSchema = z.object({ product: productSchema, size: z.string(), quantity: z.number().int().min(1).max(99) });
export type CartLine = z.infer<typeof lineSchema>;
export const lineKey = (product: Product, size: string) => `${product.demo ? 'demo' : 'live'}:${product.id}:${size}`;
export const cartTotal = (lines: CartLine[]) => lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);

export function addCartLine(lines: CartLine[], product: Product, size: string): CartLine[] | null {
  if (!product.sizes.includes(size) || product.stock < 1) return null;
  const total = lines.filter(l => l.product.id === product.id && l.product.demo === product.demo).reduce((n, l) => n + l.quantity, 0);
  if (total >= Math.min(product.stock, 99)) return null;
  const key = lineKey(product, size);
  const existing = lines.find(l => lineKey(l.product, l.size) === key);
  return existing ? lines.map(l => lineKey(l.product, l.size) === key ? { ...l, product, quantity: l.quantity + 1 } : l)
    : [...lines, { product, size, quantity: 1 }];
}

interface ShopState {
  lines: CartLine[]; favorites: number[];
  add: (product: Product, size: string) => boolean;
  quantity: (key: string, quantity: number) => boolean;
  remove: (key: string) => void;
  toggleFavorite: (id: number) => void;
}

export const useShop = create<ShopState>()(persist((set, get) => ({
  lines: [], favorites: [],
  add: (product, size) => {
    const lines = addCartLine(get().lines, product, size);
    if (!lines) return false;
    set({ lines }); return true;
  },
  quantity: (key, quantity) => {
    const line = get().lines.find(l => lineKey(l.product, l.size) === key);
    if (!line || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) return false;
    const others = get().lines.filter(l => l.product.id === line.product.id && l.product.demo === line.product.demo && lineKey(l.product, l.size) !== key).reduce((sum, l) => sum + l.quantity, 0);
    if (quantity + others > line.product.stock) return false;
    set({ lines: get().lines.map(l => lineKey(l.product, l.size) === key ? { ...l, quantity } : l) }); return true;
  },
  remove: key => set({ lines: get().lines.filter(l => lineKey(l.product, l.size) !== key) }),
  toggleFavorite: id => set({ favorites: get().favorites.includes(id) ? get().favorites.filter(x => x !== id) : [...get().favorites, id] }),
}), {
  name: 'kadomoda-shop-v1', version: 1,
  storage: createJSONStorage(() => localStorage),
  partialize: ({ lines, favorites }) => ({ lines, favorites }),
  merge: (persisted, current) => {
    const parsed = z.object({ lines: z.array(lineSchema).max(200), favorites: z.array(z.number().int()).max(1000) }).safeParse(persisted);
    return parsed.success ? { ...current, ...parsed.data } : current;
  },
}));
