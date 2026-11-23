import type { PrismaClient } from '@prisma/client';

/** Categories mirror `categoryTiles` in src/data/products.ts (same order). */
export const seedCategories = [
  { slug: 'may-khoan', name: 'Máy khoan & bắt vít', sortOrder: 1 },
  { slug: 'may-mai-may-cat', name: 'Máy mài & máy cắt', sortOrder: 2 },
  { slug: 'may-cua-gia-cong-go', name: 'Máy cưa & gia công gỗ', sortOrder: 3 },
  { slug: 'mui-dung-cu-co-khi', name: 'Mũi & dụng cụ cơ khí', sortOrder: 4 },
  { slug: 'taro-dung-cu-tao-ren', name: 'Taro & dụng cụ tạo ren', sortOrder: 5 },
  { slug: 'phu-kien-dung-cu', name: 'Phụ kiện & dụng cụ', sortOrder: 6 },
];

/** The 4 distinct products from the Phase 1 mock catalog, with their mock prices. */
export const seedProducts = [
  {
    slug: 'may-khoan-van-vit-dung-pin-18v-makita',
    name: 'Máy khoan và vặn vít dùng pin 18V Makita',
    brand: 'Makita',
    sku: 'DTD171Z',
    price: 6994000,
    stock: 25,
    isBestseller: true,
    categorySlug: 'may-khoan',
    description: [
      'Makita DTD171Z là dòng máy vặn vít va đập dùng pin 18V cao cấp, được trang bị động cơ không chổi than (BL Motor) cùng mô-men xoắn mạnh mẽ lên đến 180 N·m. Máy tích hợp 4 cấp tốc độ tùy chỉnh kết hợp 4 chế độ hỗ trợ thông minh (A-mode, T-mode cho kim loại mỏng/dày, Bolt mode), giúp tối ưu hóa khả năng siết vít trên đa dạng vật liệu.',
      'Với thiết kế nhỏ gọn, trọng lượng thân máy nhẹ cùng hệ thống đèn LED chiếu sáng hai bên, DTD171Z đáp ứng tốt các yêu cầu thi công khắt khe của kỹ thuật viên và thợ chuyên nghiệp.',
      'Sản phẩm mang mã DTD171Z là phiên bản thân máy đơn (chưa bao gồm pin và sạc), thích hợp cho người dùng đã sở hữu sẵn hệ thống pin sạc 18V LXT của Makita.',
    ].join('\n\n'),
    specs: [
      { label: 'Động cơ', value: 'Không chổi than (BL)' },
      { label: 'Xuất xứ', value: 'Thái lan' },
    ],
    images: ['/assets/home/3c819.png', '/assets/product/3c819.png'],
  },
  {
    slug: 'mui-khoan-carbide-ngan-6-3-mm',
    name: 'mũi khoan carbide ngắn Ø6,3 mm',
    brand: 'Bosch',
    sku: 'CB-063',
    price: 5270000,
    stock: 120,
    isBestseller: true,
    categorySlug: 'mui-dung-cu-co-khi',
    description: 'Mũi khoan carbide ngắn Ø6,3 mm cho khoan kim loại và vật liệu cứng, độ bền cao.',
    specs: [{ label: 'Đường kính', value: '6,3mm' }, { label: 'Vật liệu', value: 'Carbide' }],
    images: ['/assets/home/cc545.png'],
  },
  {
    slug: 'may-siet-bu-long-dung-pin-milwaukee-m18',
    name: 'Máy siết bu lông dùng pin Milwaukee M18',
    brand: 'Milwaukee',
    sku: 'M18-FHIWF12',
    price: 5270000,
    stock: 8,
    isBestseller: false,
    categorySlug: 'may-khoan',
    description: 'Máy siết bu lông dùng pin Milwaukee M18, lực siết lớn, phù hợp sửa chữa ô tô và lắp dựng kết cấu.',
    specs: [{ label: 'Điện áp', value: '18V' }, { label: 'Đầu vuông', value: '1/2"' }],
    images: ['/assets/home/8f51b.png'],
  },
  {
    slug: 'may-mai-goc-bosch-100-mm',
    name: 'Máy mài góc Bosch 100 mm',
    brand: 'Bosch',
    sku: 'GWS-060',
    price: 5270000,
    stock: 0,
    isBestseller: false,
    categorySlug: 'may-mai-may-cat',
    description: 'Máy mài góc Bosch 100 mm nhỏ gọn, dùng cho mài, cắt và đánh bóng kim loại.',
    specs: [{ label: 'Đường kính đá', value: '100mm' }, { label: 'Công suất', value: '670w' }],
    images: ['/assets/home/9c44c.png'],
  },
];

export const seedRoles = [
  { name: 'super_admin', permissions: ['*'] },
  { name: 'product_manager', permissions: ['products:write', 'categories:write'] },
];

/** Upserts roles. Safe to run repeatedly. */
export async function seedRolesInto(prisma: PrismaClient) {
  for (const role of seedRoles) {
    await prisma.role.upsert({ where: { name: role.name }, update: { permissions: role.permissions }, create: role });
  }
}

/**
 * Creates missing categories and products by slug. Safe to run repeatedly: existing rows
 * (possibly edited by admins) and their images are left untouched.
 */
export async function seedCatalogInto(prisma: PrismaClient) {
  const categoryIds = new Map<string, number>();
  for (const category of seedCategories) {
    const row = await prisma.category.upsert({ where: { slug: category.slug }, update: {}, create: category });
    categoryIds.set(row.slug, row.id);
  }
  for (const { categorySlug, images, ...product } of seedProducts) {
    const data = { ...product, categoryId: categoryIds.get(categorySlug)! };
    if (await prisma.product.findUnique({ where: { slug: product.slug }, select: { id: true } })) continue;
    await prisma.product.create({ data: { ...data, images: { create: images.map((url, sortOrder) => ({ url, sortOrder })) } } });
  }
}
