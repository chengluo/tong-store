import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getProducts } from '@/data/products';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2026-08-26.dahlia',
});

export async function POST(request: Request) {
  try {
    const { items } = (await request.json()) as {
      items: { id: string; quantity: number }[];
    };

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    const allProducts = await getProducts();
    const productMap = allProducts.reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {} as Record<string, typeof allProducts[0]>);

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item) => {
      const product = productMap[item.id];
      if (!product) {
        throw new Error(`Invalid item ID: ${item.id}`);
      }

      //block checkout if sold out
      if (product.stock !== undefined && product.stock <= 0) {
        throw new Error(`"${product.name}" is currently sold out.`);
      }

      const formattedImages = product.images.map((img) =>
        img.startsWith('http') ? img : `${process.env.NEXT_PUBLIC_SITE_URL}${img}`
      );

      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${product.name} (${product.japaneseName})`,
            images: formattedImages,
            metadata: {
              productId: product.id,
              origin: product.origin,
            },
          },
          unit_amount: product.price,
        },
        quantity: item.quantity,
      };
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'FR', 'DE', 'JP', 'AU'],
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}