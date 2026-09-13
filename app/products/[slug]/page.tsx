import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getProducts, getProductBySlug } from '@/data/products';
import ProductDetailClient from '@/components/ProductDetailClient';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({
    slug: p.slug,
  }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: 'Piece Not Found — Komorebi Kiln' };
  }

  return {
    title: `${product.name} (${product.japaneseName}) — Komorebi Kiln`,
    description: product.description,
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900">
      <ProductDetailClient product={product} />
    </div>
  );
}