import { useEffect, useRef, type ReactNode } from 'react';

export function BottomSheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { onClose(); return; }
      if (event.key !== 'Tab' || !dialog.current) return;
      const nodes = Array.from(dialog.current.querySelectorAll<HTMLElement>('button, a[href], input:not([disabled])'));
      if (!nodes.length) return;
      const index = nodes.indexOf(document.activeElement as HTMLElement);
      event.preventDefault(); nodes[(index + (event.shiftKey ? nodes.length - 1 : 1)) % nodes.length].focus();
    };
    window.addEventListener('keydown', onKey);
    dialog.current?.querySelector<HTMLElement>('button')?.focus();
    return () => { window.removeEventListener('keydown', onKey); previous?.focus(); };
  }, [open, onClose]);
  if (!open) return null;
  return <div className="fixed inset-0 z-50 bg-black/40 xl:hidden" onMouseDown={onClose}><div ref={dialog} role="dialog" aria-modal="true" aria-label={title} onMouseDown={event => event.stopPropagation()} className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-4"><div className="mb-4 flex items-center justify-between"><h2 className="font-chakra text-2xl">{title}</h2><button type="button" onClick={onClose} aria-label="Đóng" className="grid size-11 place-items-center text-2xl">×</button></div>{children}</div></div>;
}
