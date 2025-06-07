import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const FeaturesSection = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  const features = [
    {
      title: 'Real-Time Analytics',
      description: 'Get instant market insights with live price tracking, volume analysis, and trend predictions.',
      icon: '📊',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      title: 'Portfolio Management',
      description: 'Track your investments, analyze performance, and optimize your crypto portfolio with AI-driven insights.',
      icon: '💼',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      title: 'Advanced Trading Tools',
      description: 'Access professional trading indicators, signals, and automated strategies to maximize your returns.',
      icon: '⚡',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    {
      title: 'Market Intelligence',
      description: 'Stay informed with sentiment analysis, news aggregation, and market trend predictions.',
      icon: '🧠',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
    },
    {
      title: 'Security First',
      description: 'Bank-grade security with multi-factor authentication and encrypted data protection.',
      icon: '🔒',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    },
    {
      title: 'Mobile Ready',
      description: 'Access your crypto dashboard anywhere with our responsive design and mobile app.',
      icon: '📱',
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
    }
  ];

  return (
    <section className="features-section" ref={ref}>
      <div className="features-container">
        <motion.div 
          className="features-header"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2>Powerful Features for Crypto Success</h2>
          <p>Everything you need to make informed crypto decisions</p>
        </motion.div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="feature-card"
              initial={{ opacity: 0, y: 50 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -10 }}
            >
              <div 
                className="feature-icon"
                style={{ background: feature.gradient }}
              >
                <span>{feature.icon}</span>
              </div>
              <div className="feature-content">
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;