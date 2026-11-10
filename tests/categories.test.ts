import { describe, it, expect } from 'vitest';
import { categoryTree, categoryDescendants, categoryLabel, categoryOptions, resolveCategory, productsForCategory, demoCategories } from '../src/lib/categories';
import { demoProducts } from '../src/data/products';

describe('hierarchical categories', () => {
  const nodes = demoCategories();
  it('preserves the current 63-node source hierarchy and distinct repeated labels', () => {
    expect(nodes).toHaveLength(63);
    expect(categoryTree(nodes).map(n => n.name)).toEqual(['Üst Giyim', 'Alt Giyim', 'Dış Giyim', 'Aksesuar', 'Takım', '500TL']);
    const oversizes = nodes.filter(n => n.name === 'OVERSIZE');
    expect(oversizes).toHaveLength(2);
    expect(new Set(oversizes.map(n => categoryLabel(nodes, n.id))).size).toBe(2);
    expect(categoryOptions(nodes)).toHaveLength(63);
  });
  it('includes descendants and preserves legacy category links', () => {
    const selected = resolveCategory(nodes, new URLSearchParams({ kategori: 'Elbiseler' }))!;
    expect(selected.name).toBe('Elbise');
    expect(categoryDescendants(nodes, selected.id).size).toBe(12);
    expect(productsForCategory(demoProducts, nodes, selected).map(p => p.id)).toEqual([-1, -6]);
    const upper = nodes.find(n => n.name === 'Üst Giyim')!;
    expect(productsForCategory(demoProducts, nodes, upper).map(p => p.id)).toEqual([-1, -3, -6]);
  });
  it('uses IDs to distinguish identically named leaves and filter their parent branches', () => {
    const leaves = nodes.filter(n => n.name === 'OVERSIZE');
    const products = leaves.map((n, i) => ({ ...demoProducts[0], id: i + 1, category: n.name, categoryId: n.id }));
    expect(productsForCategory(products, nodes, leaves[0]).map(p => p.id)).toEqual([1]);
    expect(resolveCategory(nodes, new URLSearchParams({ kategoriId: String(leaves[1].id) }))?.id).toBe(leaves[1].id);
    expect(categoryLabel(nodes, leaves[0].id)).toContain('T-shirt');
    expect(categoryLabel(nodes, leaves[1].id)).toContain('Gömlek');
  });
  it('handles orphaned and cyclic data without infinite recursion', () => {
    const malformed = nodes.slice(0, 2).map((n, i) => ({ ...n, id: i + 1, parentId: i === 0 ? 2 : 1 }));
    expect(categoryOptions(malformed)).toHaveLength(2);
    expect(categoryDescendants(malformed, 1).size).toBe(2);
  });
});
