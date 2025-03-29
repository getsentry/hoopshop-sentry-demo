import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useFeatureFlags } from '../context/FeatureFlagsContext';
import { PaymentInfo } from '../types';
import * as Sentry from "@sentry/react";

// This can be toggled in development to test error states
const USE_ERROR_API = false;

export function CheckoutPage() {
  const { total, clearCart } = useCart();
  const { flags } = useFeatureFlags();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Simulated stored payment info
  const storedPaymentInfo: PaymentInfo = {
    cardNumber: '**** **** **** 4242',
    expiryDate: '12/25',
    cvv: '***',
    name: 'John Doe',
  };

  const processPaymentLegacy = async () => {
    // Simulate legacy payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    // Legacy API has a 20% chance of failure
    if (Math.random() < 0.2) {
      throw new Error('Legacy payment system: Transaction declined');
    }
    return { success: true };
  };

  const processPaymentNextGen = async () => {
    // Simulate next-gen payment processing with forced error
    await new Promise(resolve => setTimeout(resolve, 800));
    throw new Error('NEXT_GEN_API Error: Invalid transaction format. The new API requires additional validation parameters.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError(null);

    try {
      // Set the tag for the current transaction
      Sentry.setTag("checkout_api", flags.NEXT_GEN_API ? "nextgen" : "legacy");

      try {
        if (flags.NEXT_GEN_API) {
          await processPaymentNextGen();
        } else {
          const result = await processPaymentLegacy();
          console.log('Legacy payment successful:', result);
          setSuccess(true);
          clearCart();
        }
      } catch (err) {
        Sentry.captureException(err);
        throw err;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h2 className="text-2xl font-bold text-blue-600 mb-4">
            Payment Successful!
          </h2>
          <p className="text-gray-600 mb-4">
            Thank you for your purchase. Your order has been confirmed.
          </p>
          <p className="text-sm text-gray-500">
            Processed with: Legacy API
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-blue-900 mb-8">Checkout</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Saved Payment Method</h3>
              <div className="space-y-2">
                <p className="text-gray-600">Card: {storedPaymentInfo.cardNumber}</p>
                <p className="text-gray-600">Expiry: {storedPaymentInfo.expiryDate}</p>
                <p className="text-gray-600">Name: {storedPaymentInfo.name}</p>
              </div>
            </div>

            <div className={`p-4 rounded-lg border ${flags.NEXT_GEN_API ? 'bg-yellow-50 border-yellow-100' : 'bg-blue-50 border-blue-100'}`}>
              <p className={`text-sm ${flags.NEXT_GEN_API ? 'text-yellow-800' : 'text-blue-800'}`}>
                Using {flags.NEXT_GEN_API ? 'Next-gen API (Warning: Beta Feature)' : 'Legacy API'}
              </p>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-md">
              {error}
            </div>
          )}

          <div className="mt-6">
            <div className="text-xl font-bold text-blue-900 mb-4">
              Total: ${total.toFixed(2)}
            </div>
            <button
              type="submit"
              disabled={processing}
              className={`w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors ${
                processing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {processing ? 'Processing...' : 'Pay Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}