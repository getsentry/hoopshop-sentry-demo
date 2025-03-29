import React from 'react';
import { ProductCard } from '../components/ProductCard';
import { products } from '../data/products';

export function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="h-[60vh] relative bg-blue-900 overflow-hidden">
        <div className="absolute inset-0">
          <img
            className="w-full h-full object-cover"
            src="https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=2000"
            alt="Basketball"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/95 via-blue-900/80 to-blue-900/30"></div>
        </div>

        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-full">
            <div className="max-w-2xl">
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white">
                <span className="block mb-2">Champions</span>
                <span className="block text-blue-400">Start Young</span>
              </h1>
              <p className="mt-6 text-xl text-gray-300 max-w-lg">
                Premium basketball gear designed for young athletes. Build confidence, 
                develop skills, and inspire the next generation of basketball stars.
              </p>
              <div className="mt-8 flex gap-4">
                <button 
                  onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:translate-y-[-2px]"
                >
                  Shop Now
                </button>
                <button className="bg-white/10 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white/20 transition-all duration-300 backdrop-blur-sm hover:translate-y-[-2px]">
                  View Catalog
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-blue-900 mb-4">Featured Equipment</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Quality gear that grows with your young athlete. Designed for performance, 
            built to last.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}