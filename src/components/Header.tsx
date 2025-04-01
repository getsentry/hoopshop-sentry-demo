import React from 'react';
import { ShoppingCart, Zap } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

export function Header() {
  const { items } = useCart();
  const navigate = useNavigate();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

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
              Kids<span className="text-brand-orange">Hoops</span>
            </h1>
          </div>
          <button
            onClick={() => navigate('/cart')}
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
    </header>
  );
}