import { Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import { categoryTree, categoryLabel, categoryDescendants, type Category, type CategoryNode } from '../../lib/categories';
import type { AdminProduct } from '../../lib/admin';
import { normalizeSearch } from '../../lib/catalog';

export function CategoryGroups({ categories, products, query, edit, remove, add }: {
  categories: Category[]; products: AdminProduct[]; query: string;
  edit: (category: Category) => void; remove: (category: Category) => void; add: (parentId: number) => void;
}) {
  const term = normalizeSearch(query).trim();
  // Search keeps the complete family visible so matching children never lose
  // their parent context or appear as separate category cards.
  const groups = categoryTree(categories).filter(root => [...categoryDescendants(categories, root.id)].some(id => normalizeSearch(categoryLabel(categories, id)).includes(term)));
  const productCount = (id: number) => { const ids = categoryDescendants(categories, id); return products.filter(p => ids.has(p.categoryId)).length; };
  const actions = (node: Category) => <div className="admin-category-actions">
    <button className="text-link" aria-label={`${categoryLabel(categories, node.id)}: düzenle`} onClick={() => edit(node)}><Pencil size={14} /> Düzenle</button>
    <button className="text-link" aria-label={`${categoryLabel(categories, node.id)}: alt kategori ekle`} onClick={() => add(node.id)}><Plus size={14} /> Alt kategori ekle</button>
    <button className="icon-button" aria-label={`${categoryLabel(categories, node.id)}: sil`} onClick={() => remove(node)}><Trash2 size={16} /></button>
  </div>;
  const children = (nodes: CategoryNode[]) => <ul className="admin-category-children">{nodes.map(node => <li key={node.id}>
    <div className="admin-category-row"><div className="admin-category-name"><h4>{node.name}</h4><span>{productCount(node.id)} ürün</span></div>{actions(node)}</div>
    {node.children.length > 0 && children(node.children)}
  </li>)}</ul>;
  if (!groups.length) return <div className="empty-state"><Tags size={32} /><h2>{term ? 'Sonuç bulunamadı' : 'Henüz kayıt yok'}</h2><p>{term ? 'Farklı bir kelimeyle aramayı deneyin.' : 'Başlamak için “Yeni kategori” düğmesini kullanın.'}</p></div>;
  return <div className="admin-category-groups">{groups.map(root => <section className="admin-category-group" key={root.id} aria-labelledby={`admin-category-${root.id}`}>
    <header className="admin-category-group-header"><div className="admin-category-name"><span className="eyebrow">ANA KATEGORİ</span><h3 id={`admin-category-${root.id}`}>{root.name}</h3><p>{categoryDescendants(categories, root.id).size - 1} alt kategori · {productCount(root.id)} ürün</p></div>{actions(root)}</header>
    {root.children.length ? children(root.children) : <p className="admin-category-empty">Bu ana kategoride henüz alt kategori yok.</p>}
  </section>)}</div>;
}
