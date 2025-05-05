import React, { useState, useRef, useEffect } from 'react';
import { FiBell } from 'react-icons/fi';
import { useUserNotifications } from '../context/UserNotificationsContext';
import { useNavigate } from 'react-router-dom';
import SoundEffects from '../utils/soundEffects';

const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useUserNotifications();
  const [showDropdown, setShowDropdown] = useState(false);
  const [bellAnimation, setBellAnimation] = useState(false);
  const dropdownRef = useRef(null);
  const bellRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Bell ring animation for unread notifications
  useEffect(() => {
    if (unreadCount > 0) {
      // Trigger bell animation
      const animateBell = () => {
        setBellAnimation(true);
        setTimeout(() => setBellAnimation(false), 1000);
      };

      // Initial animation
      animateBell();

      // Set up interval for periodic animation if there are unread notifications
      const animationInterval = setInterval(animateBell, 30000); // Every 30 seconds

      return () => clearInterval(animationInterval);
    }
  }, [unreadCount]);

  // Format timestamp to relative time (e.g., "5 minutes ago")
  const getRelativeTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    // Mark as read
    markAsRead(notification.id);

    // Play click sound
    SoundEffects.play('CLICK');

    // Navigate if relevant
    if (notification.data && notification.data.invoiceId) {
      navigate(`/invoice/${notification.data.invoiceId}`);
    }
    
    // Close dropdown
    setShowDropdown(false);
  };

  // Toggle dropdown with sound effect
  const toggleDropdown = () => {
    if (!showDropdown) {
      SoundEffects.play('SWITCH');
    }
    setShowDropdown(!showDropdown);
  };

  // Handle mark all as read with sound feedback
  const handleMarkAllAsRead = () => {
    markAllAsRead();
    SoundEffects.play('SUCCESS');
  };

  return (
    <div className="notification-bell-container" style={{ position: 'relative' }}>
      <button
        className={`notification-bell-button ${bellAnimation ? 'ringing' : ''}`}
        onClick={toggleDropdown}
        ref={bellRef}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          padding: '5px',
          fontSize: '20px',
          color: 'var(--text-color)',
          transition: 'transform 0.3s ease, color 0.3s ease',
          transform: showDropdown ? 'scale(1.2)' : 'scale(1)',
        }}
        onMouseEnter={() => bellRef.current.style.transform = 'scale(1.1) rotate(5deg)'}
        onMouseLeave={() => bellRef.current.style.transform = showDropdown ? 'scale(1.2)' : 'scale(1)'}
      >
        <FiBell style={{
          animation: bellAnimation ? 'bellRing 0.8s ease-in-out' : 'none',
        }} />
        {unreadCount > 0 && (
          <span
            className="notification-badge"
            style={{
              position: 'absolute',
              top: '0',
              right: '0',
              backgroundColor: 'var(--primary-color)',
              color: 'white',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
              transform: 'translateZ(5px)',
              animation: unreadCount > 0 ? 'pulse 2s infinite' : 'none',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div
          ref={dropdownRef}
          className="notifications-dropdown glass-panel"
          style={{
            position: 'absolute',
            top: '40px',
            right: '0',
            width: '350px',
            maxHeight: '400px',
            backgroundColor: 'var(--card-bg)',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            transformOrigin: 'top right',
            animation: 'dropdownFadeIn 0.3s forwards',
            transform: 'translateZ(50px)',
          }}
        >
          <div
            className="notifications-header"
            style={{
              padding: '15px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(to right, var(--card-bg), var(--card-bg-accent, var(--card-bg)))',
            }}
          >
            <h3 style={{ 
              margin: 0, 
              fontSize: '16px', 
              fontWeight: '600',
              color: 'var(--primary-color)',
            }}>Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="mark-all-read-btn"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-color)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500',
                  padding: '5px 10px',
                  borderRadius: '4px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                Mark all as read
              </button>
            )}
          </div>

          <div
            className="notifications-list"
            style={{
              overflowY: 'auto',
              maxHeight: '350px',
            }}
          >
            {notifications.length === 0 ? (
              <div
                className="empty-notifications"
                style={{
                  padding: '30px 20px',
                  textAlign: 'center',
                  color: 'var(--light-text)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FiBell style={{ 
                  fontSize: '40px', 
                  opacity: 0.5, 
                  marginBottom: '15px',
                  color: 'var(--light-text)'
                }} />
                <p style={{ margin: '0' }}>No notifications yet</p>
                <p style={{ 
                  margin: '5px 0 0 0', 
                  fontSize: '12px' 
                }}>New notifications will appear here</p>
              </div>
            ) : (
              notifications.map((notification, index) => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                  style={{
                    padding: '15px',
                    borderBottom: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    backgroundColor: notification.read ? 'transparent' : 'rgba(59, 130, 246, 0.05)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    animation: `notificationFadeIn 0.3s ${index * 0.05}s both`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                    e.currentTarget.style.transform = 'translateX(5px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = notification.read ? 'transparent' : 'rgba(59, 130, 246, 0.05)';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  {!notification.read && (
                    <span
                      className="unread-indicator"
                      style={{
                        display: 'block',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary-color)',
                        position: 'absolute',
                        top: '18px',
                        left: '5px',
                        boxShadow: '0 0 5px var(--primary-color)',
                      }}
                    />
                  )}
                  <div style={{ marginLeft: '12px' }}>
                    <div
                      className="notification-message"
                      style={{
                        fontSize: '14px',
                        fontWeight: notification.read ? 'normal' : 'bold',
                        marginBottom: '5px',
                        color: 'var(--text-color)',
                      }}
                    >
                      {notification.message}
                    </div>
                    <div
                      className="notification-time"
                      style={{
                        fontSize: '12px',
                        color: 'var(--light-text)',
                      }}
                    >
                      {getRelativeTime(notification.timestamp)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes bellRing {
          0%, 100% { transform: rotate(0); }
          20% { transform: rotate(15deg); }
          40% { transform: rotate(-15deg); }
          60% { transform: rotate(7deg); }
          80% { transform: rotate(-7deg); }
        }
        
        @keyframes pulse {
          0% { transform: scale(1) translateZ(5px); }
          50% { transform: scale(1.1) translateZ(5px); }
          100% { transform: scale(1) translateZ(5px); }
        }
        
        @keyframes dropdownFadeIn {
          from { opacity: 0; transform: translateY(-10px) translateZ(50px); }
          to { opacity: 1; transform: translateY(0) translateZ(50px); }
        }
        
        @keyframes notificationFadeIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }

        /* For browsers that support it, add a hovering effect with perspective */
        @media (hover: hover) {
          .glass-panel {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          
          .glass-panel:hover {
            transform: translateZ(55px);
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
          }
        }
      `}</style>
    </div>
  );
};

export default NotificationBell;