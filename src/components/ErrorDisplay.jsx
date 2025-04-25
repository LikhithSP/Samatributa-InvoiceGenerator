import React, { useState, useEffect } from 'react';

const ErrorDisplay = ({ error, onClose, duration = 5000 }) => {
  const [visible, setVisible] = useState(true);
  
  // Auto-hide the error after duration
  useEffect(() => {
    if (!error) return;
    
    const timer = setTimeout(() => {
      setVisible(false);
      if (onClose) onClose();
    }, duration);
    
    return () => clearTimeout(timer);
  }, [error, onClose, duration]);
  
  // Handle manual close
  const handleClose = () => {
    setVisible(false);
    if (onClose) onClose();
  };
  
  if (!error || !visible) return null;
  
  return (
    <div className="error-display">
      <div className="error-content">
        <span className="error-message">{error}</span>
        <button className="error-close" onClick={handleClose}>×</button>
      </div>
    </div>
  );
};

export default ErrorDisplay;