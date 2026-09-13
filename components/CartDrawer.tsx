'use client';

import { useEffect, useState } from 'react';
import { useCartStore } from '@/stores/useCartStore';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';

export default function CartDrawer() {
  const {
    isOpen,
    closeCart,
    items,
    removeItem,
    updateQuantity,
    getSubtotal,
  } = useCartStore();

  const [isLoading, setIsLoading] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setIsLoading(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            id: item.id,
            quantity: item.quantity,
          })),
        }),
      });

      const { url, error } = await response.json();
      if (error) throw new Error(error);
      if (url) window.location.href = url;
    } catch (err: any) {
      console.error('Checkout error:', err);
      alert('Unable to proceed to checkout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasMounted) return null;

  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-300 ${
        isOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none'
      }`}
      aria-labelledby="cart-heading"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={closeCart}
        className={`fixed inset-0 bg-stone-900/40 backdrop-blur-xs transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div
          className={`w-screen max-w-md bg-[#FAF8F5] text-stone-900 shadow-2xl flex flex-col transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between px-6 py-6 border-b border-stone-200/80">
            <h2
              id="cart-heading"
              className="font-serif text-lg tracking-wider uppercase font-light text-stone-900"
            >
              Curated Selection
            </h2>
            <button
              onClick={closeCart}
              className="p-1.5 text-stone-400 hover:text-stone-900 transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5 stroke-[1.5]" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-stone-400 space-y-4">
                <ShoppingBag className="w-10 h-10 stroke-[1]" />
                <p className="font-serif text-sm italic">Your bag is presently empty.</p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 pb-6 border-b border-stone-200/60 last:border-b-0"
                >
                  <div className="relative w-20 h-24 bg-stone-100 shrink-0 overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover object-center"
                    />
                  </div>

                  <div className="flex flex-col flex-1 justify-between font-sans">
                    <div className="space-y-1">
                      {item.origin && (
                        <p className="text-[10px] tracking-widest uppercase text-stone-400">
                          {item.origin}
                        </p>
                      )}
                      <h3 className="font-serif text-sm font-normal text-stone-900 leading-snug">
                        {item.name}
                      </h3>
                      <p className="text-xs text-stone-600">
                        ${((item.price * item.quantity) / 100).toFixed(2)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center border border-stone-300">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-2 py-1 text-stone-500 hover:text-stone-900 hover:bg-stone-200/40"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-mono">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2 py-1 text-stone-500 hover:text-stone-900 hover:bg-stone-200/40"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-[11px] text-stone-400 hover:text-rose-800 tracking-wider uppercase underline-offset-4 hover:underline transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {items.length > 0 && (
            <div className="border-t border-stone-200/80 px-6 py-6 space-y-4 bg-stone-50/50">
              <div className="flex justify-between items-baseline font-serif">
                <span className="text-xs uppercase tracking-widest text-stone-500 font-sans">
                  Estimated Subtotal
                </span>
                <span className="text-lg font-normal text-stone-900">
                  ${(getSubtotal() / 100).toFixed(2)}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 font-sans leading-relaxed">
                Taxes and insured ceramic packaging calculated during Stripe checkout.
              </p>
              <button
                onClick={handleCheckout}
                disabled={isLoading}
                className="w-full py-4 bg-stone-900 text-stone-100 font-sans text-xs uppercase tracking-[0.2em] transition-colors duration-300 hover:bg-stone-800 disabled:opacity-50"
              >
                {isLoading ? 'Preparing Order...' : 'Proceed to Checkout'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}