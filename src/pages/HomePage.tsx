import React from 'react';
import { ProductCard } from '../components/ProductCard';
import { products } from '../data/products';
import * as Sentry from "@sentry/react";
import { ArrowRight } from 'lucide-react'; // Icon for buttons

export function HomePage() {
  const { info } = Sentry.logger;
  info("HomePage rendered");
  return (
    <div className="min-h-screen bg-brand-light">
      {/* Hero Section - Using Navy Background */}
      <div className="relative bg-brand-navy text-white overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
              <span className="block mb-2">Level Up Your</span>
              <span className="block text-brand-orange">Game</span>
            </h1>
            <p className="mt-6 text-xl text-gray-300 max-w-2xl mx-auto">
              Top-quality basketball gear built for young champions. 
              Play harder, play smarter, play with confidence.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <button 
                onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-2 bg-brand-orange text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Shop Gear
                <ArrowRight size={20} />
              </button>
              <button className="inline-flex items-center gap-2 bg-white/10 text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-white/20 transition-all duration-300 backdrop-blur-sm transform hover:-translate-y-0.5">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-brand-navy mb-4">Featured Equipment</h2>
          <p className="text-xl text-brand-secondary max-w-3xl mx-auto">
            Gear that keeps up with their passion. Designed for durability, performance, 
            and fun on the court.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}