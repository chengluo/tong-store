'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ImageUploader from '@/components/ImageUploader';
import Link from 'next/link';

const STYLES = ['Arita-yaki', 'Hasami-yaki', 'Mino-yaki', 'Bizen-yaki', 'Kutani-yaki'];

export default function AdminProductPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    japaneseName: '',
    style: 'Arita-yaki',
    origin: '',
    priceDollars: '',
    description: '',
    height: '',
    diameter: '',
    weight: '',
    capacity: '',
    careInstructions: 'Hand-wash recommended\nDo not microwave\nAllow to dry thoroughly',
    isOneOfAKind: false,
  });

  const handleImageUploaded = (url: string) => {
    setUploadedImages((prev) => [...prev, url]);
  };

  const removeImage = (indexToRemove: number) => {
    setUploadedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (uploadedImages.length === 0) {
      alert('Please upload at least one image of the ceramic piece.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.priceDollars),
          images: uploadedImages,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create piece');

      alert(`"${data.product.name}" created successfully!`);
      router.push(`/products/${data.product.slug}`);
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Failed to submit product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 py-16 px-6 sm:px-12 font-serif">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="border-b border-stone-200/80 pb-6 flex justify-between items-end">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] text-stone-400 font-sans block">
              Studio Inventory
            </span>
            <h1 className="text-3xl font-light tracking-wide text-stone-900 mt-1">
              Catalog New Ceramic Work
            </h1>
          </div>
          <Link
            href="/"
            className="text-xs font-sans uppercase tracking-[0.15em] text-stone-500 hover:text-stone-900 transition-colors"
          >
            ← View Storefront
          </Link>
        </header>

        <form onSubmit={handleSubmit} className="space-y-10 font-sans">
          {/* 1. Image Upload Section */}
          <section className="bg-white/50 border border-stone-200/80 p-8 space-y-4">
            <h2 className="text-xs uppercase tracking-[0.2em] text-stone-500 font-sans">
              1. Photographic Archive
            </h2>
            <ImageUploader onImageUploaded={handleImageUploaded} currentImages={[]} />

            {uploadedImages.length > 0 && (
              <div className="pt-4 space-y-2">
                <p className="text-xs text-stone-500">Selected Product Photos ({uploadedImages.length}):</p>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                  {uploadedImages.map((img, idx) => (
                    <div key={idx} className="relative aspect-square border border-stone-300 group overflow-hidden bg-stone-100">
                      <img src={img} alt="Uploaded ceramic" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute inset-0 bg-stone-900/70 text-stone-100 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs transition-opacity"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* 2. Core Narrative & Lineage */}
          <section className="bg-white/50 border border-stone-200/80 p-8 space-y-6">
            <h2 className="text-xs uppercase tracking-[0.2em] text-stone-500">
              2. Nomenclature & Provenance
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wider text-stone-600 block">
                  Piece Title (English) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pale Celadon Fluted Bowl"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-stone-300 px-3 py-2.5 text-sm focus:border-stone-800 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wider text-stone-600 block">
                  Japanese Name (Kanji / Kana)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 青磁輪花鉢"
                  value={formData.japaneseName}
                  onChange={(e) => setFormData({ ...formData, japaneseName: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-stone-300 px-3 py-2.5 text-sm focus:border-stone-800 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wider text-stone-600 block">
                  Pottery Tradition / Style
                </label>
                <select
                  value={formData.style}
                  onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-stone-300 px-3 py-2.5 text-sm focus:border-stone-800 outline-none"
                >
                  {STYLES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wider text-stone-600 block">
                  Origin Kiln / Prefecture
                </label>
                <input
                  type="text"
                  placeholder="e.g. Arita, Saga Prefecture"
                  value={formData.origin}
                  onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-stone-300 px-3 py-2.5 text-sm focus:border-stone-800 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wider text-stone-600 block">
                  Price (USD) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-stone-500 font-mono text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="75.00"
                    value={formData.priceDollars}
                    onChange={(e) => setFormData({ ...formData, priceDollars: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-stone-300 pl-7 pr-3 py-2.5 text-sm font-mono focus:border-stone-800 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-6">
                <input
                  type="checkbox"
                  id="oneOfAKind"
                  checked={formData.isOneOfAKind}
                  onChange={(e) => setFormData({ ...formData, isOneOfAKind: e.target.checked })}
                  className="w-4 h-4 accent-stone-900 cursor-pointer"
                />
                <label htmlFor="oneOfAKind" className="text-xs uppercase tracking-wider text-stone-700 cursor-pointer">
                  One of a Kind / Antique Unique
                </label>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider text-stone-600 block">
                Artisan Story & Glaze Character
              </label>
              <textarea
                rows={4}
                placeholder="Describe clay composition, wood-ash firing nuances, kiln atmosphere..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-[#FAF8F5] border border-stone-300 px-3 py-2.5 text-sm focus:border-stone-800 outline-none"
              />
            </div>
          </section>

          {/* 3. Physical Dimensions */}
          <section className="bg-white/50 border border-stone-200/80 p-8 space-y-6">
            <h2 className="text-xs uppercase tracking-[0.2em] text-stone-500">
              3. Physical Specifications
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-stone-500 block">Height</label>
                <input
                  type="text"
                  placeholder="e.g. 7.5 cm"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-stone-300 px-3 py-2 text-xs focus:border-stone-800 outline-none mt-1"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-stone-500 block">Diameter</label>
                <input
                  type="text"
                  placeholder="e.g. 12.0 cm"
                  value={formData.diameter}
                  onChange={(e) => setFormData({ ...formData, diameter: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-stone-300 px-3 py-2 text-xs focus:border-stone-800 outline-none mt-1"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-stone-500 block">Weight</label>
                <input
                  type="text"
                  placeholder="e.g. 240 g"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-stone-300 px-3 py-2 text-xs focus:border-stone-800 outline-none mt-1"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-stone-500 block">Capacity</label>
                <input
                  type="text"
                  placeholder="e.g. 220 ml"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-stone-300 px-3 py-2 text-xs focus:border-stone-800 outline-none mt-1"
                />
              </div>
            </div>

            <div className="space-y-1 pt-2">
              <label className="text-xs uppercase tracking-wider text-stone-600 block">
                Care Instructions (one per line)
              </label>
              <textarea
                rows={3}
                value={formData.careInstructions}
                onChange={(e) => setFormData({ ...formData, careInstructions: e.target.value })}
                className="w-full bg-[#FAF8F5] border border-stone-300 px-3 py-2 text-xs focus:border-stone-800 outline-none"
              />
            </div>
          </section>

          {/* Submit Action */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="px-10 py-4 bg-stone-900 text-stone-100 text-xs uppercase tracking-[0.2em] transition-colors hover:bg-stone-700 disabled:opacity-50"
            >
              {submitting ? 'Publishing Piece...' : 'Publish to Collection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}