export type Product = {
  name: string;
  price: string;
  oldPrice?: string;
  image: string;
  badges?: ('Bán chạy' | 'Giảm 30%')[];
};

export const products: Product[] = [
  { name: 'Máy khoan và vặn vít dùng pin 18V Makita', price: '6.994.000đ', image: '/assets/home/3c819.png', badges: ['Bán chạy'] },
  { name: 'mũi khoan carbide ngắn Ø6,3 mm', price: '5.270.000đ', oldPrice: '7.200.000đ', image: '/assets/home/cc545.png', badges: ['Bán chạy', 'Giảm 30%'] },
  { name: 'Máy siết bu lông dùng pin Milwaukee M18', price: '5.270.000đ', oldPrice: '7.200.000đ', image: '/assets/home/8f51b.png', badges: ['Giảm 30%'] },
  { name: 'Máy mài góc Bosch 100 mm', price: '5.270.000đ', oldPrice: '7.200.000đ', image: '/assets/home/9c44c.png' },
  { name: 'mũi khoan carbide ngắn Ø6,3 mm', price: '5.270.000đ', oldPrice: '7.200.000đ', image: '/assets/home/cc545.png', badges: ['Bán chạy', 'Giảm 30%'] },
];

export const recommendedProducts = [...products, products[0]];
const categoryRow = [products[0], products[2], products[3], products[1], products[0]];
export const categoryProducts = Array.from({ length: 4 }, () => categoryRow).flat();

export const categoryTiles = [
  { title: 'Máy khoan &\nbắt vít', items: ['Máy khoan pin', 'Máy khoan búa', 'Máy bắt vít'], image: '/assets/home/2a0bc.png' },
  { title: 'Máy mài &\nmáy cắt', items: ['Máy mài góc', 'Máy cắt sắt', 'Máy cắt kim loại'], image: '/assets/home/69599.png' },
  { title: 'Máy cưa &\nGia công gỗ', items: ['Cưa đĩa', 'Cưa kiếm', 'Cưa lọng', 'Máy bào'], image: '/assets/home/bbabc.png' },
  { title: 'Mũi & Dụng cụ\ncơ khí', items: ['Mũi khoan', 'Dao phay', 'Dụng cụ gia công'], image: '/assets/home/f4730.png' },
  { title: 'Taro & dụng\ncụ tạo ren', items: ['Taro thẳng', 'Taro xoắn', 'Bàn ren', 'Bộ taro'], image: '/assets/home/a5701.png' },
  { title: 'Phụ kiện &\nDụng cụ', items: ['Pin sạc', 'Mũi khoan', 'Lưỡi cưa', 'Đá mài'], image: '/assets/home/d43cf.png' },
];
