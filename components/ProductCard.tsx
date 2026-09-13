'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/types/product';
import { useCartStore } from '@/stores/useCartStore';

export default function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.images[0],
      origin: product.origin,
    });
  };

  return (
    <article className="group flex flex-col font-serif">
      <Link href={`/products/${product.slug}`} className="block relative aspect-4/5 w-full overflow-hidden bg-stone-100">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {product.isOneOfAKind && (
          <span className="absolute top-3 left-3 bg-[#FAF8F5]/90 backdrop-blur-xs text-[10px] uppercase tracking-[0.2em] px-2 py-1 font-sans text-stone-700">
            One of a Kind
          </span>
        )}

        <button
          onClick={handleQuickAdd}
          aria-label={`Add ${product.name} to cart`}
          className="absolute bottom-3 right-3 p-2.5 bg-[#FAF8F5]/90 text-stone-900 backdrop-blur-xs transition-all duration-300 opacity-0 group-hover:opacity-100 hover:bg-stone-900 hover:text-stone-100 shadow-xs"
        >
          <svg className="w-4 h-4 stroke-[1.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </Link>

      <div className="mt-4 flex flex-col space-y-1">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-stone-400 font-sans">
          <span>{product.style}</span>
          <span className="font-serif italic capitalize text-stone-400">{product.japaneseName}</span>
        </div>

        <h3 className="text-base font-light text-stone-900 tracking-wide">
          <Link href={`/products/${product.slug}`}>
            {product.name}
          </Link>
        </h3>

        <p className="text-xs font-sans text-stone-600">
          ${(product.price / 100).toFixed(2)}
        </p>
      </div>
    </article>
  );
}