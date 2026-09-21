import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import Stripe from 'stripe';
import { getProducts, saveProduct } from '@/data/products';
import { saveOrder } from '@/data/orders';
import { sendOrderConfirmationEmail } from '@/lib/email';
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

    // Decrement inventory quantities for each purchased product
    const products = await getProducts();
    const productMap = new Map(products.map((p) => [p.id, p]));
    const touchedSlugs: string[] = [];
    const emailItems = [];

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

      if (!product || product.stock === undefined) continue;

      product.stock = Math.max(0, product.stock - (item.quantity || 1));
      await saveProduct(product);
      touchedSlugs.push(product.slug);
    }

    revalidatePath('/');
    touchedSlugs.forEach((slug) => revalidatePath(`/products/${slug}`));
    revalidatePath('/admin');
    revalidatePath('/admin/orders');

    // Persist the order for the admin dashboard
    const shippingDetails = expandedSession.collected_information?.shipping_details;
    const orderItems: OrderItem[] = emailItems.map(({ productId, name, quantity, unitPrice }) => ({
      productId,
      name,
      quantity,
      unitPrice,
    }));

    const order: Order = {
      id: session.id,
      paymentIntentId:
        typeof expandedSession.payment_intent === 'string'
          ? expandedSession.payment_intent
          : expandedSession.payment_intent?.id ?? null,
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
      paymentStatus: expandedSession.payment_status,
      fulfillmentStatus: 'processing',
      createdAt: session.created * 1000,
    };

    await saveOrder(order);

    if (customerEmail) {
      await sendOrderConfirmationEmail({
        to: customerEmail,
        orderId: session.id,
        items: emailItems,
        totalCents: session.amount_total || 0,
      });
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}