import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

export function Header() {
  const { items } = useCart();
  const navigate = useNavigate();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <h1 
            className="text-2xl font-bold text-blue-900 cursor-pointer" 
            onClick={() => navigate('/')}
          >
            KidsHoops
          </h1>
          <button
            onClick={() => navigate('/cart')}
            className="relative p-2 text-gray-600 hover:text-blue-900 transition-colors"
          >
            <ShoppingCart size={24} />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}