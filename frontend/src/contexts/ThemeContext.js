/* filepath: frontend/src/contexts/ThemeContext.js */
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ThemeContext = createContext();

// Theme definitions
const themes = {
  dark: {
    name: 'dark',
    colors: {
      primary: '#40e0d0',
      secondary: '#00bcd4',
      accent: '#ff6b6b',
      success: '#2ecc71',
      warning: '#f39c12',
      error: '#e74c3c',
      info: '#3498db',
      
      background: {
        primary: '#0a0a0a',
        secondary: '#1a1a2e',
        tertiary: '#16213e',
        card: 'rgba(26, 26, 46, 0.8)',
        modal: 'rgba(0, 0, 0, 0.9)',
        overlay: 'rgba(0, 0, 0, 0.7)'
      },
      
      text: {
        primary: '#ffffff',
        secondary: '#b0b0b0',
        tertiary: '#808080',
        accent: '#40e0d0',
        muted: '#666666'
      },
      
      border: {
        primary: 'rgba(64, 224, 208, 0.3)',
        secondary: 'rgba(255, 255, 255, 0.1)',
        hover: 'rgba(64, 224, 208, 0.5)'
      },
      
      shadow: {
        small: '0 2px 8px rgba(0, 255, 255, 0.1)',
        medium: '0 8px 32px rgba(0, 255, 255, 0.15)',
        large: '0 20px 60px rgba(0, 255, 255, 0.2)',
        glow: '0 0 20px rgba(64, 224, 208, 0.3)'
      }
    },
    
    gradients: {
      primary: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      secondary: 'linear-gradient(135deg, #40e0d0 0%, #00bcd4 100%)',
      card: 'linear-gradient(135deg, rgba(26, 26, 46, 0.9) 0%, rgba(22, 33, 62, 0.8) 100%)',
      button: 'linear-gradient(135deg, #40e0d0 0%, #00bcd4 100%)',
      success: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
      error: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)'
    },
    
    animations: {
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      slowTransition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    }
  },
  
  light: {
    name: 'light',
    colors: {
      primary: '#2196f3',
      secondary: '#03dac6',
      accent: '#ff5722',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336',
      info: '#2196f3',
      
      background: {
        primary: '#ffffff',
        secondary: '#f8f9fa',
        tertiary: '#e9ecef',
        card: 'rgba(255, 255, 255, 0.9)',
        modal: 'rgba(255, 255, 255, 0.95)',
        overlay: 'rgba(0, 0, 0, 0.5)'
      },
      
      text: {
        primary: '#212529',
        secondary: '#495057',
        tertiary: '#6c757d',
        accent: '#2196f3',
        muted: '#adb5bd'
      },
      
      border: {
        primary: 'rgba(33, 150, 243, 0.3)',
        secondary: 'rgba(0, 0, 0, 0.1)',
        hover: 'rgba(33, 150, 243, 0.5)'
      },
      
      shadow: {
        small: '0 2px 8px rgba(0, 0, 0, 0.1)',
        medium: '0 8px 32px rgba(0, 0, 0, 0.15)',
        large: '0 20px 60px rgba(0, 0, 0, 0.2)',
        glow: '0 0 20px rgba(33, 150, 243, 0.3)'
      }
    },
    
    gradients: {
      primary: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 50%, #e9ecef 100%)',
      secondary: 'linear-gradient(135deg, #2196f3 0%, #03dac6 100%)',
      card: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 249, 250, 0.8) 100%)',
      button: 'linear-gradient(135deg, #2196f3 0%, #03dac6 100%)',
      success: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
      error: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)'
    },
    
    animations: {
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      slowTransition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    }
  },
  
  cyberpunk: {
    name: 'cyberpunk',
    colors: {
      primary: '#ff00ff',
      secondary: '#00ffff',
      accent: '#ffff00',
      success: '#00ff00',
      warning: '#ff8800',
      error: '#ff0044',
      info: '#0088ff',
      
      background: {
        primary: '#000011',
        secondary: '#110022',
        tertiary: '#220033',
        card: 'rgba(17, 0, 34, 0.8)',
        modal: 'rgba(0, 0, 17, 0.9)',
        overlay: 'rgba(255, 0, 255, 0.1)'
      },
      
      text: {
        primary: '#ffffff',
        secondary: '#ff00ff',
        tertiary: '#00ffff',
        accent: '#ffff00',
        muted: '#8800ff'
      },
      
      border: {
        primary: 'rgba(255, 0, 255, 0.5)',
        secondary: 'rgba(0, 255, 255, 0.3)',
        hover: 'rgba(255, 255, 0, 0.7)'
      },
      
      shadow: {
        small: '0 2px 8px rgba(255, 0, 255, 0.3)',
        medium: '0 8px 32px rgba(255, 0, 255, 0.4)',
        large: '0 20px 60px rgba(255, 0, 255, 0.5)',
        glow: '0 0 30px rgba(255, 0, 255, 0.8)'
      }
    },
    
    gradients: {
      primary: 'linear-gradient(135deg, #000011 0%, #110022 50%, #220033 100%)',
      secondary: 'linear-gradient(135deg, #ff00ff 0%, #00ffff 100%)',
      card: 'linear-gradient(135deg, rgba(17, 0, 34, 0.9) 0%, rgba(34, 0, 51, 0.8) 100%)',
      button: 'linear-gradient(135deg, #ff00ff 0%, #00ffff 100%)',
      success: 'linear-gradient(135deg, #00ff00 0%, #00cc00 100%)',
      error: 'linear-gradient(135deg, #ff0044 0%, #cc0033 100%)'
    },
    
    animations: {
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      slowTransition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    }
  }
};

// Theme reducer
const themeReducer = (state, action) => {
  switch (action.type) {
    case 'SET_THEME':
      return {
        ...state,
        currentTheme: action.payload,
        theme: themes[action.payload]
      };
    case 'TOGGLE_THEME':
      const newTheme = state.currentTheme === 'dark' ? 'light' : 'dark';
      return {
        ...state,
        currentTheme: newTheme,
        theme: themes[newTheme]
      };
    case 'SET_CUSTOM_COLORS':
      return {
        ...state,
        theme: {
          ...state.theme,
          colors: {
            ...state.theme.colors,
            ...action.payload
          }
        }
      };
    case 'SET_ANIMATIONS_ENABLED':
      return {
        ...state,
        animationsEnabled: action.payload
      };
    case 'SET_REDUCED_MOTION':
      return {
        ...state,
        reducedMotion: action.payload
      };
    default:
      return state;
  }
};

// Theme Provider Component
export const ThemeProvider = ({ children }) => {
  const [state, dispatch] = useReducer(themeReducer, {
    currentTheme: 'dark',
    theme: themes.dark,
    animationsEnabled: true,
    reducedMotion: false,
    isTransitioning: false
  });

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('signalstack_theme');
    const savedAnimations = localStorage.getItem('signalstack_animations');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (savedTheme && themes[savedTheme]) {
      dispatch({ type: 'SET_THEME', payload: savedTheme });
    }
    
    if (savedAnimations !== null) {
      dispatch({ type: 'SET_ANIMATIONS_ENABLED', payload: JSON.parse(savedAnimations) });
    }
    
    dispatch({ type: 'SET_REDUCED_MOTION', payload: prefersReducedMotion });
  }, []);

  // Save theme to localStorage
  useEffect(() => {
    localStorage.setItem('signalstack_theme', state.currentTheme);
    localStorage.setItem('signalstack_animations', JSON.stringify(state.animationsEnabled));
  }, [state.currentTheme, state.animationsEnabled]);

  // Apply CSS custom properties
  useEffect(() => {
    const root = document.documentElement;
    const theme = state.theme;
    
    // Primary colors
    root.style.setProperty('--color-primary', theme.colors.primary);
    root.style.setProperty('--color-secondary', theme.colors.secondary);
    root.style.setProperty('--color-accent', theme.colors.accent);
    root.style.setProperty('--color-success', theme.colors.success);
    root.style.setProperty('--color-warning', theme.colors.warning);
    root.style.setProperty('--color-error', theme.colors.error);
    root.style.setProperty('--color-info', theme.colors.info);
    
    // Background colors
    Object.entries(theme.colors.background).forEach(([key, value]) => {
      root.style.setProperty(`--bg-${key}`, value);
    });
    
    // Text colors
    Object.entries(theme.colors.text).forEach(([key, value]) => {
      root.style.setProperty(`--text-${key}`, value);
    });
    
    // Border colors
    Object.entries(theme.colors.border).forEach(([key, value]) => {
      root.style.setProperty(`--border-${key}`, value);
    });
    
    // Shadows
    Object.entries(theme.colors.shadow).forEach(([key, value]) => {
      root.style.setProperty(`--shadow-${key}`, value);
    });
    
    // Gradients
    Object.entries(theme.gradients).forEach(([key, value]) => {
      root.style.setProperty(`--gradient-${key}`, value);
    });
    
    // Animations
    Object.entries(theme.animations).forEach(([key, value]) => {
      root.style.setProperty(`--animation-${key}`, value);
    });
  }, [state.theme]);

  const setTheme = (themeName) => {
    if (themes[themeName]) {
      dispatch({ type: 'SET_THEME', payload: themeName });
    }
  };

  const toggleTheme = () => {
    dispatch({ type: 'TOGGLE_THEME' });
  };

  const setCustomColors = (colors) => {
    dispatch({ type: 'SET_CUSTOM_COLORS', payload: colors });
  };

  const toggleAnimations = () => {
    dispatch({ type: 'SET_ANIMATIONS_ENABLED', payload: !state.animationsEnabled });
  };

  const value = {
    ...state,
    themes: Object.keys(themes),
    setTheme,
    toggleTheme,
    setCustomColors,
    toggleAnimations
  };

  return (
    <ThemeContext.Provider value={value}>
      <AnimatePresence mode="wait">
        <motion.div
          key={state.currentTheme}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={`theme-${state.currentTheme}`}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme-aware component wrapper
export const ThemedComponent = ({ children, className = '', ...props }) => {
  const { theme, animationsEnabled } = useTheme();
  
  return (
    <motion.div
      className={`themed-component ${className}`}
      initial={animationsEnabled ? { opacity: 0, y: 20 } : false}
      animate={animationsEnabled ? { opacity: 1, y: 0 } : false}
      transition={animationsEnabled ? { duration: 0.3 } : false}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default ThemeContext;