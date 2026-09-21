// app/admin/page.tsx (Option 1)
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ImageUploader from '@/components/ImageUploader';
import type { Product } from '@/types/product';

const INITIAL_FORM = {
  id: '',
  name: '',
  japaneseName: '',
  style: 'Arita-yaki',
  origin: 'Saga Prefecture, Japan',
  price: '',
  stock: '1',
  isOneOfAKind: false,
  description: '',
  height: '8.5 cm',
  diameter: '12.0 cm',
  weight: '320 g',
  capacity: '350 ml',
  careInstructions: 'Hand-wash advised\nAvoid microwave',
  images: [] as string[],
};

export default function AdminSplitDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  const fetchCatalog = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const selectForEdit = (p: Product) => {
    setIsEditing(true);
    setFormData({
      id: p.id,
      name: p.name,
      japaneseName: p.japaneseName || '',
      style: p.style,
      origin: p.origin,
      price: (p.price / 100).toFixed(2),
      stock: (p.stock ?? 1).toString(),
      isOneOfAKind: Boolean(p.isOneOfAKind),
      description: p.description || '',
      height: p.dimensions?.height || '',
      diameter: p.dimensions?.diameter || '',
      weight: p.dimensions?.weight || '',
      capacity: p.dimensions?.capacity || '',
      careInstructions: (p.careInstructions || []).join('\n'),
      images: p.images || [],
    });
  };

  const resetToCreate = () => {
    setIsEditing(false);
    setFormData(INITIAL_FORM);
  };

  const handleStockAdjust = async (productId: string, newStock: number) => {
    if (newStock < 0) return;
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
        if (formData.id === productId) {
          setFormData((prev) => ({ ...prev, stock: newStock.toString() }));
        }
      }
    } catch (err) {
      console.error('Stock adjust failed:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock, 10),
      };

      const res = await fetch('/api/products', {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchCatalog();
        if (!isEditing) resetToCreate();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.style.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 font-sans">
      {/* Top Bar */}
      <header className="border-b border-stone-200/80 bg-white/70 backdrop-blur-xs sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="font-serif text-xl tracking-tight">Komorebi Kiln Studio</h1>
          <span className="text-[10px] tracking-widest uppercase bg-stone-100 text-stone-600 px-2 py-0.5">
            Admin CMS
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={resetToCreate}
            className="text-xs uppercase tracking-widest bg-stone-900 text-white px-4 py-2 hover:bg-stone-800 transition"
          >
            + New Piece
          </button>
          <Link
            href="/admin/orders"
            className="text-xs uppercase tracking-widest border border-stone-300 px-4 py-2 hover:bg-stone-100 transition"
          >
            Orders
          </Link>
          <Link
            href="/"
            className="text-xs uppercase tracking-widest border border-stone-300 px-4 py-2 hover:bg-stone-100 transition"
          >
            Storefront
          </Link>
        </div>
      </header>

      {/* Main Grid */}
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-65px)]">
        {/* Left Column: Inventory List */}
        <section className="lg:col-span-5 border-r border-stone-200 p-6 flex flex-col">
          <div className="flex items-center justify-between gap-4 mb-4">
            <input
              type="text"
              placeholder="Filter by name or style..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs w-full border border-stone-200 bg-white px-3 py-2 outline-hidden focus:border-stone-900"
            />
            <span className="text-xs font-mono text-stone-400 shrink-0">
              {filtered.length} works
            </span>
          </div>

          <div className="divide-y divide-stone-100 overflow-y-auto max-h-[calc(100vh-160px)] pr-2">
            {loading ? (
              <p className="text-xs text-stone-400 italic py-10 text-center">Loading catalog...</p>
            ) : (
              filtered.map((p) => {
                const stock = p.stock ?? 1;
                const isSelected = formData.id === p.id && isEditing;

                return (
                  <div
                    key={p.id}
                    className={`py-3 px-2 flex items-center justify-between gap-3 transition cursor-pointer hover:bg-stone-100/50 ${
                      isSelected ? 'bg-stone-100 border-l-2 border-stone-900' : ''
                    }`}
                    onClick={() => selectForEdit(p)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-12 h-12 bg-stone-100 shrink-0 border border-stone-200">
                        {p.images?.[0] && (
                          <Image src={p.images[0]} alt={p.name} fill className="object-cover" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-stone-900 truncate">{p.name}</p>
                        <p className="text-[10px] text-stone-400 uppercase tracking-wider">
                          {p.style} • £{(p.price / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Inline Stock Controls */}
                    <div
                      className="flex items-center gap-2 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {stock <= 0 && (
                        <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-xs">
                          Sold Out
                        </span>
                      )}
                      <div className="flex items-center border border-stone-200 bg-white">
                        <button
                          onClick={() => handleStockAdjust(p.id, Math.max(0, stock - 1))}
                          className="px-2 py-1 text-xs hover:bg-stone-100 text-stone-600"
                        >
                          -
                        </button>
                        <span className={`w-8 text-center text-xs font-mono ${stock <= 0 ? 'text-red-600 font-bold' : ''}`}>
                          {stock}
                        </span>
                        <button
                          onClick={() => handleStockAdjust(p.id, stock + 1)}
                          className="px-2 py-1 text-xs hover:bg-stone-100 text-stone-600"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Right Column: Dynamic Form (Create or Edit) */}
        <section className="lg:col-span-7 p-8 bg-white overflow-y-auto max-h-[calc(100vh-65px)]">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-6">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-stone-400">
                {isEditing ? `Modifying Item #${formData.id}` : 'Catalog Addition'}
              </span>
              <h2 className="font-serif text-2xl font-light">
                {isEditing ? `Edit: ${formData.name || 'Untitled Piece'}` : 'New Handcrafted Work'}
              </h2>
            </div>
            {isEditing && (
              <button
                type="button"
                onClick={resetToCreate}
                className="text-xs text-stone-500 hover:text-stone-900 underline underline-offset-4"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block uppercase tracking-wider text-stone-500 mb-1">Title (English)</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-stone-200 p-2.5 text-xs outline-hidden focus:border-stone-900"
                />
              </div>
              <div>
                <label className="block uppercase tracking-wider text-stone-500 mb-1">Kanji / Japanese</label>
                <input
                  type="text"
                  value={formData.japaneseName}
                  onChange={(e) => setFormData({ ...formData, japaneseName: e.target.value })}
                  className="w-full border border-stone-200 p-2.5 text-xs outline-hidden focus:border-stone-900 font-serif"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block uppercase tracking-wider text-stone-500 mb-1">Price (GBP)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full border border-stone-200 p-2.5 text-xs outline-hidden focus:border-stone-900"
                />
              </div>
              <div>
                <label className="block uppercase tracking-wider text-stone-500 mb-1">Inventory Count</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="w-full border border-stone-200 p-2.5 text-xs outline-hidden focus:border-stone-900"
                />
              </div>
              <div>
                <label className="block uppercase tracking-wider text-stone-500 mb-1">Tradition</label>
                <select
                  value={formData.style}
                  onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                  className="w-full border border-stone-200 p-2.5 text-xs outline-hidden focus:border-stone-900 bg-white"
                >
                  <option value="Arita-yaki">Arita-yaki</option>
                  <option value="Hasami-yaki">Hasami-yaki</option>
                  <option value="Mino-yaki">Mino-yaki</option>
                  <option value="Bizen-yaki">Bizen-yaki</option>
                  <option value="Kutani-yaki">Kutani-yaki</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block uppercase tracking-wider text-stone-500 mb-1">Origin Kiln / Prefecture</label>
              <input
                type="text"
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                className="w-full border border-stone-200 p-2.5 text-xs outline-hidden focus:border-stone-900"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block uppercase tracking-wider text-stone-500 mb-1">Height</label>
                <input
                  type="text"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  className="w-full border border-stone-200 p-2.5 text-xs outline-hidden focus:border-stone-900"
                />
              </div>
              <div>
                <label className="block uppercase tracking-wider text-stone-500 mb-1">Diameter</label>
                <input
                  type="text"
                  value={formData.diameter}
                  onChange={(e) => setFormData({ ...formData, diameter: e.target.value })}
                  className="w-full border border-stone-200 p-2.5 text-xs outline-hidden focus:border-stone-900"
                />
              </div>
              <div>
                <label className="block uppercase tracking-wider text-stone-500 mb-1">Weight</label>
                <input
                  type="text"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="w-full border border-stone-200 p-2.5 text-xs outline-hidden focus:border-stone-900"
                />
              </div>
              <div>
                <label className="block uppercase tracking-wider text-stone-500 mb-1">Capacity</label>
                <input
                  type="text"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  className="w-full border border-stone-200 p-2.5 text-xs outline-hidden focus:border-stone-900"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isOneOfAKind"
                checked={formData.isOneOfAKind}
                onChange={(e) => setFormData({ ...formData, isOneOfAKind: e.target.checked })}
                className="h-4 w-4 rounded-xs border-stone-300 text-stone-900 focus:ring-stone-900"
              />
              <label htmlFor="isOneOfAKind" className="uppercase tracking-wider text-stone-600">
                Unique collector item (One-of-a-Kind)
              </label>
            </div>

            <div>
              <label className="block uppercase tracking-wider text-stone-500 mb-1">Photographs</label>
              <ImageUploader onImageUploaded={(url) => setFormData((prev) => ({ ...prev, images: [...prev.images, url] }))} />
              {formData.images.length > 0 && (
                <div className="flex gap-3 mt-3 overflow-x-auto pb-2">
                  {formData.images.map((url, idx) => (
                    <div key={idx} className="relative w-16 h-16 border border-stone-200 shrink-0 group">
                      <Image src={url} alt="Uploaded" fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            images: prev.images.filter((_, i) => i !== idx),
                          }))
                        }
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block uppercase tracking-wider text-stone-500 mb-1">Narrative / Description</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border border-stone-200 p-2.5 text-xs outline-hidden focus:border-stone-900"
              />
            </div>

            <div>
              <label className="block uppercase tracking-wider text-stone-500 mb-1">Care Instructions (one per line)</label>
              <textarea
                rows={3}
                value={formData.careInstructions}
                onChange={(e) => setFormData({ ...formData, careInstructions: e.target.value })}
                className="w-full border border-stone-200 p-2.5 text-xs outline-hidden focus:border-stone-900"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-stone-900 text-white uppercase tracking-[0.2em] py-3 hover:bg-stone-800 transition disabled:opacity-50"
            >
              {submitting ? 'Saving...' : isEditing ? 'Update Ceramic Piece' : 'Publish to Storefront'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}