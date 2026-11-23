import { Link } from 'react-router-dom';
import { PriceLabel } from '../PriceLabel';

export function CartSummary() {
  return <aside className="w-[576px] rounded-[8px] border border-xam20 bg-[rgba(111,113,118,.06)] p-[12px]">
    <h1 className="h-[40px] font-chakra text-[28px] leading-none">Tổng cộng</h1><div className="rule" />
    <div className="flex h-[40px] items-center justify-between font-chakra text-[22px]"><span>Tổng cộng:</span><PriceLabel className="text-red" /></div>
    <Link to="/thanh-toan" className="flex h-[40px] items-center justify-center rounded-[6px] bg-red text-[14px] font-medium text-white">Đặt hàng</Link>
    <Link to="/danh-muc" className="mt-[12px] flex h-[28px] items-center justify-center gap-[6px] text-[14px] font-medium text-red"><img className="icon" src="/assets/cart/0dfbc.svg" />Tiếp tục mua sắm</Link>
  </aside>;
}
