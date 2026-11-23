import { useState } from 'react';

export function AuthField({ label, placeholder, password = false }: { label: string; placeholder: string; password?: boolean }) {
  const [visible, setVisible] = useState(false);
  return <label className="flex h-[70px] w-full flex-col gap-[12px]"><span className="text-[18px] font-bold leading-none text-den">{label}</span><span className="flex h-[40px] items-center rounded-[8px] border border-xam20 bg-input px-[12px]"><input className="h-full min-w-0 flex-1 bg-transparent text-[14px] font-medium leading-none text-den outline-none placeholder:text-xam" placeholder={placeholder} type={password && !visible ? 'password' : 'text'} />{password && <button aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} className="ml-[12px] h-[24px] w-[24px] shrink-0" onClick={(event) => { event.preventDefault(); setVisible(!visible); }} type="button"><img className="h-full w-full" src="/assets/login/61e96.svg" alt="" /></button>}</span></label>;
}
