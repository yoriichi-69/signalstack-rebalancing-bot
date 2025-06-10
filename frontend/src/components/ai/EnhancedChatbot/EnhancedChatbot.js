import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiMic, FiMicOff, FiMinimize2, FiMaximize2, FiTrash2, FiCopy, FiSettings } from 'react-icons/fi';
import { BiBot, BiUser, BiRefresh, BiDownload } from 'react-icons/bi';
import './EnhancedChatbot.css';

// Icon wrapper component to ensure proper rendering
const IconWrapper = ({ children, size = 18, style = {}, fallback = "?" }) => (
  <span style={{ 
    display: 'inline-flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    width: size,
    height: size,
    color: 'white',
    fontSize: size * 0.6,
    fontWeight: 'bold',
    ...style 
  }}>
    {children || fallback}
  </span>
);

// Helper function to safely format timestamps
const formatTimestamp = (timestamp) => {
  try {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (error) {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
};

const EnhancedChatbot = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [settings, setSettings] = useState({
    autoScroll: true,
    soundEnabled: true,
    darkMode: true,
    apiEndpoint: 'http://localhost:6502'
  });
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognition = useRef(null);
  useEffect(() => {
    // Initialize with a clean welcome message only
    const welcomeMessage = {
      id: 'welcome',
      type: 'ai',
      content: "👋 Hello! I'm your CryptoRizz AI Assistant. I can help you with:\n\n• Real-time crypto prices and market data\n• Portfolio analysis and trading insights\n• DeFi protocols and yield farming\n• Technical analysis and market trends\n• Smart contract interactions\n• Risk management strategies\n\nJust ask me anything about crypto or trading!",
      timestamp: new Date(),
      isStreaming: false
    };
    
    setMessages([welcomeMessage]);
    initializeSpeechRecognition();
    
    // Clear any corrupted chat history first, then load fresh
    try {
      localStorage.removeItem('cryptorizz_chat_history');
    } catch (error) {
      console.log('Error clearing chat history');
    }
    
    // Load chat history if exists
    loadChatHistory();
  }, []);

  useEffect(() => {
    if (settings.autoScroll) {
      scrollToBottom();
    }
  }, [messages, settings.autoScroll]);

  const initializeSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.lang = 'en-US';

      recognition.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };

      recognition.current.onerror = () => {
        setIsListening(false);
      };

      recognition.current.onend = () => {
        setIsListening(false);
      };
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  const loadChatHistory = () => {
    try {
      const saved = localStorage.getItem('cryptorizz_chat_history');
      if (saved) {
        const history = JSON.parse(saved);
        if (history.length > 1) { // Keep welcome message + saved messages
          // Convert timestamp strings back to Date objects
          const processedHistory = history.slice(1).map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          setMessages(prev => [...prev, ...processedHistory]);
        }
      }
    } catch (error) {
      console.log('No saved chat history');
    }
  };

  const saveChatHistory = (newMessages) => {
    try {
      localStorage.setItem('cryptorizz_chat_history', JSON.stringify(newMessages));
    } catch (error) {
      console.log('Failed to save chat history');
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
      isStreaming: false
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Call the chatbot API
      const response = await fetch(`${settings.apiEndpoint}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: userMessage.content })
      });

      let botResponse;
      if (response.ok) {
        const data = await response.json();
        botResponse = data.response || 'Sorry, I couldn\'t process that request.';
        
        // Format token price responses nicely
        if (typeof botResponse === 'object' && botResponse.price) {
          botResponse = `💰 **${botResponse.name || 'Token'}** (${botResponse.symbol?.toUpperCase() || ''})

**Price:** $${Number(botResponse.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
**Market Cap:** $${Number(botResponse.market_cap || 0).toLocaleString()}
**24h Change:** ${botResponse.price_change_24h ? (botResponse.price_change_24h > 0 ? '+' : '') + botResponse.price_change_24h.toFixed(2) + '%' : 'N/A'}

*Data from CoinGecko API*`;
        }
      } else {
        botResponse = 'I\'m having trouble connecting to my knowledge base. Please try again in a moment.';
      }

      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: typeof botResponse === 'string' ? botResponse : JSON.stringify(botResponse, null, 2),
        timestamp: new Date(),
        isStreaming: false
      };

      const finalMessages = [...newMessages, aiMessage];
      setMessages(finalMessages);
      saveChatHistory(finalMessages);

    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: '⚠️ I\'m currently offline. Please check if the chatbot service is running and try again.',
        timestamp: new Date(),
        isStreaming: false,
        isError: true
      };

      const finalMessages = [...newMessages, errorMessage];
      setMessages(finalMessages);
      saveChatHistory(finalMessages);
    }

    setIsTyping(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      recognition.current?.stop();
      setIsListening(false);
    } else {
      recognition.current?.start();
      setIsListening(true);
    }
  };

  const clearChat = () => {
    const welcomeMessage = messages[0]; // Keep welcome message
    setMessages([welcomeMessage]);
    localStorage.removeItem('cryptorizz_chat_history');
  };

  const copyMessage = (content) => {
    navigator.clipboard.writeText(content);
    // Could add a toast notification here
  };

  const exportChat = () => {
    const chatData = messages.map(msg => ({
      timestamp: msg.timestamp,
      sender: msg.type === 'user' ? 'You' : 'CryptoRizz AI',
      message: msg.content
    }));
    
    const dataStr = JSON.stringify(chatData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cryptorizz-chat-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const formatMessage = (content) => {
    // Simple markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br/>');
  };
  return (
    <motion.div 
      className={`enhanced-chatbot ${isMinimized ? 'minimized' : ''} ${settings.darkMode ? 'dark' : 'light'}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      onClick={isMinimized ? () => setIsMinimized(false) : undefined}
      style={{ cursor: isMinimized ? 'pointer' : 'default' }}
    >
      {/* Header */}
      <div className="chatbot-header">        <div className="header-left">
          <div className="bot-avatar">
            <IconWrapper><BiBot size={24} /></IconWrapper>
          </div>
          <div className="bot-info">
            <h3>CryptoRizz Assistant</h3>
            <span className="status">
              <span className="status-indicator online"></span>
              Online - AI Powered
            </span>
          </div>
        </div>        <div className="header-controls">
          <button onClick={exportChat} title="Export Chat">
            <IconWrapper fallback="⬇"><BiDownload size={18} /></IconWrapper>
          </button>
          <button onClick={clearChat} title="Clear Chat">
            <IconWrapper fallback="🗑"><FiTrash2 size={18} /></IconWrapper>
          </button>          <button 
            onClick={(e) => {
              e.stopPropagation(); // Prevent triggering the container click
              setIsMinimized(!isMinimized);
            }}
            title={isMinimized ? "Maximize" : "Minimize"}
            className="minimize-btn"
          >
            <IconWrapper fallback={isMinimized ? "⬆" : "⬇"}>
              {isMinimized ? <FiMaximize2 size={isMinimized ? 24 : 18} /> : <FiMinimize2 size={18} />}
            </IconWrapper>
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div 
            className="messages-container"
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
          >
            <div className="messages-list">
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  className={`message ${message.type} ${message.isError ? 'error' : ''}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >                  <div className="message-avatar">
                    {message.type === 'user' ? (
                      <IconWrapper size={20}><BiUser size={20} /></IconWrapper>
                    ) : (
                      <IconWrapper size={20}><BiBot size={20} /></IconWrapper>
                    )}
                  </div>
                  <div className="message-content">
                    <div className="message-header">
                      <span className="sender">
                        {message.type === 'user' ? 'You' : 'CryptoRizz AI'}
                      </span>                      <span className="timestamp">
                        {formatTimestamp(message.timestamp)}
                      </span>
                    </div>
                    <div 
                      className="message-text"
                      dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                    />                    <div className="message-actions">
                      <button 
                        onClick={() => copyMessage(message.content)}
                        title="Copy message"
                      >
                        <IconWrapper size={14} fallback="📋"><FiCopy size={14} /></IconWrapper>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
                {/* Typing Indicator */}
              {isTyping && (
                <motion.div 
                  className="message ai typing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="message-avatar">
                    <IconWrapper size={20}><BiBot size={20} /></IconWrapper>
                  </div>
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      {!isMinimized && (
        <div className="input-area">
          <div className="input-container">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="💭 Ask me anything: crypto prices, trading strategies, DeFi protocols, market analysis, portfolio insights..."
              rows={1}
              className="message-input"
            />            <div className="input-controls">
              {recognition.current && (
                <button
                  className={`voice-btn ${isListening ? 'listening' : ''}`}
                  onClick={toggleVoiceInput}
                  title={isListening ? "Stop listening" : "Voice input"}
                >
                  <IconWrapper fallback={isListening ? "🔇" : "🎤"}>
                    {isListening ? <FiMicOff size={18} /> : <FiMic size={18} />}
                  </IconWrapper>
                </button>
              )}
              <button
                className="send-btn"
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isTyping}
                title="Send message"
              >
                <IconWrapper fallback="➤"><FiSend size={18} /></IconWrapper>
              </button>
            </div>
          </div>          <div className="quick-actions">
            <button onClick={() => setInputMessage('What is the current Bitcoin price?')}>
              💰 Bitcoin Price
            </button>
            <button onClick={() => setInputMessage('Show me top DeFi protocols and their yields')}>
              🔄 DeFi Protocols
            </button>
            <button onClick={() => setInputMessage('Analyze current crypto market trends and outlook')}>
              📊 Market Analysis
            </button>
            <button onClick={() => setInputMessage('Help me optimize my portfolio allocation')}>
              ⚖️ Portfolio Tips
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default EnhancedChatbot;
