import { useCallback, useEffect, useState } from 'react';

/** Public catalog types. The public API never returns price (CAP-1). */
export type CategoryRef = { slug: string; name: string };
export type Category = CategoryRef & { sortOrder: number; productCount?: number };
export type ProductSummary = { slug: string; name: string; brand: string; image: string | null; badges: string[]; category: CategoryRef };
export type ProductSpec = { label: string; value: string };
export type ProductDetail = ProductSummary & { sku: string; description: string; specs: ProductSpec[]; stock: number; images: string[] };
export type ProductPage = { items: ProductSummary[]; total: number; page: number; limit: number };
export type ProductQuery = { q?: string; category?: string; page?: number; limit?: number };

/** Shown when a product has no images. An existing public asset (LEE's tools logo). */
export const PLACEHOLDER_IMAGE = '/assets/home/f0977.png';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

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
