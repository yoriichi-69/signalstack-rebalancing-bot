import React, { createContext, useContext, useReducer, useEffect } from 'react';

const ThemeContext = createContext();

const themes = {
  dark: {
    name: 'dark',
    colors: {
      primary: '#40e0d0',
      secondary: '#00bcd4',
      background: '#0a0a0a'
    }
  },
  light: {
    name: 'light',
    colors: {
      primary: '#2196f3',
      secondary: '#03dac6',
      background: '#ffffff'
    }
  }
};

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
    default:
      return state;
  }
};

export const ThemeProvider = ({ children }) => {
  const [state, dispatch] = useReducer(themeReducer, {
    currentTheme: 'dark',
    theme: themes.dark
  });

  const setTheme = (themeName) => {
    dispatch({ type: 'SET_THEME', payload: themeName });
  };

  const toggleTheme = () => {
    dispatch({ type: 'TOGGLE_THEME' });
  };

  return (
    <ThemeContext.Provider value={{
      ...state,
      setTheme,
      toggleTheme
    }}>
      {children}
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

export default ThemeContext;