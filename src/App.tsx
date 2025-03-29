import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { FeatureFlagsProvider } from './context/FeatureFlagsContext';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { CommandBar } from './components/CommandBar';
import { useSentryToolbar } from '@sentry/toolbar';
import { FeatureFlagAdapter } from './utils/featureFlags';


function App() {

  useSentryToolbar({
    enabled: true,
  
    initProps: {
      organizationSlug: 'buildwithcode',
      projectIdOrSlug: 'kidshoops',
      featureFlags: FeatureFlagAdapter()
    },
  })

  return (
    <Router>
      <FeatureFlagsProvider>
        <CartProvider>
          <div className="min-h-screen bg-gray-50">
            <Header />
            <CommandBar />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
            </Routes>
          </div>
        </CartProvider>
      </FeatureFlagsProvider>
    </Router>
  );
}

export default App;