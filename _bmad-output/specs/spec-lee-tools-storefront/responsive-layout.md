# Responsive layout: storefront

Applies to the storefront only. The `/quan-tri` admin panel stays desktop-only (Khoi, 2026-11-24). Visual language is unchanged: same colors, fonts (Chakra Petch for headings), red accent and card style.

## Breakpoints

| Name | Width | Container |
|---|---|---|
| Phone | < 768px | full width, 16px side padding |
| Tablet | 768–1279px | full width, 24px side padding |
| Desktop | ≥ 1280px | `max-width: 1776px`, centered, 72px padding at 1920px. At 1920px the page must look exactly like today. |

No page may scroll sideways at any width from 360px up.

## Global

- **TopBar (promo strip):** one line, ellipsis on phone. Secondary items hidden below 768px.
- **Header on phone and tablet:** one row with ☰ menu button, logo (scaled down), search icon and cart icon with a badge.
  - The search icon expands a full-width search field under the header. Submitting goes to `/danh-muc?q=`.
  - ☰ opens a left drawer, 85% of the width, with the categories list, Giới thiệu, Liên hệ, Tài khoản/Đăng nhập and the hotlines. It traps focus, closes on Esc or a tap on the backdrop, and uses `aria-modal`.
- **Header on desktop:** unchanged.
- **Footer:**
  - Phone: one column with collapsible sections (stores, support, policies, hotlines) as accordions; the newsletter box at full width.
  - Tablet: 2 columns.
  - Desktop: unchanged.
- **Chat bubbles:** bottom-right with 16px insets, stacked vertically, 48px buttons. On the product page on phone, raise them above the sticky add-to-cart bar.
- **Popup:** at most 92vw wide and 85vh tall, scrolls inside, close button always visible.
- **Tap targets:** at least 44×44px. Body text at least 14px on phone.

## Pages

- **Home:**
  - Hero and business banners: full width with the aspect ratio kept; slider dots stay visible.
  - Category menu: horizontal scroll chips on phone.
  - Product rows: a horizontal scroll strip with snap, about 1.6 cards visible on phone and 3 on tablet. The row banner image is hidden below 1280px.
  - Featured categories grid: 2 columns on phone, 3 on tablet.
  - Brands strip: horizontal scroll.
  - Benefits strip: 2×2 grid on phone.
- **Category:**
  - The filter sidebar becomes a "Bộ lọc" button that opens a bottom sheet with the category list. Applying closes it.
  - The sort control and the result count sit in one row above the grid.
  - Grid: 2 columns on phone, 3 on tablet, 5 on desktop. Pagination wraps.
- **Product:**
  - The gallery stacks on top: the main image is full width and swipeable, with thumbnails as a horizontal strip.
  - The info section follows, then the details tabs.
  - On phone, a sticky bottom bar holds "Liên Hệ", "Thêm vào giỏ hàng" and "Mua ngay" (disabled when out of stock).
  - Related products: a horizontal strip.
- **Cart:** the table becomes one card per line (image, name, variant or gift, quantity control, remove link). The summary stacks below with full-width buttons.
- **Checkout (order form):** a single column. Fields are full width, and the order summary comes after the form.
- **Login / Register / Account:** the card is full width (max 480px) and centered; the account menu becomes horizontal tabs.
- **About / Contact / 404:** single column. The contact info appears before the map link.

## Card sizing

`ProductCard` loses its fixed width and height: it becomes fluid, with the image area at a 4:3 aspect ratio and the title clamped to 2 lines. On desktop it keeps its current look.
