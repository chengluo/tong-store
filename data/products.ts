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

export interface StockReservation {
  id: string;
  quantity: number;
}

export interface ReserveStockResult {
  success: boolean;
  reason?: 'no_data' | 'not_found' | 'insufficient_stock';
  productId?: string;
}

// Atomically checks and decrements stock for every reservation in one Redis-side
// Lua script, so two concurrent buyers can never both "win" the last unit.
const RESERVE_STOCK_SCRIPT = `
local raw = redis.call('GET', KEYS[1])
if not raw then
  return cjson.encode({ success = false, reason = 'no_data' })
end
local products = cjson.decode(raw)
local reservations = cjson.decode(ARGV[1])

for i = 1, #reservations do
  local res = reservations[i]
  local found = false
  for j = 1, #products do
    if products[j].id == res.id then
      found = true
      if products[j].stock ~= nil and products[j].stock < res.quantity then
        return cjson.encode({ success = false, reason = 'insufficient_stock', productId = res.id })
      end
    end
  end
  if not found then
    return cjson.encode({ success = false, reason = 'not_found', productId = res.id })
  end
end

for i = 1, #reservations do
  local res = reservations[i]
  for j = 1, #products do
    if products[j].id == res.id and products[j].stock ~= nil then
      products[j].stock = products[j].stock - res.quantity
    end
  end
end

redis.call('SET', KEYS[1], cjson.encode(products))
return cjson.encode({ success = true })
`;

export async function reserveStock(reservations: StockReservation[]): Promise<ReserveStockResult> {
  if (reservations.length === 0) return { success: true };

  if (!redis) {
    // No Redis configured (local dev only) — best-effort, non-atomic fallback.
    const products = await getProducts();
    for (const res of reservations) {
      const product = products.find((p) => p.id === res.id);
      if (!product) return { success: false, reason: 'not_found', productId: res.id };
      if (product.stock !== undefined && product.stock < res.quantity) {
        return { success: false, reason: 'insufficient_stock', productId: res.id };
      }
    }
    for (const res of reservations) {
      const product = products.find((p) => p.id === res.id)!;
      if (product.stock !== undefined) product.stock -= res.quantity;
    }
    return { success: true };
  }

  try {
    const result = await redis.eval(
      RESERVE_STOCK_SCRIPT,
      [KV_KEY],
      [JSON.stringify(reservations)]
    );
    return (typeof result === 'string' ? JSON.parse(result) : result) as ReserveStockResult;
  } catch (err) {
    console.error('Atomic stock reservation failed:', err);
    return { success: false, reason: 'no_data' };
  }
}