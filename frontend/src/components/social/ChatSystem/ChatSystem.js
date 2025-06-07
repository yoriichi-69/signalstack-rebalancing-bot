/* filepath: frontend/src/components/social/ChatSystem/ChatSystem.js */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../../contexts/ThemeContext';
import VoiceCommandService from '../../../services/VoiceCommandService';
import NotificationService from '../../../services/NotificationService';
import './ChatSystem.css';

const ChatSystem = () => {
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeRoom, setActiveRoom] = useState('general');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const { theme } = useTheme();

  const chatRooms = [
    { id: 'general', name: '💬 General', description: 'General discussion' },
    { id: 'trading', name: '📈 Trading', description: 'Trading signals & analysis' },
    { id: 'btc', name: '₿ Bitcoin', description: 'Bitcoin discussion' },
    { id: 'eth', name: '⟠ Ethereum', description: 'Ethereum & DeFi' },
    { id: 'nft', name: '🎨 NFTs', description: 'NFT marketplace' },
    { id: 'alerts', name: '🚨 Alerts', description: 'Price alerts & signals' }
  ];

  useEffect(() => {
    // Initialize chat system
    initializeChat();
    loadChatHistory();
    
    // Voice command integration
    VoiceCommandService.addEventListener('voice_command', handleVoiceCommand);
    
    return () => {
      // Cleanup
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = () => {
    // Simulate real-time connections
    setOnlineUsers([
      { id: 1, username: 'CryptoTrader', status: 'online', avatar: '🧑‍💼' },
      { id: 2, username: 'BitcoinMax', status: 'online', avatar: '🤖' },
      { id: 3, username: 'EthereumQueen', status: 'away', avatar: '👩‍💻' },
      { id: 4, username: 'DeFiGuru', status: 'online', avatar: '🧙‍♂️' },
      { id: 5, username: 'NFTCollector', status: 'online', avatar: '🎨' }
    ]);

    // Simulate incoming messages
    simulateRealTimeMessages();
  };

  const simulateRealTimeMessages = () => {
    const sampleMessages = [
      { user: 'CryptoTrader', message: 'Bitcoin looking bullish! 🚀', type: 'text' },
      { user: 'BitcoinMax', message: 'Just got a strong buy signal on ETH', type: 'signal' },
      { user: 'EthereumQueen', message: 'DeFi yields are insane right now 💰', type: 'text' },
      { user: 'DeFiGuru', message: 'Check out this new protocol launch', type: 'link' },
      { user: 'NFTCollector', message: 'Minted some rare NFTs today 🎨', type: 'text' }
    ];

    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      if (messageIndex < sampleMessages.length) {
        const msg = sampleMessages[messageIndex];
        addMessage({
          id: Date.now() + messageIndex,
          ...msg,
          timestamp: new Date(),
          room: activeRoom,
          reactions: [],
          isOwn: false
        });
        messageIndex++;
        
        if (!isOpen) {
          setUnreadCount(prev => prev + 1);
          NotificationService.info(`New message from ${msg.user}`, {
            duration: 3000
          });
        }
      } else {
        clearInterval(messageInterval);
      }
    }, 5000);
  };

  const loadChatHistory = () => {
    // Load previous messages from localStorage or API
    const savedMessages = localStorage.getItem(`chat_${activeRoom}`);
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  };

  const addMessage = (message) => {
    setMessages(prev => {
      const updated = [...prev, message].slice(-100); // Keep last 100 messages
      localStorage.setItem(`chat_${activeRoom}`, JSON.stringify(updated));
      return updated;
    });
  };

  const sendMessage = () => {
    if (!currentMessage.trim()) return;

    const message = {
      id: Date.now(),
      user: 'You',
      message: currentMessage,
      timestamp: new Date(),
      room: activeRoom,
      type: detectMessageType(currentMessage),
      reactions: [],
      isOwn: true
    };

    addMessage(message);
    setCurrentMessage('');
    
    // Simulate AI responses for certain keywords
    if (shouldTriggerAIResponse(currentMessage)) {
      setTimeout(() => {
        addAIResponse(currentMessage);
      }, 1500);
    }
  };

  const detectMessageType = (message) => {
    const lower = message.toLowerCase();
    if (lower.includes('buy') || lower.includes('sell') || lower.includes('signal')) {
      return 'signal';
    }
    if (lower.includes('http') || lower.includes('www.')) {
      return 'link';
    }
    if (lower.includes('?')) {
      return 'question';
    }
    return 'text';
  };

  const shouldTriggerAIResponse = (message) => {
    const triggers = ['signal', 'analysis', 'prediction', 'price', 'recommendation'];
    return triggers.some(trigger => message.toLowerCase().includes(trigger));
  };

  const addAIResponse = (originalMessage) => {
    const aiResponses = [
      'Based on technical analysis, I see strong support at current levels 📊',
      'Market sentiment is currently bullish. Consider DCA strategy 💡',
      'RSI indicates oversold conditions. Potential reversal incoming 🔄',
      'Volume analysis suggests institutional accumulation 🏢',
      'Fibonacci retracement shows key resistance at $45k 📈'
    ];

    const response = aiResponses[Math.floor(Math.random() * aiResponses.length)];
    
    addMessage({
      id: Date.now(),
      user: 'SignalStack AI',
      message: response,
      timestamp: new Date(),
      room: activeRoom,
      type: 'ai',
      reactions: [],
      isOwn: false,
      isAI: true
    });
  };

  const handleVoiceCommand = ({ result }) => {
    if (result.action === 'SEND_MESSAGE' && result.message) {
      setCurrentMessage(result.message);
      setTimeout(sendMessage, 100);
    }
  };

  const addReaction = (messageId, emoji) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const existingReaction = msg.reactions.find(r => r.emoji === emoji);
        if (existingReaction) {
          existingReaction.count += 1;
          existingReaction.users.push('You');
        } else {
          msg.reactions.push({ emoji, count: 1, users: ['You'] });
        }
      }
      return msg;
    }));
  };

  const switchRoom = (roomId) => {
    setActiveRoom(roomId);
    setMessages([]);
    loadChatHistory();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <motion.button
        className="chat-toggle-btn"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setUnreadCount(0);
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        💬
        {unreadCount > 0 && (
          <motion.span 
            className="chat-badge"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            {unreadCount}
          </motion.span>
        )}
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="chat-system"
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            {/* Chat Header */}
            <div className="chat-header">
              <div className="chat-title">
                <h3>SignalStack Community</h3>
                <span className="online-count">
                  🟢 {onlineUsers.filter(u => u.status === 'online').length} online
                </span>
              </div>
              <button 
                className="chat-close"
                onClick={() => setIsOpen(false)}
              >
                ✕
              </button>
            </div>

            {/* Room Selector */}
            <div className="chat-rooms">
              {chatRooms.map(room => (
                <motion.button
                  key={room.id}
                  className={`room-btn ${activeRoom === room.id ? 'active' : ''}`}
                  onClick={() => switchRoom(room.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {room.name}
                </motion.button>
              ))}
            </div>

            {/* Messages Area */}
            <div className="chat-messages">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    className={`message ${message.isOwn ? 'own' : ''} ${message.type}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <div className="message-header">
                      <span className="message-user">
                        {message.isAI && '🤖'} {message.user}
                      </span>
                      <span className="message-time">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                    
                    <div className="message-content">
                      {message.type === 'signal' && (
                        <div className="signal-indicator">📊 Trading Signal</div>
                      )}
                      {message.message}
                    </div>

                    {message.reactions.length > 0 && (
                      <div className="message-reactions">
                        {message.reactions.map((reaction, idx) => (
                          <span key={idx} className="reaction">
                            {reaction.emoji} {reaction.count}
                          </span>
                        ))}
                      </div>
                    )}

                    {!message.isOwn && (
                      <div className="message-actions">
                        {['👍', '👎', '🚀', '💎', '📈'].map(emoji => (
                          <button
                            key={emoji}
                            className="reaction-btn"
                            onClick={() => addReaction(message.id, emoji)}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Online Users */}
            <div className="online-users">
              <h4>Online Users</h4>
              <div className="users-list">
                {onlineUsers.map(user => (
                  <div key={user.id} className={`user ${user.status}`}>
                    <span className="user-avatar">{user.avatar}</span>
                    <span className="user-name">{user.username}</span>
                    <span className={`user-status ${user.status}`}></span>
                  </div>
                ))}
              </div>
            </div>

            {/* Message Input */}
            <div className="chat-input">
              <div className="input-container">
                <input
                  type="text"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message... or use voice command"
                  className="message-input"
                />
                <div className="input-actions">
                  <button 
                    className="voice-btn"
                    onClick={() => VoiceCommandService.startListening()}
                  >
                    🎤
                  </button>
                  <motion.button
                    className="send-btn"
                    onClick={sendMessage}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={!currentMessage.trim()}
                  >
                    Send
                  </motion.button>
                </div>
              </div>
              
              {isTyping && (
                <div className="typing-indicator">
                  <motion.span
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    Someone is typing...
                  </motion.span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatSystem;