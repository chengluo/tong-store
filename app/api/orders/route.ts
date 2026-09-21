// app/api/orders/route.ts
import { NextResponse } from 'next/server';
import { getOrders, updateFulfillmentStatus } from '@/data/orders';
import type { FulfillmentStatus } from '@/types/order';

const VALID_STATUSES: FulfillmentStatus[] = ['processing', 'shipped', 'delivered'];

export async function GET() {
  const orders = await getOrders();
  return NextResponse.json(orders);
}

export async function PATCH(request: Request) {
  try {
    const { id, fulfillmentStatus } = await request.json();

    if (!id || !VALID_STATUSES.includes(fulfillmentStatus)) {
      return NextResponse.json(
        { error: 'Valid order ID and fulfillment status (processing, shipped, delivered) are required.' },
        { status: 400 }
      );
    }

    const updated = await updateFulfillmentStatus(id, fulfillmentStatus);

    if (!updated) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, order: updated });
  } catch (error: any) {
    console.error('Error updating order status:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
