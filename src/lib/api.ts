import { useCallback, useEffect, useState } from 'react';

/** Public catalog types. The public API never returns price (CAP-1). */
export type CategoryRef = { slug: string; name: string };
export type Category = CategoryRef & { sortOrder: number; productCount?: number };
export type ProductSummary = { slug: string; name: string; brand: string; image: string | null; badges: string[]; category: CategoryRef };
export type ProductSpec = { label: string; value: string };
export type ProductDetail = ProductSummary & { sku: string; description: string; specs: ProductSpec[]; stock: number; images: string[] };
export type ProductPage = { items: ProductSummary[]; total: number; page: number; limit: number };
export type ProductQuery = { q?: string; category?: string; page?: number; limit?: number };
export type ContentBanner = { id: number; title: string; imageUrl: string; linkUrl: string | null; placement: 'hero' | 'business'; sortOrder: number; isEnabled: boolean };
export type ContentPage = { slug: string; title: string; html: string };
export type SiteSettings = { address: string; hotlines: { label: string; numbers: string[] }[]; email: string; zaloUrl: string | null; messengerUrl: string | null; mapEmbedUrl: string; stores: { name: string; address: string }[] };
export type Popup = { title: string; html: string; imageUrl: string | null; linkUrl: string | null; version: number };

/** Shown when a product has no images. An existing public asset (LEE's tools logo). */
export const PLACEHOLDER_IMAGE = '/assets/home/f0977.png';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
export type OrderLookup = { code: string; status: string; deliveryOption: string; createdAt: string; items: { productId: number; slug: string; name: string; sku: string; image: string | null; quantity: number }[]; history: { from: string | null; to: string; at: string }[] };
async function postJson<T>(path: string, body: unknown): Promise<T> { const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) }); if (!res.ok) { const data = await res.json().catch(() => ({})); throw new ApiError(res.status, data.error ?? 'Có lỗi xảy ra'); } return res.json(); }

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(path, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) {
    const body = await res.json().catch(() => null) as { error?: string } | null;
    throw new ApiError(res.status, body?.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  categories: (signal?: AbortSignal) => getJson<{ items: Category[] }>('/api/categories', signal).then(body => body.items),
  products: (query: ProductQuery = {}, signal?: AbortSignal) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) if (value !== undefined && value !== '') params.set(key, String(value));
    const search = params.toString();
    return getJson<ProductPage>(`/api/products${search ? `?${search}` : ''}`, signal);
  },
  product: (slug: string, signal?: AbortSignal) => getJson<ProductDetail>(`/api/products/${encodeURIComponent(slug)}`, signal),
  banners: (signal?: AbortSignal) => getJson<{ items: ContentBanner[] }>('/api/content/banners', signal).then(x => x.items),
  page: (slug: string, signal?: AbortSignal) => getJson<ContentPage>(`/api/content/pages/${slug}`, signal),
  site: (signal?: AbortSignal) => getJson<SiteSettings>('/api/content/site', signal),
  popup: (signal?: AbortSignal) => getJson<Popup | null>('/api/content/popup', signal),
  createOrder: (body: unknown) => postJson<{ code: string }>('/api/orders', body),
  lookupOrder: (code: string, phone: string) => postJson<OrderLookup>('/api/orders/lookup', { code, phone }),
};

export type AsyncState<T> = { data: T | undefined; error: Error | undefined; loading: boolean; retry: () => void };

/** Runs `load` whenever `key` changes; aborts stale requests. */
export function useApi<T>(key: string, load: (signal: AbortSignal) => Promise<T>): AsyncState<T> {
  const [state, setState] = useState<{ key: string; data?: T; error?: Error }>({ key: '' });
  const [attempt, setAttempt] = useState(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(load, [key]);
  useEffect(() => {
    const controller = new AbortController();
    setState(current => ({ key, data: current.key === key ? current.data : undefined }));
    run(controller.signal).then(
      data => { if (!controller.signal.aborted) setState({ key, data }); },
      error => { if (!controller.signal.aborted) setState({ key, error: error instanceof Error ? error : new Error(String(error)) }); },
    );
    return () => controller.abort();
  }, [key, run, attempt]);
  const current = state.key === key;
  return {
    data: current ? state.data : undefined,
    error: current ? state.error : undefined,
    loading: !current || (state.data === undefined && state.error === undefined),
    retry: () => setAttempt(value => value + 1),
  };
}

export const useCategories = () => useApi('categories', signal => api.categories(signal));
export const useProducts = (query: ProductQuery = {}) => useApi(`products:${JSON.stringify(query)}`, signal => api.products(query, signal));
export const useProduct = (slug: string) => useApi(`product:${slug}`, signal => api.product(slug, signal));
export const useContentBanners = () => useApi('content-banners', signal => api.banners(signal));
export const useContentPage = (slug: string) => useApi(`content-page:${slug}`, signal => api.page(slug, signal));
export const useSite = () => useApi('content-site', signal => api.site(signal));
export const usePopup = () => useApi('content-popup', signal => api.popup(signal));
