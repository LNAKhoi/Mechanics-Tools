import { BenefitsStrip } from '../components/BenefitsStrip';
import { CartSummary } from '../components/cart/CartSummary';
import { CartTable } from '../components/cart/CartTable';
import { Layout } from '../components/Layout';

export default function Cart() {
  return <Layout assetGroup="cart"><main className="bg-page px-[72px] pb-0 pt-[24px]"><div className="page-container"><nav className="flex items-center gap-[12px] text-[16px] font-bold"><span>Trang chủ</span><span>&gt;</span><span className="text-xam">Giỏ hàng</span></nav><div className="mt-[24px] flex items-start justify-between"><CartTable /><CartSummary /></div><BenefitsStrip assetGroup="cart" /></div></main></Layout>;
}
