import { NextResponse } from 'next/server';
import { getProducts, saveProduct } from '@/data/products';
import type { Product } from '@/types/product';

export async function GET() {
  const products = await getProducts();
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.name || !body.price || !body.images || body.images.length === 0) {
      return NextResponse.json(
        { error: 'Name, price, and at least one image are mandatory.' },
        { status: 400 }
      );
    }

    const slug = body.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const id = `${slug}-${Date.now().toString().slice(-4)}`;

    const newProduct: Product = {
      id,
      slug,
      name: body.name,
      japaneseName: body.japaneseName || '',
      style: body.style || 'Arita-yaki',
      origin: body.origin || 'Japan',
      price: Math.round(Number(body.price) * 100),
      description: body.description || '',
      dimensions: {
        height: body.height || 'N/A',
        diameter: body.diameter || 'N/A',
        weight: body.weight || 'N/A',
        capacity: body.capacity || undefined,
      },
      careInstructions: body.careInstructions
        ? body.careInstructions.split('\n').filter((l: string) => l.trim().length > 0)
        : ['Hand-wash advised'],
      isOneOfAKind: Boolean(body.isOneOfAKind),
      images: body.images,
    };

    await saveProduct(newProduct);

    return NextResponse.json({ success: true, product: newProduct }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}