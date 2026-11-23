import { Link, useParams } from 'react-router-dom';
import { EmptyState, ErrorState, LoadingState } from '../components/ApiStatus';
import { BenefitsStrip } from '../components/BenefitsStrip';
import { Layout } from '../components/Layout';
import { ProductDetails } from '../components/product/ProductDetails';
import { ProductGallery } from '../components/product/ProductGallery';
import { ProductInfo } from '../components/product/ProductInfo';
import { ApiError, useProduct } from '../lib/api';

export default function Product() {
  const { slug = '' } = useParams();
  const { data: product, error, loading, retry } = useProduct(slug);
  if (error || loading || !product) {
    const notFound = error instanceof ApiError && error.status === 404;
    return <Layout><main className="bg-page px-[72px] pb-[24px] pt-[24px]"><div className="page-container"><nav className="flex items-center gap-[12px] text-[16px] font-bold"><Link to="/">Trang chủ</Link></nav>{notFound ? <EmptyState><p className="font-chakra text-[28px] text-den">Không tìm thấy sản phẩm</p><Link to="/danh-muc" className="mt-[12px] inline-block font-bold text-red">Xem tất cả sản phẩm</Link></EmptyState> : error ? <ErrorState onRetry={retry} /> : <LoadingState />}</div></main></Layout>;
  }
  return <Layout><main className="bg-page px-[72px] pb-[24px] pt-[24px]"><div className="page-container"><nav className="flex items-center gap-[12px] text-[16px] font-bold"><Link to="/">Trang chủ</Link><span>&gt;</span><Link to={`/danh-muc/${product.category.slug}`}>{product.category.name}</Link><span>&gt;</span><span className="text-xam underline">{product.name}</span></nav><section className="mt-[24px] flex h-[726px] justify-between"><ProductGallery key={`gallery-${product.slug}`} images={product.images} name={product.name} /><ProductInfo key={`info-${product.slug}`} product={product} /></section></div><BenefitsStrip assetGroup="product" /><ProductDetails product={product} /></main></Layout>;
}
