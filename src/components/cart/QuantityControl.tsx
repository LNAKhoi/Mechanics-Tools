type QuantityControlProps = { quantity: number; onChange: (quantity: number) => void; assetGroup?: string };

export function QuantityControl({ quantity, onChange, assetGroup = 'cart' }: QuantityControlProps) {
  const assetPath = `/assets/${assetGroup}/`;
  return <div className="flex h-[40px] w-[114px] items-center justify-center gap-[10px] rounded-[8px] border border-xam20 bg-[rgba(111,113,118,.06)] p-[10px]">
    <button aria-label="Giảm số lượng" onClick={() => onChange(Math.max(1, quantity - 1))}><img className="icon" src={`${assetPath}95aef.svg`} /></button>
    <span className="w-[24px] text-center text-[14px] font-medium leading-none">{quantity}</span>
    <button aria-label="Tăng số lượng" onClick={() => onChange(quantity + 1)}><img className="icon" src={`${assetPath}fb5f3.svg`} /></button>
  </div>;
}
