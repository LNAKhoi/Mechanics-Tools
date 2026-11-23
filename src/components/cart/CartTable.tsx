import { useCart } from '../../context/CartContext';
import { formatVnd, type CartItem } from '../../data/cart';
import { QuantityControl } from './QuantityControl';

function CartRow({ item }: { item: CartItem }) {
  const { updateQuantity, removeItem } = useCart();
  return <div className="grid min-h-[150px] grid-cols-[426px_126px_276px_276px] items-center gap-[24px] border-t border-xam20">
    <div className="flex items-center gap-[24px]"><img className="h-[126px] w-[126px] object-contain" src={item.image} /><div className="min-w-0"><p className="text-[18px] font-medium leading-[1.1]">{item.name}</p>{item.variant && <p className="mt-[6px] text-[14px] text-xam">{item.variant}</p>}{item.gift && <div className="mt-[6px]"><p className="text-[14px] leading-none text-xam">Tặng:</p><div className="mt-[6px] flex items-center gap-[8px]"><img className="size-[40px] rounded-full object-contain" src={item.gift.image} /><span className="text-[16px] leading-[1.16]">{item.gift.name}</span></div></div>}</div></div>
    <div className="flex justify-center"><QuantityControl quantity={item.quantity} onChange={quantity => updateQuantity(item.id, quantity)} /></div>
    <p className="text-center text-[16px] font-bold">{formatVnd(item.price)}</p>
    <div className="flex items-center justify-center gap-[10px]"><p className="text-[16px] font-bold text-red">{formatVnd(item.price * item.quantity)}</p><button aria-label={`Xóa ${item.name}`} className="text-[14px] text-xam underline" onClick={() => removeItem(item.id)}>Xóa</button></div>
  </div>;
}

export function CartTable() {
  const { items } = useCart();
  if (!items.length) return <div className="flex h-[200px] items-center justify-center rounded-[8px] border border-xam20 bg-white text-xam">Giỏ hàng của bạn đang trống.</div>;
  return <section className="w-[1176px] overflow-hidden rounded-[8px] border border-xam20 bg-white">
    <div className="grid h-[50px] grid-cols-[426px_126px_276px_276px] items-center gap-[24px] text-center text-[16px] font-bold text-xam"><span>Sản phẩm</span><span>Số lượng</span><span>Giá bán</span><span>Thành tiền</span></div>
    {items.map(item => <CartRow key={item.id} item={item} />)}
  </section>;
}
