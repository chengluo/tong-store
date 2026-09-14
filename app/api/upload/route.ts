import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate image format
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file format. Only JPEG, PNG, WEBP, and AVIF are permitted.' },
        { status: 400 }
      );
    }

    // Sanitize filename and create unique timestamped name
    const sanitizedOriginalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const pathname = `products/${Date.now()}-${sanitizedOriginalName}`;

    // Upload directly to Vercel Edge Blob Storage / CDN
    const blob = await put(pathname, file, {
      access: 'public',
      addRandomSuffix: true,
    });

    // blob.url is the globally distributed edge CDN URL
    return NextResponse.json({
      success: true,
      url: blob.url,
      filename: sanitizedOriginalName,
    });
  } catch (error: any) {
    console.error('Vercel Blob upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload image to Vercel CDN' },
      { status: 500 }
    );
  }
}