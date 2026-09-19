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
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required.' }, { status: 400 });
    }

    const products = await getProducts();
    const targetProduct = products.find((p) => p.id === id);

    if (!targetProduct) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    if (body.stock !== undefined) {
      if (body.stock < 0) {
        return NextResponse.json({ error: 'Stock cannot be negative.' }, { status: 400 });
      }
      targetProduct.stock = Number(body.stock);
    }

    if (body.name !== undefined) targetProduct.name = body.name;
    if (body.japaneseName !== undefined) targetProduct.japaneseName = body.japaneseName;
    if (body.style !== undefined) targetProduct.style = body.style;
    if (body.origin !== undefined) targetProduct.origin = body.origin;
    if (body.price !== undefined) targetProduct.price = Math.round(Number(body.price) * 100);
    if (body.isOneOfAKind !== undefined) targetProduct.isOneOfAKind = Boolean(body.isOneOfAKind);
    if (body.description !== undefined) targetProduct.description = body.description;
    if (body.height !== undefined || body.diameter !== undefined || body.weight !== undefined || body.capacity !== undefined) {
      targetProduct.dimensions = {
        height: body.height ?? targetProduct.dimensions.height,
        diameter: body.diameter ?? targetProduct.dimensions.diameter,
        weight: body.weight ?? targetProduct.dimensions.weight,
        capacity: body.capacity ?? targetProduct.dimensions.capacity,
      };
    }
    if (body.careInstructions !== undefined) {
      targetProduct.careInstructions =
        typeof body.careInstructions === 'string'
          ? body.careInstructions.split('\n').filter((l: string) => l.trim().length > 0)
          : body.careInstructions;
    }
    if (body.images !== undefined) targetProduct.images = body.images;

    await saveProduct(targetProduct);

    revalidatePath('/');
    revalidatePath(`/products/${targetProduct.slug}`);
    revalidatePath('/admin');

    return NextResponse.json({ success: true, product: targetProduct });
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}