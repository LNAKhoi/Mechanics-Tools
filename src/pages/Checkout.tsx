import { Link } from 'react-router-dom';
import { CustomerForm } from '../components/checkout/CustomerForm';
import { OrderSummary } from '../components/checkout/OrderSummary';
import { Layout } from '../components/Layout';

export default function Checkout() {
  const assetGroup = 'checkout';
  return <Layout assetGroup={assetGroup}><main className="bg-page px-[72px] pb-[24px] pt-[24px]"><div className="page-container"><nav className="flex items-center gap-[12px] text-[16px] font-bold"><Link to="/">Trang chủ</Link><span>&gt;</span><span className="text-xam">Thông tin đặt hàng</span></nav><Link to="/gio-hang" className="mt-[24px] flex h-[40px] items-center gap-[6px] px-[12px] text-[14px] font-medium text-red underline"><img className="icon" src={`/assets/${assetGroup}/bc600.svg`} />Quay lại giỏ hàng</Link><div className="mt-[24px] flex items-start justify-center gap-[24px]"><CustomerForm /><OrderSummary assetGroup={assetGroup} /></div></div></main></Layout>;
}
