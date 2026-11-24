# LEE's tools storefront

Web storefront for the LEE's tools / Bình Thịnh tool store.

- `src/`: React 18, Vite, TypeScript, Tailwind CSS v3 and react-router-dom.
- `server/`: our own API (Node 22, Express, Prisma) backed by PostgreSQL 16 in Docker. It serves the public catalog and the admin auth/product endpoints.

Prices are quoted on request: the storefront shows "Liên Hệ", and the public API never returns `price`.

## Setup

Requires Node 22 and Docker.

```bash
# 1. Install dependencies (root = storefront, server = API)
npm install
npm --prefix server install

# 2. Configure the API (edit if you change the Docker credentials)
cp server/.env.example server/.env

# 3. Start PostgreSQL (docker-compose.yml, data kept in a named volume, listening on 127.0.0.1 only)
npm run db:up

# 4. Create the schema and seed 6 categories, 4 products and the admin roles
#    (re-running the seed only adds missing rows; it never overwrites admin edits)
cd server
npx prisma migrate dev
npx prisma db seed

# 5. Create the first super-admin (prompts for email, name and a hidden password)
npm run create-admin
cd ..
```

## Run locally

Run both servers in separate terminals:

```bash
npm run dev:server   # API on http://localhost:4000
npm run dev          # storefront on http://localhost:5173 (proxies /api and /uploads to the API)
```

Set `SITE_URL` in `server/.env` to the public storefront origin when hosting (it defaults to `http://localhost:5173`). The API uses it for `/sitemap.xml` and `/robots.txt`.

## Tests and builds

The API tests use a separate database, `TEST_DATABASE_URL` in `server/.env` (default `lee_tools_test` on the same Docker Postgres). It must name a different database than `DATABASE_URL`: every run empties its tables, and the tests refuse to start if the two database names match. `npm test` applies the migrations to it with `prisma migrate deploy`, which creates `lee_tools_test` if it is missing. If your database user cannot create databases, create it once yourself:

```bash
docker compose exec db createdb -U lee lee_tools_test
```

```bash
cd server && npm test   # Vitest + supertest against TEST_DATABASE_URL
npm run build           # storefront type-check and build (root)
cd server && npm run build
```

## API

Public (no `price` in any response):

| Endpoint | Notes |
|---|---|
| `GET /api/categories` | Categories in display order, with `productCount` |
| `GET /api/products?q=&category=&page=&limit=` | `q` matches name, brand or SKU (case-insensitive); unknown category gives an empty list |
| `GET /api/products/:slug` | Detail with images, specs and stock; 404 JSON if missing |
| `GET /api/content/banners` | Enabled homepage banners, in display order |
| `GET /api/content/pages/:slug` | Public About (`gioi-thieu`) or Contact (`lien-he`) page |
| `GET /api/content/site` | Store, hotline, contact and chat-link settings |
| `GET /api/content/popup` | Enabled popup inside its configured schedule, otherwise `null` |
| `POST /api/orders` | Guest quote request; accepts contact, delivery details and 1–50 product lines; returns only `{ code }` |
| `POST /api/orders/lookup` | Lookup by order code and phone; returns status, timeline and product snapshots only |
| `GET /sitemap.xml`, `GET /robots.txt` | Public discovery files; `SITE_URL` supplies their absolute URLs |

Admin (HTTP-only `lee_admin_session` cookie, valid 7 days):

| Endpoint | Permission |
|---|---|
| `POST /api/admin/auth/login` | none; more than 10 failed attempts per IP in 15 min gives 429 |
| `POST /api/admin/auth/logout`, `GET /api/admin/auth/me` | session |
| `POST /api/admin/products`, `PUT`/`DELETE /api/admin/products/:id` | `products:write` |
| `GET`/`POST /api/admin/products`, `GET`/`PUT`/`DELETE /api/admin/products/:id` | `products:write` |
| `GET`/`POST /api/admin/categories`, `PUT`/`DELETE /api/admin/categories/:id` | `categories:write` (a category with products cannot be deleted) |
| `POST /api/admin/uploads` | `products:write`; PNG/JPEG/WebP request body, maximum 5 MB; saves a generated name in `server/uploads` |
| `GET`/`POST`/`PUT`/`DELETE /api/admin/content/banners...` | `content:write` |
| `GET`/`PUT /api/admin/content/pages/:slug`, `/site`, `/popup` | `content:write`; HTML is sanitized on save and each popup save increments its version |
| `GET /api/admin/orders`, `GET /api/admin/orders/:id` | `orders:read` |
| `PUT /api/admin/orders/:id` | `orders:write` |
| `GET /api/admin/customers`, `GET /api/admin/customers/:id` | `customers:read` |
| `GET /api/admin/users`, `GET /api/admin/roles`, `POST /api/admin/users/:id/deactivate` | super-admin only; deactivation removes all sessions immediately |

`PUT` is a partial update: send only the fields to change, and omitted fields keep their values. Sending `images` replaces the whole image list. Image URLs must start with `/assets/` or `/uploads/`, or be http(s) URLs.

Roles are data: `super_admin` has `*`, `product_manager` has `products:write` and `categories:write`, `content_editor` has `content:write`, and `order_manager` has `orders:read`, `orders:write`, and `customers:read`. Content editors can also use the verified image upload endpoint for banners and popups.

## Nhập sản phẩm bằng Excel

Trong Quản trị → Sản phẩm, tải [File mẫu](/templates/mau-nhap-san-pham.xlsx), điền sheet **Sản phẩm**, rồi chọn **Nhập Excel**. SKU được so khớp không phân biệt hoa thường: SKU mới được thêm, SKU có sẵn chỉ cập nhật các ô có giá trị. Có thể chọn ảnh riêng hoặc ZIP cùng lần tải lên; cột Ảnh dùng tên tệp (phân cách `;`) hoặc liên kết `https://`. Bản xem trước báo lỗi theo dòng và chỉ lưu sau khi xác nhận.

## Routes

| Route | Screen |
|---|---|
| `/` | Home |
| `/danh-muc`, `/danh-muc/:slug`, `/danh-muc?q=` | Category listing and search results |
| `/san-pham/:slug` | Product detail (`/san-pham` redirects to `/danh-muc`) |
| `/gio-hang` | Cart |
| `/thanh-toan` | Order form (ordering not yet active) |
| `/dang-nhap` | Login |
| `/dang-ky` | Register |
| `/tai-khoan` | Account |
| `/quan-tri/dang-nhap` | Protected administrator sign-in |
| `/quan-tri` | Protected catalog management (prices shown only here) |
| `/quan-tri/noi-dung` | Protected banner, page, contact and popup management |
| `/gioi-thieu`, `/lien-he` | Public About and Contact pages |

## Deploy on Vercel

Framework preset: Vite · Build command: `npm run build` · Output directory: `dist`. `vercel.json` rewrites all paths to `index.html` for client-side routing. The API is not deployed yet (hosting is a later phase).

## Demo on Vercel + Render + Neon

1. Create a Neon project in the Singapore region and copy its direct (non-pooled) connection string.
2. In Render, select **New** → **Blueprint** → this repository, then paste `DATABASE_URL` and set `SITE_URL` to the Vercel URL.
3. If Render assigns a URL other than `https://lee-tools-api.onrender.com`, update `vercel.json`.
4. To create the first admin, from a local terminal with `DATABASE_URL` set to the Neon connection string, run `npm --prefix server run create-admin`.
5. Limitations: Render's free plan sleeps after idle (allow about 50 seconds for the first request), and uploads are not persistent.
