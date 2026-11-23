import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import type { Product } from '../data/products';

const assetPath = '/assets/home/';
const productId = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
const productPrice = (price: string) => Number(price.replace(/[^0-9]/g, ''));

export function ProductCard({ product }: { product: Product }) {
  const navigate = useNavigate();
  const { addItem } = useCart();
  return <article onClick={() => navigate('/san-pham')} className="flex h-[376px] w-[276px] shrink-0 cursor-pointer flex-col gap-[6px] overflow-hidden rounded-[8px] bg-white shadow-[0_2px_16px_rgba(0,0,0,.08)]"><div className="relative h-[207px] shrink-0"><div className="absolute left-0 right-0 top-0 z-10 flex justify-between p-[8px]"><div className="flex flex-col gap-[4px]">{product.badges?.map(badge => <span key={badge} className={`rounded-[6px] px-[12px] py-[6px] text-[12px] leading-none text-white ${badge === 'Giảm 30%' ? 'bg-[#00ba0c]' : 'bg-red'}`}>{badge}</span>)}</div><img className="icon" src={`${assetPath}5a3c9.svg`} /></div><img className="h-full w-full object-contain p-[16px]" src={product.image} /></div><div className="flex flex-1 flex-col items-start gap-[6px] px-[12px] pb-[12px]"><h3 className="min-h-[40px] text-[18px] font-medium leading-[1.1]">{product.name}</h3><div className="flex items-center gap-[6px] text-[14px] leading-none"><img className="h-[16px] w-[16px]" src={`${assetPath}034ed.svg`} />4.8 <span>/</span><span className="text-xam">320 đánh giá</span></div><div className="flex flex-col gap-[4px]"><b className="text-[16px] leading-[1.16] text-red">{product.price}</b>{product.oldPrice && <del className="text-[14px] leading-none text-xam">{product.oldPrice}</del>}</div><button onClick={event => { event.stopPropagation(); addItem({ id: productId(product.name), name: product.name, price: productPrice(product.price), image: product.image }); navigate('/gio-hang'); }} className="mt-auto flex h-[40px] w-[252px] items-center justify-center gap-[6px] rounded-[6px] border-[1.5px] border-red px-[12px] py-[6px] text-[16px] font-bold leading-[1.16] text-red"><img className="icon" src={`${assetPath}0dfbc.svg`} />Thêm vào giỏ hàng</button></div></article>;
}
