import React, { useState, useEffect, useCallback } from "react";
import "./App.css";
import { InternetIdentityProvider } from "ic-use-internet-identity";

// V1 Imports (Keep your existing functionality)
import VirtualAccount from "./utils/VirtualAccount";
import PriceService from "./services/PriceService";
import SignalService from "./services/SignalService";
import AuthService from "./services/AuthService";
import LoginForm from "./components/LoginForm";
import SortableTable from "./components/SortableTable";
import LoadingSpinner from "./components/LoadingSpinner";
import StrategyComparison from "./components/StrategyComparison";
import {
  PortfolioValueChart,
  TokenWeightsChart,
} from "./components/PortfolioChart";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import strategies from "./utils/StrategyService";

// V2 Imports (New professional components)
import Header from "./components/navigation/Header";
import MobileNav from "./components/layout/MobileNav";
import Dashboard from "./components/dashboard/Dashboard";
import LandingPage from "./components/landing/LandingPage";

// Enhanced V3 Imports (New services and features - Voice removed)
import NotificationService from "./services/NotificationService";
import NewsService from "./services/NewsService";
import SecurityService from "./services/SecurityService";
import PerformanceMonitor from "./utils/PerformanceMonitor";
import { useTheme } from "./contexts/ThemeContext";

// PWA Imports
import { motion, AnimatePresence } from "framer-motion";
import usePWA from "./hooks/usePWA";

import PortfolioOverview from "./components/portfolio/PortfolioOverview";
import VirtualTradingTerminal from "./components/virtual_trading/VirtualTradingTerminal";
import MarketOverview from "./components/dashboard/MarketOverview";
import TradingSignals from "./signals/TradingSignals/TradingSignals";

// PWA Components
const PWAInstallPrompt = ({ onInstall, onDismiss, isVisible }) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        className="pwa-install-prompt"
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
      >
        <div className="install-content">
          <h3>📱 Install SignalStack</h3>
          <p>
            Get the full app experience with offline access and push
            notifications
          </p>
          <div className="install-actions">
            <button className="btn-install" onClick={onInstall}>
              Install App
            </button>
            <button className="btn-dismiss" onClick={onDismiss}>
              Not Now
            </button>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

const OfflineIndicator = ({ isOnline }) => (
  <AnimatePresence>
    {!isOnline && (
      <motion.div
        className="offline-indicator"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
      >
        <span>📡 You're offline - Using cached data</span>
      </motion.div>
    )}
  </AnimatePresence>
);

const PWAUpdatePrompt = ({ onUpdate, onDismiss, isVisible }) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        className="pwa-update-prompt"
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
      >
        <div className="update-content">
          <h3>🔄 Update Available</h3>
          <p>A new version of SignalStack is ready to install</p>
          <div className="update-actions">
            <button className="btn-update" onClick={onUpdate}>
              Update Now
            </button>
            <button className="btn-dismiss" onClick={onDismiss}>
              Later
            </button>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

// import PortfolioOverview from './components/portfolio/PortfolioOverview';
// import ActiveSignals from './components/signals/ActiveSignals';
// import VirtualTradingTerminal from './components/virtual_trading/VirtualTradingTerminal';
// import MarketOverview from './components/market/MarketOverview';

function App() {
  // V1 Authentication state (Keep existing)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userAccounts, setUserAccounts] = useState([]);
  const [activeAccount, setActiveAccount] = useState(null);

  // V1 App state (Keep existing)
  const [account, setAccount] = useState(null);
  const [virtualAccount, setVirtualAccount] = useState(null);
  const [prices, setPrices] = useState({});
  const [signals, setSignals] = useState({});
  const [targetWeights, setTargetWeights] = useState({});
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [isLoadingSignals, setIsLoadingSignals] = useState(false);
  const [txHistory, setTxHistory] = useState([]);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [portfolioHistory, setPortfolioHistory] = useState([]);
  const [activeStrategy, setActiveStrategy] = useState("signalBased");

  // V2 UI state (New for professional UI)
  const [currentRoute, setCurrentRoute] = useState(window.location.pathname);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [user, setUser] = useState(null);

  // V3 Enhanced state (Voice-related state removed)
  const [newsData, setNewsData] = useState([]);
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState({});

  // PWA State
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

  // Hooks
  const { theme, toggleTheme } = useTheme();
  const {
    isInstalled,
    isInstallable,
    installApp,
    isOnline,
    updateAvailable,
    updateApp,
    installationStatus,
    requestNotificationPermission,
  } = usePWA();

  // PWA Handlers
  const handlePWAInstall = useCallback(async () => {
    const success = await installApp();
    if (success) {
      setShowInstallPrompt(false);
      NotificationService.success("App installed successfully! 🎉");

      const notificationGranted = await requestNotificationPermission();
      if (notificationGranted) {
        NotificationService.success("Push notifications enabled! 🔔");
      }
    }
  }, [installApp, requestNotificationPermission]);

  const handlePWAUpdate = useCallback(async () => {
    await updateApp();
    setShowUpdatePrompt(false);
  }, [updateApp]);

  // V3 News update handler
  const handleNewsUpdate = useCallback((news) => {
    setNewsData((prevNews) => [news, ...prevNews.slice(0, 19)]);

    if (news.priority === "high") {
      NotificationService.info(`Breaking: ${news.title}`, {
        persistent: true,
        actions: [
          { label: "Read More", action: () => setCurrentRoute("/news") },
          { label: "Dismiss", action: "dismiss" },
        ],
      });
    }
  }, []);

  // V3 Security event handler
  const handleSecurityEvent = useCallback((event) => {
    setSecurityAlerts((prev) => [event, ...prev.slice(0, 9)]);

    if (event.severity === "high" || event.severity === "critical") {
      NotificationService.warning(`Security Alert: ${event.message}`, {
        persistent: true,
        priority: "high",
      });
    }
  }, []);

  // PWA useEffect hooks
  useEffect(() => {
    if (isInstallable && !isInstalled) {
      setTimeout(() => setShowInstallPrompt(true), 5000);
    }
  }, [isInstallable, isInstalled]);

  useEffect(() => {
    if (updateAvailable) {
      setShowUpdatePrompt(true);
    }
  }, [updateAvailable]);

  // V1 Initialize app (Voice services removed)
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsAppLoading(true);

        // V3: Initialize enhanced services (Voice removed)
        PerformanceMonitor.startMonitoring();
        await SecurityService.initializeSecurity();
        NotificationService.initialize();

        // V3: Setup news stream
        NewsService.addEventListener("news_update", handleNewsUpdate);
        NewsService.startNewsStream();

        // V3: Setup security monitoring
        SecurityService.addEventListener("security_event", handleSecurityEvent);

        // V1: Check authentication status
        const authStatus = AuthService.isAuthenticated();
        setIsAuthenticated(authStatus);

        if (authStatus) {
          // V1: Load user accounts
          const accounts = AuthService.getAccounts();
          setUserAccounts(accounts);

          // V2: Create user object for new header
          setUser({
            id: 1,
            name: accounts[0]?.name || "Trading User",
            email: "user@signalstack.com",
          });

          if (accounts.length === 0) {
            const result = AuthService.createAccount("Main Trading Account");
            if (result.success) {
              setUserAccounts([result.account]);
              setActiveAccount(result.account);
            }
          } else {
            setActiveAccount(accounts[0]);
          }
        } else {
          // V1: For demo mode, create virtual account
          const vAccount = new VirtualAccount();
          setVirtualAccount(vAccount);
          setTxHistory(vAccount.getTransactionHistory());
          setPortfolioHistory(vAccount.portfolioHistory || []);

          // V2: Set demo user for header
          setUser({
            id: 0,
            name: "Demo User",
            email: "demo@signalstack.com",
          });
        }

        // V1: Start price updates
        PriceService.startRealTimeUpdates();

        // V1: Subscribe to price updates
        const unsubscribe = PriceService.subscribe((latestPrices) => {
          setPrices(latestPrices);
          if (virtualAccount) {
            const value = virtualAccount.getPortfolioValue(latestPrices);
            setPortfolioValue(value);
          }
        });

        // V1: Fetch signals
        await fetchSignalData();

        // V3: Track app initialization
        PerformanceMonitor.trackUserInteraction("app_initialized");

        // V2: Hide loading after everything is ready
        setTimeout(() => setIsAppLoading(false), 1000);

        return () => {
          PriceService.stopRealTimeUpdates();
          unsubscribe();
          NewsService.stopNewsStream();
          SecurityService.removeEventListener(
            "security_event",
            handleSecurityEvent
          );
          PerformanceMonitor.stopMonitoring();
        };
      } catch (error) {
        console.error("Failed to initialize app:", error);
        NotificationService.error("Failed to initialize app");
        setIsAppLoading(false);
      }
    };

    initializeApp();
  }, [handleNewsUpdate, handleSecurityEvent]);

  // V1: Keep all your existing functions
  const fetchSignalData = async () => {
    setIsLoadingSignals(true);
    try {
      const signalData = await SignalService.fetchLatestSignals();
      setSignals(signalData);

      const weights = await SignalService.fetchTargetWeights();
      setTargetWeights(weights);

      NotificationService.success("Signals updated successfully");
    } catch (error) {
      console.error("Error fetching signal data:", error);
      NotificationService.error("Failed to fetch signals");
    } finally {
      setIsLoadingSignals(false);
    }
  };

  const executeVirtualRebalance = async () => {
    if (!virtualAccount) return;

    try {
      setIsRebalancing(true);
      const result = virtualAccount.executeRebalance(targetWeights, prices);
      setTxHistory(virtualAccount.getTransactionHistory());
      setPortfolioHistory(virtualAccount.portfolioHistory || []);

      PerformanceMonitor.trackUserInteraction("portfolio_rebalance", {
        newValue: result.newValue,
        timestamp: Date.now(),
      });

      NotificationService.success(
        `Rebalancing complete! Portfolio value: $${result.newValue.toFixed(2)}`
      );
    } catch (error) {
      console.error("Error executing rebalance:", error);
      NotificationService.error("Rebalancing failed: " + error.message);
    } finally {
      setIsRebalancing(false);
    }
  };

  const resetVirtualAccount = () => {
    if (virtualAccount) {
      if (
        window.confirm("Are you sure you want to reset your virtual account?")
      ) {
        virtualAccount.reset();
        setTxHistory(virtualAccount.getTransactionHistory());
        setPortfolioHistory([]);
        setPortfolioValue(virtualAccount.getPortfolioValue(prices));

        PerformanceMonitor.trackUserInteraction("account_reset");
        NotificationService.info("Virtual account has been reset");
      }
    }
  };

  const applyStrategy = (strategyKey, weights) => {
    setTargetWeights(weights);
    setActiveStrategy(strategyKey);

    PerformanceMonitor.trackUserInteraction("strategy_applied", {
      strategy: strategyKey,
    });
    NotificationService.success(
      `Applied ${strategies[strategyKey].getName()} strategy`
    );
  };

  // V1: Keep existing auth functions, enhance for V2 & V3
  const handleLoginSuccess = (credentials) => {
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem(
      "userEmail",
      credentials?.email || "user@signalstack.com"
    );

    setIsAuthenticated(true);
    const accounts = AuthService.getAccounts();
    setUserAccounts(accounts);

    setUser({
      id: 1,
      name: accounts[0]?.name || "Trading User",
      email: credentials?.email || "user@signalstack.com",
    });

    PerformanceMonitor.trackUserInteraction("user_login");
    SecurityService.logSecurityEvent("user_login_success");

    if (accounts.length > 0) {
      setActiveAccount(accounts[0]);
    } else {
      const result = AuthService.createAccount("Main Trading Account");
      if (result.success) {
        setUserAccounts([result.account]);
        setActiveAccount(result.account);
      }
    }
  };

  const handleLogout = () => {
    AuthService.logout();
    setIsAuthenticated(false);
    setUserAccounts([]);
    setActiveAccount(null);
    setUser(null);

    PerformanceMonitor.trackUserInteraction("user_logout");
    SecurityService.logSecurityEvent("user_logout");
    NotificationService.info("You have been logged out");
  };

  const createNewAccount = () => {
    const name = prompt("Enter portfolio name:");
    if (name) {
      const result = AuthService.createAccount(name);
      if (result.success) {
        setUserAccounts([...userAccounts, result.account]);
        setActiveAccount(result.account);

        PerformanceMonitor.trackUserInteraction("account_created");
        NotificationService.success("New portfolio created!");
      } else {
        NotificationService.error("Failed to create portfolio");
      }
    }
  };

  const switchAccount = (accountId) => {
    const account = userAccounts.find((acc) => acc.id === parseInt(accountId));
    if (account) {
      setActiveAccount(account);
      PerformanceMonitor.trackUserInteraction("account_switched");
    }
  };

  // V2: New navigation functions
  const handleNavigate = (route) => {
    console.log("Navigating to:", route);
    setCurrentRoute(route);

    // Update URL without page reload
    window.history.pushState({}, "", route);

    // Close mobile nav if open
    if (isMobileNavOpen) {
      setIsMobileNavOpen(false);
    }
  };

  const toggleMobileNav = () => {
    setIsMobileNavOpen(!isMobileNavOpen);
  };

  // V2: Create portfolio data for new Dashboard
  const createPortfolioData = () => {
    if (!virtualAccount) return null;

    const balances = virtualAccount.getBalances();
    const totalValue = portfolioValue;

    return {
      totalValue: totalValue,
      dayChange: 2.45,
      dayChangeAmount: totalValue * 0.0245,
      allocations: Object.entries(balances)
        .map(([token, balance]) => ({
          name: token,
          value: ((balance * (prices[token] || 0)) / totalValue) * 100 || 0,
          amount: balance * (prices[token] || 0),
          color: getTokenColor(token),
        }))
        .filter((item) => item.value > 0),
      performance: portfolioHistory,
      recentTransactions: txHistory.slice(0, 5).map((tx) => ({
        type: tx.type,
        asset: tx.toToken,
        amount: tx.amountTo,
        value: tx.amountTo * (prices[tx.toToken] || 0),
        time: new Date(tx.timestamp).toLocaleString(),
      })),
    };
  };

  const getTokenColor = (token) => {
    const colors = {
      BTC: "#f7931a",
      ETH: "#627eea",
      ADA: "#0033ad",
      DOT: "#e6007a",
      USDC: "#2775ca",
    };
    return colors[token] || "#8b5cf6";
  };

  // Add function to handle executing trades from signals
  const handleExecuteSignal = (signal) => {
    console.log("Executing signal:", signal);

    if (!virtualAccount) {
      toast.error("Virtual account not initialized");
      return;
    }

    try {
      // Determine what to do based on signal type
      if (signal.type === "BUY") {
        // Calculate how much USD to use (10% of portfolio or fixed amount)
        const usdBalance = virtualAccount.getBalances().USD || 0;
        const amountToSpend = Math.min(usdBalance * 0.1, 1000); // 10% of USD or $1000, whichever is less

        if (amountToSpend <= 0) {
          toast.error(
            `Insufficient USD balance to execute BUY signal for ${signal.asset}`
          );
          return;
        }

        // Execute the trade
        const price = signal.price || prices[signal.asset] || 0;
        if (price <= 0) {
          toast.error(`Invalid price for ${signal.asset}`);
          return;
        }

        const tokenAmount = amountToSpend / price;
        const result = virtualAccount.executeTrade(
          "USD",
          signal.asset,
          amountToSpend,
          tokenAmount
        );

        if (result.success) {
          // Record transaction
          const newTx = {
            type: "BUY",
            fromToken: "USD",
            toToken: signal.asset,
            amountFrom: amountToSpend,
            amountTo: tokenAmount,
            price: price,
            timestamp: new Date().getTime(),
            signalId: signal.id,
          };

          setTxHistory((prev) => [newTx, ...prev]);

          // Update portfolio value
          updatePortfolioValue();

          toast.success(
            `Successfully bought ${tokenAmount.toFixed(6)} ${
              signal.asset
            } for $${amountToSpend.toFixed(2)}`
          );
        } else {
          toast.error(
            result.error || `Failed to execute BUY signal for ${signal.asset}`
          );
        }
      } else if (signal.type === "SELL") {
        // Get token balance
        const tokenBalance = virtualAccount.getBalances()[signal.asset] || 0;

        if (tokenBalance <= 0) {
          toast.error(`No ${signal.asset} balance to sell`);
          return;
        }

        // Sell 50% of the balance
        const amountToSell = tokenBalance * 0.5;
        const price = signal.price || prices[signal.asset] || 0;

        if (price <= 0) {
          toast.error(`Invalid price for ${signal.asset}`);
          return;
        }

        const usdAmount = amountToSell * price;
        const result = virtualAccount.executeTrade(
          signal.asset,
          "USD",
          amountToSell,
          usdAmount
        );

        if (result.success) {
          // Record transaction
          const newTx = {
            type: "SELL",
            fromToken: signal.asset,
            toToken: "USD",
            amountFrom: amountToSell,
            amountTo: usdAmount,
            price: price,
            timestamp: new Date().getTime(),
            signalId: signal.id,
          };

          setTxHistory((prev) => [newTx, ...prev]);

          // Update portfolio value
          updatePortfolioValue();

          toast.success(
            `Successfully sold ${amountToSell.toFixed(6)} ${
              signal.asset
            } for $${usdAmount.toFixed(2)}`
          );
        } else {
          toast.error(
            result.error || `Failed to execute SELL signal for ${signal.asset}`
          );
        }
      } else if (signal.type === "REBALANCE") {
        // Trigger portfolio rebalance
        executeVirtualRebalance();
        toast.success("Portfolio rebalancing initiated based on signal");
      }
    } catch (error) {
      console.error("Error executing signal:", error);
      toast.error(`Failed to execute signal: ${error.message}`);
    }
  };

  // Update portfolio value when prices change
  const updatePortfolioValue = () => {
    if (!virtualAccount) return;

    const balances = virtualAccount.getBalances();
    let totalValue = balances.USD || 0;

    // Add value of all tokens
    Object.keys(balances).forEach((token) => {
      if (token !== "USD" && prices[token]) {
        totalValue += balances[token] * prices[token];
      }
    });

    setPortfolioValue(totalValue);

    // Update portfolio history
    const timestamp = new Date().getTime();
    setPortfolioHistory((prev) => [...prev, { timestamp, value: totalValue }]);

    // Keep only the last 100 data points
    if (portfolioHistory.length > 100) {
      setPortfolioHistory((prev) => prev.slice(prev.length - 100));
    }
  };

  const renderContent = () => {
    switch (currentRoute) {
      case "/dashboard":
        return <Dashboard />;
      case "/portfolio":
        return <PortfolioOverview virtualAccount={virtualAccount} />;
      case "/signals":
        return <TradingSignals />;
      case "/bots":
        return (
          <VirtualTradingTerminal
            virtualAccount={virtualAccount}
            setVirtualAccount={setVirtualAccount}
          />
        );
      case "/market":
        return <MarketOverview />;
      default:
        return <Dashboard />;
    }
  };

  // V3: Enhanced loading screen
  if (isAppLoading) {
    return (
      <div className="app-loading">
        <motion.div
          className="loading-container"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="loading-logo">
            <div className="signal-waves">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
          <h1 className="loading-title">SignalStack</h1>
          <p className="loading-subtitle">
            Initializing your trading dashboard...
          </p>
          <div className="loading-bar">
            <div className="loading-progress"></div>
          </div>

          <div className="loading-status">
            {!isOnline && (
              <span className="status-offline">📴 Offline Mode</span>
            )}
            {isInstallable && (
              <span className="status-installable">
                📱 App Ready to Install
              </span>
            )}
            {updateAvailable && (
              <span className="status-update">🔄 Update Available</span>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // V1: Login screen (Replace with Landing Page)
  if (!isAuthenticated) {
    return (
      <div className="app">
        <LandingPage onLoginSuccess={handleLoginSuccess} />

        <div id="notification-root"></div>

        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />

        <OfflineIndicator isOnline={isOnline} />

        <PWAInstallPrompt
          isVisible={showInstallPrompt && isInstallable && !isInstalled}
          onInstall={handlePWAInstall}
          onDismiss={() => setShowInstallPrompt(false)}
        />

        <PWAUpdatePrompt
          isVisible={showUpdatePrompt}
          onUpdate={handlePWAUpdate}
          onDismiss={() => setShowUpdatePrompt(false)}
        />

        <div className="app-status">
          {!isOnline && (
            <div className="status-item offline">📡 Offline Mode</div>
          )}
        </div>
      </div>
    );
  }

  // V2: Main authenticated app
  return (
    <div className={`app ${theme}`}>
      {/* V2: New Professional Header (Voice props removed) */}
      <Header
        user={user}
        activeAccount={activeAccount}
        userAccounts={userAccounts}
        onSwitchAccount={switchAccount}
        onCreateAccount={createNewAccount}
        onLogout={handleLogout}
        onToggleMobileNav={toggleMobileNav}
        theme={theme}
        onToggleTheme={toggleTheme}
        currentRoute={currentRoute}
        onNavigate={handleNavigate}
      />

      {/* V2: Mobile Navigation */}
      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        currentRoute={currentRoute}
        onNavigate={handleNavigate}
      />

      {/* V2: Main Content with Route Management */}
      <main className="app-content">
        <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
      </main>

      {/* PWA Components */}
      <OfflineIndicator isOnline={isOnline} />

      <PWAInstallPrompt
        isVisible={showInstallPrompt && isInstallable && !isInstalled}
        onInstall={handlePWAInstall}
        onDismiss={() => setShowInstallPrompt(false)}
      />

      <PWAUpdatePrompt
        isVisible={showUpdatePrompt}
        onUpdate={handlePWAUpdate}
        onDismiss={() => setShowUpdatePrompt(false)}
      />

      {/* Status indicators (Voice indicator removed) */}
      <div className="app-status">
        {!isOnline && (
          <div className="status-item offline">📡 Offline Mode</div>
        )}
        {isRebalancing && (
          <div className="status-item rebalancing">⚖️ Rebalancing...</div>
        )}
      </div>

      {/* Notification containers */}
      <div id="notification-root"></div>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}

// Wrap the App with InternetIdentityProvider
const AppWithInternetIdentity = () => {
  return (
    <InternetIdentityProvider
      whitelist={["rrkah-fqaaa-aaaaa-aaaaq-cai"]} // Replace with your canister ID if different
      host={process.env.REACT_APP_IC_HOST || "https://ic0.app"}
    >
      <App />
    </InternetIdentityProvider>
  );
};

export default AppWithInternetIdentity;
