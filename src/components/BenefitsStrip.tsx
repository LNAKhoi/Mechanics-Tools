const benefits = [['eb719.svg', 'Cam kết của', 'LEE’s Tools'], ['e6b74.svg', 'Giao hàng toàn quốc', 'Giao hàng toàn quốc'], ['5884f.svg', 'Đổi trả 30 ngày', 'Yên tâm mua sắm'], ['f2ba6.svg', 'Tư vấn chuyên nghiệp', '1900 1000'], ['591d6.svg', 'Hệ thống cửa hàng', 'Trên toàn quốc'], ['591d6.svg', 'Ưu đãi doanh nghiệp', 'Chiết khấu tốt nhất']];

export function BenefitsStrip({ assetGroup = 'home' }: { assetGroup?: string }) {
  const assetPath = `/assets/${assetGroup}/`;
  const displayedBenefits = assetGroup === 'cart' || assetGroup === 'product' ? benefits.slice(1) : benefits;
  const serviceOnly = assetGroup === 'cart' || assetGroup === 'product';
  return <div className={`page-container grid grid-cols-2 gap-4 py-[24px] md:grid-cols-3 xl:flex xl:items-center xl:justify-between xl:px-[48px] ${serviceOnly ? 'border-t border-xam20' : ''} ${assetGroup === 'cart' ? 'mt-[24px]' : ''}`}>{displayedBenefits.map(([icon, title, detail], index) => <div className="flex min-w-0 items-center gap-[8px]" key={title}>{index > 0 && <i className="hidden h-[24px] border-l border-xam20 xl:block" />}<img className="icon shrink-0" src={assetPath + icon} /><div className="flex min-w-0 flex-col gap-[4px] xl:whitespace-nowrap"><span className="text-[14px] font-bold leading-none xl:text-[16px]">{title}</span><span className="text-[12px] leading-none text-xam">{detail}</span></div></div>)}</div>;
}
