export type CartItem = {
  id: string;
  name: string;
  variant?: string;
  price: number;
  image: string;
  gift?: { name: string; image: string };
  quantity: number;
};

export const initialCartItems: CartItem[] = [
  { id: 'makita-drill', name: 'Máy khoan và vặn vít dùng pin 18V Makita', price: 6994000, image: '/assets/cart/3c819.png', quantity: 2 },
  { id: 'carbide-bit', name: 'mũi khoan carbide ngắn Ø6,3 mm', price: 6994000, image: '/assets/cart/cc545.png', quantity: 1 },
  {
    id: 'carbide-bit-gift', name: 'mũi khoan carbide ngắn Ø6,3 mm', price: 6994000, image: '/assets/cart/9c44c.png', quantity: 1,
    gift: { name: 'Đá cắt sắt Makita B-10730 355mm', image: '/assets/cart/24f13.png' },
  },
];

export const formatVnd = (value: number) => `${new Intl.NumberFormat('vi-VN').format(value)}đ`;
