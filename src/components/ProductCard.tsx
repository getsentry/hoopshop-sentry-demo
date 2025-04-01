import React from 'react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useFeatureFlags } from '../context/FeatureFlagsContext';
import { ShoppingCart } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { flags } = useFeatureFlags();

  const isStoreEnabled = flags.MAIN_STORE;

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden group transform transition-all duration-300 hover:shadow-2xl">
      <div className="relative overflow-hidden h-64">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
      </div>
      <div className="p-6">
        <h3 className="text-2xl font-bold text-brand-navy mb-2">{product.name}</h3>
        <p className="text-brand-secondary text-sm mb-4 h-10">{product.description}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-3xl font-extrabold text-brand-orange">
            ${product.price.toFixed(2)}
          </span>
          <button
            onClick={() => isStoreEnabled && addToCart(product)}
            disabled={!isStoreEnabled}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-full font-semibold transition-all duration-300 transform ${
              isStoreEnabled
                ? 'bg-brand-orange text-white hover:bg-orange-600 hover:shadow-lg hover:-translate-y-0.5'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <ShoppingCart size={18} />
            <span>{isStoreEnabled ? 'Add to Cart' : 'Coming Soon'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}