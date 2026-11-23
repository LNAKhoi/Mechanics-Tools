import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { EmptyState, ErrorState, LoadingState } from '../components/ApiStatus';
import { Layout } from '../components/Layout';
import { ProductCard } from '../components/ProductCard';
import { useCategories, useProducts, type Category as CategoryItem } from '../lib/api';

const PAGE_SIZE = 20;

export default function Category() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q')?.trim() ?? '';
  const page = Math.max(1, Math.floor(Number(searchParams.get('page'))) || 1);
  const categories = useCategories();
  const products = useProducts({ category: slug, q: q || undefined, page, limit: PAGE_SIZE });
  const current = categories.data?.find(category => category.slug === slug);
  const crumb = q ? `Kết quả tìm kiếm: "${q}"` : current?.name ?? (slug ? 'Danh mục' : 'Tất cả sản phẩm');
  const total = products.data?.total ?? 0;
  return <Layout><main className="bg-page px-[72px] pb-[24px] pt-[24px]"><div className="page-container"><nav className="flex gap-[12px] text-[16px] font-bold"><Link to="/">Trang chủ</Link><span>&gt;</span><span className="text-xam underline">{crumb}</span></nav><div className="mt-[24px] flex h-[40px] items-center justify-between"><h1 className="font-chakra text-[28px] leading-none">Danh mục</h1><SortBar page={page} total={total} count={products.data?.items.length ?? 0} /></div><div className="mt-[24px] flex items-start gap-[24px]"><Filters categories={categories.data ?? []} selected={slug} q={q} /><section className="w-[1476px]">{products.error ? <ErrorState onRetry={() => { products.retry(); if (categories.error) categories.retry(); }} /> : products.loading ? <LoadingState /> : products.data!.items.length === 0 ? <EmptyState>{q ? `Không tìm thấy sản phẩm phù hợp với "${q}".` : 'Chưa có sản phẩm trong danh mục này.'}</EmptyState> : <><div className="grid grid-cols-5 gap-[24px]">{products.data!.items.map(product => <ProductCard product={product} key={product.slug} />)}</div><Pagination page={page} pageCount={Math.ceil(total / PAGE_SIZE)} /></>}</section></div></div></main></Layout>;
}

const withQuery = (path: string, q: string) => q ? `${path}?q=${encodeURIComponent(q)}` : path;

function Filters({ categories, selected, q }: { categories: CategoryItem[]; selected?: string; q: string }) {
  const navigate = useNavigate();
  const items = [{ slug: undefined, label: 'Tất cả' }, ...categories.map(category => ({ slug: category.slug, label: `${category.name}${category.productCount !== undefined ? ` (${category.productCount})` : ''}` }))];
  return <aside className="relative w-[276px] shrink-0"><div className="absolute bottom-0 right-[4px] top-0 w-[4px] rounded-full bg-input"><i className="block h-[32px] w-full rounded-full bg-xam" /></div><div className="pr-[36px]"><section><h2 className="flex items-center justify-between text-[22px] font-bold leading-none">Danh mục<Chevron color="#D70114" /></h2><div className="mt-[28px] space-y-[20px]">{items.map(item => { const checked = item.slug === selected; return <label key={item.slug ?? 'all'} className={`flex cursor-pointer items-center gap-[8px] text-[16px] font-bold leading-none ${checked ? 'text-red' : ''}`}><input className="sr-only" type="checkbox" checked={checked} onChange={() => navigate(withQuery(item.slug ? `/danh-muc/${item.slug}` : '/danh-muc', q))} /><span className={`size-[16px] rounded-[5px] border ${checked ? 'border-red bg-red' : 'border-xam'}`} />{item.label}</label>; })}</div></section><button className="mt-[16px] text-[14px] font-medium text-red">Xem thêm &gt;</button><button className="mt-[48px] flex w-full flex-col items-center gap-[4px] text-[14px] font-medium text-red"><Chevron direction="up" color="#D70114" />Thu gọn</button></div></aside>;
}

function SortBar({ page, total, count }: { page: number; total: number; count: number }) {
  const from = count ? (page - 1) * PAGE_SIZE + 1 : 0;
  return <div className="flex h-[40px] items-center gap-[24px]"><span className="text-[16px] font-bold text-xam">{total ? `Hiển thị ${from}-${from + count - 1} trong ${total} sản phẩm` : 'Hiển thị 0 sản phẩm'}</span><button className="flex h-[40px] w-[306px] items-center justify-between rounded-[8px] border border-xam20 bg-input px-[12px] text-[14px] font-medium">Sắp xếp: Phổ biến nhất <Chevron color="#1F1F1E" /></button><button aria-label="Sắp xếp" className="grid size-[40px] place-items-center rounded-[8px] border border-xam20 bg-input"><SortIcon /></button></div>;
}

function Pagination({ page, pageCount }: { page: number; pageCount: number }) {
  const [searchParams, setSearchParams] = useSearchParams();
  if (pageCount <= 1) return null;
  const go = (value: number) => { const next = new URLSearchParams(searchParams); next.set('page', String(value)); setSearchParams(next); window.scrollTo(0, 0); };
  const first = Math.max(1, Math.min(page - 2, pageCount - 4));
  const pages = Array.from({ length: Math.min(5, pageCount) }, (_, index) => first + index);
  return <div className="mt-[24px] flex justify-center gap-[16px]">{pages.map(value => <button key={value} onClick={() => go(value)} className={`size-[40px] rounded-[8px] border ${value === page ? 'border-red bg-red text-white' : 'border-xam20 bg-input'}`}>{value}</button>)}{pages[pages.length - 1] < pageCount && <span className="pt-[10px]">...</span>}<button aria-label="Trang tiếp" disabled={page >= pageCount} onClick={() => go(page + 1)} className="grid size-[40px] place-items-center rounded-[8px] border border-xam20 bg-input disabled:opacity-40"><Chevron direction="right" color="#1F1F1E" /></button></div>;
}

function Chevron({ direction = 'down', color }: { direction?: 'down' | 'up' | 'right'; color: string }) {
  const path = direction === 'right' ? 'M9 6L15 12L9 18' : direction === 'up' ? 'M6 15L12 9L18 15' : 'M6 9L12 15L18 9';
  return <svg aria-hidden="true" className="size-[24px] shrink-0" viewBox="0 0 24 24" fill="none"><path d={path} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function SortIcon() {
  return <svg aria-hidden="true" className="size-[24px]" viewBox="0 0 24 24" fill="none" stroke="#1F1F1E" strokeWidth="1.5" strokeLinecap="round"><path d="M5 6h14M5 12h9M5 18h4M18 10v9m0 0-3-3m3 3 3-3" /></svg>;
}
