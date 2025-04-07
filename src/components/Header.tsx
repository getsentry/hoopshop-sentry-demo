import React from 'react';
import { ShoppingCart, Zap, CircleDot, Flag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { useFeatureFlags } from '../context/FeatureFlagsContext';

export function Header() {
  const { items } = useCart();
  const { flags } = useFeatureFlags();
  const navigate = useNavigate();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  
  const isNeoBrutalism = flags.SITE_RELAUNCH;

  if (isNeoBrutalism) {
    return (
      <header className="bg-brand-basketball border-b-4 border-brand-lines sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex justify-between items-center">
            <div 
              className="flex items-center space-x-2 cursor-pointer" 
              onClick={() => navigate('/')}
            >
              <CircleDot size={28} className="text-brand-net" />
              <h1 className="text-3xl font-black text-white tracking-tight uppercase">
                Hoop<span className="text-brand-court">Shop</span>
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/flags')}
                data-testid="flags-button"
                className="p-2 text-white border-2 border-brand-lines bg-brand-trim shadow-[2px_2px_0px_0px_rgba(0,0,0)] hover:shadow-none transition-all"
              >
                <Flag size={24} />
              </button>
              <button
                onClick={() => navigate('/cart')}
                data-testid="cart-button"
                className="relative p-2 text-white border-2 border-brand-lines bg-brand-trim shadow-[2px_2px_0px_0px_rgba(0,0,0)] hover:shadow-none transition-all group"
              >
                <ShoppingCart size={26} />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brand-court text-brand-lines font-black border border-brand-lines w-5 h-5 flex items-center justify-center text-xs group-hover:scale-110 transition-transform">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>
    );
  }

  // Original header
  return (
    <header className="bg-brand-navy shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex justify-between items-center">
          <div 
            className="flex items-center space-x-2 cursor-pointer" 
            onClick={() => navigate('/')}
          >
             <Zap size={28} className="text-brand-orange" />
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Hoop<span className="text-brand-orange">Shop</span>
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/flags')}
              data-testid="flags-button"
              className="p-2 text-gray-300 hover:text-white transition-colors"
            >
              <Flag size={24} />
            </button>
            <button
              onClick={() => navigate('/cart')}
              data-testid="cart-button"
              className="relative p-2 text-gray-300 hover:text-white transition-colors group"
            >
              <ShoppingCart size={26} />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-orange text-brand-navy font-bold rounded-full w-5 h-5 flex items-center justify-center text-xs group-hover:scale-110 transition-transform">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}