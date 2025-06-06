import React, { useState } from 'react';
import AuthService from '../services/AuthService';

const LoginForm = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    
    if (isRegistering) {
      const result = AuthService.register(email, password);
      if (result.success) {
        onSuccess();
      } else {
        setError(result.message || 'Registration failed.');
      }
    } else {
      const loggedIn = AuthService.login(email, password);
      if (loggedIn) {
        onSuccess();
      } else {
        setError('Invalid email or password.');
      }
    }
  };
  
  return (
    <div className="auth-form">
      <h2>{isRegistering ? 'Create Account' : 'Sign In'}</h2>
      
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
          {isRegistering ? 'Register' : 'Login'}
        </button>
      </form>
      
      <p className="auth-switch">
        {isRegistering ? 'Already have an account?' : 'Need an account?'}
        <button
          className="btn-text"
          onClick={() => setIsRegistering(!isRegistering)}
        >
          {isRegistering ? 'Sign In' : 'Register'}
        </button>
      </p>
      
      <div className="auth-demo">
        <p>Demo Credentials:</p>
        <p>Email: demo@example.com</p>
        <p>Password: password</p>
      </div>
    </div>
  );
};

export default LoginForm;