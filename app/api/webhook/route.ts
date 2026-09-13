import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

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
      expand: ['line_items', 'customer_details'],
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

    // Here you would:
    // 1. Decrement inventory quantities in your database
    // 2. Mark one-of-a-kind ceramics as "Sold Out"
    // 3. Trigger email dispatch (e.g. via Resend or SendGrid)
  }

  return NextResponse.json({ received: true }, { status: 200 });
}