// components/Navbar.tsx
'use client';

import { useCartStore } from '@/stores/useCartStore';
import { ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const openCart = useCartStore((state) => state.openCart);
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-stone-200/60 transition-colors">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="font-serif text-lg tracking-[0.2em] uppercase text-stone-900 font-light"
        >
          Tong's Store
        </Link>

        <button
          onClick={openCart}
          className="flex items-center space-x-2 text-stone-700 hover:text-stone-900 transition-colors"
          aria-label="Open Cart"
        >
          <span className="text-xs uppercase tracking-widest font-sans hidden sm:inline-block">
            Selection
          </span>
          <div className="relative">
            <ShoppingBag className="w-5 h-5 stroke-[1.25]" />
            {mounted && getTotalItems() > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-stone-900 text-stone-50 text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-mono">
                {getTotalItems()}
              </span>
            )}
          </div>
        </button>
      </div>
    </header>
  );
}