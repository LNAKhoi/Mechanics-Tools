import { useState } from 'react';
import { PLACEHOLDER_IMAGE } from '../../lib/api';

const VISIBLE_THUMBNAILS = 5;

export function ProductGallery({ images: productImages, name }: { images: string[]; name: string }) {
  const [selected, setSelected] = useState(0);
  const images = productImages.length ? productImages : [PLACEHOLDER_IMAGE];
  const thumbnails = images.slice(0, VISIBLE_THUMBNAILS);
  const hidden = images.length - VISIBLE_THUMBNAILS;
  return <section className="flex h-[726px] w-[876px] gap-[24px]">
    <div className="flex w-[126px] flex-col gap-[24px]">{thumbnails.map((image, index) => <button key={index} onClick={() => setSelected(index)} className={`relative size-[126px] overflow-hidden rounded-[8px] border bg-[rgba(111,113,118,.06)] ${selected === index ? 'border-[1.5px] border-red' : 'border-white'}`}>
      <img className="h-full w-full scale-[1.29] object-contain" src={image} alt={`${name} - ảnh ${index + 1}`} />{index === VISIBLE_THUMBNAILS - 1 && hidden > 0 && <span className="absolute inset-0 grid place-items-center bg-black/40 font-chakra text-[28px] text-white">+{hidden}</span>}
    </button>)}</div>
    <div className="flex size-[726px] items-center justify-center overflow-hidden rounded-[8px] border border-white bg-[rgba(111,113,118,.06)]">
      <img className="h-full w-full scale-[1.29] object-contain" src={images[selected] ?? images[0]} alt={name} />
    </div>
  </section>;
}
