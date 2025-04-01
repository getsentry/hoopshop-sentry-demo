import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useFeatureFlags } from '../context/FeatureFlagsContext';
import { PaymentInfo } from '../types';
import * as Sentry from "@sentry/react";
import { useNavigate } from 'react-router-dom';
import { CreditCard, Lock, CheckCircle, AlertTriangle, Loader2, ArrowRight } from 'lucide-react';

// This can be toggled in development to test error states
const { info, fmt } = Sentry.logger

export function CheckoutPage() {
  const { total, clearCart, items } = useCart();
  const { flags } = useFeatureFlags();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [apiUsedOnSuccess, setApiUsedOnSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  // If checkout is disabled, redirect to cart
  React.useEffect(() => {
    if (!flags.STORE_CHECKOUT_ENABLED) {
      navigate('/cart');
    }
  }, [flags.STORE_CHECKOUT_ENABLED, navigate]);

  // Simulated stored payment info
  const storedPaymentInfo: PaymentInfo = {
    cardNumber: '**** **** **** 4242',
    expiryDate: '12/25',
    cvv: '***',
    name: 'John Doe',
  };

  const processPaymentLegacy = async () => {
    info(fmt`Processing legacy payment: ${storedPaymentInfo}`);
    // Simulate legacy payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    // Legacy API has a 20% chance of failure
    if (Math.random() < 0.2) {
      throw new Error('Legacy payment system: Transaction declined');
    }
    return { success: true };
  };

  const processPaymentNewStoreApi = async () => {
    // Simulate new store API processing - this fails for demo purposes
    await new Promise(resolve => setTimeout(resolve, 800));
    throw new Error('NEW_STORE_API Error: Invalid transaction format. The new API requires additional validation parameters.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError(null);

    // Check if MAIN_STORE is enabled but PURCHASING_API is not
    if (flags.MAIN_STORE && !flags.PURCHASING_API) { // Use PURCHASING_API
      const errorMessage = 'Checkout Error: The purchasing API seems to be temporarily down. Please try again later.';
      setError(errorMessage); // Set UI error message
      Sentry.captureException(new Error(errorMessage), { // Capture the specific error in Sentry
        tags: { checkout_step: 'api_check' }
      }); 
      setProcessing(false);
      return; // Stop processing
    }

    try {
      // Decide API based on MAIN_STORE and PURCHASING_API flags
      let apiToUse = 'legacy';
      if (flags.MAIN_STORE && flags.PURCHASING_API) { // Use PURCHASING_API
          apiToUse = 'main_store_with_api'; // Represents the successful main store path
      } else if (flags.NEW_STORE_API) { 
          apiToUse = 'new_store_api';
      } // else it remains 'legacy'
      Sentry.setTag("checkout_api", apiToUse);

      try {
        // Branch logic based on the flags
        if (flags.MAIN_STORE && flags.PURCHASING_API) { // Use PURCHASING_API
            // Main store is active and API is enabled - process successfully (using legacy simulation for now)
            const result = await processPaymentLegacy(); 
            console.log('Main store payment successful:', result);
            setSuccess(true);
            setApiUsedOnSuccess(apiToUse);
            clearCart();
        } else if (flags.NEW_STORE_API) {
            // Use the new store API (which currently simulates failure)
            await processPaymentNewStoreApi(); 
        } else {
            // Default to legacy payment processing
            const result = await processPaymentLegacy();
            console.log('Legacy payment successful:', result);
            setSuccess(true);
            setApiUsedOnSuccess(apiToUse);
            clearCart();
        }
      } catch (err) {
        // Capture errors from legacy and new_store_api paths.
        if (apiToUse === 'legacy' || apiToUse === 'new_store_api') {
           Sentry.captureException(err);
        }
        throw err; // Rethrow to be handled by the outer catch
      }
    } catch (err) {
      // Outer catch handles setting the error message for the UI
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <CheckCircle size={64} className="mx-auto text-green-500 mb-6" />
        <h2 className="text-3xl font-bold text-brand-navy mb-4">
          Payment Successful!
        </h2>
        <p className="text-brand-secondary mb-6">
          Thank you for your purchase. Your order is confirmed and on its way!
        </p>
         {/* Display API used on success based on state */}
         {apiUsedOnSuccess === 'main_store_with_api' && (
          <p className="text-sm text-gray-500 mb-8">Processed with: Main Store API</p>
        )}
        {apiUsedOnSuccess === 'legacy' && (
          <p className="text-sm text-gray-500 mb-8">Processed with: Legacy API</p>
        )}
        {/* Add case for new_store_api if it could ever lead to success */}
        {apiUsedOnSuccess === 'new_store_api' && (
          <p className="text-sm text-gray-500 mb-8">Processed with: New Store API (Beta)</p>
        )}

        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 bg-brand-orange text-white px-6 py-3 rounded-full text-lg font-semibold hover:bg-orange-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  // Determine API status message based on flags for UI
  let apiStatusMessage = 'Using Legacy API';
  let apiStatusColor = 'blue';
  if (flags.MAIN_STORE && flags.PURCHASING_API) {
      apiStatusMessage = 'Using Main Store API';
      apiStatusColor = 'green';
  } else if (flags.NEW_STORE_API) {
      apiStatusMessage = 'Using New Store API (Beta)';
      apiStatusColor = 'yellow';
  }
  // Note: The case where MAIN_STORE is true but PURCHASING_API is false is handled by the error state

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="px-8 py-10">
          <h2 className="text-4xl font-extrabold text-brand-navy mb-8 text-center">Complete Your Order</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            {/* Order Summary */}
            <div className="bg-brand-light p-6 rounded-lg border border-gray-200">
              <h3 className="text-xl font-bold text-brand-navy mb-4">Order Summary</h3>
              <ul className="space-y-3 mb-4 text-sm text-brand-secondary">
                {items.map(item => (
                  <li key={item.id} className="flex justify-between">
                    <span>{item.name} (x{item.quantity})</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <div className="border-t border-gray-300 pt-4 flex justify-between font-bold text-brand-navy text-lg">
                <span>Total</span>
                <span className="text-brand-orange">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-brand-light p-6 rounded-lg border border-gray-200">
              <h3 className="text-xl font-bold text-brand-navy mb-4 flex items-center">
                <CreditCard size={22} className="mr-2 text-brand-orange" /> Payment Method
              </h3>
              <div className="space-y-2 text-brand-secondary">
                <p>Card: {storedPaymentInfo.cardNumber}</p>
                <p>Expiry: {storedPaymentInfo.expiryDate}</p>
                <p>Name: {storedPaymentInfo.name}</p>
              </div>
               {/* API Status Indicator */}
              <div className={`mt-4 p-3 rounded-lg border bg-${apiStatusColor}-50 border-${apiStatusColor}-200`}>
                <p className={`text-sm font-medium text-${apiStatusColor}-800`}>
                  {apiStatusMessage}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg flex items-center gap-3 border border-red-300">
                <AlertTriangle size={20} />
                <span>{error}</span>
              </div>
            )}

            <div className="mt-8">
              <button
                type="submit"
                disabled={processing}
                className={`w-full inline-flex items-center justify-center gap-3 bg-brand-orange text-white px-8 py-4 rounded-full text-xl font-semibold hover:bg-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 ${
                  processing ? 'opacity-60 cursor-wait' : ''
                }`}
              >
                {processing ? (
                  <>
                    <Loader2 size={24} className="animate-spin" /> Processing Payment...
                  </>
                ) : (
                  <>
                    <Lock size={20} /> Pay ${total.toFixed(2)} Securely
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}