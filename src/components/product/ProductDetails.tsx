import { useState } from 'react';
import { ProductCard } from '../ProductCard';
import { EmptyState, ErrorState, LoadingState } from '../ApiStatus';
import { useProducts, type ProductDetail } from '../../lib/api';

const banner = '/assets/product/763d1.png';

export function ProductDetails({ product }: { product: ProductDetail }) {
  const [tab, setTab] = useState<'details' | 'reviews'>('details');
  return <section className="page-container mt-[24px]">
    <div className="flex justify-center gap-[96px] border-b border-xam20"><Tab active={tab === 'details'} onClick={() => setTab('details')}>Chi tiết sản phẩm</Tab><Tab active={tab === 'reviews'} onClick={() => setTab('reviews')}>Đánh giá</Tab></div>
    {tab === 'details' ? <DetailsContent product={product} /> : <Reviews />}
  </section>;
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) { return <button onClick={onClick} className={`border-b-2 px-[46px] pb-[12px] pt-[24px] font-chakra text-[22px] ${active ? 'border-red text-den' : 'border-transparent text-xam'}`}>{children}</button>; }

function DetailsContent({ product }: { product: ProductDetail }) {
  const paragraphs = product.description.split(/\n\s*\n/).map(paragraph => paragraph.trim()).filter(Boolean);
  return <div className="py-[24px] text-[24px] leading-[1.6]"><h2 className="font-chakra text-[28px] leading-none">Giới thiệu {product.name}</h2>{paragraphs.map((paragraph, index) => <p key={index} className="mt-[12px] whitespace-pre-line">{paragraph}</p>)}<ProductBanner name={product.name} />{product.specs.length > 0 && <><h2 className="font-chakra text-[28px] leading-none">Thông số kỹ thuật</h2><ul className="mt-[12px] list-disc pl-[36px]">{product.specs.map((spec, index) => <li key={`${index}-${spec.label}`}>{spec.label}: {spec.value}</li>)}</ul></>}<Related product={product} /></div>;
}
function ProductBanner({ name }: { name: string }) { return <figure className="my-[24px]"><img className="h-[1000px] w-full rounded-[8px] object-cover object-center" src={banner} alt="" /><figcaption className="text-center text-[16px] leading-none">Hình ảnh minh họa: {name}</figcaption></figure>; }
function Related({ product }: { product: ProductDetail }) {
  const sameCategory = useProducts({ category: product.category.slug, limit: 7 });
  const others = sameCategory.data?.items.filter(item => item.slug !== product.slug);
  const fallback = useProducts({ limit: 7 });
  // The all-products fallback (data and error) only matters when the category has no other products.
  const useFallback = others !== undefined && others.length === 0;
  const items = useFallback ? fallback.data?.items.filter(item => item.slug !== product.slug) : others;
  const error = sameCategory.error ?? (useFallback ? fallback.error : undefined);
  return <section className="mt-[24px] border-t border-xam20 pt-[24px]"><h2 className="font-chakra text-[28px] leading-none">Sản phẩm liên quan</h2>{error ? <ErrorState onRetry={() => { if (sameCategory.error) sameCategory.retry(); else fallback.retry(); }} /> : !items ? <LoadingState /> : items.length === 0 ? <EmptyState>Chưa có sản phẩm liên quan.</EmptyState> : <div className="mt-[24px] flex gap-[24px]">{items.slice(0, 6).map(item => <ProductCard product={item} key={item.slug} />)}</div>}</section>;
}
function Reviews() { return <div className="py-[48px]"><h2 className="font-chakra text-[28px]">Đánh giá từ khách hàng</h2><div className="mt-[24px] rounded-[8px] bg-white p-[24px] shadow-[0_2px_16px_rgba(0,0,0,.08)]"><b>4.8 / 5</b><p className="mt-[12px] text-xam">320 đánh giá về sản phẩm này.</p></div></div>; }
