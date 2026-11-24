import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Admin, adminApi } from "../../lib/admin-api";
import { AdminLayout } from "./AdminLayout";
import { LoginPage } from "./LoginPage";
import { ProductsPage } from "./ProductsPage";
import { CategoriesPage } from "./CategoriesPage";
import { ContentPage } from "./ContentPage";

export default function AdminPanel() {
  const [admin, setAdmin] = useState<Admin | null | undefined>();
  useEffect(() => {
    void adminApi
      .me()
      .then(setAdmin)
      .catch(() => setAdmin(null));
  }, []);
  if (admin === undefined) return <p>Đang kiểm tra phiên…</p>;
  if (!admin)
    return (
      <Routes>
        <Route path="dang-nhap" element={<LoginPage onLogin={setAdmin} />} />
        <Route path="*" element={<Navigate to="dang-nhap" replace />} />
      </Routes>
    );
  return (
    <Routes>
      <Route
        element={<AdminLayout admin={admin} onLogout={() => setAdmin(null)} />}
      >
        <Route index element={<ProductsPage />} />
        <Route path="danh-muc" element={<CategoriesPage />} />
        <Route path="noi-dung" element={<ContentPage />} />
        <Route path="*" element={<Navigate to="." replace />} />
      </Route>
    </Routes>
  );
}
