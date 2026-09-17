// components/CartDrawer.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useCartStore } from '@/stores/useCartStore';

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Displays exact stock message (e.g. "Piece is currently sold out")
        setErrorMessage(data.error || 'Unable to proceed to checkout.');
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Network error while processing checkout.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-xs transition-opacity" onClick={closeCart} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FAF8F5] border-l border-stone-200 flex flex-col justify-between p-6 sm:p-8">
          <div>
            <div className="flex items-center justify-between border-b border-stone-200 pb-4 mb-6">
              <h2 className="font-serif text-lg tracking-wide text-stone-900">Your Selection</h2>
              <button onClick={closeCart} className="text-xs uppercase tracking-widest text-stone-400 hover:text-stone-900">
                Close
              </button>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-mono">
                {errorMessage}
              </div>
            )}

            {items.length === 0 ? (
              <p className="text-stone-400 text-xs font-serif italic py-12 text-center">Your bag is empty.</p>
            ) : (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 border-b border-stone-100 pb-4">
                    <div className="relative w-16 h-16 shrink-0 bg-stone-100 border border-stone-200">
                      {item.imageUrl && <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-serif text-xs text-stone-900 truncate">{item.name}</h4>
                      <p className="font-mono text-xs text-stone-500 mt-1">${(item.price / 100).toFixed(2)}</p>
                      
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center border border-stone-200 bg-white text-xs">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="px-2 py-0.5 hover:bg-stone-100"
                          >
                            -
                          </button>
                          <span className="px-2 font-mono">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-2 py-0.5 hover:bg-stone-100"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-[10px] uppercase tracking-wider text-stone-400 hover:text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="border-t border-stone-200 pt-6">
              <div className="flex justify-between text-xs font-mono mb-4">
                <span>Subtotal</span>
                <span>${(total / 100).toFixed(2)}</span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full bg-stone-900 text-white text-xs tracking-[0.2em] uppercase py-3.5 hover:bg-stone-800 transition disabled:opacity-50"
              >
                {loading ? 'Validating Stock...' : 'Proceed to Stripe Checkout'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}