const benefits = [['eb719.svg', 'Cam kết của', 'LEE’s Tools'], ['e6b74.svg', 'Giao hàng toàn quốc', 'Giao hàng toàn quốc'], ['5884f.svg', 'Đổi trả 30 ngày', 'Yên tâm mua sắm'], ['f2ba6.svg', 'Tư vấn chuyên nghiệp', '1900 1000'], ['591d6.svg', 'Hệ thống cửa hàng', 'Trên toàn quốc'], ['591d6.svg', 'Ưu đãi doanh nghiệp', 'Chiết khấu tốt nhất']];

export function BenefitsStrip({ assetGroup = 'home' }: { assetGroup?: string }) {
  const assetPath = `/assets/${assetGroup}/`;
  const displayedBenefits = assetGroup === 'cart' || assetGroup === 'product' ? benefits.slice(1) : benefits;
  const serviceOnly = assetGroup === 'cart' || assetGroup === 'product';
  return <div className={`page-container flex items-center justify-between px-[48px] py-[24px] ${serviceOnly ? 'border-t border-xam20' : ''} ${assetGroup === 'cart' ? 'mt-[24px]' : ''}`}>{displayedBenefits.map(([icon, title, detail], index) => <div className="contents" key={title}>{index > 0 && <i className="h-[24px] border-l border-xam20" />}<div className="flex items-center gap-[8px]"><img className="icon" src={assetPath + icon} /><div className="flex flex-col gap-[4px] whitespace-nowrap"><span className="text-[16px] font-bold leading-none">{title}</span><span className="text-[12px] leading-none text-xam">{detail}</span></div></div></div>)}</div>;
}
