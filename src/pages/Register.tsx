import { useNavigate } from 'react-router-dom';
import { AuthCard, AuthSubmit, BackHomeLink, TermsAndSignIn } from '../components/auth/AuthCard';
import { AuthField } from '../components/auth/AuthField';
import { AuthLayout } from '../components/auth/AuthLayout';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { signIn } = useAuth(); const navigate = useNavigate();
  function submit(event: React.FormEvent) { event.preventDefault(); signIn(); navigate('/tai-khoan'); }
  return <AuthLayout contentTop="265.588px"><div className="flex flex-col gap-[24px]"><BackHomeLink /><AuthCard title="Đăng ký tài khoản"><form className="mt-[24px] flex flex-col gap-[24px]" onSubmit={submit}><div className="flex flex-col gap-[12px]"><AuthField label="Tài khoản" placeholder="Nhập tài khoản" /><AuthField label="Mật khẩu" placeholder="Nhập mật khẩu" password /><AuthField label="Xác nhận lại mật khẩu" placeholder="Nhập lại mật khẩu" password /></div><div className="flex flex-col items-center gap-[12px]"><AuthSubmit>Đăng ký tài khoản</AuthSubmit><TermsAndSignIn /></div></form></AuthCard></div></AuthLayout>;
}
