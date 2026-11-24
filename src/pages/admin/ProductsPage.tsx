import { useEffect, useState } from "react";
import { AdminCategory, AdminProduct, adminApi } from "../../lib/admin-api";
import { ImportWizard } from "./ImportWizard";
import { ProductEditor } from "./ProductEditor";

export function ProductsPage() {
  const [items, setItems] = useState<AdminProduct[]>([]), [categories, setCategories] = useState<AdminCategory[]>([]), [q, setQ] = useState(""), [category, setCategory] = useState(""), [stock, setStock] = useState(""), [page, setPage] = useState(1), [total, setTotal] = useState(0), [showImport, setShowImport] = useState(false), [editing, setEditing] = useState<AdminProduct | null | undefined>();
  const load = () => adminApi.products(q, page, 20, category, stock).then(({ items, total }) => { setItems(items); setTotal(total); });
  useEffect(() => { void adminApi.categories().then(({ items }) => setCategories(items)); }, []);
  useEffect(() => { void load(); }, [q, page, category, stock]);
  const change = (setter: (value: string) => void, value: string) => { setter(value); setPage(1); };
  const pages = Math.max(1, Math.ceil(total / 20));
  return <section>
    <div className="admin-page-head"><h1>Sản phẩm · {total}</h1><div className="admin-toolbar">
      <a className="admin-button-secondary" href="/templates/mau-nhap-san-pham.xlsx">File mẫu</a>
      <button className="admin-button-secondary" onClick={() => setShowImport(true)}>Nhập Excel</button>
      <button className="admin-button" onClick={() => setEditing(null)}>Thêm sản phẩm</button>
    </div></div>
    <div className="admin-filter"><input value={q} onChange={(e) => change(setQ, e.target.value)} placeholder="Tìm tên, thương hiệu hoặc SKU" aria-label="Tìm sản phẩm" />
      <select value={category} onChange={(e) => change(setCategory, e.target.value)} aria-label="Lọc danh mục"><option value="">Tất cả danh mục</option>{categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}</select>
      <select value={stock} onChange={(e) => change(setStock, e.target.value)} aria-label="Lọc tồn kho"><option value="">Tất cả tồn kho</option><option value="in">Còn hàng</option><option value="out">Hết hàng</option></select>
    </div>
    <table className="products-table"><thead><tr><th>Ảnh</th><th>Sản phẩm</th><th>SKU</th><th>Danh mục</th><th className="align-right">Giá nội bộ</th><th className="align-right">Tồn kho</th></tr></thead><tbody>
      {items.map((product) => <tr key={product.id} onClick={() => setEditing(product)}><td>{product.images[0] && <img className="product-thumb" src={product.images[0]} alt="" />}</td><td>{product.name}</td><td>{product.sku}</td><td>{product.category.name}</td><td className="align-right">{product.price.toLocaleString("vi-VN")} ₫</td><td className="align-right">{product.stock ? product.stock : <span className="stock-out">Hết</span>}</td></tr>)}
    </tbody></table>
    <div className="admin-pagination"><span>Trang {page} / {pages}</span><button className="admin-button-secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>Trước</button><button className="admin-button-secondary" disabled={page === pages} onClick={() => setPage(page + 1)}>Sau</button></div>
    {showImport && <ImportWizard done={() => { void load(); setShowImport(false); }} onClose={() => setShowImport(false)} />}
    {editing !== undefined && <ProductEditor product={editing || undefined} categories={categories} onClose={() => setEditing(undefined)} onSaved={() => { void load(); setEditing(undefined); }} />}
  </section>;
}
