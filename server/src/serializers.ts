import type { Category, Prisma, Product, ProductImage } from '@prisma/client';

type ProductWithRelations = Product & { category: Category; images: ProductImage[] };

export type Spec = { label: string; value: string };

const specsOf = (value: Prisma.JsonValue): Spec[] =>
  Array.isArray(value)
    ? value.flatMap(item => item && typeof item === 'object' && !Array.isArray(item) && typeof item.label === 'string' && typeof item.value === 'string' ? [{ label: item.label, value: item.value }] : [])
    : [];

const sortedImages = (images: ProductImage[]) => [...images].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id).map(image => image.url);

export const publicCategory = (category: Category & { _count?: { products: number } }) => ({
  slug: category.slug,
  name: category.name,
  sortOrder: category.sortOrder,
  ...(category._count ? { productCount: category._count.products } : {}),
});

/**
 * Public product shapes. Fields are picked explicitly (never spread) so `price`
 * can never leak to anonymous users (CAP-1).
 */
export const publicProductSummary = (product: ProductWithRelations) => ({
  slug: product.slug,
  name: product.name,
  brand: product.brand,
  image: sortedImages(product.images)[0] ?? null,
  badges: product.isBestseller ? ['Bán chạy'] : [],
  category: { slug: product.category.slug, name: product.category.name },
});

export const publicProductDetail = (product: ProductWithRelations) => ({
  ...publicProductSummary(product),
  sku: product.sku,
  description: product.description,
  specs: specsOf(product.specs),
  stock: product.stock,
  images: sortedImages(product.images),
});

/** Admin-only shape: includes price and ids. */
export const adminProduct = (product: ProductWithRelations) => ({
  id: product.id,
  ...publicProductDetail(product),
  price: product.price,
  isBestseller: product.isBestseller,
  categoryId: product.categoryId,
});

export const adminCategory = (category: Category) => ({ id: category.id, slug: category.slug, name: category.name, sortOrder: category.sortOrder });
