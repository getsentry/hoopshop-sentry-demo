import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { FeatureFlagsProvider } from './context/FeatureFlagsContext';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { FlagsDashboardPage } from './pages/FlagsDashboardPage';
import { CommandBar } from './components/CommandBar';
import { useSentryToolbar } from '@sentry/toolbar';
import { FeatureFlagAdapter } from './utils/featureFlags';
import { useFeatureFlags } from './context/FeatureFlagsContext';

// Create the adapter once, outside the component
const featureFlagAdapter = FeatureFlagAdapter();

// Wrapper component to apply theme based on feature flags
function AppContent() {
  const { flags } = useFeatureFlags();
  const location = useLocation();
  const isFlagsPage = location.pathname === '/flags';
  
  // Don't apply neo-brutalism theme to the flags dashboard page
  const shouldApplyTheme = flags.SITE_RELAUNCH && !isFlagsPage;
  
  // Neo-brutalism theme class names
  const neoBrutalismClasses = shouldApplyTheme
    ? "neo-brutalism font-mono" 
    : "";
  
  return (
    <CartProvider>
      <div className={`min-h-screen ${shouldApplyTheme ? 'bg-brand-court' : 'bg-gray-50'} ${neoBrutalismClasses}`}>
        <Header />
        <CommandBar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/flags" element={<FlagsDashboardPage />} />
        </Routes>
      </div>
    </CartProvider>
  );
}

function App() {
  // Initialize Sentry toolbar with stable adapter reference
  useSentryToolbar({
    enabled: true,
    initProps: {
      organizationSlug: 'buildwithcode',
      projectIdOrSlug: 'hoopshop',
      featureFlags: featureFlagAdapter
    },
  });

  return (
    <Router>
      <FeatureFlagsProvider>
        <AppContent />
      </FeatureFlagsProvider>
    </Router>
  );
}

export default App;