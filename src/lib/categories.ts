import { z } from 'zod';
import reference from '../data/reference-categories.json';
import type { Product } from './catalog';

export const categorySchema = z.object({
  id: z.number().int().positive(), name: z.string(), parentId: z.number().int().positive().nullable().default(null),
  slug: z.string().nullable().default(null), sortOrder: z.number().int().default(0),
});
export type Category = z.infer<typeof categorySchema>;
export type CategoryNode = Category & { children: CategoryNode[] };
export const legacyCategoryNames: Record<string, string> = { Elbiseler: 'Elbise', Ceketler: 'Ceket', Etekler: 'Etek', Takımlar: 'Takım' };
export function categoryTree(categories: Category[]): CategoryNode[] {
  const map = new Map(categories.map(c => [c.id, { ...c, children: [] as CategoryNode[] }]));
  const roots: CategoryNode[] = [];
  for (const node of map.values()) {
    // Malformed/cyclic server data cannot trap the navigation in recursion.
    if (node.parentId != null && map.has(node.parentId) && !isAncestorLoop(node, map)) map.get(node.parentId)!.children.push(node);
    else roots.push(node);
  }
  const sort = (nodes: CategoryNode[]) => { nodes.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'tr')); nodes.forEach(n => sort(n.children)); };
  sort(roots); return roots;
}
function isAncestorLoop(node: Category, map: Map<number, Category>) {
  const seen = new Set([node.id]); let parent = node.parentId;
  while (parent != null) { if (seen.has(parent)) return true; seen.add(parent); parent = map.get(parent)?.parentId ?? null; }
  return false;
}
export function categoryPath(categories: Category[], id: number): Category[] {
  const map = new Map(categories.map(c => [c.id, c])), path: Category[] = [], seen = new Set<number>();
  let current = map.get(id);
  while (current && !seen.has(current.id)) { seen.add(current.id); path.unshift(current); current = current.parentId == null ? undefined : map.get(current.parentId); }
  return path;
}
export const categoryLabel = (categories: Category[], id: number) => categoryPath(categories, id).map(c => c.name).join(' / ');
export function categoryOptions(categories: Category[]) {
  const out: Category[] = [];
  const visit = (nodes: CategoryNode[]) => nodes.forEach(n => { out.push(n); visit(n.children); });
  visit(categoryTree(categories)); return out;
}
export function categoryDescendants(categories: Category[], id: number) {
  const result = new Set([id]); const pending = [id];
  while (pending.length) { const parent = pending.pop(); for (const c of categories) if (c.parentId === parent && !result.has(c.id)) { result.add(c.id); pending.push(c.id); } }
  return result;
}
export const categoryHref = (category: Category) => `/koleksiyon?kategoriId=${category.id}`;
export function resolveCategory(categories: Category[], params: URLSearchParams) {
  const id = params.get('kategoriId');
  if (id) return categories.find(c => String(c.id) === id);
  const name = params.get('kategori') ?? '';
  return categories.find(c => c.name === name) ?? categories.find(c => c.name === legacyCategoryNames[name]);
}
export function demoCategories(): Category[] {
  const ids = new Map(reference.categories.map((c, i) => [c.slug, -(i + 1)]));
  return reference.categories.map(c => ({ id: ids.get(c.slug)!, name: c.name, slug: c.slug, sortOrder: c.sortOrder, parentId: c.parentSlug ? ids.get(c.parentSlug)! : null }));
}
export function productsForCategory(products: Product[], categories: Category[], selected: Category) {
  const ids = categoryDescendants(categories, selected.id);
  const names = new Set(categories.filter(c => ids.has(c.id)).map(c => c.name));
  return products.filter(p => p.categoryId != null ? ids.has(p.categoryId) : names.has(legacyCategoryNames[p.category] ?? p.category));
}
