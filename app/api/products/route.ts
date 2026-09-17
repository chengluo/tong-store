// app/api/products/route.ts
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
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
      stock: body.stock !== undefined ? Math.max(0, parseInt(body.stock, 10)) : 1,
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

    revalidatePath('/');
    revalidatePath(`/products/${slug}`);
    revalidatePath('/admin');

    return NextResponse.json({ success: true, product: newProduct }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, stock } = await request.json();

    if (!id || stock === undefined || stock < 0) {
      return NextResponse.json({ error: 'Valid product ID and non-negative stock count are required.' }, { status: 400 });
    }

    const products = await getProducts();
    const targetProduct = products.find((p) => p.id === id);

    if (!targetProduct) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    targetProduct.stock = Number(stock);
    await saveProduct(targetProduct);

    revalidatePath('/');
    revalidatePath(`/products/${targetProduct.slug}`);
    revalidatePath('/admin');

    return NextResponse.json({ success: true, product: targetProduct });
  } catch (error: any) {
    console.error('Error modifying stock:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}