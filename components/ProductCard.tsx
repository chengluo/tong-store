// components/ProductCard.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/stores/useCartStore';
import type { Product } from '@/types/product';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.openCart);

  const isOutOfStock = product.stock !== undefined && product.stock <= 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isOutOfStock) return;

    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.images[0],
    });
    openCart();
  };

  return (
    <div className="group flex flex-col justify-between">
      <Link href={`/products/${product.slug}`} className="block relative overflow-hidden bg-stone-100 aspect-square">
        {product.images[0] && (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={`object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${
              isOutOfStock ? 'grayscale opacity-60' : ''
            }`}
          />
        )}

        {/* Status Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {isOutOfStock ? (
            <span className="bg-stone-900 text-stone-100 text-[10px] tracking-[0.2em] uppercase px-2.5 py-1 font-mono">
              Sold Out
            </span>
          ) : product.isOneOfAKind ? (
            <span className="bg-stone-100/90 backdrop-blur-xs text-stone-800 text-[10px] tracking-[0.2em] uppercase px-2 py-0.5 border border-stone-200">
              One of a Kind
            </span>
          ) : null}
        </div>

        {/* Quick-add button */}
        {!isOutOfStock && (
          <button
            onClick={handleQuickAdd}
            aria-label={`Add ${product.name} to cart`}
            className="absolute bottom-3 right-3 w-9 h-9 bg-white/95 backdrop-blur-xs text-stone-900 rounded-full flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-stone-900 hover:text-white shadow-xs"
          >
            <span className="text-lg leading-none mb-0.5">+</span>
          </button>
        )}
      </Link>

      <div className="mt-3 flex items-start justify-between text-xs">
        <div>
          <Link href={`/products/${product.slug}`} className="hover:underline">
            <h3 className="font-serif text-sm text-stone-900">{product.name}</h3>
          </Link>
          <p className="text-stone-400 mt-0.5 font-light">{product.style}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-stone-800">${(product.price / 100).toFixed(2)}</p>
          {isOutOfStock && (
            <p className="text-[10px] uppercase tracking-wider text-stone-400 mt-0.5">Unavailable</p>
          )}
        </div>
      </div>
    </div>
  );
}