/* global PublicKeyCredential */
import NotificationService from './NotificationService';

class SecurityService {
  constructor() {
    // Basic authentication properties
    this.isAuthenticated = false;
    this.user = null;
    this.sessionToken = null;
    this.refreshToken = null;
    this.securityLevel = 'basic';
    this.twoFactorEnabled = false;
    
    // Advanced security properties
    this.sessions = new Map();
    this.deviceFingerprints = new Map();
    this.rateLimits = new Map();
    this.securityEvents = [];
    this.encryptionKey = null;
    this.biometricSupported = false;
    this.deviceFingerprint = null;
    
    this.initializeSecurity();
  }

  async initializeSecurity() {
    // Check biometric support
    if ('credentials' in navigator && 'create' in navigator.credentials) {
      this.biometricSupported = await this.checkBiometricSupport();
    }
    
    // Generate device fingerprint
    this.deviceFingerprint = await this.generateDeviceFingerprint();
    
    // Load saved security preferences
    this.loadSecurityPreferences();
    
    // Set up security monitoring
    this.setupSecurityMonitoring();
    
    // Check for existing session
    await this.checkExistingSession();
    
    console.log('Security service initialized');
  }

  // Fixed biometric support check
  async checkBiometricSupport() {
    try {
      // Check if PublicKeyCredential is available
         if (typeof window !== 'undefined' && 
        typeof PublicKeyCredential !== 'undefined' && 
        typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        this.biometricSupported = available;
        
        if (available) {
          console.log('Biometric authentication supported');
        }
        return available;
      }
      return false;
    } catch (error) {
      console.warn('Biometric check failed:', error);
      this.biometricSupported = false;
      return false;
    }
  }

  // Fixed Device Fingerprinting with proper screen access
  async generateDeviceFingerprint() {
    const fingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      // Fixed screen access
          screenResolution: (typeof window !== 'undefined' && window.screen) ? `${window.screen.width}x${window.screen.height}` : 'unknown',
    colorDepth: (typeof window !== 'undefined' && window.screen) ? window.screen.colorDepth : 'unknown',
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: navigator.deviceMemory || 'unknown',
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,
      timestamp: Date.now()
    };

    // Add canvas fingerprint
    fingerprint.canvas = await this.generateCanvasFingerprint();
    
    // Add WebGL fingerprint
    fingerprint.webglFingerprint = this.generateWebGLFingerprint();
    
    // Create hash of fingerprint
    const fingerprintHash = await this.hashFingerprint(fingerprint);
    this.deviceFingerprints.set('current', {
      hash: fingerprintHash,
      details: fingerprint
    });
    
    return fingerprintHash.substring(0, 32); // First 32 characters
  }

  // Fixed canvas fingerprint generation
  async generateCanvasFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 200;
      canvas.height = 50;
      
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('SignalStack Security 🔒', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('Security Fingerprint', 4, 35);
      
      return canvas.toDataURL();
    } catch (error) {
      console.warn('Canvas fingerprinting failed:', error);
      return 'canvas-not-supported';
    }
  }

  // Fixed WebGL fingerprint
  generateWebGLFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (!gl) return 'not-supported';
      
      return {
        vendor: gl.getParameter(gl.VENDOR) || 'unknown',
        renderer: gl.getParameter(gl.RENDERER) || 'unknown',
        version: gl.getParameter(gl.VERSION) || 'unknown',
        shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION) || 'unknown'
      };
    } catch (error) {
      console.warn('WebGL fingerprinting failed:', error);
      return 'webgl-not-supported';
    }
  }

  async hashFingerprint(fingerprint) {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(fingerprint));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async createHash(data) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Enhanced Authentication Methods
  async login(credentials) {
    try {
      // Check rate limiting
      if (!this.checkRateLimit('login_attempt', 5, 300000)) { // 5 attempts per 5 minutes
        throw new Error('Too many login attempts. Please try again later.');
      }

      const loginAttempt = {
        timestamp: Date.now(),
        type: 'login_attempt',
        deviceFingerprint: this.deviceFingerprint,
        ipAddress: await this.getClientIP()
      };

      // Validate credentials
      const response = await this.validateCredentials(credentials);
      
      if (response.success) {
        this.isAuthenticated = true;
        this.user = response.user;
        this.sessionToken = response.sessionToken;
        this.refreshToken = response.refreshToken;
        this.securityLevel = response.securityLevel || 'basic';
        this.twoFactorEnabled = response.user.twoFactorEnabled || false;
        
        // Create secure session
        this.createSecureSession(this.user.id);
        
        // Log successful login
        this.logSecurityEvent({
          ...loginAttempt,
          type: 'login_success',
          userId: this.user.id
        });
        
        // Check if 2FA is required
        if (this.user.twoFactorEnabled && !response.twoFactorVerified) {
          return { success: true, requiresTwoFactor: true };
        }
        
        // Setup session monitoring
        this.setupSessionMonitoring();
        
        if (NotificationService && NotificationService.success) {
          NotificationService.success('Login successful', {
            duration: 3000
          });
        }
        
        return { success: true, user: this.user };
      } else {
        this.logSecurityEvent({
          ...loginAttempt,
          type: 'login_failed',
          reason: response.error
        });
        
        throw new Error(response.error || 'Login failed');
      }
    } catch (error) {
      if (NotificationService && NotificationService.error) {
        NotificationService.error(`Login failed: ${error.message}`);
      }
      throw error;
    }
  }

  // Enhanced Biometric Authentication
  async setupBiometricLogin() {
    if (!this.biometricSupported) {
      throw new Error('Biometric authentication not supported');
    }

    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      
      // Create credential
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: "SignalStack",
            id: window.location.hostname,
          },
          user: {
            id: new TextEncoder().encode(this.user.id),
            name: this.user.email,
            displayName: this.user.name,
          },
          pubKeyCredParams: [{alg: -7, type: "public-key"}],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required"
          },
          timeout: 60000,
          attestation: "direct"
        }
      });

      // Save credential to local storage and server
      const credentialData = {
        id: credential.id,
        rawId: Array.from(new Uint8Array(credential.rawId)),
        publicKey: Array.from(new Uint8Array(credential.response.getPublicKey())),
        challenge: Array.from(challenge)
      };
      
      localStorage.setItem(`biometric_${this.user.id}`, JSON.stringify(credentialData));

      await this.saveCredential({
        credentialId: credential.id,
        publicKey: credential.response.publicKey,
        userId: this.user.id
      });

      this.logSecurityEvent({
        type: 'biometric_setup',
        userId: this.user.id,
        timestamp: Date.now()
      });

      if (NotificationService && NotificationService.success) {
        NotificationService.success('Biometric authentication setup complete');
      }
      return true;
    } catch (error) {
      console.error('Biometric setup failed:', error);
      if (NotificationService && NotificationService.error) {
        NotificationService.error('Failed to setup biometric authentication');
      }
      throw error;
    }
  }

  async authenticateWithBiometric(userId) {
    if (!this.biometricSupported) {
      throw new Error('Biometric authentication not supported');
    }

    const credentialData = localStorage.getItem(`biometric_${userId}`);
    if (!credentialData) {
      throw new Error('No biometric credentials found');
    }

    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const { id } = JSON.parse(credentialData);

      const credential = await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [{
            id: new Uint8Array(JSON.parse(credentialData).rawId),
            type: 'public-key',
          }],
          userVerification: "required",
          timeout: 60000,
        }
      });

      // Verify credential with server
      const verification = await this.verifyBiometricCredential({
        credentialId: credential.id,
        signature: credential.response.signature,
        authenticatorData: credential.response.authenticatorData
      });

      if (verification.success) {
        this.isAuthenticated = true;
        this.user = verification.user;
        this.sessionToken = verification.sessionToken;
        this.securityLevel = 'high';

        this.logSecurityEvent({
          type: 'biometric_login',
          userId: this.user.id,
          timestamp: Date.now()
        });

        if (NotificationService && NotificationService.success) {
          NotificationService.success('Biometric authentication successful');
        }
        return { success: true, user: this.user };
      } else {
        throw new Error('Biometric verification failed');
      }
    } catch (error) {
      this.logSecurityEvent({
        type: 'biometric_failed',
        userId,
        timestamp: Date.now(),
        error: error.message
      });
      
      if (NotificationService && NotificationService.error) {
        NotificationService.error('Biometric authentication failed');
      }
      throw error;
    }
  }

  // Enhanced Two-Factor Authentication
  async setupTwoFactor() {
    try {
      const secret = this.generateTOTPSecret();
      const qrCode = this.generateQRCode(this.user.id, secret);
      
      // Store encrypted secret
      const encryptedSecret = await this.encryptData(secret);
      localStorage.setItem(`totp_${this.user.id}`, encryptedSecret);
      
      return {
        secret,
        qrCode,
        backupCodes: this.generateBackupCodes()
      };
    } catch (error) {
      if (NotificationService && NotificationService.error) {
        NotificationService.error('Failed to setup 2FA');
      }
      throw error;
    }
  }

  async verifyTwoFactor(token) {
    try {
      const verification = await this.verifyTOTP(this.user.id, token);
      
      if (verification) {
        this.twoFactorEnabled = true;
        this.securityLevel = 'high';
        
        this.logSecurityEvent({
          type: '2fa_verified',
          userId: this.user.id,
          timestamp: Date.now()
        });
        
        if (NotificationService && NotificationService.success) {
          NotificationService.success('Two-factor authentication verified');
        }
        return true;
      } else {
        throw new Error('Invalid verification code');
      }
    } catch (error) {
      this.logSecurityEvent({
        type: '2fa_failed',
        userId: this.user?.id,
        timestamp: Date.now(),
        error: error.message
      });
      
      if (NotificationService && NotificationService.error) {
        NotificationService.error('Two-factor verification failed');
      }
      throw error;
    }
  }

  generateTOTPSecret() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  }

  generateQRCode(userId, secret) {
    const issuer = 'SignalStack';
    const label = `${issuer}:${userId}`;
    const otpauth = `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauth)}`;
  }

  generateBackupCodes() {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substr(2, 8).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  async verifyTOTP(userId, token) {
    const encryptedSecret = localStorage.getItem(`totp_${userId}`);
    if (!encryptedSecret) return false;
    
    const secret = await this.decryptData(encryptedSecret);
    return this.validateTOTPToken(secret, token);
  }

  validateTOTPToken(secret, token) {
    const timeWindow = Math.floor(Date.now() / 30000);
    
    // Check current window and ±1 window for clock skew
    for (let window = timeWindow - 1; window <= timeWindow + 1; window++) {
      const expectedToken = this.generateTOTPToken(secret, window);
      if (expectedToken === token) return true;
    }
    
    return false;
  }

  generateTOTPToken(secret, timeWindow) {
    // Simplified TOTP implementation
    const key = this.base32Decode(secret);
    const time = timeWindow || Math.floor(Date.now() / 30000);
    const timeBytes = new ArrayBuffer(8);
    const timeView = new DataView(timeBytes);
    timeView.setUint32(4, time, false);
    
    // This is a simplified version - in production, use a proper TOTP library
    const hash = this.hmacSha1(key, new Uint8Array(timeBytes));
    const offset = hash[hash.length - 1] & 0xf;
    const code = ((hash[offset] & 0x7f) << 24) |
                 ((hash[offset + 1] & 0xff) << 16) |
                 ((hash[offset + 2] & 0xff) << 8) |
                 (hash[offset + 3] & 0xff);
    
    return (code % 1000000).toString().padStart(6, '0');
  }

  base32Decode(encoded) {
    // Simplified base32 decode - use proper library in production
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = '';
    for (let char of encoded) {
      bits += alphabet.indexOf(char).toString(2).padStart(5, '0');
    }
    
    const bytes = [];
    for (let i = 0; i < bits.length; i += 8) {
      if (i + 8 <= bits.length) {
        bytes.push(parseInt(bits.substr(i, 8), 2));
      }
    }
    return new Uint8Array(bytes);
  }

  hmacSha1(key, data) {
    // Simplified HMAC-SHA1 - use crypto library in production
    return new Uint8Array(32); // Placeholder
  }

  // Enhanced Session Management
  createSecureSession(userId) {
    const sessionId = this.generateSecureToken();
    const session = {
      id: sessionId,
      userId,
      deviceFingerprint: this.deviceFingerprints.get('current')?.hash,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      ipAddress: 'unknown', // Would be set by server
      userAgent: navigator.userAgent,
      isValid: true
    };
    
    this.sessions.set(sessionId, session);
    localStorage.setItem('secure_session', sessionId);
    localStorage.setItem('session_token', this.sessionToken);
    localStorage.setItem('refresh_token', this.refreshToken);
    
    this.logSecurityEvent('session_created', { userId, sessionId });
    return session;
  }

  async validateSession() {
    const sessionId = localStorage.getItem('secure_session');
    if (!sessionId) return false;

    const session = this.sessions.get(sessionId);
    if (!session || !session.isValid) {
      // Try to validate with server
      if (!this.sessionToken) return false;

      try {
        const response = await fetch('/api/auth/validate-session', {
          headers: {
            'Authorization': `Bearer ${this.sessionToken}`
          }
        });

        if (!response.ok) {
          throw new Error('Session validation failed');
        }

        return true;
      } catch (error) {
        this.logout();
        return false;
      }
    }
    
    // Check session timeout (24 hours)
    const sessionAge = Date.now() - session.createdAt;
    if (sessionAge > 24 * 60 * 60 * 1000) {
      this.invalidateSession(sessionId);
      return false;
    }
    
    // Check device fingerprint
    const currentFingerprint = this.deviceFingerprints.get('current')?.hash;
    if (session.deviceFingerprint !== currentFingerprint) {
      this.logSecurityEvent('device_fingerprint_mismatch', { sessionId });
      if (NotificationService && NotificationService.warning) {
        NotificationService.warning('Device fingerprint changed - please re-authenticate');
      }
      return false;
    }
    
    // Update last activity
    session.lastActivity = Date.now();
    return true;
  }

  invalidateSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isValid = false;
      this.logSecurityEvent('session_invalidated', { sessionId });
    }
    localStorage.removeItem('secure_session');
  }

  async refreshSession() {
    if (!this.refreshToken) {
      this.logout();
      return false;
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          refreshToken: this.refreshToken
        })
      });

      if (response.ok) {
        const data = await response.json();
        this.sessionToken = data.sessionToken;
        this.refreshToken = data.refreshToken;
        localStorage.setItem('session_token', this.sessionToken);
        localStorage.setItem('refresh_token', this.refreshToken);
        return true;
      } else {
        this.logout();
        return false;
      }
    } catch (error) {
      this.logout();
      return false;
    }
  }

  // Rate Limiting
  checkRateLimit(action, limit = 5, windowMs = 60000) {
    const key = `${action}_${this.deviceFingerprints.get('current')?.hash}`;
    const now = Date.now();
    
    if (!this.rateLimits.has(key)) {
      this.rateLimits.set(key, []);
    }
    
    const attempts = this.rateLimits.get(key);
    
    // Remove old attempts outside window
    const validAttempts = attempts.filter(time => now - time < windowMs);
    this.rateLimits.set(key, validAttempts);
    
    if (validAttempts.length >= limit) {
      this.logSecurityEvent('rate_limit_exceeded', { action, attempts: validAttempts.length });
      return false;
    }
    
    // Add current attempt
    validAttempts.push(now);
    return true;
  }

  // Encryption/Decryption
  async generateEncryptionKey() {
    if (!this.encryptionKey) {
      this.encryptionKey = await crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
      );
    }
    return this.encryptionKey;
  }

  async encryptData(data) {
    const key = await this.generateEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(data);
    
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encodedData
    );
    
    // Combine iv and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return btoa(String.fromCharCode(...combined));
  }

  async decryptData(encryptedData) {
    const key = await this.generateEncryptionKey();
    const combined = new Uint8Array([...atob(encryptedData)].map(c => c.charCodeAt(0)));
    
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      encrypted
    );
    
    return new TextDecoder().decode(decrypted);
  }

  // Enhanced Security Monitoring
  setupSecurityMonitoring() {
    // Monitor for suspicious activities
    this.monitorLoginAttempts();
    this.monitorDeviceChanges();
    this.monitorSessionActivity();
    this.setupCSRFProtection();
    this.monitorPageVisibility();
    this.monitorDevTools();
    this.monitorNetworkChanges();
  }

  monitorLoginAttempts() {
    const failedAttempts = this.securityEvents.filter(
      event => event.type === 'login_failed' && 
      Date.now() - event.timestamp < 3600000 // Last hour
    );

    if (failedAttempts.length >= 5) {
      this.triggerSecurityAlert('multiple_failed_logins', {
        count: failedAttempts.length,
        timeframe: '1 hour'
      });
    }
  }

  monitorDeviceChanges() {
    const savedFingerprint = localStorage.getItem('device_fingerprint');
    if (savedFingerprint && savedFingerprint !== this.deviceFingerprint) {
      this.triggerSecurityAlert('device_change_detected', {
        oldFingerprint: savedFingerprint,
        newFingerprint: this.deviceFingerprint
      });
    }
    localStorage.setItem('device_fingerprint', this.deviceFingerprint);
  }

  setupSessionMonitoring() {
    // Monitor for session hijacking
    setInterval(() => {
      this.validateSession();
    }, 300000); // Every 5 minutes

    // Monitor for concurrent sessions
    this.checkConcurrentSessions();
  }

  setupCSRFProtection() {
    // Generate CSRF token
    const csrfToken = this.generateCSRFToken();
    
    // Add to all API requests
    const originalFetch = window.fetch;
    window.fetch = (url, options = {}) => {
      if (options.method && options.method !== 'GET') {
        options.headers = {
          ...options.headers,
          'X-CSRF-Token': csrfToken
        };
      }
      return originalFetch(url, options);
    };
  }

  generateCSRFToken() {
    return Math.random().toString(36).substr(2) + Date.now().toString(36);
  }

  monitorPageVisibility() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.logSecurityEvent('page_hidden');
      } else {
        this.logSecurityEvent('page_visible');
      }
    });
  }

  // Fixed monitor dev tools
  monitorDevTools() {
    let devtools = false;
    const threshold = 160;
    
    const checkDevTools = () => {
      try {
        if (window.outerHeight - window.innerHeight > threshold ||
            window.outerWidth - window.innerWidth > threshold) {
          if (!devtools) {
            devtools = true;
            this.logSecurityEvent('devtools_opened');
            if (NotificationService && NotificationService.warning) {
              NotificationService.warning('Developer tools detected');
            }
          }
        } else {
          devtools = false;
        }
      } catch (error) {
        // Silently handle errors in dev tools detection
      }
    };

    // Check every 500ms
    setInterval(checkDevTools, 500);
  }

  // Fixed network monitoring
  monitorNetworkChanges() {
    try {
      if ('connection' in navigator && navigator.connection) {
        navigator.connection.addEventListener('change', () => {
          this.logSecurityEvent('network_changed', {
            effectiveType: navigator.connection.effectiveType || 'unknown',
            downlink: navigator.connection.downlink || 'unknown'
          });
        });
      }
    } catch (error) {
      console.warn('Network monitoring not supported:', error);
    }
  }

  triggerSecurityAlert(alertType, details) {
    const alert = {
      type: alertType,
      details,
      timestamp: Date.now(),
      severity: this.getAlertSeverity(alertType)
    };

    this.logSecurityEvent(alert);

    if (NotificationService && NotificationService.notify) {
      NotificationService.notify('security_alert', 
        `Security Alert: ${this.getAlertMessage(alertType)}`, {
        priority: alert.severity === 'critical' ? 'critical' : 'high',
        persistent: true,
        actions: [
          { label: 'Review', action: 'REVIEW_SECURITY' },
          { label: 'Secure Account', action: 'SECURE_ACCOUNT' }
        ]
      });
    }
  }

  getAlertSeverity(alertType) {
    const severities = {
      'multiple_failed_logins': 'high',
      'device_change_detected': 'medium',
      'suspicious_activity': 'high',
      'session_hijacking': 'critical',
      'data_breach_attempt': 'critical'
    };
    return severities[alertType] || 'medium';
  }

  getAlertMessage(alertType) {
    const messages = {
      'multiple_failed_logins': 'Multiple failed login attempts detected',
      'device_change_detected': 'Login from new device detected',
      'suspicious_activity': 'Suspicious account activity detected',
      'session_hijacking': 'Potential session hijacking detected',
      'data_breach_attempt': 'Potential data breach attempt detected'
    };
    return messages[alertType] || 'Security anomaly detected';
  }

  logout() {
    this.isAuthenticated = false;
    this.user = null;
    this.sessionToken = null;
    this.refreshToken = null;
    this.securityLevel = 'basic';
    this.twoFactorEnabled = false;
    
    // Clear stored data
    localStorage.removeItem('session_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('secure_session');
    
    this.logSecurityEvent({
      type: 'logout',
      timestamp: Date.now()
    });

    if (NotificationService && NotificationService.info) {
      NotificationService.info('You have been logged out');
    }
  }

  // Security Event Logging
  logSecurityEvent(event) {
    const securityEvent = typeof event === 'string' ? 
      { type: event, timestamp: Date.now() } : event;
    
    const enhancedEvent = {
      ...securityEvent,
      userAgent: navigator.userAgent,
      url: window.location.href,
      deviceFingerprint: this.deviceFingerprints.get('current')?.hash
    };
    
    this.securityEvents.push(enhancedEvent);
    
    // Keep only last 1000 events
    if (this.securityEvents.length > 1000) {
      this.securityEvents = this.securityEvents.slice(-1000);
    }
    
    // Save to localStorage for persistence
    localStorage.setItem('security_events', JSON.stringify(this.securityEvents));
    
    // Send to server in production
    console.log('Security Event:', enhancedEvent);
    
    // Trigger alerts for critical events
    if (['rate_limit_exceeded', 'device_fingerprint_mismatch', 'biometric_auth_failed'].includes(securityEvent.type)) {
      if (NotificationService && NotificationService.warning) {
        NotificationService.warning(`Security Alert: ${securityEvent.type}`, {
          persistent: true,
          priority: 'high'
        });
      }
    }
  }

  loadSecurityPreferences() {
    const preferences = localStorage.getItem('security_preferences');
    if (preferences) {
      const parsed = JSON.parse(preferences);
      this.twoFactorEnabled = parsed.twoFactorEnabled || false;
      this.securityLevel = parsed.securityLevel || 'basic';
    }
    
    // Load security events
    const events = localStorage.getItem('security_events');
    if (events) {
      this.securityEvents = JSON.parse(events);
    }
  }

  async checkExistingSession() {
    const sessionToken = localStorage.getItem('session_token');
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (sessionToken && refreshToken) {
      this.sessionToken = sessionToken;
      this.refreshToken = refreshToken;
      
      // Validate existing session
      const isValid = await this.validateSession();
      if (!isValid) {
        // Try to refresh
        await this.refreshSession();
      }
    }
  }

  checkConcurrentSessions() {
    // This would be implemented with server-side session tracking
    console.log('Checking for concurrent sessions...');
  }

  // Utility Methods
  generateSecureToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/[<>\"']/g, '') // Remove potential XSS characters
      .trim()
      .slice(0, 1000); // Limit length
  }

  validateInput(input, pattern) {
    if (typeof input !== 'string') return false;
    return pattern.test(input);
  }

  async getClientIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  }

  // Event listeners management
  addEventListener(event, callback) {
    if (!this.eventListeners) {
      this.eventListeners = new Map();
    }
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  removeEventListener(event, callback) {
    if (this.eventListeners && this.eventListeners.has(event)) {
      const callbacks = this.eventListeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Public API
  isSecureContext() {
    return window.isSecureContext && window.location.protocol === 'https:';
  }

  getSecurityStatus() {
    return {
      isAuthenticated: this.isAuthenticated,
      isSecureContext: this.isSecureContext(),
      biometricSupported: this.biometricSupported,
      twoFactorEnabled: this.twoFactorEnabled,
      securityLevel: this.securityLevel,
      hasActiveSession: !!localStorage.getItem('secure_session'),
      deviceFingerprint: this.deviceFingerprints.get('current')?.hash,
      eventCount: this.securityEvents.length
    };
  }

  getSecurityEvents() {
    return this.securityEvents;
  }

  getSecurityLevel() {
    return this.securityLevel;
  }

  isSecure() {
    return this.securityLevel === 'high' && this.isAuthenticated;
  }

  exportSecurityReport() {
    return {
      timestamp: Date.now(),
      events: this.securityEvents.slice(-100), // Last 100 events
      deviceInfo: this.deviceFingerprints.get('current')?.details,
      securityStatus: this.getSecurityStatus()
    };
  }

  // Mock API methods (replace with real API calls)
  async validateCredentials(credentials) {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        if (credentials.email === 'demo@signalstack.com' && credentials.password === 'password') {
          resolve({
            success: true,
            user: {
              id: '1',
              email: 'demo@signalstack.com',
              name: 'Demo User',
              twoFactorEnabled: false
            },
            sessionToken: 'mock_session_token',
            refreshToken: 'mock_refresh_token',
            securityLevel: 'basic'
          });
        } else {
          resolve({
            success: false,
            error: 'Invalid credentials'
          });
        }
      }, 1000);
    });
  }

  async saveCredential(credential) {
    // Mock save to server
    console.log('Saving biometric credential:', credential);
    return Promise.resolve({ success: true });
  }

  async verifyBiometricCredential(credential) {
    // Mock verification
    console.log('Verifying biometric credential:', credential);
    return Promise.resolve({
      success: true,
      user: {
        id: '1',
        email: 'demo@signalstack.com',
        name: 'Demo User'
      },
      sessionToken: 'mock_biometric_session_token'
    });
  }
   // Add this method anywhere in your SecurityService class (after existing methods)
monitorSessionActivity() {
  // Track user activity
  const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
  let lastActivity = Date.now();
  
  const updateActivity = () => {
    lastActivity = Date.now();
    localStorage.setItem('lastActivity', lastActivity.toString());
  };
  
  // Add event listeners for user activity
  activityEvents.forEach(event => {
    document.addEventListener(event, updateActivity, { passive: true });
  });
  
  // Check for session timeout every minute
  setInterval(() => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivity;
    const sessionTimeout = 30 * 60 * 1000; // 30 minutes
    
    if (timeSinceLastActivity > sessionTimeout && this.isAuthenticated) {
      console.warn('Session timeout due to inactivity');
      this.logSecurityEvent({
        type: 'session_timeout',
        timestamp: now,
        reason: 'inactivity'
      });
      this.logout();
    }
  }, 60000); // Check every minute
  
  console.log('Session activity monitoring started');
}
// Add this method too (if it's missing)
setupSecurityMonitoring() {
  // Monitor login attempts
  this.monitorLoginAttempts();
  
  // Monitor device changes
  this.monitorDeviceChanges();
  
  // Monitor session activity
  this.monitorSessionActivity();
  
  // Setup CSRF protection
  this.setupCSRFProtection();
  
  // Monitor page visibility
  this.monitorPageVisibility();
  
  // Monitor dev tools
  this.monitorDevTools();
  
  // Monitor network changes
  this.monitorNetworkChanges();
  
  console.log('Security monitoring setup complete');
}
}

export default new SecurityService();