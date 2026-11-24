import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Admin, adminApi } from "../../lib/admin-api";
import "./admin.css";

export function LoginPage({ onLogin }: { onLogin: (admin: Admin) => void }) {
  const [error, setError] = useState(""), navigate = useNavigate();
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); try { onLogin(await adminApi.login(String(form.get("email")), String(form.get("password")))); navigate("/quan-tri"); } catch (reason) { setError(reason instanceof Error ? reason.message : "Có lỗi xảy ra"); } };
  return <main className="admin-login"><form onSubmit={submit}><h1>LEE&apos;s tools</h1><label htmlFor="admin-email">Email<input id="admin-email" name="email" type="email" required /></label><label htmlFor="admin-password">Mật khẩu<input id="admin-password" name="password" type="password" required /></label><button className="admin-button">Đăng nhập</button>{error && <p className="admin-error">{error}</p>}</form></main>;
}
