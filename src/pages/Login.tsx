import { Link, useNavigate } from 'react-router-dom';
import { AuthCard, AuthSubmit, BackHomeLink } from '../components/auth/AuthCard';
import { AuthField } from '../components/auth/AuthField';
import { AuthLayout } from '../components/auth/AuthLayout';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { signIn } = useAuth(); const navigate = useNavigate();
  function submit(event: React.FormEvent) { event.preventDefault(); signIn(); navigate('/tai-khoan'); }
  return <AuthLayout><div className="flex flex-col gap-[24px]"><BackHomeLink /><div className="flex flex-col items-center gap-[24px]"><AuthCard title="Đăng nhập"><form className="mt-[24px] flex flex-col gap-[24px]" onSubmit={submit}><div className="flex flex-col gap-[12px]"><AuthField label="Tài khoản" placeholder="Nhập tài khoản" /><AuthField label="Mật khẩu" placeholder="Nhập mật khẩu" password /><a className="text-right text-[14px] font-medium leading-none text-link underline" href="#forgot">Quên mật khẩu</a></div><div className="flex flex-col gap-[12px]"><AuthSubmit>Đăng nhập</AuthSubmit><p className="text-center text-[14px] font-medium leading-none">Bạn chưa có tài khoản? <Link className="text-red underline" to="/dang-ky">Đăng ký tài khoản</Link></p></div></form></AuthCard><SocialLogin /></div></div></AuthLayout>;
}

function SocialLogin() { return <div className="flex flex-col items-center gap-[24px]"><div className="flex w-[576px] items-center gap-[12px] px-[12px]"><img className="h-px flex-1" src="/assets/login/16f81.svg" alt="" /><span className="text-[16px] leading-[1.16] text-xam">Hoặc đăng nhập bằng</span><img className="h-px flex-1" src="/assets/login/16f81.svg" alt="" /></div><div className="flex gap-[24px]">{['b3de0.png', '4beb9.png', '5f569.png'].map((icon) => <button className="flex h-[56px] w-[56px] items-center justify-center rounded-full border border-xam20 bg-white" type="button" key={icon}><img className="h-[32px] w-[32px] object-contain" src={`/assets/login/${icon}`} alt="" /></button>)}</div></div>; }
