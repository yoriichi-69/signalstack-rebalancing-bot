class AuthService {
  constructor() {
    this.users = JSON.parse(localStorage.getItem('users')) || {
      'demo@example.com': { password: 'password', accounts: [] }
    };
    
    this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
  }
  
  isAuthenticated() {
    return !!this.currentUser;
  }
  
  getCurrentUser() {
    return this.currentUser;
  }
  
  login(email, password) {
    // Check if user exists and password matches
    if (this.users[email] && this.users[email].password === password) {
      this.currentUser = {
        email,
        lastLogin: new Date()
      };
      localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
      return true;
    }
    return false;
  }
  
  register(email, password) {
    // Check if user already exists
    if (this.users[email]) {
      return { success: false, message: "User already exists" };
    }
    
    // Add new user
    this.users[email] = {
      password,
      accounts: []
    };
    
    localStorage.setItem('users', JSON.stringify(this.users));
    
    // Auto-login after registration
    this.login(email, password);
    
    return { success: true };
  }
  
  logout() {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
  }
  
  createAccount(accountName) {
    if (!this.currentUser) {
      return { success: false, message: "Not logged in" };
    }
    
    const email = this.currentUser.email;
    const newAccount = {
      id: Date.now().toString(),
      name: accountName,
      created: new Date(),
      balances: {
        'ETH': 1.0,
        'BTC': 0.05,
        'USDC': 10000
      },
      transactions: [],
      portfolioHistory: []
    };
    
    this.users[email].accounts.push(newAccount);
    localStorage.setItem('users', JSON.stringify(this.users));
    
    return { success: true, account: newAccount };
  }
  
  getAccounts() {
    if (!this.currentUser) {
      return [];
    }
    
    const email = this.currentUser.email;
    return this.users[email]?.accounts || [];
  }
  
  updateAccount(accountId, accountData) {
    if (!this.currentUser) {
      return { success: false, message: "Not logged in" };
    }
    
    const email = this.currentUser.email;
    const accountIndex = this.users[email].accounts.findIndex(acc => acc.id === accountId);
    
    if (accountIndex >= 0) {
      this.users[email].accounts[accountIndex] = {
        ...this.users[email].accounts[accountIndex],
        ...accountData
      };
      
      localStorage.setItem('users', JSON.stringify(this.users));
      return { success: true };
    }
    
    return { success: false, message: "Account not found" };
  }
}

export default new AuthService();