import { Link, useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
export default function OrderSuccess() { const [params] = useSearchParams(); return <Layout><main className="page-container px-4 py-16 text-center"><h1 className="font-chakra text-3xl">Đã gửi yêu cầu đặt hàng</h1><p className="mt-5">Mã đơn hàng của bạn: <b>{params.get('ma') ?? '—'}</b></p><p className="mt-3">Chúng tôi sẽ liên hệ để báo giá.</p><Link className="mt-6 inline-block text-red underline" to="/tra-cuu-don-hang">Tra cứu đơn hàng</Link></main></Layout>; }
