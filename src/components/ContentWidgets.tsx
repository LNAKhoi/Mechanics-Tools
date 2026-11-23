import { useEffect, useRef, useState } from 'react';
import { useContentPage, usePopup, useSite } from '../lib/api';
import { useSeo } from '../lib/seo';

export function ChatBubbles() {
  const site = useSite();
  const url = (value?: string | null) => value || '/lien-he';
  return <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3" aria-label="Liên hệ nhanh">
    <a aria-label="Chat Zalo" target="_blank" rel="noopener noreferrer" href={url(site.data?.zaloUrl)} className="rounded-full bg-blue-600 px-4 py-3 text-white shadow-lg">Zalo</a>
    <a aria-label="Chat Facebook Messenger" target="_blank" rel="noopener noreferrer" href={url(site.data?.messengerUrl)} className="rounded-full bg-blue-700 px-4 py-3 text-white shadow-lg">Messenger</a>
  </div>;
}

export function PromoPopup() {
  const state = usePopup();
  const dialog = useRef<HTMLDivElement>(null);
  const [closedVersion, setClosedVersion] = useState<number | null>(null);
  const popup = state.data;
  const key = popup ? `lee-popup-${popup.version}` : '';
  let storedDismissal = false;
  try { storedDismissal = Boolean(key && localStorage.getItem(key) === 'dismissed'); } catch { /* storage may be restricted */ }
  const dismissed = !popup || closedVersion === popup.version || storedDismissal;
  const close = () => { if (popup) try { localStorage.setItem(`lee-popup-${popup.version}`, 'dismissed'); } catch { /* storage may be restricted */ } setClosedVersion(popup?.version ?? null); };
  useEffect(() => {
    if (dismissed) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { close(); return; }
      if (event.key !== 'Tab' || !dialog.current) return;
      const nodes = Array.from(dialog.current.querySelectorAll<HTMLElement>('button, a[href]'));
      if (!nodes.length) return;
      const index = nodes.indexOf(document.activeElement as HTMLElement);
      event.preventDefault();
      nodes[(index + (event.shiftKey ? nodes.length - 1 : 1)) % nodes.length].focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dismissed, popup?.version]);
  if (dismissed || !popup) return null;
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><div ref={dialog} role="dialog" aria-modal="true" aria-label={popup.title} className="relative max-w-lg bg-white p-6 shadow-xl"><button aria-label="Đóng" autoFocus className="absolute right-2 top-2 text-2xl" onClick={close}>×</button>{popup.imageUrl && <img src={popup.imageUrl} alt="" className="mb-3 max-h-64 w-full object-cover" />}<h2 className="pr-8 text-xl font-bold">{popup.title}</h2><div className="mt-3" dangerouslySetInnerHTML={{ __html: popup.html }} />{popup.linkUrl && <a href={popup.linkUrl} className="mt-4 inline-block text-red underline">Xem thêm</a>}</div></div>;
}

export function ContentPageView({ slug }: { slug: 'gioi-thieu' | 'lien-he' }) {
  const content = useContentPage(slug);
  const site = useSite();
  const fallback = slug === 'gioi-thieu' ? { title: 'Giới thiệu', html: '<p>LEE\'s tools cung cấp dụng cụ và thiết bị chính hãng cho mọi công việc.</p>' } : { title: 'Liên hệ', html: '<p>Liên hệ LEE\'s tools để được tư vấn sản phẩm phù hợp.</p>' };
  const page = content.data ?? fallback;
  useSeo({ title: page.title, description: `${page.title} — LEE's tools cung cấp dụng cụ và thiết bị chính hãng.`, canonical: `/${slug}` });
  const contact = site.data ?? { address: '1234, Q1, TPHCM', email: 'contact@leestools.vn', hotlines: [{ label: 'Hotline', numbers: ['19001001'] }], mapEmbedUrl: 'https://www.google.com/maps' };
  return <main className="page-container py-12"><h1 className="font-chakra text-4xl">{page.title}</h1>{content.loading ? <p className="mt-4">Đang tải nội dung…</p> : <><div className="mt-6" dangerouslySetInnerHTML={{ __html: page.html }} />{content.error && <p className="mt-4 text-xam">Không thể tải nội dung mới nhất; đang hiển thị thông tin mặc định.</p>}</>}{slug === 'lien-he' && <section className="mt-6 space-y-2"><p>{contact.address}</p><p>{contact.email}</p>{contact.hotlines.map(x => <p key={x.label}>{x.label}: {x.numbers.join(', ')}</p>)}<a href={contact.mapEmbedUrl} target="_blank" rel="noopener noreferrer" className="inline-block text-red underline">Xem bản đồ</a></section>}</main>;
}
