import { useState } from 'react';

const images = Array.from({ length: 5 }, () => '/assets/product/3c819.png');

export function ProductGallery() {
  const [selected, setSelected] = useState(0);
  return <section className="flex h-[726px] w-[876px] gap-[24px]">
    <div className="flex w-[126px] flex-col gap-[24px]">{images.map((image, index) => <button key={index} onClick={() => setSelected(index)} className={`relative size-[126px] overflow-hidden rounded-[8px] border bg-[rgba(111,113,118,.06)] ${selected === index ? 'border-[1.5px] border-red' : 'border-white'}`}>
      <img className="h-full w-full scale-[1.29] object-contain" src={image} />{index === 4 && <span className="absolute inset-0 grid place-items-center bg-black/40 font-chakra text-[28px] text-white">+5</span>}
    </button>)}</div>
    <div className="flex size-[726px] items-center justify-center overflow-hidden rounded-[8px] border border-white bg-[rgba(111,113,118,.06)]">
      <img className="h-full w-full scale-[1.29] object-contain" src={images[selected]} />
    </div>
  </section>;
}
