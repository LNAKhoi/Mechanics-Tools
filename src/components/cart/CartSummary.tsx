import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { formatVnd } from '../../data/cart';

export function CartSummary() {
  const { subtotal } = useCart();
  const shipping = 0;
  const total = subtotal + shipping;
  return <aside className="w-[576px] rounded-[8px] border border-xam20 bg-[rgba(111,113,118,.06)] p-[12px]">
    <h1 className="h-[40px] font-chakra text-[28px] leading-none">Tổng cộng</h1><div className="rule" />
    <SummaryRow label="Tổng tiền hàng:" value={formatVnd(subtotal)} /><SummaryRow label="Phí vận chuyển:" value={formatVnd(shipping)} />
    <div className="rule" /><div className="flex h-[40px] items-center justify-between font-chakra text-[22px]"><span>Tổng thanh toán:</span><span className="text-red">{formatVnd(total)}</span></div>
    <Link to="/thanh-toan" className="flex h-[40px] items-center justify-center rounded-[6px] bg-red text-[14px] font-medium text-white">Thanh toán ngay</Link>
    <Link to="/danh-muc" className="mt-[12px] flex h-[28px] items-center justify-center gap-[6px] text-[14px] font-medium text-red"><img className="icon" src="/assets/cart/0dfbc.svg" />Tiếp tục mua sắm</Link>
  </aside>;
}
function SummaryRow({ label, value }: { label: string; value: string }) { return <div className="flex h-[44px] items-center justify-between text-[16px] font-bold"><span className="text-xam">{label}</span><span className="text-red">{value}</span></div>; }
