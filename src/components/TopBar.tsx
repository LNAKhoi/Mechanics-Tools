const services = [['e3eeb.svg', 'Giao hàng toàn quốc'], ['a38ac.svg', 'Đổi trả 30 ngày'], ['0ddbb.svg', 'Hỗ trợ doanh nghiệp'], ['f6a6f.svg', 'Hệ thống cửa hàng']];

export function TopBar({ assetGroup = 'home' }: { assetGroup?: string }) {
  const assetPath = `/assets/${assetGroup}/`;
  return <div className="h-[56px] min-w-[1920px] bg-den px-[80px] text-white"><div className="mx-auto flex h-full items-center justify-between"><p className="text-[16px] font-bold leading-[1.16]">HƠN MỘT CÔNG CỤ, MỘT KHÔNG GIAN LÀM VIỆC TỐT HƠN</p><div className="flex items-center gap-[12px]">{services.map(([icon, text], index) => <div className="flex items-center gap-[12px]" key={text}>{index > 0 && <span className="text-[16px]">I</span>}<div className="flex items-center gap-[6px]"><img className="icon" src={assetPath + icon} alt="" /><span className="text-[14px] leading-none">{text}</span></div></div>)}</div></div></div>;
}
