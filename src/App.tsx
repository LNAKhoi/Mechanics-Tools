import { Navigate, Route, Routes } from 'react-router-dom';
import Category from './pages/Category';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Home from './pages/Home';
import Product from './pages/Product';
import Login from './pages/Login';
import Register from './pages/Register';
import Account from './pages/Account';
import AdminPanel from './pages/admin/AdminPanel';
import { ContentPageView } from './components/ContentWidgets';
import { Layout } from './components/Layout';

export default function App() { return <Routes><Route path="/quan-tri/*" element={<AdminPanel/>}/><Route path="/" element={<Home />} /><Route path="/gioi-thieu" element={<Layout><ContentPageView slug="gioi-thieu"/></Layout>}/><Route path="/lien-he" element={<Layout><ContentPageView slug="lien-he"/></Layout>}/><Route path="/danh-muc" element={<Category />} /><Route path="/danh-muc/:slug" element={<Category />} /><Route path="/san-pham" element={<Navigate to="/danh-muc" replace />} /><Route path="/san-pham/:slug" element={<Product />} /><Route path="/gio-hang" element={<Cart />} /><Route path="/thanh-toan" element={<Checkout />} /><Route path="/dang-nhap" element={<Login />} /><Route path="/dang-ky" element={<Register />} /><Route path="/tai-khoan" element={<Account />} /><Route path="*" element={<Home />} /></Routes>; }
