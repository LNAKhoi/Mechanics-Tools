import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CustomerForm } from '../components/checkout/CustomerForm';
import { OrderSummary } from '../components/checkout/OrderSummary';
import { Layout } from '../components/Layout';

export default function Checkout() {
  const location = useLocation();
  const routeInvoice = location.pathname === '/thanh-toan/hoa-don';
  const [invoiceRequested, setInvoiceRequested] = useState(routeInvoice);
  useEffect(() => setInvoiceRequested(routeInvoice), [routeInvoice]);
  const assetGroup = routeInvoice ? 'checkout-invoice' : 'checkout';
  return <Layout assetGroup={assetGroup}><main className="bg-page px-[72px] pb-[24px] pt-[24px]"><div className="page-container"><nav className="flex items-center gap-[12px] text-[16px] font-bold"><span>Trang chủ</span><span>&gt;</span><span className="text-xam">Thông tin thanh toán</span></nav><Link to="/gio-hang" className="mt-[24px] flex h-[40px] items-center gap-[6px] px-[12px] text-[14px] font-medium text-red underline"><img className="icon" src={`/assets/${assetGroup}/bc600.svg`} />Quay lại giỏ hàng</Link><div className="mt-[24px] flex items-start justify-center gap-[24px]"><CustomerForm invoiceRequested={invoiceRequested} onInvoiceChange={setInvoiceRequested} /><OrderSummary assetGroup={assetGroup} /></div></div></main></Layout>;
}
