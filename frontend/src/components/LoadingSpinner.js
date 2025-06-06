import React from 'react';

const LoadingSpinner = ({ size = 40, color = '#0f3460' }) => {
  return (
    <div className="spinner-container">
      <div className="spinner" style={{
        width: `${size}px`,
        height: `${size}px`,
        border: `4px solid rgba(0, 0, 0, 0.1)`,
        borderLeftColor: color,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }}>
      </div>
      
      <style jsx>{`
        .spinner-container {
          display: flex;
          justify-content: center;
          margin: 20px 0;
        }
        
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;