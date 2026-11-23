import { useState } from 'react';
import { accountMenuItems } from '../../data/user';

export function AccountMenu() {
  const [active, setActive] = useState(accountMenuItems[0]);
  return <nav className="w-full overflow-x-auto border-b border-xam20" aria-label="Tài khoản"><div className="flex min-w-max gap-2 px-4 xl:justify-center">{accountMenuItems.map((item) => <button className={`min-h-11 shrink-0 border-b-2 px-3 text-sm font-medium ${active === item ? 'border-red text-red' : 'border-transparent'}`} aria-current={active === item ? 'page' : undefined} key={item} onClick={() => setActive(item)}>{item}</button>)}</div></nav>;
}
