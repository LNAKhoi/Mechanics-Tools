import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CopyrightBar } from '../Footer';
import { TopBar } from '../TopBar';

export function AuthLayout({ children, contentTop = '256px' }: { children: ReactNode; contentTop?: string }) {
  return <div className="min-w-[1920px] bg-page"><TopBar assetGroup="login" /><main className="relative h-[968px]"><div className="absolute left-1/2 top-[24px] -translate-x-1/2"><AuthLogo /></div><div className="absolute left-1/2 -translate-x-1/2" style={{ top: contentTop }}>{children}</div><a className="absolute bottom-[24px] left-[72px] right-[72px] text-center text-[14px] font-medium leading-none text-red underline" href="#privacy">Privacy policy</a></main><CopyrightBar /></div>;
}

function AuthLogo() {
  return <Link to="/" aria-label="LEE's tools home" className="flex flex-col items-center gap-[7px]"><div className="h-[35px] w-[78px] overflow-hidden [mask-image:url('/assets/login/7f969.svg')] [mask-position:center] [mask-repeat:no-repeat] [mask-size:78px_35px]"><img className="h-full w-full object-bottom" src="/assets/login/f0977.png" alt="" /></div><div className="w-[140px] text-center text-black"><p className="font-chakra text-[24.435px] font-bold leading-none tracking-[1px]">LEE’s tools</p><p className="mt-[3px] text-[7px] leading-none tracking-[.42px]">TOOLS FOR REAL PROGRESS</p></div></Link>;
}
