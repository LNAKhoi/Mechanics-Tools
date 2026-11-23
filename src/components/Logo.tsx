import { Link } from 'react-router-dom';

export function Logo({ inverted = false, assetGroup = 'home' }: { inverted?: boolean; assetGroup?: string }) {
  const assetPath = `/assets/${assetGroup}/`;
  return <Link to="/" aria-label="LEE's tools home" className="relative block h-[44px] w-[140px] shrink-0 xl:h-[60px] xl:w-[310px]">
    {inverted ? <span className="flex origin-top-left scale-[.7] items-center gap-[12px] pt-[7px] xl:scale-100"><span className="h-[48px] w-[106px] overflow-hidden [mask-image:url('/assets/home/19e48.svg')] [mask-position:center] [mask-repeat:no-repeat] [mask-size:106px_48px]"><img className="size-full object-bottom" src={`${assetPath}f0977.png`} /></span><img className="h-[41px] w-[188px] object-contain" src={`${assetPath}8ae4c.svg`} /></span> : <span className="relative block h-[60px] w-[190px] origin-top-left scale-[.7] xl:scale-100"><img className="absolute left-[83px] top-0 h-[37px] w-[42px]" src={`${assetPath}2e3c5.svg`} /><img className="absolute left-0 top-[18px] h-[40px] w-[105px]" src={`${assetPath}6465f.svg`} /><span className="absolute left-[108px] top-[38px] text-[10px] leading-[1.04] tracking-[-.1px] text-black">TOOLS FOR<br />REAL PROGRESS</span></span>}
  </Link>;
}
