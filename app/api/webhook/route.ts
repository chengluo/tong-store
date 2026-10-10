import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import Stripe from 'stripe';
import { getProducts, reserveStock } from '@/data/products';
import { saveOrder } from '@/data/orders';
import { sendOrderConfirmationEmail, sendSoldOutCancellationEmail } from '@/lib/email';
import type { Order, OrderItem } from '@/types/order';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2026-08-26.dahlia',
});

export async function POST(req: Request) {
  const body = await req.text();
  const headerList = await headers();
  const signature = headerList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  } 

  // Handle successful checkout payments
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    // Retrieve full line item details for fulfillment
    const expandedSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['line_items.data.price.product', 'customer_details'],
    });

    const customerEmail = expandedSession.customer_details?.email;
    const items = expandedSession.line_items?.data || [];

    console.log('\n--- 📦 ORDER RECEIVED FOR FULFILLMENT ---');
    console.log(`Order ID: ${session.id}`);
    console.log(`Customer: ${customerEmail}`);
    console.log(`Total Paid: £${((session.amount_total || 0) / 100).toFixed(2)}`);
    console.log('Items to pack & dispatch:');
    items.forEach((item) => {
      console.log(`  • ${item.quantity}x ${item.description}`);
    });
    console.log('------------------------------------------\n');

    const paymentIntentId =
      typeof expandedSession.payment_intent === 'string'
        ? expandedSession.payment_intent
        : expandedSession.payment_intent?.id ?? null;

    // Build line-item details and the stock reservations they require
    const products = await getProducts();
    const productMap = new Map(products.map((p) => [p.id, p]));
    const emailItems = [];
    const reservations: { id: string; quantity: number }[] = [];

    for (const item of items) {
      const stripeProduct = item.price?.product as Stripe.Product | undefined;
      const productId = stripeProduct?.metadata?.productId;
      const product = productId ? productMap.get(productId) : undefined;

      emailItems.push({
        productId,
        name: product?.name || item.description || 'Ceramic Piece',
        quantity: item.quantity || 1,
        unitPrice: item.price?.unit_amount ?? 0,
        careInstructions: product?.careInstructions,
      });

      if (product && product.stock !== undefined) {
        reservations.push({ id: product.id, quantity: item.quantity || 1 });
      }
    }

    const shippingDetails = expandedSession.collected_information?.shipping_details;
    const orderItems: OrderItem[] = emailItems.map(({ productId, name, quantity, unitPrice }) => ({
      productId,
      name,
      quantity,
      unitPrice,
    }));

    const baseOrder: Omit<Order, 'paymentStatus' | 'fulfillmentStatus'> = {
      id: session.id,
      paymentIntentId,
      customerEmail: customerEmail ?? null,
      customerName: expandedSession.customer_details?.name ?? null,
      shippingAddress: shippingDetails
        ? {
            name: shippingDetails.name,
            line1: shippingDetails.address.line1,
            line2: shippingDetails.address.line2,
            city: shippingDetails.address.city,
            state: shippingDetails.address.state,
            postalCode: shippingDetails.address.postal_code,
            country: shippingDetails.address.country,
          }
        : null,
      items: orderItems,
      amountSubtotal: expandedSession.amount_subtotal || 0,
      shippingAmount: expandedSession.shipping_cost?.amount_total || 0,
      amountTotal: expandedSession.amount_total || 0,
      currency: expandedSession.currency || 'gbp',
      createdAt: session.created * 1000,
    };

    // Atomically re-check and reserve stock right before capturing payment —
    // this is what prevents two simultaneous buyers from both winning the
    // last unit of a one-of-a-kind piece.
    const reservation = await reserveStock(reservations);

    if (reservation.success) {
      if (paymentIntentId) {
        await stripe.paymentIntents.capture(paymentIntentId);
      }

      revalidatePath('/');
      reservations.forEach((r) => {
        const product = productMap.get(r.id);
        if (product) revalidatePath(`/products/${product.slug}`);
      });
      revalidatePath('/admin');
      revalidatePath('/admin/orders');

      await saveOrder({
        ...baseOrder,
        paymentStatus: 'paid',
        fulfillmentStatus: 'processing',
      });

      if (customerEmail) {
        await sendOrderConfirmationEmail({
          to: customerEmail,
          orderId: session.id,
          items: emailItems,
          totalCents: session.amount_total || 0,
        });
      }
    } else {
      console.warn(
        `Stock reservation failed for session ${session.id} (product: ${reservation.productId}, reason: ${reservation.reason}). Releasing payment authorization.`
      );

      if (paymentIntentId) {
        await stripe.paymentIntents.cancel(paymentIntentId);
      }

      revalidatePath('/admin/orders');

      await saveOrder({
        ...baseOrder,
        paymentStatus: 'canceled',
        fulfillmentStatus: 'canceled',
      });

      if (customerEmail) {
        const soldOutItem = emailItems.find((i) => i.productId === reservation.productId);
        await sendSoldOutCancellationEmail({
          to: customerEmail,
          orderId: session.id,
          itemName: soldOutItem?.name || 'this item',
        });
      }
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}