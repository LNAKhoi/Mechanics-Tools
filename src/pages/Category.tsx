import { useState } from 'react';
import { Layout } from '../components/Layout';
import { ProductCard } from '../components/ProductCard';
import { categoryProducts } from '../data/products';

const prices = ['Tất cả', 'Từ 500 vnd - 1 triệu vnd', 'Từ 1 triệu vnd - 2 triệu vnd', 'Từ 2 triệu vnd - 3 triệu vnd', 'Từ 5 triệu vnd - 10 triệu vnd'];
const groups = ['Tất cả', 'Máy khoan & bắt vít (22)', 'Máy mài & máy cắt (22)', 'Máy cưa & gia công gỗ (22)', 'Máy & dụng cụ cơ khí (22)', 'Taro & dụng cụ tạo ren (22)', 'Phụ kiện dụng cụ (22)'];

export default function Category() {
  return <Layout><main className="bg-page px-[72px] pb-[24px] pt-[24px]"><div className="page-container"><nav className="flex gap-[12px] text-[16px] font-bold"><span>Trang chủ</span><span>&gt;</span><span className="text-xam underline">Máy khoan & bắt vít</span></nav><div className="mt-[24px] flex h-[40px] items-center justify-between"><h1 className="font-chakra text-[28px] leading-none">Danh mục</h1><SortBar /></div><div className="mt-[24px] flex items-start gap-[24px]"><Filters /><section className="w-[1476px]"><div className="grid grid-cols-5 gap-[24px]">{categoryProducts.map((product, index) => <ProductCard product={product} key={index} />)}</div><Pagination /></section></div></div></main></Layout>;
}

function Filters() {
  return <aside className="relative w-[276px] shrink-0"><div className="absolute right-[4px] top-0 h-[806px] w-[4px] rounded-full bg-input"><i className="block h-[32px] w-full rounded-full bg-xam" /></div><div className="pr-[36px]"><FilterGroup title="Khoảng giá" items={prices} initial={0} /><div className="my-[16px] border-t border-xam20" /><FilterGroup title="Danh mục" items={groups} initial={1} category /><button className="mt-[16px] text-[14px] font-medium text-red">Xem thêm &gt;</button><button className="mt-[48px] flex w-full flex-col items-center gap-[4px] text-[14px] font-medium text-red"><Chevron direction="up" color="#D70114" />Thu gọn</button></div></aside>;
}

function FilterGroup({ title, items, initial, category = false }: { title: string; items: string[]; initial: number; category?: boolean }) {
  const [checked, setChecked] = useState(() => new Set([initial]));
  const toggle = (index: number) => setChecked(current => { const next = new Set(current); next.has(index) ? next.delete(index) : next.add(index); return next; });
  return <section><h2 className="flex items-center justify-between text-[22px] font-bold leading-none">{title}<Chevron color="#D70114" /></h2><div className="mt-[28px] space-y-[20px]">{items.map((item, index) => <label key={item} className={`flex cursor-pointer items-center gap-[8px] text-[16px] font-bold leading-none ${checked.has(index) ? 'text-red' : ''}`}><input className="sr-only" type="checkbox" checked={checked.has(index)} onChange={() => toggle(index)} /><span className={`size-[16px] rounded-[5px] border ${checked.has(index) ? 'border-red bg-red' : 'border-xam'}`} />{item}</label>)}</div>{!category && <><p className="mt-[20px] text-[14px] leading-none text-xam">Hoặc nhập khoảng giá phù hợp<br />với bạn:</p><div className="mt-[8px] flex items-center gap-[8px]"><span className="h-[40px] rounded-[8px] border border-xam20 bg-input px-[8px] pt-[11px] text-[14px]">5.000.000 đ</span><b>~</b><span className="h-[40px] rounded-[8px] border border-xam20 bg-input px-[8px] pt-[11px] text-[14px]">10.000.000 đ</span></div></>}</section>;
}

function SortBar() {
  return <div className="flex h-[40px] items-center gap-[24px]"><span className="text-[16px] font-bold text-xam">Hiển thị 1-20 các sản phẩm</span><button className="flex h-[40px] w-[306px] items-center justify-between rounded-[8px] border border-xam20 bg-input px-[12px] text-[14px] font-medium">Sắp xếp: Phổ biến nhất <Chevron color="#1F1F1E" /></button><button aria-label="Sắp xếp" className="grid size-[40px] place-items-center rounded-[8px] border border-xam20 bg-input"><SortIcon /></button></div>;
}

function Pagination() {
  return <div className="mt-[24px] flex justify-center gap-[16px]">{[1, 2, 3, 4, 5].map(value => <button key={value} className={`size-[40px] rounded-[8px] border ${value === 1 ? 'border-red bg-red text-white' : 'border-xam20 bg-input'}`}>{value}</button>)}<span className="pt-[10px]">...</span><button aria-label="Trang tiếp" className="grid size-[40px] place-items-center rounded-[8px] border border-xam20 bg-input"><Chevron direction="right" color="#1F1F1E" /></button></div>;
}

function Chevron({ direction = 'down', color }: { direction?: 'down' | 'up' | 'right'; color: string }) {
  const path = direction === 'right' ? 'M9 6L15 12L9 18' : direction === 'up' ? 'M6 15L12 9L18 15' : 'M6 9L12 15L18 9';
  return <svg aria-hidden="true" className="size-[24px] shrink-0" viewBox="0 0 24 24" fill="none"><path d={path} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function SortIcon() {
  return <svg aria-hidden="true" className="size-[24px]" viewBox="0 0 24 24" fill="none" stroke="#1F1F1E" strokeWidth="1.5" strokeLinecap="round"><path d="M5 6h14M5 12h9M5 18h4M18 10v9m0 0-3-3m3 3 3-3" /></svg>;
}
