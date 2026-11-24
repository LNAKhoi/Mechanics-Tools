import { NavLink, Outlet } from "react-router-dom";
import { Admin, adminApi } from "../../lib/admin-api";
import "./admin.css";

const can = (admin: Admin, permission: string) =>
  admin.permissions.includes("*") || admin.permissions.includes(permission);

export function AdminLayout({ admin, onLogout }: { admin: Admin; onLogout: () => void }) {
  return <div className="admin-shell">
    <nav className="admin-sidebar" aria-label="Điều hướng quản trị">
      <b className="admin-brand">LEE&apos;s tools</b>
      <div className="admin-nav">
        {can(admin, "products:write") && <NavLink end to="/quan-tri">▦ Sản phẩm</NavLink>}
        {can(admin, "categories:write") && <NavLink to="/quan-tri/danh-muc">▤ Danh mục</NavLink>}
        {can(admin, "content:write") && <NavLink to="/quan-tri/noi-dung">▧ Nội dung</NavLink>}
      </div>
      <button className="admin-logout" onClick={() => void adminApi.logout().finally(onLogout)}>↪ Đăng xuất</button>
    </nav>
    <main className="admin-main"><Outlet /></main>
  </div>;
}
