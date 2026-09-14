import { Redis } from '@upstash/redis';
import type { Product } from '@/types/product';
import initialProducts from './products.json';

export type { Product };

export const PRODUCTS: Product[] = initialProducts as Product[];

export const PRODUCT_MAP: Record<string, Product> = PRODUCTS.reduce(
  (acc, product) => {
    acc[product.id] = product;
    return acc;
  },
  {} as Record<string, Product>
);

const KV_KEY = 'komorebi_products';

// Auto-reads UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

export async function getProducts(): Promise<Product[]> {
  if (!redis) {
    return initialProducts as Product[];
  }

  try {
    const products = await redis.get<Product[]>(KV_KEY);
    if (products && Array.isArray(products) && products.length > 0) {
      return products;
    }

    // Seed Redis with initial JSON catalog if empty
    await redis.set(KV_KEY, initialProducts);
    return initialProducts as Product[];
  } catch (err) {
    console.error('Upstash Redis read error, falling back to local seed:', err);
    return initialProducts as Product[];
  }
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const products = await getProducts();
  return products.find((p) => p.slug === slug);
}

export async function saveProduct(newProduct: Product): Promise<Product[]> {
  const products = await getProducts();
  const index = products.findIndex((p) => p.id === newProduct.id);

  let updated: Product[];
  if (index >= 0) {
    updated = [...products];
    updated[index] = newProduct;
  } else {
    updated = [newProduct, ...products];
  }

  if (redis) {
    try {
      await redis.set(KV_KEY, updated);
    } catch (err) {
      console.error('Failed to persist product to Upstash Redis:', err);
    }
  }

  return updated;
}

export const saveProducts = saveProduct;