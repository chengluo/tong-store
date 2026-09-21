import { Redis } from '@upstash/redis';
import type { Order, FulfillmentStatus } from '@/types/order';

export type { Order, FulfillmentStatus };

const KV_KEY = 'komorebi_orders';

// Auto-reads UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

// In-memory fallback when Redis isn't configured (local dev only — does not persist across restarts)
let memoryOrders: Order[] = [];

export async function getOrders(): Promise<Order[]> {
  if (!redis) {
    return memoryOrders;
  }

  try {
    const orders = await redis.get<Order[]>(KV_KEY);
    return Array.isArray(orders) ? orders : [];
  } catch (err) {
    console.error('Upstash Redis read error (orders), falling back to in-memory:', err);
    return memoryOrders;
  }
}

export async function saveOrder(order: Order): Promise<Order[]> {
  const orders = await getOrders();
  const index = orders.findIndex((o) => o.id === order.id);

  let updated: Order[];
  if (index >= 0) {
    updated = [...orders];
    updated[index] = order;
  } else {
    updated = [order, ...orders];
  }

  if (redis) {
    try {
      await redis.set(KV_KEY, updated);
    } catch (err) {
      console.error('Failed to persist order to Upstash Redis:', err);
    }
  } else {
    memoryOrders = updated;
  }

  return updated;
}

export async function updateFulfillmentStatus(
  id: string,
  fulfillmentStatus: FulfillmentStatus
): Promise<Order | null> {
  const orders = await getOrders();
  const order = orders.find((o) => o.id === id);
  if (!order) return null;

  order.fulfillmentStatus = fulfillmentStatus;
  await saveOrder(order);
  return order;
}
