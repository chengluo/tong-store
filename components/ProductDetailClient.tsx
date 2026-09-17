// components/ProductDetailClient.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useCartStore } from '@/stores/useCartStore';
import type { Product } from '@/types/product';

export default function ProductDetailClient({ product }: { product: Product }) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.openCart);

  const isOutOfStock = product.stock !== undefined && product.stock <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.images[selectedImage] || product.images[0],
      quantity: 1,
    });
    openCart();
  };

  const handleDirectCheckout = async () => {
    if (isOutOfStock) return;
    setIsCheckingOut(true);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [
            {
              id: product.id,
              name: product.name,
              price: product.price,
              quantity: 1,
            },
          ],
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Checkout unavailable');
      }
    } catch (err) {
      console.error(err);
      alert('Unable to initiate checkout');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-12 py-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
        {/* Images Gallery */}
        <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4">
          <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-visible">
            {product.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={`relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 border transition ${
                  selectedImage === i ? 'border-stone-900' : 'border-stone-200 hover:border-stone-400'
                }`}
              >
                <Image src={img} alt={`${product.name} angle ${i + 1}`} fill className="object-cover" />
              </button>
            ))}
          </div>

          <div className="relative w-full aspect-square bg-stone-100 border border-stone-200/60 overflow-hidden">
            <Image
              src={product.images[selectedImage] || product.images[0]}
              alt={product.name}
              fill
              priority
              className={`object-cover transition-opacity duration-300 ${isOutOfStock ? 'grayscale opacity-75' : ''}`}
            />
            {isOutOfStock && (
              <div className="absolute inset-0 bg-stone-900/15 flex items-center justify-center">
                <span className="bg-stone-900 text-white text-xs tracking-[0.25em] uppercase font-mono px-4 py-2">
                  Sold Out
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Product Details & Purchase Actions */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xs uppercase tracking-[0.2em] text-stone-400">{product.style}</span>
              {product.japaneseName && (
                <span className="text-xs font-serif text-stone-500 font-light">{product.japaneseName}</span>
              )}
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl text-stone-900 font-light mt-2 mb-3">
              {product.name}
            </h1>

            <div className="flex items-baseline gap-4 mb-6">
              <span className="font-mono text-xl text-stone-900">${(product.price / 100).toFixed(2)}</span>
              {isOutOfStock ? (
                <span className="text-xs uppercase tracking-widest text-red-600 font-medium">Currently Sold Out</span>
              ) : product.stock !== undefined && product.stock <= 3 ? (
                <span className="text-xs uppercase tracking-widest text-amber-700">Only {product.stock} available</span>
              ) : null}
            </div>

            <p className="text-stone-600 text-sm leading-relaxed mb-8 font-light">
              {product.description}
            </p>

            {/* Specifications */}
            <div className="border-t border-b border-stone-200/80 py-4 mb-8 text-xs grid grid-cols-2 gap-y-2">
              <div><span className="text-stone-400">Origin:</span> {product.origin}</div>
              <div><span className="text-stone-400">Height:</span> {product.dimensions.height}</div>
              <div><span className="text-stone-400">Diameter:</span> {product.dimensions.diameter}</div>
              <div><span className="text-stone-400">Weight:</span> {product.dimensions.weight}</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {isOutOfStock ? (
              <button
                disabled
                className="w-full bg-stone-200 text-stone-400 text-xs tracking-[0.25em] uppercase py-4 font-mono cursor-not-allowed"
              >
                Piece Out of Stock
              </button>
            ) : (
              <>
                <button
                  onClick={handleAddToCart}
                  className="w-full border border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-white text-xs tracking-[0.25em] uppercase py-3.5 transition"
                >
                  Add to Selection
                </button>
                <button
                  onClick={handleDirectCheckout}
                  disabled={isCheckingOut}
                  className="w-full bg-stone-900 text-white hover:bg-stone-800 text-xs tracking-[0.25em] uppercase py-3.5 transition disabled:opacity-50"
                >
                  {isCheckingOut ? 'Opening Checkout...' : 'Direct Checkout'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}