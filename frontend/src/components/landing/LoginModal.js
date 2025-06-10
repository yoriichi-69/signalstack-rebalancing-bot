import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInternetIdentity } from "ic-use-internet-identity";

const LoginModal = ({ onClose, onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });

  const { login, loginStatus, isAuthenticated, identity } =
    useInternetIdentity();

  // Check authentication status immediately
  useEffect(() => {
    if (isAuthenticated && identity) {
      onLogin({ method: "internet-identity" });
      onClose();
    }
  }, [isAuthenticated, identity, onLogin, onClose]);

  // If already authenticated, don't render the modal
  if (isAuthenticated && identity) {
    return null;
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add your authentication logic here
    if (formData.email && formData.password) {
      // Set authentication status
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userEmail", formData.email);

      // Call the onLogin callback with form data
      onLogin(formData);

      // Close modal - don't redirect here, let parent handle it
      onClose();
    }
  };

  const handleInternetIdentityLogin = async () => {
    try {
      // Check if already authenticated before attempting login
      if (isAuthenticated && identity) {
        onLogin({ method: "internet-identity" });
        onClose();
        return;
      }

      await login();
    } catch (error) {
      if (error.message.includes("already authenticated")) {
        onLogin({ method: "internet-identity" });
        onClose();
      }
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="login-modal"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="modal-close" onClick={onClose}>
            ×
          </button>

          <div className="modal-header">
            <h2>{isLogin ? "Welcome Back" : "Join CryptoRizz"}</h2>
            <p>{isLogin ? "Sign in to your account" : "Create your account"}</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {!isLogin && (
              <div className="form-group">
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
            </div>

            {!isLogin && (
              <div className="form-group">
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
              </div>
            )}

            <button type="submit" className="btn-login">
              {isLogin ? "Sign In" : "Create Account"}
            </button>
          </form>

          {/* Internet Identity Login Button */}
          <div style={{ margin: "16px 0", textAlign: "center" }}>
            <button
              type="button"
              className="btn-login"
              onClick={handleInternetIdentityLogin}
              disabled={
                loginStatus === "logging-in" || (isAuthenticated && identity)
              }
            >
              {loginStatus === "logging-in"
                ? "Logging in with Internet Identity..."
                : "Login with Internet Identity"}
            </button>
          </div>

          <div className="modal-footer">
            <p>
              {isLogin
                ? "Don't have an account? "
                : "Already have an account? "}
              <button
                className="link-button"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? "Sign Up" : "Sign In"}
              </button>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LoginModal;
