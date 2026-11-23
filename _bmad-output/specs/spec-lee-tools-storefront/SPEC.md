---
id: SPEC-lee-tools-storefront
companions: [brownfield.md]
sources: [../../../features.md]
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability.

# LEE's tools e-commerce website

## Why

Opportunity + mandate: the Bình Thịnh / LEE's tools shop needs a working storefront it can run itself. Shoppers browse tools and send order requests. Staff manage products, customers and content without a developer. A static React mock storefront already exists. Prices are quoted on request ("Liên Hệ"), so the site's job is to bring in leads and order requests, not to take payment.

## Capabilities

- **CAP-1** Price on request
  - **intent:** Shoppers see "Liên Hệ" wherever a product price would appear, so pricing is negotiated directly with the shop.
  - **success:** No numeric or struck-through price appears on Home, Category, Product, Cart, Checkout or Order summary. Every price slot shows "Liên Hệ", including cart line totals and subtotal.
- **CAP-2** Home navigation
  - **intent:** Clicking the LEE's tools logo (header, footer, auth pages) or any "Trang chủ" breadcrumb returns the shopper to the homepage.
  - **success:** From every route, clicking each of those elements lands on `/`.
- **CAP-3** Core pages
  - **intent:** Visitors can read a Homepage, About Us and Contact Us page on mobile, tablet and desktop.
  - **success:** All three pages render without horizontal scroll at 375px, 768px and 1920px widths.
- **CAP-4** Popup notifications
  - **intent:** Admins configure a popup that shows visitors a promotion or announcement.
  - **success:** An admin can create, enable or disable a popup, and visitors then see or stop seeing it with no code change. Visitors can dismiss it.
- **CAP-5** Basic SEO
  - **intent:** Search engines can index the site with meaningful URLs and metadata.
  - **success:** Product and category URLs are readable slugs. Each page has a unique meta title and description. `/sitemap.xml` lists every public page and product.
- **CAP-6** Product search
  - **intent:** Shoppers find products by keyword, category and other non-price filters.
  - **success:** A keyword search and a category + filter combination return only matching products from the live catalog. There is no price-range filter anywhere.
- **CAP-7** Cart and order form (ordering deferred)
  - **intent:** Shoppers add and remove products, change quantities, view the cart and fill in their contact details on the order form. Submitting and storing orders comes in a later phase.
  - **success:** Cart changes persist while browsing. "Đặt hàng" opens the order form. The form shows no payment or invoice fields.
- **CAP-8** Product management
  - **intent:** Admins add, edit and delete products and categories, including price, images and inventory.
  - **success:** A product created in admin appears on the storefront, and editing or deleting it changes the storefront to match.
- **CAP-9** Customer management
  - **intent:** Admins view the customer list, each customer's details and their order history.
  - **success:** Every customer who placed an order is listed, with that customer's orders.
- **CAP-10** Content management
  - **intent:** Admins edit banners, the About Us and Contact Us pages, and other displayed content.
  - **success:** Content edited in admin appears on the storefront with no code change.
- **CAP-11** Admin roles
  - **intent:** A super-admin creates admin accounts and assigns permissions by role.
  - **success:** An admin whose role lacks a permission cannot reach or use that admin feature. This is enforced on the server.
- **CAP-12** No payment or invoice surfaces
  - **intent:** The site never suggests online payment or invoicing.
  - **success:** No page shows a payment-method choice, an invoice request form, "Thanh toán" wording (buttons, totals, breadcrumbs, footer guide link) or invoice marketing copy. `/thanh-toan/hoa-don` no longer exists.

## Constraints

- No online payment. An order is a request that the shop follows up on.
- Keep the existing storefront look. Changes add to it and do not redesign it.
- UI copy is in Vietnamese.
- Every page must work on mobile, tablet and desktop. The current fixed 1920px layout has to become responsive.
- CAP-4, CAP-8, CAP-9, CAP-10 and CAP-11 need persistence and authentication, which the current static app lacks. The backend is our own self-managed server and database (no managed backend service), so the shop keeps full control. It runs locally until a later hosting phase.
- Prices are still stored per product (CAP-8) but are never shown on the storefront (CAP-1).

## Non-goals

- Online payment gateway integration.
- Invoice generation and PDF invoice export.
- Web hosting services and infrastructure.
- Website deployment and production environment setup.
- Order submission and storage, for now (deferred to a later phase).
- Price-range filtering while prices are not published.

## Success signal

- An admin adds a product with images in the admin panel. A shopper on a phone finds it by search, sees "Liên Hệ" as its price, adds it to the cart and opens the order form, and sees no payment or invoice option anywhere.

## Assumptions

- "LEE's tools home" means the logo and the "Trang chủ" breadcrumbs, so both are covered.
- "Liên Hệ" can be plain text for the MVP. Linking it to Contact Us or a phone number is optional.
- The homepage line "Hóa đơn chứng từ đầy đủ" counts as invoice copy and is removed.
- The cart's "Thanh toán ngay" button becomes "Đặt hàng" and opens the order form. The form's final submit stays inactive until the ordering phase.

## Open Questions

- Guest ordering vs. login is deferred until the ordering phase.
