/* filepath: frontend/src/services/VoiceCommandService.js */
class VoiceCommandService {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.commands = new Map();
    this.confidence = 0.7;
    this.currentLanguage = 'en-US';
    this.voiceEnabled = false;
    this.synthesis = window.speechSynthesis;
    this.voices = [];
    this.selectedVoice = null;
    
    this.initializeVoiceRecognition();
    this.setupDefaultCommands();
    this.loadVoices();
  }

  initializeVoiceRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = this.currentLanguage;
      this.recognition.maxAlternatives = 3;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.notifyListeners('voice_start');
        this.speak('Voice assistant activated');
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.notifyListeners('voice_end');
      };

      this.recognition.onerror = (event) => {
        console.error('Voice recognition error:', event.error);
        this.notifyListeners('voice_error', { error: event.error });
      };

      this.recognition.onresult = (event) => {
        this.handleVoiceResult(event);
      };

      this.voiceEnabled = true;
    } else {
      console.warn('Speech recognition not supported');
    }
  }

  setupDefaultCommands() {
    // Portfolio Commands
    this.registerCommand(/show portfolio|portfolio overview/i, () => {
      this.speak('Displaying portfolio overview');
      return { action: 'SHOW_PORTFOLIO' };
    });

    this.registerCommand(/show (.*) price|price of (.*)/i, (matches) => {
      const symbol = matches[1] || matches[2];
      this.speak(`Showing price for ${symbol}`);
      return { action: 'SHOW_PRICE', symbol: symbol.toUpperCase() };
    });

    // Trading Commands
    this.registerCommand(/buy (.*)|purchase (.*)/i, (matches) => {
      const symbol = matches[1] || matches[2];
      this.speak(`Preparing buy order for ${symbol}`);
      return { action: 'BUY_CRYPTO', symbol: symbol.toUpperCase() };
    });

    this.registerCommand(/sell (.*)|sell all (.*)/i, (matches) => {
      const symbol = matches[1] || matches[2];
      this.speak(`Preparing sell order for ${symbol}`);
      return { action: 'SELL_CRYPTO', symbol: symbol.toUpperCase() };
    });

    // Analysis Commands
    this.registerCommand(/analyze (.*)|technical analysis (.*)/i, (matches) => {
      const symbol = matches[1] || matches[2];
      this.speak(`Running technical analysis for ${symbol}`);
      return { action: 'ANALYZE_CRYPTO', symbol: symbol.toUpperCase() };
    });

    this.registerCommand(/market sentiment|sentiment analysis/i, () => {
      this.speak('Analyzing market sentiment');
      return { action: 'MARKET_SENTIMENT' };
    });

    // Navigation Commands
    this.registerCommand(/go to dashboard|show dashboard/i, () => {
      this.speak('Navigating to dashboard');
      return { action: 'NAVIGATE', route: '/dashboard' };
    });

    this.registerCommand(/show news|latest news/i, () => {
      this.speak('Displaying latest cryptocurrency news');
      return { action: 'SHOW_NEWS' };
    });

    // Accessibility Commands
    this.registerCommand(/read (.*)|tell me about (.*)/i, (matches) => {
      const topic = matches[1] || matches[2];
      return { action: 'READ_CONTENT', topic };
    });

    this.registerCommand(/help|what can you do/i, () => {
      const helpText = `I can help you with: viewing portfolio, checking prices, 
                       buying and selling crypto, technical analysis, market news, 
                       and navigation. Just speak naturally!`;
      this.speak(helpText);
      return { action: 'HELP' };
    });

    // System Commands
    this.registerCommand(/stop listening|disable voice/i, () => {
      this.speak('Voice assistant disabled');
      this.stopListening();
      return { action: 'DISABLE_VOICE' };
    });

    this.registerCommand(/dark mode|light mode|toggle theme/i, () => {
      this.speak('Toggling theme');
      return { action: 'TOGGLE_THEME' };
    });
  }

  registerCommand(pattern, callback) {
    this.commands.set(pattern, callback);
  }

  handleVoiceResult(event) {
    const results = event.results;
    const lastResult = results[results.length - 1];
    
    if (lastResult.isFinal && lastResult[0].confidence > this.confidence) {
      const transcript = lastResult[0].transcript.toLowerCase().trim();
      console.log('Voice command:', transcript);
      
      // Find matching command
      for (let [pattern, callback] of this.commands) {
        const matches = transcript.match(pattern);
        if (matches) {
          const result = callback(matches);
          this.notifyListeners('voice_command', { transcript, result });
          return;
        }
      }
      
      // No command matched
      this.speak("I didn't understand that command. Say 'help' for available commands.");
      this.notifyListeners('voice_no_match', { transcript });
    }
  }

  speak(text, options = {}) {
    if (!this.synthesis) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = this.selectedVoice;
    utterance.rate = options.rate || 1;
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || 0.8;
    
    utterance.onend = () => {
      this.notifyListeners('speech_end');
    };
    
    this.synthesis.speak(utterance);
  }

  loadVoices() {
    this.voices = this.synthesis.getVoices();
    this.selectedVoice = this.voices.find(voice => 
      voice.lang.startsWith(this.currentLanguage.split('-')[0])
    ) || this.voices[0];
    
    if (this.voices.length === 0) {
      this.synthesis.onvoiceschanged = () => {
        this.loadVoices();
      };
    }
  }

  startListening() {
    if (this.recognition && this.voiceEnabled && !this.isListening) {
      this.recognition.start();
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  toggleListening() {
    if (this.isListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  // Event system for voice commands
  listeners = new Map();

  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
      }
    };
  }

  notifyListeners(event, data = {}) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  // Accessibility features
  readElement(element) {
    if (element && element.textContent) {
      this.speak(element.textContent);
    }
  }

  announcePrice(symbol, price, change) {
    const changeText = change >= 0 ? `up ${change.toFixed(2)}%` : `down ${Math.abs(change).toFixed(2)}%`;
    this.speak(`${symbol} is trading at $${price.toFixed(2)}, ${changeText}`);
  }

  announcePortfolioValue(totalValue, change) {
    const changeText = change >= 0 ? `up ${change.toFixed(2)}%` : `down ${Math.abs(change).toFixed(2)}%`;
    this.speak(`Your portfolio value is $${totalValue.toLocaleString()}, ${changeText} today`);
  }

  // Configuration
  setLanguage(lang) {
    this.currentLanguage = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
    this.loadVoices();
  }

  setConfidence(confidence) {
    this.confidence = Math.max(0, Math.min(1, confidence));
  }

  isSupported() {
    return this.voiceEnabled;
  }
}

export default new VoiceCommandService();