import React, { useState, useEffect } from "react";
import AuthService from "../services/AuthService";
import { useInternetIdentity } from "ic-use-internet-identity";

const LoginForm = ({ onSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const { login, loginStatus, isAuthenticated, identity } =
    useInternetIdentity();

  // Check authentication status immediately and redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && identity) {
      onSuccess();
    }
  }, [isAuthenticated, identity, onSuccess]);

  // If already authenticated, don't render the form
  if (isAuthenticated && identity) {
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    if (isRegistering) {
      const result = AuthService.register(email, password);
      if (result.success) {
        onSuccess();
      } else {
        setError(result.message || "Registration failed.");
      }
    } else {
      const loggedIn = AuthService.login(email, password);
      if (loggedIn) {
        onSuccess();
      } else {
        setError("Invalid email or password.");
      }
    }
  };

  const handleInternetIdentityLogin = async () => {
    try {
      // Check if already authenticated before attempting login
      if (isAuthenticated && identity) {
        onSuccess();
        return;
      }

      await login();
    } catch (error) {
      if (error.message.includes("already authenticated")) {
        onSuccess();
      } else {
        setError("Failed to login with Internet Identity. Please try again.");
      }
    }
  };

  return (
    <div className="auth-form">
      <h2>{isRegistering ? "Create Account" : "Sign In"}</h2>

      {error && <div className="auth-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />
        </div>

        <button type="submit" className="btn-primary">
          {isRegistering ? "Register" : "Login"}
        </button>
      </form>

      <p className="auth-switch">
        {isRegistering ? "Already have an account?" : "Need an account?"}
        <button
          className="btn-text"
          onClick={() => setIsRegistering(!isRegistering)}
        >
          {isRegistering ? "Sign In" : "Register"}
        </button>
      </p>

      <div className="auth-demo">
        <p>Demo Credentials:</p>
        <p>Email: demo@example.com</p>
        <p>Password: password</p>
      </div>

      <div style={{ margin: "16px 0", textAlign: "center" }}>
        <button
          type="button"
          className="btn-primary"
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
    </div>
  );
};

export default LoginForm;
