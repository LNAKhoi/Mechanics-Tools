import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { user } from '../data/user';
import { Logo } from './Logo';
import { TopBar } from './TopBar';

export type HeaderVariant = 'default' | 'variant2' | 'loggedIn';
const navItems = [['8fe63.svg', 'Phụ tùng, linh kiện'], ['c8768.svg', 'Công cụ, dụng cụ'], ['51792.svg', 'Thiết bị dùng Pin'], ['935d3.svg', 'Dụng cụ điện'], ['2fe6a.svg', 'Thiết bị nâng đỡ'], ['32c7b.svg', 'Thang nhôm']];

export function Header({ variant = 'default', assetGroup = 'home' }: { variant?: HeaderVariant; assetGroup?: string }) {
  const assetPath = `/assets/${assetGroup}/`; const { isLoggedIn } = useAuth(); const loggedIn = variant === 'loggedIn' || isLoggedIn; const accountIcon = assetGroup === 'user' ? '09ce2.svg' : 'c0f8b.svg';
  return <><TopBar assetGroup={assetGroup} /><header className="h-[144px] min-w-[1920px] bg-white px-[72px] py-[16px] shadow-[0_6px_6px_rgba(0,0,0,.04)]"><div className="page-container flex h-[36px] items-center justify-between"><nav className="flex w-[990px] items-center gap-[12px] overflow-hidden px-[50px]">{navItems.map(([icon, label]) => <Link className="flex shrink-0 items-center gap-[6px] px-[12px] py-[6px] text-[14px] leading-none" to="/danh-muc" key={label}><img className="icon" src={assetPath + icon} alt="" />{label}</Link>)}</nav><div className="flex h-[36px] items-center gap-[16px] text-[14px]"><div className="flex items-center gap-[8px]"><img className="icon" src={`${assetPath}646fd.svg`} alt="" /><span>Hotline</span><span className="text-red">1900 1000</span></div><i className="h-[16px] border-l border-xam20" />{[1, 2].map((key) => <div className="flex items-center gap-[8px]" key={key}><img className="icon" src={`${assetPath}e4534.svg`} alt="" /><span>Thời gian mở cửa</span><span className="text-red">8:00 - 22:00</span>{key === 1 && <i className="ml-[8px] h-[16px] border-l border-xam20" />}</div>)}</div></div><div className="page-container flex h-[60px] items-center justify-between"><div className="w-[452px]"><Logo assetGroup={assetGroup} /></div><div className="flex items-center gap-[8px]"><Link to="/danh-muc" className="flex h-[40px] items-center gap-[6px] rounded-[8px] bg-red px-[12px] text-[14px] font-medium text-white"><img className="icon" src={`${assetPath}8fa00.svg`} alt="" />Tất cả danh mục</Link><SearchBox assetPath={assetPath} /></div><div className="flex w-[452px] justify-end gap-[24px]"><HeaderAction base={assetPath} icon="54e19.svg" title="Thông báo" detail="0 thông báo tới" /><Link to="/gio-hang"><HeaderAction base={assetPath} icon="109f5.svg" title="Giỏ hàng" detail="0 Sản phẩm" /></Link><Link to={loggedIn ? '/tai-khoan' : '/dang-nhap'}><HeaderAction base={assetPath} icon={accountIcon} title={loggedIn ? user.accountName : 'Tài khoản'} detail={loggedIn ? user.membership : 'Đăng nhập/ Đăng ký'} member={loggedIn} /></Link></div></div></header></>;
}

function HeaderAction({ base, icon, title, detail, member = false }: { base: string; icon: string; title: string; detail: string; member?: boolean }) { return <div className="flex items-center gap-[10px] whitespace-nowrap"><img className="icon" src={base + icon} alt="" /><div className="flex flex-col gap-[3px]"><b className="text-[16px] leading-[1.16]">{title}</b><span className={member ? 'w-fit rounded-[8px] bg-[#009a1a] px-[8px] py-[2px] text-[12px] leading-none text-white' : 'text-[12px] leading-none text-xam'}>{detail}</span></div></div>; }

/** Header search: submits to /danh-muc?q=, and mirrors the current ?q= when on the listing. */
function SearchBox({ assetPath }: { assetPath: string }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentQuery = searchParams.get('q') ?? '';
  const [value, setValue] = useState(currentQuery);
  useEffect(() => setValue(currentQuery), [currentQuery]);
  const submit = (event: FormEvent) => { event.preventDefault(); const q = value.trim(); navigate(q ? `/danh-muc?q=${encodeURIComponent(q)}` : '/danh-muc'); };
  return <form role="search" onSubmit={submit} className="flex h-[42px] w-[640px] items-center justify-between rounded-[8px] border border-red bg-input pl-[12px]"><label className="flex flex-1 items-center gap-[6px] text-[14px] font-medium"><img className="icon" src={`${assetPath}4a34b.svg`} alt="" /><input type="search" value={value} onChange={event => setValue(event.target.value)} aria-label="Tìm kiếm sản phẩm" placeholder="Tìm máy khoan, cờ lê, phụ kiện..." className="w-full bg-transparent text-den outline-none placeholder:text-xam" /></label><button type="submit" className="flex h-[40px] items-center gap-[6px] rounded-[8px] bg-red px-[12px] text-[14px] font-medium text-white"><img className="icon" src={`${assetPath}79761.svg`} alt="" />Tìm kiếm</button></form>;
}
