'use client';

import { useState, useEffect } from 'react';
import ProductCard from '@/components/ProductCard';
import type { Product } from '@/types/product';

const CATEGORIES = ['All', 'Arita-yaki', 'Hasami-yaki', 'Mino-yaki', 'Bizen-yaki', 'Kutani-yaki'] as const;

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load products:', err);
        setLoading(false);
      });
  }, []);

  const filteredProducts = activeCategory === 'All'
    ? products
    : products.filter((item) => item.style === activeCategory);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900">
      <section className="pt-20 pb-16 px-6 sm:px-12 max-w-6xl mx-auto border-b border-stone-200/60">
        <span className="text-xs uppercase tracking-[0.3em] text-stone-400 font-sans">
          Permanent Collection
        </span>
        <h1 className="mt-3 font-serif text-4xl sm:text-5xl font-light tracking-tight text-stone-900 max-w-xl leading-tight">
          Handcrafted Japanese Porcelain & Ceramic Vessels
        </h1>
        <p className="mt-4 font-sans text-sm text-stone-600 max-w-lg font-light leading-relaxed">
          Curated tea ware, functional serving dishes, and one-of-a-kind kiln treasures sourced directly from heritage pottery regions across Japan.
        </p>
      </section>

      <nav aria-label="Pottery styles filter" className="max-w-6xl mx-auto px-6 sm:px-12 pt-8 pb-4">
        <div className="flex items-center space-x-6 overflow-x-auto no-scrollbar border-b border-stone-200/40 pb-4 text-xs font-sans uppercase tracking-[0.2em]">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap transition-colors duration-200 ${
                activeCategory === cat
                  ? 'text-stone-900 border-b border-stone-900 pb-1'
                  : 'text-stone-400 hover:text-stone-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 sm:px-12 py-10">
        {loading ? (
          <div className="py-24 text-center font-serif text-sm italic text-stone-400">
            Unpacking kiln collection...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-14">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}