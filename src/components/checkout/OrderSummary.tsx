import { useCart } from '../../context/CartContext';
import type { CartItem } from '../../data/cart';
import { PriceLabel } from '../PriceLabel';

function OrderItem({ item, assetGroup }: { item: CartItem; assetGroup: string }) {
  const image = `/assets/${assetGroup}/${item.image.split('/').pop()}`;
  const giftImage = item.gift && `/assets/${assetGroup}/${item.gift.image.split('/').pop()}`;
  return <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-[24px]"><div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-[24px]"><img className="size-20 shrink-0 object-contain sm:size-[126px]" src={image} /><div className="min-w-0"><p className="text-[16px] font-medium leading-[1.1] sm:text-[18px]">{item.name}</p>{item.gift && <><p className="mt-[6px] text-[14px] leading-none text-xam">Tặng:</p><div className="mt-[6px] flex flex-wrap items-center gap-[8px]"><img className="size-[40px] rounded-full object-contain" src={giftImage} /><span className="text-[14px] leading-[1.16] sm:text-[16px]">{item.gift.name}</span></div></>}</div></div><div className="flex justify-between sm:contents"><b className="text-[16px] sm:w-[126px] sm:text-center">SL: {item.quantity}</b><PriceLabel className="text-[16px] font-bold sm:w-[137px] sm:text-right" /></div></div>;
}

export function OrderSummary({ assetGroup }: { assetGroup: string }) {
  const { items } = useCart();
  return <section className="w-full self-start rounded-[8px] border border-xam20 bg-white p-[12px] xl:w-[726px]"><h1 className="h-[40px] text-center font-chakra text-[28px] leading-none">Thông tin đơn hàng</h1><div className="mt-[24px]"><div className="hidden h-[40px] grid-cols-[1fr_126px_137px] gap-[24px] text-[16px] font-bold text-xam sm:grid"><span>Sản phẩm</span><span className="text-center">Số lượng</span><span className="text-right">Thành tiền</span></div><div className="rule" /><div className="flex flex-col gap-[18px] py-[18px]">{items.map(item => <OrderItem key={item.id} item={item} assetGroup={assetGroup} />)}</div><div className="rule" /><div className="flex h-[40px] items-center justify-between font-chakra text-[22px]"><span>Tổng cộng:</span><PriceLabel className="text-red" /></div><button className="h-[40px] w-full rounded-[6px] bg-red text-[14px] font-medium text-white">Đặt hàng ngay</button></div></section>;
}
