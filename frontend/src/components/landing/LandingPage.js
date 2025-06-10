import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useInternetIdentity } from "ic-use-internet-identity";
import "./LandingPage.css";
import HeroSection from "./HeroSection";
import StatsSection from "./StatsSection";
import FeaturesSection from "./FeaturesSection";
import LoginModal from "./LoginModal";

const LandingPage = ({ onLoginSuccess }) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [cryptoStats, setCryptoStats] = useState({
    totalMarketCap: 0,
    totalVolume: 0,
    activeCryptos: 0,
    marketSentiment: "bullish",
  });

  const { isAuthenticated, identity } = useInternetIdentity();

  // Use your existing market data
  useEffect(() => {
    // You can integrate this with your existing MarketOverview data
    setCryptoStats({
      totalMarketCap: 2.1e12, // 2.1T
      totalVolume: 89.5e9, // 89.5B
      activeCryptos: 10847,
      marketSentiment: "bullish",
    });
  }, []);

  const handleLogin = () => {
    // Check if already authenticated
    if (isAuthenticated && identity) {
      onLoginSuccess({ method: "internet-identity" });
      return;
    }
    setShowLoginModal(true);
  };

  return (
    <div className="landing-page">
      <HeroSection onLogin={handleLogin} />
      <StatsSection stats={cryptoStats} />
      <FeaturesSection />

      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onLogin={(credentials) => {
            setShowLoginModal(false);
            onLoginSuccess(credentials);
          }}
        />
      )}
    </div>
  );
};

export default LandingPage;
