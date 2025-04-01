import React from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import * as Sentry from "@sentry/react";
import { useFeatureFlags } from '../context/FeatureFlagsContext';

export function CartPage() {
  const { items, removeFromCart, total } = useCart();
  const { flags } = useFeatureFlags();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <ShoppingBag size={64} className="mx-auto text-brand-orange opacity-50 mb-6" />
        <h2 className="text-3xl font-bold text-brand-navy mb-4">Your Cart is Empty</h2>
        <p className="text-brand-secondary mb-8">Looks like you haven't added any gear yet!</p>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 bg-brand-orange text-white px-6 py-3 rounded-full text-lg font-semibold hover:bg-orange-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        >
          Start Shopping
          <ArrowRight size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-4xl font-bold text-brand-navy mb-8">Your Cart</h2>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {items.map(item => (
            <li key={item.id} className="p-6 flex items-center space-x-6">
              <img
                src={item.image}
                alt={item.name}
                className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
              />
              <div className="flex-grow">
                <h3 className="text-xl font-semibold text-brand-navy">
                  {item.name}
                </h3>
                <p className="text-brand-secondary mt-1">
                  Quantity: {item.quantity}
                </p>
                <p className="text-lg font-medium text-brand-orange mt-1">
                  ${item.price.toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => removeFromCart(item.id)}
                className="text-gray-400 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50"
              >
                <span className="sr-only">Remove item</span>
                <Trash2 size={20} />
              </button>
            </li>
          ))}
        </ul>
        <div className="bg-gray-50 p-6 flex items-center justify-between border-t border-gray-200">
          <span className="text-2xl font-bold text-brand-navy">
            Total: <span className="text-brand-orange">${total.toFixed(2)}</span>
          </span>
          <button
            onClick={() => navigate('/checkout')}
            disabled={!flags.STORE_CHECKOUT_ENABLED}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-lg transition-all duration-300 transform ${flags.STORE_CHECKOUT_ENABLED 
              ? 'bg-brand-orange text-white hover:bg-orange-600 hover:shadow-lg hover:-translate-y-0.5' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'} `}
          >
            Proceed to Checkout
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}