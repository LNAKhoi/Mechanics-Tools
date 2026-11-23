import { Link } from 'react-router-dom';
import { BenefitsStrip } from '../components/BenefitsStrip';
import { Layout } from '../components/Layout';
import { ProductDetails } from '../components/product/ProductDetails';
import { ProductGallery } from '../components/product/ProductGallery';
import { ProductInfo } from '../components/product/ProductInfo';

export default function Product() {
  return <Layout><main className="bg-page px-[72px] pb-[24px] pt-[24px]"><div className="page-container"><nav className="flex items-center gap-[12px] text-[16px] font-bold"><Link to="/">Trang chủ</Link><span>&gt;</span><span>Máy khoan & Bắt vít</span><span>&gt;</span><span>Máy dùng pin</span><span>&gt;</span><span className="text-xam underline">Máy khoan và vặn vít dùng pin 18V Makita</span></nav><section className="mt-[24px] flex h-[726px] justify-between"><ProductGallery /><ProductInfo /></section></div><BenefitsStrip assetGroup="product" /><ProductDetails /></main></Layout>;
}
