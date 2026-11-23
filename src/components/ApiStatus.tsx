import type { ReactNode } from 'react';

/** Shared loading / error / empty states for API-backed sections. */
export function LoadingState({ className = '' }: { className?: string }) {
  return <div role="status" className={`py-[48px] text-center text-[16px] text-xam ${className}`}>Đang tải...</div>;
}

export function ErrorState({ onRetry, message = 'Không thể tải dữ liệu. Vui lòng thử lại.', className = '' }: { onRetry: () => void; message?: string; className?: string }) {
  return <div role="alert" className={`flex flex-col items-center gap-[12px] py-[48px] text-center text-[16px] ${className}`}><p>{message}</p><button onClick={onRetry} className="h-[40px] rounded-[6px] border-[1.5px] border-red px-[16px] font-bold text-red">Thử lại</button></div>;
}

export function EmptyState({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`py-[48px] text-center text-[16px] text-xam ${className}`}>{children}</div>;
}
