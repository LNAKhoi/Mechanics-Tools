# LEE's tools storefront

Desktop web UI for the LEE's tools / Bình Thịnh tool store, built with React 18, Vite, TypeScript, Tailwind CSS v3 and react-router-dom. Mock data only (no backend).

## Run locally

```bash
npm install && npm run dev
```

Build for production with `npm run build` (output in `dist/`).

## Routes

| Route | Screen |
|---|---|
| `/` | Home |
| `/danh-muc` | Category listing |
| `/san-pham` | Product detail |
| `/gio-hang` | Cart |
| `/thanh-toan` | Checkout |
| `/thanh-toan/hoa-don` | Checkout with VAT invoice form |
| `/dang-nhap` | Login |
| `/dang-ky` | Register |
| `/tai-khoan` | Account |

## Deploy on Vercel

Framework preset: Vite · Build command: `npm run build` · Output directory: `dist`. `vercel.json` rewrites all paths to `index.html` for client-side routing.
