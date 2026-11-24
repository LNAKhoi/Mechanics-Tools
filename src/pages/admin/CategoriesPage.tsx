import { FormEvent, useEffect, useState } from "react";
import { AdminCategory, adminApi } from "../../lib/admin-api";
export function CategoriesPage() {
  const [items, setItems] = useState<AdminCategory[]>([]),
    [name, setName] = useState(""),
    [error, setError] = useState("");
  const load = () => adminApi.categories().then((x) => setItems(x.items));
  useEffect(() => {
    void load();
  }, []);
  const add = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.createCategory({
        name,
        slug: name
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/đ/g, "d")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
        sortOrder: 0,
      });
      setName("");
      void load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Có lỗi");
    }
  };
  const rename = async (c: AdminCategory) => {
    const value = prompt("Tên danh mục", c.name);
    if (!value) return;
    try {
      await adminApi.updateCategory(c.id, { name: value });
      void load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Có lỗi");
    }
  };
  const remove = async (c: AdminCategory) => {
    if (confirm(`Xóa “${c.name}”?`))
      try {
        await adminApi.deleteCategory(c.id);
        void load();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Có lỗi");
      }
  };
  return (
    <section>
      <h1>Danh mục</h1>
      <form onSubmit={add}>
        <input
          value={name}
          required
          placeholder="Tên danh mục"
          onChange={(e) => setName(e.target.value)}
        />
        <button>Thêm</button>
      </form>
      {error && <p className="admin-error">{error}</p>}
      <table>
        <thead>
          <tr>
            <th>Tên</th>
            <th>Slug</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.map((x) => (
            <tr key={x.id}>
              <td>{x.name}</td>
              <td>{x.slug}</td>
              <td>
                <button onClick={() => void rename(x)}>Đổi tên</button>{" "}
                <button onClick={() => void remove(x)}>Xóa</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
