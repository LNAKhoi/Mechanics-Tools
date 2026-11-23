export type Admin = { id: number; email: string; name: string; role: string; permissions: string[] };
export type AdminCategory = { id: number; slug: string; name: string; sortOrder: number };
export type AdminProduct = { id: number; slug: string; name: string; brand: string; sku: string; description: string; price: number; stock: number; isBestseller: boolean; specs: { label: string; value: string }[]; images: string[]; category: { slug: string; name: string } };
export type AdminUser = { id: number; email: string; name: string; role: string; isActive: boolean; createdAt: string };
export type Role = { id: number; name: string; permissions: string[] };

export class AdminApiError extends Error { constructor(public status: number, message: string, public fieldErrors?: Record<string, string[]>) { super(message); } }
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api/admin${path}`, { credentials: 'same-origin', headers: { Accept: 'application/json', ...(init.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...init.headers }, ...init });
  if (!res.ok) { const body = await res.json().catch(() => ({})); if (res.status === 401) window.dispatchEvent(new Event('admin:unauthorized')); throw new AdminApiError(res.status, body.error || 'Có lỗi xảy ra', body.fieldErrors); }
  return res.status === 204 ? undefined as T : res.json();
}
export const adminApi = {
  me: () => request<Admin>('/auth/me'), login: (email: string, password: string) => request<Admin>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }), logout: () => request<void>('/auth/logout', { method: 'POST' }),
  products: (q = '', page = 1, limit = 20) => request<{ items: AdminProduct[]; total: number; page: number; limit: number }>(`/products?${new URLSearchParams({ q, page: String(page), limit: String(limit) }).toString()}`), product: (id: number) => request<AdminProduct>(`/products/${id}`), createProduct: (body: unknown) => request<AdminProduct>('/products', { method: 'POST', body: JSON.stringify(body) }), updateProduct: (id: number, body: unknown) => request<AdminProduct>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }), deleteProduct: (id: number) => request<void>(`/products/${id}`, { method: 'DELETE' }),
  categories: () => request<{ items: AdminCategory[] }>('/categories'), createCategory: (body: unknown) => request<AdminCategory>('/categories', { method: 'POST', body: JSON.stringify(body) }), updateCategory: (id: number, body: unknown) => request<AdminCategory>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(body) }), deleteCategory: (id: number) => request<void>(`/categories/${id}`, { method: 'DELETE' }),
  upload: (image: File) => request<{ url: string }>('/uploads', { method: 'POST', body: image, headers: { 'Content-Type': image.type } }),
  users: () => request<{ items: AdminUser[] }>('/users'), roles: () => request<{ items: Role[] }>('/roles'), deactivate: (id: number) => request<void>(`/users/${id}/deactivate`, { method: 'POST' }),
};
