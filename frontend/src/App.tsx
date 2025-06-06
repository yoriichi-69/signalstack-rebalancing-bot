import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AnimatePresence, motion } from 'framer-motion';
import ParticleBackground from './components/ParticleBackground';

// Layout
import Layout from './components/Layout';

// Pages
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import Strategies from './pages/Strategies';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00ff9d',
      light: '#33ffb1',
      dark: '#00cc7d',
    },
    secondary: {
      main: '#ff00ff',
      light: '#ff33ff',
      dark: '#cc00cc',
    },
    background: {
      default: '#0a0a0f',
      paper: '#151520',
    },
    error: {
      main: '#ff3d3d',
      light: '#ff6b6b',
    },
    warning: {
      main: '#ffd700',
      light: '#ffe44d',
    },
    success: {
      main: '#00ff9d',
      light: '#33ffb1',
    },
    info: {
      main: '#00bfff',
      light: '#33ccff',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b3b3cc',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 800,
      letterSpacing: '-0.025em',
      fontSize: '2.5rem',
      textShadow: '0 0 10px rgba(0, 255, 157, 0.5), 0 0 20px rgba(0, 255, 157, 0.3)',
    },
    h2: {
      fontWeight: 800,
      letterSpacing: '-0.025em',
      fontSize: '2rem',
      textShadow: '0 0 8px rgba(0, 255, 157, 0.4), 0 0 16px rgba(0, 255, 157, 0.2)',
    },
    h3: {
      fontWeight: 700,
      fontSize: '1.5rem',
      textShadow: '0 0 6px rgba(0, 255, 157, 0.3), 0 0 12px rgba(0, 255, 157, 0.1)',
    },
    h4: {
      fontWeight: 700,
      fontSize: '1.25rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.125rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
    },
    button: {
      fontWeight: 700,
      textTransform: 'none',
      letterSpacing: '0.05em',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '12px 24px',
          textTransform: 'none',
          fontWeight: 700,
          letterSpacing: '0.05em',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(45deg, rgba(0, 255, 157, 0.1), rgba(255, 0, 255, 0.1))',
            opacity: 0,
            transition: 'opacity 0.3s ease',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: 'linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
            transform: 'rotate(45deg)',
            transition: 'all 0.3s ease',
            opacity: 0,
          },
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 0 20px rgba(0, 255, 157, 0.4), 0 0 40px rgba(0, 255, 157, 0.2)',
            '&::before': {
              opacity: 1,
            },
            '&::after': {
              opacity: 1,
              transform: 'rotate(45deg) translate(50%, 50%)',
            },
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        contained: {
          background: 'linear-gradient(45deg, #00ff9d 30%, #00cc7d 90%)',
          boxShadow: '0 0 15px rgba(0, 255, 157, 0.3), inset 0 0 10px rgba(0, 255, 157, 0.2)',
          '&:hover': {
            background: 'linear-gradient(45deg, #00cc7d 30%, #00ff9d 90%)',
            boxShadow: '0 0 25px rgba(0, 255, 157, 0.5), inset 0 0 15px rgba(0, 255, 157, 0.3)',
          },
        },
        outlined: {
          border: '2px solid #00ff9d',
          color: '#00ff9d',
          textShadow: '0 0 5px rgba(0, 255, 157, 0.5)',
          '&:hover': {
            border: '2px solid #00ff9d',
            background: 'rgba(0, 255, 157, 0.1)',
            boxShadow: '0 0 20px rgba(0, 255, 157, 0.3), inset 0 0 10px rgba(0, 255, 157, 0.2)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(21, 21, 32, 0.7)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(0, 255, 157, 0.1)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2), inset 0 0 10px rgba(0, 255, 157, 0.1)',
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(45deg, rgba(0, 255, 157, 0.1), rgba(255, 0, 255, 0.1))',
            opacity: 0,
            transition: 'opacity 0.3s ease',
          },
          '&:hover': {
            transform: 'translateY(-4px)',
            border: '1px solid rgba(0, 255, 157, 0.3)',
            boxShadow: '0 8px 30px rgba(0, 255, 157, 0.2), inset 0 0 15px rgba(0, 255, 157, 0.2)',
            '&::before': {
              opacity: 1,
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background: 'rgba(21, 21, 32, 0.7)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(0, 255, 157, 0.1)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2), inset 0 0 10px rgba(0, 255, 157, 0.1)',
        },
      },
    },
  },
});

// Create a sub-component that uses useLocation inside Router context
const AnimatedRoutes: React.FC = () => {
  const location = useLocation();
  return (
    <Layout>
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
              <Dashboard />
            </motion.div>
          } />
          <Route path="/portfolio" element={
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
              <Portfolio />
            </motion.div>
          } />
          <Route path="/strategies" element={
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
              <Strategies />
            </motion.div>
          } />
          <Route path="/analytics" element={
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
              <Analytics />
            </motion.div>
          } />
          <Route path="/settings" element={
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
              <Settings />
            </motion.div>
          } />
        </Routes>
      </AnimatePresence>
    </Layout>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ParticleBackground />
      <Router>
        <AnimatedRoutes />
      </Router>
      <ToastContainer position="top-right" />
    </ThemeProvider>
  );
}

export default App; 