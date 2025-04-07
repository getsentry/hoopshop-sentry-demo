import React from 'react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useFeatureFlags } from '../context/FeatureFlagsContext';
import { ShoppingCart, Sparkles } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { flags } = useFeatureFlags();

  // Always allow adding to cart regardless of flags
  // Only checkout is controlled by STORE_CHECKOUT_ENABLED
  const isStoreEnabled = true; // Always allow adding to cart
  const isNeoBrutalism = flags.SITE_RELAUNCH;

  // Generate random rotation for neo-brutalism cards (-2 to 2 degrees)
  const randomRotation = React.useMemo(() => {
    if (!isNeoBrutalism) return '';
    const degrees = Math.floor(Math.random() * 5) - 2;
    return `rotate-[${degrees}deg]`;
  }, [isNeoBrutalism]);
  
  if (isNeoBrutalism) {
    return (
      <div className={`bg-brand-net border-2 border-brand-lines shadow-[8px_8px_0px_0px_rgba(0,0,0)] overflow-hidden group transition-all duration-300 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0)] ${randomRotation}`}>
        <div className="relative overflow-hidden h-64 border-b-2 border-brand-lines">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-0 right-0 bg-brand-basketball border-l-2 border-b-2 border-brand-lines p-2 font-black text-white">
            NEW
          </div>
        </div>
        <div className="p-6">
          <h3 className="text-2xl font-black text-brand-lines mb-2 uppercase">{product.name}</h3>
          <p className="text-brand-lines font-medium mb-4 h-10 border-2 border-brand-lines bg-brand-court p-2 text-sm transform -rotate-1">{product.description}</p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-3xl font-black text-white bg-brand-basketball py-1 px-3 border-2 border-brand-lines transform rotate-1">
              ${product.price.toFixed(2)}
            </span>
            <button
              onClick={() => isStoreEnabled && addToCart(product)}
              disabled={!isStoreEnabled}
              data-testid="add-to-cart-button"
              className={`flex items-center gap-2 px-5 py-2.5 border-2 border-brand-lines font-bold transition-all transform ${
                isStoreEnabled
                  ? 'bg-brand-trim text-white hover:translate-x-0.5 hover:translate-y-0.5 shadow-[4px_4px_0px_0px_rgba(0,0,0)] hover:shadow-none'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isStoreEnabled ? (
                <>
                  <ShoppingCart size={18} />
                  <span>Add to Cart</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Coming Soon</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Original design
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
            data-testid="add-to-cart-button"
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