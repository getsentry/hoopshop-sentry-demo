import React from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { Trash2, ArrowRight, ShoppingBag, AlertCircle } from 'lucide-react';
import * as Sentry from "@sentry/react";
import { useFeatureFlags } from '../context/FeatureFlagsContext';

export function CartPage() {
  const { items, removeFromCart, total } = useCart();
  const { flags } = useFeatureFlags();
  const navigate = useNavigate();
  
  const isNeoBrutalism = flags.SITE_RELAUNCH;
  const checkoutEnabled = true; // Always enable the checkout button, we'll handle errors in the checkout page
  
  // Empty cart state
  if (items.length === 0) {
    if (isNeoBrutalism) {
      return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="border-4 border-black bg-yellow-100 p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0)]">
            <ShoppingBag size={64} className="mx-auto text-black mb-6" />
            <h2 className="text-3xl font-black text-black mb-4 uppercase tracking-wide">Your Cart is Empty</h2>
            <p className="text-black font-bold mb-8 p-2 bg-white inline-block border-2 border-black transform -rotate-1">Looks like you haven't added any gear yet!</p>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 bg-pink-400 text-black px-6 py-3 border-2 border-black font-bold text-lg transform hover:translate-x-0.5 hover:translate-y-0.5 shadow-[4px_4px_0px_0px_rgba(0,0,0)] hover:shadow-none transition-all"
            >
              Start Shopping
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      );
    }
    
    // Original empty cart
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

  // Neo-brutalism cart with basketball theme
  if (isNeoBrutalism) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-4xl font-black text-white mb-8 uppercase tracking-wide bg-brand-basketball p-3 border-2 border-brand-lines inline-block transform -rotate-1 shadow-[4px_4px_0px_0px_rgba(0,0,0)]">
          Your Cart
        </h2>
        
        <div className="bg-brand-net border-2 border-brand-lines shadow-[8px_8px_0px_0px_rgba(0,0,0)]">
          <ul className="divide-y-2 divide-brand-lines" data-testid="cart-items">
            {items.map(item => (
              <li key={item.id} className="p-6 flex items-center space-x-6" data-testid="cart-item">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-24 h-24 object-cover border-2 border-brand-lines flex-shrink-0"
                />
                <div className="flex-grow">
                  <h3 className="text-xl font-black text-brand-lines uppercase">
                    {item.name}
                  </h3>
                  <p className="font-bold mt-1 bg-brand-court p-1 inline-block border border-brand-lines text-brand-lines">
                    Quantity: {item.quantity}
                  </p>
                  <p className="text-lg font-black mt-2 bg-brand-basketball py-1 px-2 inline-block border border-brand-lines text-white">
                    ${item.price.toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="bg-red-500 text-white border-2 border-brand-lines p-2 hover:bg-red-600 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0)] hover:shadow-none"
                >
                  <span className="sr-only">Remove item</span>
                  <Trash2 size={20} />
                </button>
              </li>
            ))}
          </ul>
          
          <div className="bg-brand-court p-6 flex flex-col md:flex-row md:items-center md:justify-between border-t-2 border-brand-lines gap-4">
            <span className="text-2xl font-black text-brand-lines">
              Total: <span className="bg-brand-basketball py-1 px-3 border-2 border-brand-lines text-white">${total.toFixed(2)}</span>
            </span>
            
            <button
              onClick={() => navigate('/checkout')}
              disabled={!checkoutEnabled}
              data-testid="checkout-button"
              className={`inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-brand-lines font-bold text-lg transition-all ${
                checkoutEnabled 
                  ? 'bg-brand-trim text-white hover:translate-x-0.5 hover:translate-y-0.5 shadow-[4px_4px_0px_0px_rgba(0,0,0)] hover:shadow-none' 
                  : 'bg-gray-300 text-gray-700 cursor-not-allowed'
              }`}
            >
              Proceed to Checkout
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Original cart with items
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-4xl font-bold text-brand-navy mb-8">Your Cart</h2>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <ul className="divide-y divide-gray-200" data-testid="cart-items">
          {items.map(item => (
            <li key={item.id} className="p-6 flex items-center space-x-6" data-testid="cart-item">
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
            disabled={!checkoutEnabled}
            data-testid="checkout-button"
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-lg transition-all duration-300 transform ${
              checkoutEnabled 
                ? 'bg-brand-orange text-white hover:bg-orange-600 hover:shadow-lg hover:-translate-y-0.5' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Proceed to Checkout
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}