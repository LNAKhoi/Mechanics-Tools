import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useSite } from '../lib/api';
import { Logo } from './Logo';

const stores = [{ name: 'Cửa hàng TP.HCM', address: '1234, Q1, TPHCM' }];
const support = ['Tư vấn kết nối', 'Tin khuyến mãi', 'Hướng dẫn thành viên', 'Các hình thức mua hàng'];
const policies = ['Chính sách và quy định chung', 'Chính sách bảo hành sản phẩm', 'Chính sách bảo mật thông tin', 'Chính sách vận chuyển', 'Quy trình giao hàng', 'Chính sách đổi trả'];
const hotlines = [{ label: 'Miền Bắc', numbers: ['19001001', '19001001'] }, { label: 'Miền Trung', numbers: ['19001001'] }, { label: 'Miền Nam', numbers: ['19001001'] }, { label: 'Bảo hành', numbers: ['19001001'] }];

export function Footer({ assetGroup = 'home' }: { assetGroup?: string }) {
  const assetPath = `/assets/${assetGroup}/`;
  const site = useSite();
  const siteStores = site.data?.stores ?? stores;
  const siteHotlines = site.data?.hotlines ?? hotlines;
  return <><footer className="h-[565px] min-w-[1920px] bg-red px-[72px] pt-[24px] text-white"><div className="page-container"><Logo inverted assetGroup={assetGroup} /><div className="mt-[24px] flex gap-[24px]"><div className="flex w-[276px] flex-col gap-[16px]"><FooterTitle>Cửa hàng của chúng tôi</FooterTitle>{siteStores.map(store => <div className="flex flex-col gap-[8px]" key={store.name}><b className="text-[16px] leading-[1.16]">{store.name}</b><span className="flex items-center gap-[8px] text-[16px]"><img className="icon" src={`${assetPath}549a3.svg`} alt="" />{store.address}</span></div>)}</div><div className="flex w-[276px] flex-col gap-[16px]"><FooterTitle>Chăm sóc khách hàng</FooterTitle><Link className="text-[16px] leading-[1.16]" to="/gioi-thieu">Giới thiệu</Link><Link className="text-[16px] leading-[1.16]" to="/lien-he">Liên hệ</Link>{support.map(link => <span className="text-[16px] leading-[1.16]" key={link}>{link}</span>)}</div><FooterColumn title="Chính sách bán hàng" links={policies} /><div className="w-[276px]"><FooterTitle>Tổng đài hỗ trợ</FooterTitle><div className="mt-[16px] flex flex-col gap-[16px]">{siteHotlines.map(({ label, numbers }) => <div className="flex items-start gap-[8px]" key={label}><b className="w-[90px] pt-[1px] text-[16px]">{label}</b><img className="icon shrink-0" src={`${assetPath}2d203.svg`} alt="" /><span className="flex flex-col gap-[8px] text-[16px] leading-[1.16]">{numbers.map(number => <span key={`${label}-${number}`}>{number}</span>)}</span></div>)}</div></div><Newsletter /></div></div></footer><CopyrightBar /></>;
}

function Newsletter() {
  return <div className="h-[121px] w-[576px] rounded-[8px] bg-white p-[8px] text-den shadow-[0_2px_16px_rgba(0,0,0,.08)]"><h3 className="font-chakra text-[22px] leading-[1.16]">Đăng kí nhận ưu đãi</h3><p className="mt-[10px] text-[16px] leading-[1.16]">Hãy nhập địa chỉ e-mail để nhận tin ưu đãi từ LEE’s tools</p><div className="mt-[10px] flex gap-[24px]"><input className="h-[40px] flex-1 rounded-[8px] border border-xam20 bg-input px-[12px] text-[14px]" placeholder="Nhập địa chỉ E-mail" /><button className="h-[40px] rounded-[8px] bg-red px-[24px] font-chakra text-[22px] text-white">Đăng kí</button></div></div>;
}

function FooterTitle({ children }: { children: ReactNode }) { return <h3 className="font-chakra text-[22px] leading-[1.16]">{children}</h3>; }
function FooterColumn({ title, links }: { title: string; links: string[] }) { return <div className="flex w-[276px] flex-col gap-[16px]"><FooterTitle>{title}</FooterTitle>{links.map(link => <span className="text-[16px] leading-[1.16]" key={link}>{link}</span>)}</div>; }
export function CopyrightBar() { return <div className="flex h-[56px] min-w-[1920px] items-center bg-den px-[72px] text-[16px] font-bold text-white">Copyright © 2026 by Lee’s tools. All rights reserved</div>; }
