// types/product.ts
export interface Product {
  id: string;
  slug: string;
  name: string;
  japaneseName: string;
  style: 'Arita-yaki' | 'Hasami-yaki' | 'Mino-yaki' | 'Bizen-yaki' | 'Kutani-yaki' | string;
  origin: string;
  price: number; // in cents
  stock?: number; // inventory count
  description: string;
  dimensions: {
    height: string;
    diameter: string;
    weight: string;
    capacity?: string;
  };
  careInstructions: string[];
  isOneOfAKind: boolean;
  images: string[];
}