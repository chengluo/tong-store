import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import type { Product } from '@/types/product';
import initialProducts from './products.json';

export type { Product };

export const PRODUCTS: Product[] = initialProducts as Product[];

export const PRODUCT_MAP: Record<string, Product> = PRODUCTS.reduce(
  (acc, product) => {
    acc[product.id] = product;
    return acc;
  },
  {} as Record<string, Product>
);

const dbPath = path.join(process.cwd(), 'data', 'products.json');

export async function getProducts(): Promise<Product[]> {
  try {
    const data = await readFile(dbPath, 'utf8');
    return JSON.parse(data) as Product[];
  } catch (err) {
    console.error('Error reading products.json, returning empty array:', err);
    return [];
  }
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const products = await getProducts();
  return products.find((p) => p.slug === slug);
}

export async function saveProduct(newProduct: Product): Promise<Product[]> {
  const products = await getProducts();
  const index = products.findIndex((p) => p.id === newProduct.id);

  let updated: Product[];
  if (index >= 0) {
    updated = [...products];
    updated[index] = newProduct;
  } else {
    updated = [newProduct, ...products];
  }

  await writeFile(dbPath, JSON.stringify(updated, null, 2), 'utf8');
  return updated;
}

export const saveProducts = saveProduct;