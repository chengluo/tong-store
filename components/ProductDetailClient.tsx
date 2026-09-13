'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/types/product';
import { useCartStore } from '@/stores/useCartStore';

export default function ProductDetailClient({ product }: { product: Product }) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isDirectCheckingOut, setIsDirectCheckingOut] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.images[0],
      origin: product.origin,
    });
  };

  const handleBuyNow = async () => {
    setIsDirectCheckingOut(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ id: product.id, quantity: 1 }],
        }),
      });

      const { url, error } = await res.json();
      if (error) throw new Error(error);
      if (url) window.location.href = url;
    } catch (err) {
      console.error(err);
      alert('Unable to initiate checkout. Please try again.');
    } finally {
      setIsDirectCheckingOut(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-12 py-12 lg:py-16 font-serif">
      {/* Breadcrumb Navigation */}
      <nav className="text-xs uppercase tracking-[0.2em] text-stone-400 font-sans mb-10">
        <Link href="/" className="hover:text-stone-900 transition-colors">
          Collection
        </Link>
        <span className="mx-2">/</span>
        <span>{product.style}</span>
        <span className="mx-2">/</span>
        <span className="text-stone-700">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        {/* Left Column: Visual Gallery */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-4/5 w-full bg-stone-100 overflow-hidden shadow-xs">
            <Image
              src={product.images[selectedImageIndex]}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover object-center transition-all duration-500"
            />
            {product.isOneOfAKind && (
              <span className="absolute top-4 left-4 bg-[#FAF8F5]/90 backdrop-blur-xs text-[10px] uppercase tracking-[0.25em] px-3 py-1 font-sans text-stone-800">
                One of a Kind
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex space-x-3 pt-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative w-20 aspect-square overflow-hidden border transition-all ${
                    selectedImageIndex === idx
                      ? 'border-stone-900 opacity-100'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                  aria-label={`Select angle ${idx + 1}`}
                >
                  <Image
                    src={img}
                    alt={`${product.name} angle ${idx + 1}`}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Piece Narrative & Specifications */}
        <div className="lg:col-span-5 flex flex-col space-y-8 font-sans">
          <header className="space-y-2 border-b border-stone-200/80 pb-6">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-stone-400">
              <span>{product.origin}</span>
              <span className="font-serif italic capitalize text-stone-500 text-sm">
                {product.japaneseName}
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-light text-stone-900 tracking-wide">
              {product.name}
            </h1>
            <p className="text-xl font-light text-stone-800 pt-2 font-mono">
              ${(product.price / 100).toFixed(2)}
            </p>
          </header>

          <p className="text-sm font-light text-stone-700 leading-relaxed font-serif text-base">
            {product.description}
          </p>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleAddToCart}
              className="w-full py-4 bg-stone-900 text-stone-100 text-xs uppercase tracking-[0.2em] transition-colors hover:bg-stone-800"
            >
              Add to Selection
            </button>
            <button
              onClick={handleBuyNow}
              disabled={isDirectCheckingOut}
              className="w-full py-3.5 border border-stone-900 text-stone-900 text-xs uppercase tracking-[0.2em] transition-colors hover:bg-stone-100 disabled:opacity-50"
            >
              {isDirectCheckingOut ? 'Opening Checkout...' : 'Direct Checkout'}
            </button>
          </div>

          {/* Dimensions & Specifications */}
          <section className="border-t border-stone-200/80 pt-6 space-y-4">
            <h2 className="text-xs uppercase tracking-[0.2em] text-stone-500">
              Specifications
            </h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <div>
                <dt className="text-stone-400 uppercase tracking-wider">Height</dt>
                <dd className="text-stone-800 font-mono mt-0.5">{product.dimensions.height}</dd>
              </div>
              <div>
                <dt className="text-stone-400 uppercase tracking-wider">Diameter</dt>
                <dd className="text-stone-800 font-mono mt-0.5">{product.dimensions.diameter}</dd>
              </div>
              <div>
                <dt className="text-stone-400 uppercase tracking-wider">Weight</dt>
                <dd className="text-stone-800 font-mono mt-0.5">{product.dimensions.weight}</dd>
              </div>
              {product.dimensions.capacity && (
                <div>
                  <dt className="text-stone-400 uppercase tracking-wider">Capacity</dt>
                  <dd className="text-stone-800 font-mono mt-0.5">{product.dimensions.capacity}</dd>
                </div>
              )}
            </dl>
          </section>

          {/* Care Guidelines */}
          <section className="border-t border-stone-200/80 pt-6 space-y-3 text-xs text-stone-600 font-light">
            <h2 className="uppercase tracking-[0.2em] text-stone-500 font-sans">
              Care & Preservations
            </h2>
            <ul className="space-y-1.5 list-disc list-inside">
              {product.careInstructions.map((instruction, index) => (
                <li key={index}>{instruction}</li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}