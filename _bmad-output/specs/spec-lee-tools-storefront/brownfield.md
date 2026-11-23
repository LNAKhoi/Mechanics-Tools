# Brownfield notes

## Stack
React 18.3, Vite, TypeScript, Tailwind 3.4, react-router-dom 6.30. Mock data only, no backend. Static SPA on Vercel (`vercel.json` rewrites everything to `index.html`). Fixed `min-w-[1920px]` desktop layout.

## Routes
`/` Home · `/danh-muc` Category · `/san-pham` Product · `/gio-hang` Cart · `/thanh-toan` Checkout · `/thanh-toan/hoa-don` Checkout + VAT form · `/dang-nhap` Login · `/dang-ky` Register · `/tai-khoan` Account · `*` falls back to Home.

## Price surfaces (CAP-1)
- `src/data/products.ts`: `price` / `oldPrice` are formatted strings (`'6.994.000đ'`).
- `src/components/ProductCard.tsx`: renders `price`, `<del>oldPrice`, and parses the string into a number for the cart.
- `src/components/product/ProductInfo.tsx`: hardcoded `6.994.000đ` price and `<del>`.
- `src/components/cart/CartTable.tsx`: unit price and line total.
- `src/components/cart/CartSummary.tsx` and `src/context/CartContext.tsx`: subtotal.
- `src/components/checkout/OrderSummary.tsx`: line totals and total.
- `src/data/cart.ts`: numeric mock prices.
- `src/pages/Category.tsx`: price-range filter options and min/max inputs.

## Payment / invoice surfaces (CAP-12)
- `src/components/checkout/CustomerForm.tsx`: `payment` state + "Thanh toán" RadioGroup (COD / transfer); "Yêu cầu xuất hóa đơn" toggle + invoice fields; `invoiceRequested` props.
- `src/pages/Checkout.tsx`: `/thanh-toan/hoa-don` detection, `checkout-invoice` asset group, breadcrumb "Thông tin thanh toán".
- `src/App.tsx`: `/thanh-toan/hoa-don` route.
- `src/components/cart/CartSummary.tsx`: "Tổng thanh toán", "Thanh toán ngay" button; `OrderSummary.tsx`: "Tổng thanh toán".
- `src/components/Footer.tsx`: "Hướng dẫn thanh toán" link. `src/pages/Home.tsx`: "Hóa đơn chứng từ đầy đủ".
- `public/assets/checkout-invoice/` only serves the invoice variant.

## Home links (CAP-2)
- `src/components/Logo.tsx` (header and footer) and `src/components/auth/AuthLayout.tsx` already `<Link to="/">`.
- The "Trang chủ" breadcrumb is a plain `<span>` in `src/pages/Category.tsx`, `Product.tsx`, `Cart.tsx` and `Checkout.tsx`.
