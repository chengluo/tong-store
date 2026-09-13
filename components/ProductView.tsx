import { useCartStore } from '@/stores/useCartStore';

export default function ProductView({ product }: { product: any }) {
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      origin: product.origin,
    });
  };

  return (
    // ... rest of the product page
    <button
      onClick={handleAddToCart}
      className="w-full py-4 bg-stone-900 text-stone-100 font-sans text-xs uppercase tracking-[0.2em] transition-colors duration-300 hover:bg-stone-700"
    >
      Add to Selection
    </button>
  );
}