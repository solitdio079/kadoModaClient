import { Link } from 'react-router';
import { contentPages, businessLabels, useSiteContent, type Business, type PageSlug } from '../lib/siteContent';
export function Information({ slug }: { slug: PageSlug | 'business' }) {
  const { records, loading, error, reload } = useSiteContent();
  const record = records.find(r => r.slug === slug);
  const title = slug === 'business' ? 'İletişim' : contentPages[slug].title;
  return <div className="shell section information-page"><div className="breadcrumbs"><Link to="/">Ana sayfa</Link><span>/</span><span>{title}</span></div><span className="eyebrow">KADO MODA BUTİK</span><h1>{title}</h1>{loading ? <p role="status">Bilgiler yükleniyor…</p> : error ? <div role="alert"><p>Bilgiler şu anda yüklenemiyor. Lütfen tekrar deneyin.</p><button className="btn btn-outline" onClick={reload}>Tekrar dene</button></div> : !record ? <p className="notice">Bu sayfanın bilgileri henüz yayımlanmadı. Mağazamız şu anda sipariş ve ödeme almamaktadır.</p> : <>{slug === 'business' && 'legalName' in record.content ? <Contact business={record.content} /> : 'body' in record.content ? <div className="information-copy">{record.content.body.split(/\n\s*\n/).map((paragraph, i) => <p key={i}>{paragraph}</p>)}</div> : null}<p className="information-date">Son yayımlanma: {new Date(record.publishedAt).toLocaleDateString('tr-TR')}</p></>}</div>;
}
function Contact({ business }: { business: Business }) {
  return <><p className="information-intro">Ürünlerimiz ve mağazamızla ilgili sorularınız için bize ulaşabilirsiniz.</p><div className="contact-links"><a className="btn btn-primary" href={`mailto:${business.email}`}>E-posta gönder</a><a className="btn btn-outline" href={`tel:${business.phone.replace(/[^\d+]/g, '')}`}>Bizi arayın</a></div><dl className="business-details">{Object.entries(businessLabels).map(([key, title]) => business[key as keyof Business] ? <div key={key}><dt>{title}</dt><dd>{business[key as keyof Business]}</dd></div> : null)}</dl></>;
}
