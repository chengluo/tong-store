// app/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ImageUploader from '@/components/ImageUploader';
import type { Product } from '@/types/product';

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [japaneseName, setJapaneseName] = useState('');
  const [style, setStyle] = useState('Arita-yaki');
  const [origin, setOrigin] = useState('Saga Prefecture, Japan');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('1');
  const [isOneOfAKind, setIsOneOfAKind] = useState(false);
  const [description, setDescription] = useState('');
  const [height, setHeight] = useState('8.5 cm');
  const [diameter, setDiameter] = useState('12.0 cm');
  const [weight, setWeight] = useState('320 g');
  const [capacity, setCapacity] = useState('350 ml');
  const [careInstructions, setCareInstructions] = useState('Hand wash recommended\nDo not microwave');
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleStockUpdate = async (productId: string, newStock: number) => {
    if (newStock < 0) return;
    setUpdatingId(productId);

    try {
      const res = await fetch('/api/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId, stock: newStock }),
      });

      if (res.ok) {
        setProducts((prev) =>
          prev.map((item) => (item.id === productId ? { ...item, stock: newStock } : item))
        );
      } else {
        alert('Failed to update stock');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || images.length === 0) {
      alert('Please fill out name, price, and provide at least one photo.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          japaneseName,
          style,
          origin,
          price,
          stock: parseInt(stock, 10) || 0,
          isOneOfAKind,
          description,
          height,
          diameter,
          weight,
          capacity,
          careInstructions,
          images,
        }),
      });

      if (res.ok) {
        // Reset form
        setName('');
        setJapaneseName('');
        setPrice('');
        setStock('1');
        setDescription('');
        setImages([]);
        fetchProducts();
      } else {
        const error = await res.json();
        alert(`Error creating piece: ${error.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error creating piece.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 py-12 px-6 sm:px-12 max-w-7xl mx-auto font-sans">
      <header className="border-b border-stone-200/80 pb-6 mb-10 flex items-center justify-between">
        <div>
          <span className="text-xs tracking-[0.25em] uppercase text-stone-400">Inventory & Studio</span>
          <h1 className="font-serif text-3xl font-light mt-1">Komorebi Kiln Management</h1>
        </div>
        <Link href="/" className="text-xs uppercase tracking-widest border border-stone-300 px-4 py-2 hover:bg-stone-900 hover:text-white transition">
          View Storefront
        </Link>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Creation Form */}
        <div className="lg:col-span-7 bg-white p-8 border border-stone-200/80 shadow-xs">
          <h2 className="font-serif text-xl font-light mb-6 border-b border-stone-100 pb-3">New Kiln Work</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">Title (English)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tenmoku Glaze Chawan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-stone-200 p-2.5 outline-hidden focus:border-stone-900"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">Japanese Name (Kanji)</label>
                <input
                  type="text"
                  placeholder="e.g. 天目茶碗"
                  value={japaneseName}
                  onChange={(e) => setJapaneseName(e.target.value)}
                  className="w-full border border-stone-200 p-2.5 outline-hidden focus:border-stone-900 font-serif"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">Price (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="85.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full border border-stone-200 p-2.5 outline-hidden focus:border-stone-900"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">Initial Stock</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full border border-stone-200 p-2.5 outline-hidden focus:border-stone-900"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">Pottery Tradition</label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full border border-stone-200 p-2.5 outline-hidden focus:border-stone-900 bg-white"
                >
                  <option value="Arita-yaki">Arita-yaki (有田焼)</option>
                  <option value="Hasami-yaki">Hasami-yaki (波佐見焼)</option>
                  <option value="Mino-yaki">Mino-yaki (美濃焼)</option>
                  <option value="Bizen-yaki">Bizen-yaki (備前焼)</option>
                  <option value="Kutani-yaki">Kutani-yaki (九谷焼)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isOneOfAKind"
                checked={isOneOfAKind}
                onChange={(e) => setIsOneOfAKind(e.target.checked)}
                className="h-4 w-4 rounded-xs border-stone-300 text-stone-900 focus:ring-stone-900"
              />
              <label htmlFor="isOneOfAKind" className="text-xs tracking-wider uppercase text-stone-600">
                Unique collector item (One-of-a-Kind)
              </label>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">Photographs</label>
              <ImageUploader onImageUploaded={(url: string) => setImages((prev) => [...prev, url])}/>
              {images.length > 0 && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                  {images.map((url, i) => (
                    <div key={i} className="relative w-16 h-16 shrink-0 border border-stone-200">
                      <Image src={url} alt="Thumbnail" fill className="object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">Description</label>
              <textarea
                rows={3}
                placeholder="Narrative regarding firing technique, clay origin, and form..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-stone-200 p-2.5 outline-hidden focus:border-stone-900"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-stone-900 text-white text-xs uppercase tracking-[0.2em] py-3.5 hover:bg-stone-800 transition disabled:opacity-50"
            >
              {submitting ? 'Registering Work...' : 'Publish to Catalog'}
            </button>
          </form>
        </div>

        {/* Stock & Active Inventory Control */}
        <div className="lg:col-span-5 bg-white p-8 border border-stone-200/80 shadow-xs flex flex-col h-fit">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-6">
            <h2 className="font-serif text-xl font-light">Inventory Levels</h2>
            <span className="text-xs font-mono text-stone-400">{products.length} Items</span>
          </div>

          {loading ? (
            <p className="text-xs text-stone-400 italic py-8 text-center font-serif">Checking kiln levels...</p>
          ) : (
            <div className="space-y-4 max-h-[750px] overflow-y-auto pr-1">
              {products.map((p) => {
                const currentStock = p.stock !== undefined ? p.stock : 1;
                const isOutOfStock = currentStock <= 0;

                return (
                  <div key={p.id} className="p-3 border border-stone-100 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-12 h-12 shrink-0 bg-stone-50 border border-stone-200 overflow-hidden">
                        {p.images[0] && (
                          <Image src={p.images[0]} alt={p.name} fill className="object-cover" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link href={`/products/${p.slug}`} className="text-xs font-medium text-stone-900 hover:underline truncate block">
                          {p.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-sans text-stone-400">${(p.price / 100).toFixed(2)}</span>
                          <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.2 rounded-xs ${
                            isOutOfStock ? 'bg-red-50 text-red-600' : 'bg-stone-100 text-stone-600'
                          }`}>
                            {isOutOfStock ? 'Sold Out' : `${currentStock} in stock`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stock Quick-Adjuster */}
                    <div className="flex items-center border border-stone-200 bg-stone-50">
                      <button
                        onClick={() => handleStockUpdate(p.id, Math.max(0, currentStock - 1))}
                        disabled={updatingId === p.id || currentStock <= 0}
                        className="px-2 py-1 text-xs hover:bg-stone-200 text-stone-600 transition disabled:opacity-30"
                        title="Decrease stock"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={currentStock}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val)) handleStockUpdate(p.id, val);
                        }}
                        disabled={updatingId === p.id}
                        className="w-10 text-center text-xs bg-transparent border-none focus:outline-hidden font-mono"
                      />
                      <button
                        onClick={() => handleStockUpdate(p.id, currentStock + 1)}
                        disabled={updatingId === p.id}
                        className="px-2 py-1 text-xs hover:bg-stone-200 text-stone-600 transition disabled:opacity-30"
                        title="Increase stock"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}