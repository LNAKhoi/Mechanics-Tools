import { FormEvent, useEffect, useRef, useState } from "react";
import { AdminApiError, AdminCategory, AdminProduct, adminApi } from "../../lib/admin-api";

type Draft = {
  slug: string; name: string; sku: string; categorySlug: string; brand: string;
  price: string; stock: string; description: string; images: string[];
  specs: { label: string; value: string }[]; isBestseller: boolean;
};
const empty = (): Draft => ({ slug: "", name: "", sku: "", categorySlug: "", brand: "", price: "0", stock: "0", description: "", images: [], specs: [], isBestseller: false });
const fromProduct = (product: AdminProduct): Draft => ({ ...product, categorySlug: product.category.slug, price: String(product.price), stock: String(product.stock), images: [...product.images], specs: [...product.specs] });
const slugify = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const formatPrice = (value: string) => (Number(value.replace(/\D/g, "")) || 0).toLocaleString("vi-VN");

export function ProductEditor({ product, categories, onClose, onSaved }: { product?: AdminProduct; categories: AdminCategory[]; onClose: () => void; onSaved: () => void }) {
  const [draft, setDraft] = useState<Draft>(product ? fromProduct(product) : empty());
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<{ id: string; name: string }[]>([]);
  const panel = useRef<HTMLElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => setDraft(product ? fromProduct(product) : empty()), [product]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !panel.current) return;
      const controls = Array.from(panel.current.querySelectorAll<HTMLElement>("button, input, select, textarea, [href]"));
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    panel.current?.querySelector<HTMLElement>("button, input, select, textarea")?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const set = (key: keyof Draft, value: unknown) => setDraft((current) => ({ ...current, [key]: value }));
  const upload = async (files: FileList | null) => {
    if (!files) return;
    const pending = Array.from(files).map((file) => ({ id: crypto.randomUUID(), name: file.name, file }));
    setUploading((current) => [...current, ...pending]);
    setUploadError("");
    const urls = await Promise.all(pending.map(async ({ id, file }) => {
      try { return (await adminApi.upload(file)).url; }
      catch (error) { setUploadError(error instanceof Error ? error.message : "Không thể tải ảnh"); return null; }
      finally { setUploading((current) => current.filter((item) => item.id !== id)); }
    }));
    setDraft((current) => ({ ...current, images: [...current.images, ...urls.filter((url): url is string => Boolean(url))] }));
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setErrors({}); setMessage("");
    const body = { ...draft, slug: draft.slug || slugify(draft.name), price: Number(draft.price), stock: Number(draft.stock) };
    try { if (product) await adminApi.updateProduct(product.id, body); else await adminApi.createProduct(body); setMessage("Đã lưu"); onSaved(); }
    catch (error) { if (error instanceof AdminApiError) setErrors(error.fieldErrors || {}); setMessage(error instanceof Error ? error.message : "Không thể lưu"); }
    finally { setSaving(false); }
  };
  const remove = async () => {
    if (!product || !confirm(`Xóa “${product.name}”?`)) return;
    try { await adminApi.deleteProduct(product.id); onSaved(); onClose(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Không thể xóa"); }
  };
  const field = (key: string) => errors[key]?.map((error) => <small className="admin-error" key={error}>{error}</small>);
  const reorderImage = (index: number, direction: -1 | 1) => set("images", draft.images.map((image, current) => current === index ? draft.images[index + direction] : current === index + direction ? draft.images[index] : image));

  return <><div className="admin-backdrop" onMouseDown={onClose} aria-hidden="true" />
    <aside className="product-editor" ref={panel} role="dialog" aria-modal="true" aria-labelledby="product-editor-title">
      <form onSubmit={submit}>
        <header className="editor-header">
          <h2 id="product-editor-title">{product ? `Sửa sản phẩm · ${product.sku}` : "Thêm sản phẩm"}</h2>
          <button className="editor-close" type="button" onClick={onClose} aria-label="Đóng">×</button>
        </header>
        <div className="editor-body">
          {message && <p className={message === "Đã lưu" ? "admin-success" : "admin-error"}>{message}</p>}
          <div className="editor-grid">
            <div>
              <label>Tên sản phẩm<input value={draft.name} onChange={(event) => set("name", event.target.value)} required />{field("name")}</label>
              <label>SKU<input value={draft.sku} onChange={(event) => set("sku", event.target.value)} required />{field("sku")}</label>
              <label>Danh mục<select value={draft.categorySlug} onChange={(event) => set("categorySlug", event.target.value)} required><option value="">Chọn danh mục</option>{categories.map((category) => <option value={category.slug} key={category.id}>{category.name}</option>)}</select>{field("categorySlug")}</label>
              <label>Thương hiệu<input value={draft.brand} onChange={(event) => set("brand", event.target.value)} required />{field("brand")}</label>
              <label>Giá nội bộ<span className="price-input"><input inputMode="numeric" value={formatPrice(draft.price)} onChange={(event) => set("price", event.target.value.replace(/\D/g, ""))} required /><span aria-hidden="true">₫</span></span>{field("price")}</label>
              <label>Tồn kho<input type="number" min="0" value={draft.stock} onChange={(event) => set("stock", event.target.value)} required />{field("stock")}</label>
              <label>Mô tả<textarea value={draft.description} onChange={(event) => set("description", event.target.value)} />{field("description")}</label>
            </div>
            <div>
              <span className="editor-section-label">Ảnh</span>
              <div className="image-list">
                {draft.images.map((url, index) => <div className="editor-image" key={url}><img src={url} alt="" />{index === 0 && <span className="image-label">Ảnh đại diện</span>}<span className="image-controls"><button type="button" disabled={index === 0} aria-label="Đưa ảnh lên" onClick={() => reorderImage(index, -1)}>↑</button><button type="button" disabled={index === draft.images.length - 1} aria-label="Đưa ảnh xuống" onClick={() => reorderImage(index, 1)}>↓</button><button type="button" aria-label="Xóa ảnh" onClick={() => set("images", draft.images.filter((_, current) => current !== index))}>×</button></span></div>)}
                {uploading.map((item) => <div className="editor-image image-uploading" key={item.id} aria-label={`Đang tải ${item.name}`}><span className="image-spinner" /></div>)}
                <button className="image-upload-tile" type="button" aria-label="Thêm ảnh" onClick={() => fileInput.current?.click()}>+</button>
                <input ref={fileInput} className="visually-hidden" type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={(event) => { void upload(event.target.files); event.currentTarget.value = ""; }} />
              </div>
              {uploadError && <p className="admin-error">{uploadError}</p>}
              <h3>Thông số</h3>
              {draft.specs.map((spec, index) => <p className="spec-row" key={index}><input placeholder="Tên" aria-label={`Tên thông số ${index + 1}`} value={spec.label} onChange={(event) => set("specs", draft.specs.map((item, current) => current === index ? { ...item, label: event.target.value } : item))} /><input placeholder="Giá trị" aria-label={`Giá trị thông số ${index + 1}`} value={spec.value} onChange={(event) => set("specs", draft.specs.map((item, current) => current === index ? { ...item, value: event.target.value } : item))} /><button type="button" aria-label={`Xóa thông số ${index + 1}`} onClick={() => set("specs", draft.specs.filter((_, current) => current !== index))}>×</button></p>)}
              <button className="text-button" type="button" onClick={() => set("specs", [...draft.specs, { label: "", value: "" }])}>+ Thêm thông số</button>
              <label className="bestseller-toggle"><input type="checkbox" checked={draft.isBestseller} onChange={(event) => set("isBestseller", event.target.checked)} />Bán chạy</label>
            </div>
          </div>
        </div>
        <footer className="editor-footer">
          {product && <button className="admin-button-danger" type="button" onClick={() => void remove()}>Xóa</button>}
          <button className="admin-button-secondary" type="button" onClick={onClose}>Hủy</button>
          <button className="admin-button" disabled={saving}>{saving ? "Đang lưu…" : "Lưu"}</button>
        </footer>
      </form>
    </aside>
  </>;
}
