import { useState } from 'react';

const inputClass = 'h-[40px] w-full rounded-[8px] border border-xam20 bg-input px-[12px] text-[14px] font-medium text-den placeholder:text-xam';

function Field({ label, required, placeholder, textarea = false }: { label: string; required?: boolean; placeholder: string; textarea?: boolean }) {
  return <label className="flex w-full flex-col gap-[12px]"><span className="text-[18px] font-bold leading-none">{label}{required && <b className="ml-[8px] text-red">*</b>}</span>{textarea ? <textarea className="h-[100px] w-full resize-none rounded-[8px] border border-xam20 bg-input p-[12px] text-[14px] font-medium placeholder:text-xam" placeholder={placeholder} /> : <input className={inputClass} placeholder={placeholder} />}</label>;
}

export function CustomerForm() {
  const [delivery, setDelivery] = useState('standard');
  return <section className="w-[726px] self-start rounded-[8px] border border-xam20 bg-white py-[12px]"><h1 className="text-center font-chakra text-[28px] leading-none">Thông tin khách hàng</h1><div className="mt-[24px] flex flex-col gap-[16px] px-[12px]"><Field label="Họ và tên" required placeholder="Nhập họ và tên" /><div className="flex gap-[16px]"><Field label="Điện thoại" required placeholder="Nhập số điện thoại" /><Field label="E-mail" placeholder="Nhập E-mail" /></div><Field label="Tỉnh/ Thành phố" required placeholder="Nhập tỉnh/ thành phố" /><Field label="Phường/ Xã" required placeholder="Nhập phường/ xã" /><Field label="Địa chỉ" required placeholder="Nhập địa chỉ giao đến" /><Field label="Ghi chú" placeholder="Nhập ghi chú" textarea /></div><div className="mt-[24px] border-t border-xam20 px-[12px] pt-[24px]"><div className="flex gap-[32px] text-[14px]"><RadioGroup label="Giao hàng" value={delivery} onChange={setDelivery} options={[['standard', 'Tiêu chuẩn'], ['express', 'Nhanh']]} /></div></div></section>;
}

function RadioGroup({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: [string, string][] }) { return <fieldset className="flex items-center gap-[8px]"><legend className="font-bold">{label}:</legend>{options.map(([option, text]) => <label className="flex cursor-pointer items-center gap-[4px] whitespace-nowrap" key={option}><input className="accent-red" type="radio" name={label} value={option} checked={value === option} onChange={() => onChange(option)} />{text}</label>)}</fieldset>; }
