import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useFeatureFlags } from '../context/FeatureFlagsContext';
import { PaymentInfo } from '../types';
import * as Sentry from "@sentry/react";
import { useNavigate } from 'react-router-dom';
import { CreditCard, Lock, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

// This can be toggled in development to test error states
const { info, error, fmt } = Sentry.logger

export function CheckoutPage() {
  const { total, clearCart, items } = useCart();
  const { flags } = useFeatureFlags();
  const [processing, setProcessing] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [apiUsedOnSuccess, setApiUsedOnSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  // We won't redirect as we want to always allow checkout, 
  // but show appropriate errors based on flag combinations

  // SITE_RELAUNCH feature flag handling - check when the component mounts or flags change
  useEffect(() => {
    if (flags.SITE_RELAUNCH && !flags.BACKEND_V2) {
      console.log("SITE_RELAUNCH is enabled but BACKEND_V2 is not. Checkout will fail when attempted.");
    }
  }, [flags.SITE_RELAUNCH, flags.BACKEND_V2]);

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
    // No random failures anymore - always succeed
    return { success: true };
  };

  // New function to process payment with the relaunch backend
  const processRelaunchPayment = async () => {
    info(fmt`Processing relaunch payment with BACKEND_V2: ${storedPaymentInfo}`);
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Only succeed if BACKEND_V2 is enabled
    if (!flags.BACKEND_V2) {
      error(`SITE_RELAUNCH Error: Unable to connect to API. The relaunch requires BACKEND_V2 to be enabled.`);
      throw new Error('SITE_RELAUNCH Error: Unable to connect to API. The relaunch requires BACKEND_V2 to be enabled.');
    }
    
    return { success: true };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setErrorState(null);

    // SITE_RELAUNCH scenario - requires BACKEND_V2 to work
    if (flags.SITE_RELAUNCH) {
      Sentry.setTag("checkout_api", "relaunch_api");
      
      try {
        const result = await processRelaunchPayment();
        console.log('Relaunch payment successful:', result);
        setSuccess(true);
        setApiUsedOnSuccess("relaunch_with_backend_v2");
        clearCart();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Payment failed during site relaunch';
        
        // Capture the specific error in Sentry with detailed tags
        Sentry.captureException(new Error(errorMessage), {
          tags: { 
            checkout_step: 'relaunch_payment_processing',
            site_relaunch: 'true',
            backend_v2: flags.BACKEND_V2 ? 'true' : 'false'
          }
        });
        
        setErrorState(errorMessage);
      } finally {
        setProcessing(false);
      }
      return; // Exit early
    }
    
    // If not in relaunch mode, use standard legacy flow
    try {
      // Use legacy API
      Sentry.setTag("checkout_api", "legacy");
      
      try {
        const result = await processPaymentLegacy();
        console.log('Legacy payment successful:', result);
        setSuccess(true);
        setApiUsedOnSuccess("legacy");
        info(fmt`Checkout successful: ${result}`);
        clearCart();
      } catch (err) {
        Sentry.captureException(err);
        throw err;
      }
    } catch (err) {
      setErrorState(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <CheckCircle size={64} className="mx-auto text-green-500 mb-6" />
        <h2 className="text-3xl font-bold text-brand-navy mb-4" data-testid="payment-success">
          Payment Successful!
        </h2>
        <p className="text-brand-secondary mb-6">
          Thank you for your purchase. Your order is confirmed and on its way!
        </p>
         {/* Display API used on success based on state */}
         {apiUsedOnSuccess === 'relaunch_with_backend_v2' && (
          <p className="text-sm text-gray-500 mb-8">Processed with: Relaunch API v2</p>
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
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {errorState && (
              <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg flex items-center gap-3 border border-red-300">
                <AlertTriangle size={20} />
                <span>500 error communicating with backend services. API unavailable.</span>
              </div>
            )}

            <div className="mt-8">
              <button
                type="submit"
                disabled={processing}
                data-testid="submit-payment-button"
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