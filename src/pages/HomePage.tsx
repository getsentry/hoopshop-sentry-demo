import React, { useEffect, useRef, useMemo } from 'react';
import { ProductCard } from '../components/ProductCard';
import { products } from '../data/products';
import * as Sentry from "@sentry/react";
import { ArrowRight } from 'lucide-react'; // Icon for buttons
import { useFeatureFlags } from '../context/FeatureFlagsContext';

// Use React.memo to prevent unnecessary re-renders of the entire component
const HomePage = React.memo(function HomePage() {
  const { flags } = useFeatureFlags();
  const { info } = Sentry.logger;
  const prevFlagsRef = useRef(flags);
  
  // Only use SITE_RELAUNCH for rendering changes
  // We're removing the dependency on MAIN_STORE
  const showNeoBrutalism = flags.SITE_RELAUNCH;
  
  // Only log flag changes when needed - and only when they actually change
  useEffect(() => {
    // Only run on localhost
    if (window.location.hostname === 'localhost') {
      // Check if any flag values have actually changed
      const prevFlags = prevFlagsRef.current;
      const hasChanged = Object.keys(flags).some(key => flags[key] !== prevFlags[key]);
      
      if (hasChanged) {
        console.log("🔍 HomePage - flags changed:", flags);
        console.log("🔍 HomePage - SITE_RELAUNCH is now:", flags.SITE_RELAUNCH);
        console.log("🔍 HomePage - BACKEND_V2 is now:", flags.BACKEND_V2);
        
        // Update the ref to current values
        prevFlagsRef.current = {...flags};
      }
    }
  }, [flags]); // Still depends on flags, but won't cause excessive logging
  
  // Listen for direct flag changes via the custom event
  useEffect(() => {
    const handleFlagChange = (e: CustomEvent) => {
      const { flagName, value } = e.detail;
      if (window.location.hostname === 'localhost') {
        console.log(`📢 HomePage - Flag '${flagName}' changed to ${value} via event`);
      }
    };
    
    window.addEventListener('flag-value-changed', handleFlagChange as EventListener);
    return () => window.removeEventListener('flag-value-changed', handleFlagChange as EventListener);
  }, []);
  
  // Only log on localhost
  if (window.location.hostname === 'localhost') {
    console.log("HomePage rendered");
  }
  
  return (
    <div className={`min-h-screen ${showNeoBrutalism ? 'bg-brand-court' : 'bg-brand-light'}`}>
      {/* Hero Section - Changes based on SITE_RELAUNCH flag only */}
      <div className={`relative ${
        showNeoBrutalism 
          ? 'bg-brand-basketball border-4 border-brand-lines shadow-[8px_8px_0px_0px_rgba(0,0,0)] mb-8' 
          : 'bg-brand-navy'
        } text-white overflow-hidden`}>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center">
            <h1 className={`${
              showNeoBrutalism 
                ? 'text-5xl md:text-7xl font-black tracking-tight transform -rotate-1' 
                : 'text-5xl md:text-7xl font-extrabold tracking-tight'
              }`}>
              <span className="block mb-2">Level Up Your</span>
              <span className={`block ${
                showNeoBrutalism 
                  ? 'text-brand-lines underline decoration-wavy decoration-brand-net underline-offset-8' 
                  : 'text-brand-orange'
                }`}>Game</span>
            </h1>
            
            <p className={`mt-6 text-xl ${
              showNeoBrutalism 
                ? 'text-brand-lines font-bold max-w-2xl mx-auto bg-brand-court p-4 inline-block transform rotate-1 border-2 border-brand-lines' 
                : 'text-gray-300 max-w-2xl mx-auto'
              }`}>
              Top-quality basketball gear built for young champions. 
              Play harder, play smarter, play with confidence.
            </p>
            
            <div className="mt-10 flex justify-center gap-4">
              <button 
                onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
                className={`inline-flex items-center gap-2 ${
                  showNeoBrutalism 
                    ? 'bg-brand-trim text-white px-8 py-3 border-2 border-brand-lines font-bold text-lg transform rotate-1 hover:rotate-0 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0)]' 
                    : 'bg-brand-orange text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                  }`}
              >
                Shop Gear
                <ArrowRight size={20} />
              </button>
              
              <button className={`inline-flex items-center gap-2 ${
                showNeoBrutalism 
                  ? 'bg-brand-basketball text-white px-8 py-3 border-2 border-brand-lines font-bold text-lg transform -rotate-1 hover:rotate-0 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0)]' 
                  : 'bg-white/10 text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-white/20 transition-all duration-300 backdrop-blur-sm transform hover:-translate-y-0.5'
                }`}>
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div id="products" className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 ${
        showNeoBrutalism ? 'bg-brand-court' : ''
      }`}>
        <div className={`text-center mb-16 ${
          showNeoBrutalism ? 'transform -rotate-1' : ''
        }`}>
          <h2 className={`${
            showNeoBrutalism 
              ? 'text-4xl md:text-5xl font-black text-brand-lines mb-4 uppercase tracking-widest' 
              : 'text-4xl md:text-5xl font-bold text-brand-navy mb-4'
            }`}>
            Featured Equipment
          </h2>
          <p className={`${
            showNeoBrutalism 
              ? 'text-xl font-bold text-brand-lines max-w-3xl mx-auto bg-brand-net p-3 inline-block border-2 border-brand-lines' 
              : 'text-xl text-brand-secondary max-w-3xl mx-auto'
            }`}>
            Gear that keeps up with their passion. Designed for durability, performance, 
            and fun on the court.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12" data-testid="product-grid">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
});

export { HomePage };