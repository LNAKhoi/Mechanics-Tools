import { useState } from 'react';
import { accountMenuItems } from '../../data/user';

export function AccountMenu() {
  const [active, setActive] = useState(accountMenuItems[0]);
  return <nav className="sr-only" aria-label="Tài khoản">{accountMenuItems.map((item) => <button aria-current={active === item ? 'page' : undefined} key={item} onClick={() => setActive(item)}>{item}</button>)}</nav>;
}
