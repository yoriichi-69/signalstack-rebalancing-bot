import React, { useState, useEffect, useRef } from 'react';
import './ChatBot.css';
import { motion, AnimatePresence } from 'framer-motion';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! I\'m your crypto trading assistant. How can I help you today?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([
    "What is the current Bitcoin price?",
    "How does portfolio rebalancing work?",
    "What trading signals are best for beginners?",
    "Explain DeFi staking"
  ]);
  const messagesEndRef = useRef(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [serverStatus, setServerStatus] = useState('unknown'); // 'online', 'offline', 'unknown'

  // Check server status when component mounts
  useEffect(() => {
    checkServerStatus();
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Reset unread count when chat is opened
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  // Check if the server is running
  const checkServerStatus = async () => {
    try {
      const response = await fetch('http://localhost:6502/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 3000, // 3 second timeout
      });
      
      if (response.ok) {
        setServerStatus('online');
        console.log('ChatBot server is online');
      } else {
        setServerStatus('offline');
        console.log('ChatBot server returned error status');
      }
    } catch (error) {
      setServerStatus('offline');
      console.log('ChatBot server is offline or unreachable');
    }
  };

  const toggleChatBot = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0);
      // Check server status when opening the chat
      checkServerStatus();
    }
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!inputText.trim()) return;
    
    // Add user message to chat
    const userMessage = { sender: 'user', text: inputText };
    setMessages([...messages, userMessage]);
    setInputText('');
    setIsLoading(true);
    
    // If server is offline, immediately use fallback response
    if (serverStatus === 'offline') {
      const fallbackResponse = getFallbackResponse(userMessage.text);
      setMessages(prevMessages => [
        ...prevMessages, 
        { 
          sender: 'bot', 
          text: fallbackResponse || "I'm working in offline mode right now. To get full functionality, please start the chatbot backend by running the start-chatbot.bat file."
        }
      ]);
      setIsLoading(false);
      generateNewSuggestions(userMessage.text);
      return;
    }
    
    try {
      // Call the backend chatbot API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch('http://localhost:6502/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: userMessage.text }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      
      const data = await response.json();
      
      // Server is responsive, update status
      setServerStatus('online');
      
      // Add bot response to chat
      setMessages(prevMessages => [
        ...prevMessages, 
        { sender: 'bot', text: data.response || "Sorry, I couldn't process your request." }
      ]);

      // If chat is closed, increment unread count
      if (!isOpen) {
        setUnreadCount(prev => prev + 1);
      }
      
      // Generate new suggestions based on the context
      generateNewSuggestions(userMessage.text);
    } catch (error) {
      console.error('Error fetching data from chatbot API:', error);
      
      // Update server status
      setServerStatus('offline');
      
      // Try a fallback response for common crypto questions
      const fallbackResponse = getFallbackResponse(userMessage.text);
      
      if (fallbackResponse) {
        setMessages(prevMessages => [
          ...prevMessages, 
          { sender: 'bot', text: fallbackResponse }
        ]);
      } else {
        // Add error message with instructions
        setMessages(prevMessages => [
          ...prevMessages, 
          { 
            sender: 'bot', 
            text: "I'm having trouble connecting to the server. To fix this issue:\n\n1. Make sure the chatbot backend is running\n2. Run the `start-chatbot.bat` file in the project root\n3. Check that port 6502 is not blocked by a firewall\n\nIn the meantime, I can still answer some basic questions."
          }
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewSuggestions = (query) => {
    // Simple logic to generate new relevant suggestions based on user's query
    const cryptoTerms = ['bitcoin', 'btc', 'eth', 'price', 'market'];
    const tradingTerms = ['trade', 'buy', 'sell', 'signal', 'strategy'];
    const defiTerms = ['defi', 'staking', 'yield', 'farming', 'liquidity'];
    
    let newSuggestions = [];
    
    const lowerQuery = query.toLowerCase();
    
    if (cryptoTerms.some(term => lowerQuery.includes(term))) {
      newSuggestions = [
        "Show me Ethereum price trends",
        "Compare Bitcoin and Ethereum performance",
        "What affects crypto market prices?",
        "What's your prediction for Bitcoin?"
      ];
    } else if (tradingTerms.some(term => lowerQuery.includes(term))) {
      newSuggestions = [
        "What's dollar cost averaging?",
        "Explain trading signals in CryptoRizz",
        "Best time to trade cryptocurrencies?",
        "What technical indicators should I watch?"
      ];
    } else if (defiTerms.some(term => lowerQuery.includes(term))) {
      newSuggestions = [
        "Explain yield farming risks",
        "Best DeFi platforms for beginners",
        "What APY is considered good?",
        "How does liquidity providing work?"
      ];
    } else {
      // Default suggestions
      newSuggestions = [
        "How to get started with trading?",
        "Explain crypto portfolio diversification",
        "What is the CryptoRizz bot strategy?",
        "How secure is my crypto in this app?"
      ];
    }
    
    setSuggestions(newSuggestions);
  };

  // Provide offline responses for common questions
  const getFallbackResponse = (query) => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('bitcoin') || lowerQuery.includes('btc') && lowerQuery.includes('price')) {
      return "While I can't fetch the real-time Bitcoin price right now, you can check the latest price on the Market tab in the app.";
    }
    
    if (lowerQuery.includes('rebalancing')) {
      return "Portfolio rebalancing is a strategy that periodically adjusts your portfolio to maintain your desired asset allocation. CryptoRizz offers automated rebalancing to help optimize your crypto investments based on market signals.";
    }
    
    if (lowerQuery.includes('signal') || lowerQuery.includes('indicator')) {
      return "Trading signals are indicators derived from technical analysis that suggest potential market movements. CryptoRizz provides several signal types including momentum, trend following, and mean reversion strategies.";
    }
    
    if (lowerQuery.includes('bot') || lowerQuery.includes('strategy')) {
      return "CryptoRizz bots use various strategies like trend following, mean reversion, and signal-based approaches to automate trading decisions. You can deploy multiple bots with different strategies from the Bots tab.";
    }
    
    if (lowerQuery.includes('help') || lowerQuery.includes('server') || lowerQuery.includes('connect')) {
      return "To start the chatbot server:\n\n1. Navigate to the project root directory\n2. Run `start-chatbot.bat` file\n3. Or manually start the server with `cd chat-bot && python bot.py`\n\nThis will enable full functionality including real-time crypto data.";
    }
    
    // New common questions
    if (lowerQuery.includes('defi') || lowerQuery.includes('staking')) {
      return "DeFi (Decentralized Finance) refers to financial services operating on blockchain without centralized intermediaries. Staking involves locking up crypto assets to support network operations and earn rewards. It's a way to generate passive income from your crypto holdings.";
    }
    
    if (lowerQuery.includes('wallet') || lowerQuery.includes('secure')) {
      return "CryptoRizz prioritizes security through encryption, two-factor authentication, and segregated wallets. Your assets are protected using industry best practices. We recommend using hardware wallets for long-term storage of significant crypto holdings.";
    }
    
    return null; // No fallback available
  };

  const handleSuggestionClick = (suggestion) => {
    setInputText(suggestion);
  };

  // Server status indicator color
  const getServerStatusColor = () => {
    switch (serverStatus) {
      case 'online': return 'status-online';
      case 'offline': return 'status-offline';
      default: return 'status-unknown';
    }
  };

  return (
    <div className="chatbot-container">
      {/* Collapsed chat button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button 
            className="chatbot-button"
            onClick={toggleChatBot}
            aria-label="Open chat assistant"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="chatbot-icon">🤖</span>
            <span className="chatbot-label">Crypto Assistant</span>
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount}</span>
            )}
          </motion.button>
        )}
      </AnimatePresence>
      
      {/* Expanded chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="chatbot-window"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="chatbot-header">
              <div className="header-content">
                <div className="bot-avatar-header">
                  <span>🤖</span>
                </div>
                <h3>CryptoRizz Assistant</h3>
                <div className={`server-status ${getServerStatusColor()}`}></div>
              </div>
              <button 
                className="close-button" 
                onClick={toggleChatBot}
                aria-label="Close chat"
              >
                ✖
              </button>
            </div>
            
            <div className="chatbot-messages">
              {messages.map((msg, index) => (
                <motion.div 
                  key={index} 
                  className={`message ${msg.sender === 'bot' ? 'bot-message' : 'user-message'}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {msg.sender === 'bot' && (
                    <div className="bot-avatar">
                      <span>🤖</span>
                    </div>
                  )}
                  <div className="message-content">
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <motion.div 
                  className="message bot-message"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="bot-avatar">
                    <span>🤖</span>
                  </div>
                  <div className="message-content typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Server status message */}
            {serverStatus === 'offline' && (
              <div className="server-status-message">
                <span className="status-icon">⚠️</span>
                <span className="status-text">Offline mode - Limited functionality</span>
              </div>
            )}
            
            {/* Suggestions */}
            <div className="chatbot-suggestions">
              {suggestions.map((suggestion, index) => (
                <button 
                  key={index}
                  className="suggestion-item"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
            
            <form className="chatbot-input" onSubmit={handleSubmit}>
              <input
                type="text"
                value={inputText}
                onChange={handleInputChange}
                placeholder="Ask about crypto, tokens, trading..."
                disabled={isLoading}
              />
              <button 
                type="submit" 
                disabled={!inputText.trim() || isLoading}
                className={`send-button ${!inputText.trim() || isLoading ? 'disabled' : ''}`}
                aria-label="Send message"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M3 20.59L20.59 12L3 3.41V9.75L14.17 12L3 14.25V20.59Z"></path>
                </svg>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatBot; 