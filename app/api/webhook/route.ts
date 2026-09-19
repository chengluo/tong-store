import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import Stripe from 'stripe';
import { getProducts, saveProduct } from '@/data/products';

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
    console.log(`Total Paid: $${((session.amount_total || 0) / 100).toFixed(2)}`);
    console.log('Items to pack & dispatch:');
    items.forEach((item) => {
      console.log(`  • ${item.quantity}x ${item.description}`);
    });
    console.log('------------------------------------------\n');

    // Decrement inventory quantities for each purchased product
    const products = await getProducts();
    const productMap = new Map(products.map((p) => [p.id, p]));
    let touchedSlugs: string[] = [];

    for (const item of items) {
      const stripeProduct = item.price?.product as Stripe.Product | undefined;
      const productId = stripeProduct?.metadata?.productId;
      if (!productId) continue;

      const product = productMap.get(productId);
      if (!product || product.stock === undefined) continue;

      product.stock = Math.max(0, product.stock - (item.quantity || 1));
      await saveProduct(product);
      touchedSlugs.push(product.slug);
    }

    revalidatePath('/');
    touchedSlugs.forEach((slug) => revalidatePath(`/products/${slug}`));
    revalidatePath('/admin');

    // Here you would also trigger email dispatch (e.g. via Resend or SendGrid)
  }

  return NextResponse.json({ received: true }, { status: 200 });
}