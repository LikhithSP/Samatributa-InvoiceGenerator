import React, { useEffect, useState } from 'react';

const Modal = ({ isOpen, onClose, title, children, actions }) => {
  const [animatingOut, setAnimatingOut] = useState(false);
  const [visible, setVisible] = useState(false);
  
  // Set visible with slight delay to trigger animation
  useEffect(() => {
    if (isOpen) {
      setAnimatingOut(false);
      // Small timeout to ensure CSS transition works
      setTimeout(() => setVisible(true), 10);
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  // Handle closing with animation
  const handleClose = () => {
    setAnimatingOut(true);
    setVisible(false);
    // Wait for animation to finish before calling onClose
    setTimeout(onClose, 300);
  };

  // Close modal when Escape key is pressed
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Stop click propagation from the modal content
  const handleContentClick = (e) => {
    e.stopPropagation();
  };
  
  if (!isOpen && !animatingOut) return null;
  
  return (
    <div 
      className={`modal-overlay ${visible ? 'visible' : 'hidden'}`}
      onClick={handleClose}
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease'
      }}
    >
      <div 
        className={`modal-content glass-panel ${visible ? 'visible' : 'hidden'}`}
        onClick={handleContentClick}
        style={{
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(20px)',
          opacity: visible ? 1 : 0,
          transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
        }}
      >
        <div className="modal-header parallax-container">
          <h3 className="parallax-layer-1">{title}</h3>
          <button 
            className="modal-close" 
            onClick={handleClose}
            style={{
              transition: 'transform 0.2s ease, opacity 0.2s ease',
              transform: 'translateZ(5px)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateZ(10px) scale(1.2) rotate(90deg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateZ(5px)';
            }}
          >×</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        {actions && (
          <div className="modal-footer">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;