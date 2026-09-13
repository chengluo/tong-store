'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

interface ImageUploaderProps {
  onImageUploaded: (url: string) => void;
  currentImages?: string[];
}

export default function ImageUploader({
  onImageUploaded,
  currentImages = [],
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      onImageUploaded(data.url);
    } catch (err: any) {
      alert(err.message || 'Error uploading image');
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-4 font-sans">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border border-dashed p-8 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-stone-900 bg-stone-100'
            : 'border-stone-300 hover:border-stone-600 bg-stone-50/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/webp, image/avif"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleFileUpload(e.target.files[0]);
            }
          }}
        />

        <div className="flex flex-col items-center space-y-2">
          <svg
            className="w-8 h-8 text-stone-400 stroke-[1.25]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-xs uppercase tracking-wider text-stone-700">
            {isUploading ? 'Uploading local photo...' : 'Click or drag ceramic photo here'}
          </p>
          <span className="text-[11px] text-stone-400">
            Accepts JPG, PNG, WEBP from your local computer
          </span>
        </div>
      </div>

      {/* Uploaded Previews */}
      {currentImages.length > 0 && (
        <div className="grid grid-cols-4 gap-3 pt-2">
          {currentImages.map((src, i) => (
            <div
              key={i}
              className="relative aspect-square border border-stone-200 overflow-hidden bg-stone-100"
            >
              <Image
                src={src}
                alt="Product preview"
                fill
                sizes="120px"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}