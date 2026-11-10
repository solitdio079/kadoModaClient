import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { ArrowUpRight, ChevronDown } from 'lucide-react';
import { useCatalog } from '../lib/CatalogProvider';
import { categoryTree, categoryHref, type CategoryNode } from '../lib/categories';

function DescendantLinks({ nodes }: { nodes: CategoryNode[] }) {
  return <ul>{nodes.map(node => <li key={node.id}><Link to={categoryHref(node)}>{node.name}</Link>{node.children.length > 0 && <DescendantLinks nodes={node.children} />}</li>)}</ul>;
}

export function CategoryMenu() {
  const { categories } = useCatalog();
  const roots = categoryTree(categories);
  const [open, setOpen] = useState<number | null>(null);
  const nav = useRef<HTMLElement>(null);
  const buttons = useRef(new Map<number, HTMLButtonElement>());
  const mode = useRef<'pointer' | 'keyboard' | 'click'>('pointer');
  const location = useLocation();
  const active = roots.find(n => n.id === open);
  useEffect(() => { setOpen(null); }, [location.pathname, location.search]);
  useEffect(() => {
    const outside = (e: PointerEvent) => { if (!nav.current?.contains(e.target as Node)) setOpen(null); };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, []);
  return <>
    <nav ref={nav} className="department-nav shell desktop-categories" aria-label="Koleksiyonlar"
      onMouseLeave={() => { if (mode.current === 'pointer') setOpen(null); }}
      onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(null); }}
      onKeyDown={e => { if (e.key === 'Escape' && open != null) { e.preventDefault(); setOpen(null); buttons.current.get(open)?.focus(); } }}>
      <Link to="/koleksiyon" onMouseEnter={() => setOpen(null)}>Tüm Ürünler</Link>
      {roots.map(root => root.children.length ? <div className="department-trigger" key={root.id}>
        <button ref={el => { if (el) buttons.current.set(root.id, el); else buttons.current.delete(root.id); }} type="button" aria-expanded={open === root.id} aria-controls={`category-panel-${root.id}`}
          onMouseEnter={() => { mode.current = 'pointer'; setOpen(root.id); }}
          onClick={() => { const hovered = mode.current === 'pointer'; mode.current = 'click'; setOpen(current => hovered ? root.id : current === root.id ? null : root.id); }}
          onKeyDown={e => { if (e.key === 'ArrowDown') { e.preventDefault(); mode.current = 'keyboard'; setOpen(root.id); requestAnimationFrame(() => document.getElementById(`category-panel-${root.id}`)?.querySelector<HTMLAnchorElement>('a')?.focus()); } }}>
          {root.name}<ChevronDown size={13} aria-hidden="true" />
        </button>
      </div> : <Link key={root.id} to={categoryHref(root)} onMouseEnter={() => setOpen(null)}>{root.name}</Link>)}
      <Link to="/koleksiyon?secim=yeni" onMouseEnter={() => setOpen(null)}>Yeni Gelenler</Link>
      {roots.filter(n => n.children.length).map(root => <div key={root.id} id={`category-panel-${root.id}`} role="region" className="category-mega" hidden={open !== root.id} aria-label={`${root.name} alt kategorileri`}>
        <div className="category-mega-inner shell">
          <div className="category-mega-intro"><span className="eyebrow">KADO MODA SEÇKİSİ</span><h2>{root.name}</h2><p>Kendinize ait olanı keşfedin.</p><Link to={categoryHref(root)} className="text-link">Tüm {root.name}<ArrowUpRight size={16} /></Link></div>
          <div className="category-mega-columns">{root.children.map(group => <section className="category-mega-group" key={group.id}><h3><Link to={categoryHref(group)}>{group.name}</Link></h3>{group.children.length > 0 && <><Link className="category-see-all" to={categoryHref(group)}>Tüm {group.name}</Link><DescendantLinks nodes={group.children} /></>}</section>)}</div>
        </div>
        <div className="category-mega-footer shell"><span>{active?.name} koleksiyonunu keşfedin</span><button type="button" onClick={() => { setOpen(null); buttons.current.get(root.id)?.focus(); }}>Menüyü kapat</button></div>
      </div>)}
    </nav>
    <nav className="department-nav shell mobile-departments" aria-label="Kategorilere göz at"><Link to="/koleksiyon">Tüm Ürünler</Link>{roots.map(root => <Link key={root.id} to={categoryHref(root)}>{root.name}</Link>)}<Link to="/koleksiyon?secim=yeni">Yeni Gelenler</Link></nav>
  </>;
}

function MobileNode({ node }: { node: CategoryNode }) {
  if (!node.children.length) return <Link to={categoryHref(node)}>{node.name}</Link>;
  return <details className="mobile-category-branch"><summary>{node.name}<ChevronDown size={16} aria-hidden="true" /></summary><div><Link className="mobile-category-all" to={categoryHref(node)}>Tüm {node.name}<ArrowUpRight size={15} /></Link>{node.children.map(child => <MobileNode key={child.id} node={child} />)}</div></details>;
}
export function MobileCategories() {
  const { categories } = useCatalog();
  return <div className="mobile-category-tree">{categoryTree(categories).map(node => <MobileNode key={node.id} node={node} />)}</div>;
}
