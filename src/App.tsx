import { Route, Routes } from 'react-router-dom';
import Category from './pages/Category';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Home from './pages/Home';
import Product from './pages/Product';
import Login from './pages/Login';
import Register from './pages/Register';
import Account from './pages/Account';

export default function App() {
  return <Routes><Route path="/" element={<Home />} /><Route path="/danh-muc" element={<Category />} /><Route path="/san-pham" element={<Product />} /><Route path="/gio-hang" element={<Cart />} /><Route path="/thanh-toan" element={<Checkout />} /><Route path="/thanh-toan/hoa-don" element={<Checkout />} /><Route path="/dang-nhap" element={<Login />} /><Route path="/dang-ky" element={<Register />} /><Route path="/tai-khoan" element={<Account />} /><Route path="*" element={<Home />} /></Routes>;
}
