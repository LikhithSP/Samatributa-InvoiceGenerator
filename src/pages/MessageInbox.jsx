import React, { useState, useEffect } from 'react';
import { FiSend, FiMail, FiCircle, FiPlus, FiMoreVertical, FiEdit2, FiTrash2 } from 'react-icons/fi';
import '../App.css';
import { useUserNotifications } from '../context/UserNotificationsContext';

const getAllUsers = () => JSON.parse(localStorage.getItem('users')) || [];
const getCurrentUser = () => {
  const userId = localStorage.getItem('userId');
  const users = getAllUsers();
  return users.find(u => u.id === userId);
};
const getConversationKey = (email1, email2) => [email1, email2].sort().join('__');

const getLastMessage = (currentEmail, otherEmail) => {
  const key = getConversationKey(currentEmail, otherEmail);
  const conv = JSON.parse(localStorage.getItem(`messages_${key}`)) || [];
  return conv.length > 0 ? conv[conv.length - 1] : null;
};

const getAvatar = (user) => user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=3b82f6&color=fff&size=64`;

// Utility to get unread count for a conversation
const getUnreadCount = (currentEmail, otherEmail) => {
  const key = getConversationKey(currentEmail, otherEmail);
  const conv = JSON.parse(localStorage.getItem(`messages_${key}`)) || [];
  return conv.filter(msg => msg.to === currentEmail && !msg.read).length;
};

// Mark all messages as read in a conversation
const markConversationRead = (currentEmail, otherEmail) => {
  const key = getConversationKey(currentEmail, otherEmail);
  let conv = JSON.parse(localStorage.getItem(`messages_${key}`)) || [];
  let updated = false;
  conv = conv.map(msg => {
    if (msg.to === currentEmail && !msg.read) {
      updated = true;
      return { ...msg, read: true };
    }
    return msg;
  });
  if (updated) {
    localStorage.setItem(`messages_${key}`, JSON.stringify(conv));
  }
};

const MessageInbox = () => {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState([]);
  const [isDark, setIsDark] = useState(document.body.classList.contains('dark-mode'));
  const { addNotification } = useUserNotifications();
  const [editIdx, setEditIdx] = useState(null);
  const [editText, setEditText] = useState('');
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [hoveredMsg, setHoveredMsg] = useState(null);
  const [showMenuIdx, setShowMenuIdx] = useState(null);

  useEffect(() => {
    setUsers(getAllUsers());
    setCurrentUser(getCurrentUser());
  }, []);

  useEffect(() => {
    if (currentUser && selectedUser) {
      const key = getConversationKey(currentUser.email, selectedUser.email);
      const conv = JSON.parse(localStorage.getItem(`messages_${key}`)) || [];
      setMessages(conv);
      // Mark as read when opening conversation
      markConversationRead(currentUser.email, selectedUser.email);
    } else {
      setMessages([]);
    }
  }, [currentUser, selectedUser]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.body.classList.contains('dark-mode'));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Handle file selection
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    const isImage = selected.type.startsWith('image/');
    const isPDF = selected.type === 'application/pdf';
    if (!isImage && !isPDF) {
      alert('Only images and PDFs are allowed.');
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB.');
      return;
    }
    setFile(selected);
    if (isImage) {
      const reader = new FileReader();
      reader.onload = (ev) => setFilePreview(ev.target.result);
      reader.readAsDataURL(selected);
    } else if (isPDF) {
      setFilePreview(URL.createObjectURL(selected));
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if ((!messageText.trim() && !file) || !selectedUser) return;
    const key = getConversationKey(currentUser.email, selectedUser.email);
    let newMsg = {
      from: currentUser.email,
      to: selectedUser.email,
      text: messageText,
      timestamp: new Date().toISOString(),
      read: false // Mark as unread for recipient
    };
    if (file) {
      const isImage = file.type.startsWith('image/');
      const isPDF = file.type === 'application/pdf';
      newMsg.file = {
        name: file.name,
        type: file.type,
        data: filePreview // base64 for image, blob url for pdf
      };
    }
    const conv = JSON.parse(localStorage.getItem(`messages_${key}`)) || [];
    const updatedConv = [...conv, newMsg];
    localStorage.setItem(`messages_${key}`, JSON.stringify(updatedConv));
    setMessages(updatedConv);
    setMessageText('');
    setFile(null);
    setFilePreview(null);
    // Send notification to recipient if not self
    const allUsers = getAllUsers();
    const recipient = allUsers.find(u => u.email === selectedUser.email);
    if (recipient && recipient.id !== currentUser.id) {
      // Store notification in recipient's notifications in localStorage
      const recipientNotifications = JSON.parse(localStorage.getItem(`notifications_${recipient.id}`)) || [];
      const notification = {
        id: `notification_${Date.now()}`,
        timestamp: new Date().toISOString(),
        message: `${currentUser.name} has sent you a message`,
        type: 'info',
        read: false,
        data: { from: currentUser.id, to: recipient.id }
      };
      localStorage.setItem(`notifications_${recipient.id}`, JSON.stringify([
        notification,
        ...recipientNotifications
      ]));
      // If recipient is current user (for demo/multi-tab), also show in bell
      if (recipient.id === localStorage.getItem('userId')) {
        addNotification(`${currentUser.name} has sent you a message`, 'info', { from: currentUser.id, to: recipient.id });
      }
      // Dispatch event so NotificationBell updates in real time
      window.dispatchEvent(new Event('userUpdated'));
    }
  };

  const startEdit = (idx, text) => {
    setEditIdx(idx);
    setEditText(text);
  };

  const saveEdit = (idx) => {
    const key = getConversationKey(currentUser.email, selectedUser.email);
    const conv = JSON.parse(localStorage.getItem(`messages_${key}`)) || [];
    conv[idx].text = editText;
    localStorage.setItem(`messages_${key}`, JSON.stringify(conv));
    setMessages(conv);
    setEditIdx(null);
    setEditText('');
  };

  const cancelEdit = () => {
    setEditIdx(null);
    setEditText('');
  };

  const deleteMessage = (idx) => {
    const key = getConversationKey(currentUser.email, selectedUser.email);
    const conv = JSON.parse(localStorage.getItem(`messages_${key}`)) || [];
    conv.splice(idx, 1);
    localStorage.setItem(`messages_${key}`, JSON.stringify(conv));
    setMessages(conv);
  };

  // For sidebar: sort users by last message time (desc)
  const sidebarUsers = users
    .filter(u => u.email !== currentUser?.email)
    .map(u => {
      const lastMsg = getLastMessage(currentUser?.email, u.email);
      return { ...u, lastMsg };
    })
    .sort((a, b) => {
      const aTime = a.lastMsg ? new Date(a.lastMsg.timestamp).getTime() : 0;
      const bTime = b.lastMsg ? new Date(b.lastMsg.timestamp).getTime() : 0;
      return bTime - aTime;
    });

  // Calculate total unread messages for badge
  const totalUnread = sidebarUsers.reduce((sum, u) => sum + getUnreadCount(currentUser?.email, u.email), 0);

  const formatTime = (iso) => {
    if (!iso) return '';
    const date = new Date(iso);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString();
  };

  return (
    <div
      style={{
        display: 'flex',
        height: '80vh',
        background: isDark
          ? 'linear-gradient(135deg, #181f2a 0%, #232a36 100%)'
          : 'linear-gradient(135deg, #f6f8fa 0%, #e3eafc 100%)',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: isDark
          ? '0 4px 32px 0 #10131a99, 0 1.5px 6px #232a36'
          : '0 4px 32px 0 #e0e7ef99, 0 1.5px 6px #e3eafc',
        margin: '40px auto',
        maxWidth: 950,
        border: isDark ? '1.5px solid #232a36' : '1.5px solid #e5e7eb',
        transition: 'background 0.3s, box-shadow 0.3s',
      }}
    >
      {/* Sidebar */}
      <div style={{ 
        width: 320, 
        background: isDark ? '#232a36' : '#fff', 
        borderRight: isDark ? '1px solid #232a36' : '1px solid #e5e7eb', 
        display: 'flex', 
        flexDirection: 'column' 
      }}>
        <div style={{ 
          padding: '24px 24px 12px 24px', 
          borderBottom: isDark ? '1px solid #232a36' : '1px solid #f3f4f6', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between' // Add space for clear chat button
        }}>
          <div style={{ fontWeight: 700, fontSize: 22, color: isDark ? '#fff' : '#222', display: 'flex', alignItems: 'center', gap: 10 }}>
            Inbox
          </div>
          {selectedUser && (
            <button
              onClick={() => {
                if (window.confirm(`Clear chat with ${selectedUser.name}? This cannot be undone.`)) {
                  const key = getConversationKey(currentUser.email, selectedUser.email);
                  localStorage.removeItem(`messages_${key}`);
                  setMessages([]);
                  window.dispatchEvent(new Event('userUpdated'));
                }
              }}
              style={{
                background: isDark ? 'linear-gradient(90deg, #ef4444 60%, #b91c1c 100%)' : 'linear-gradient(90deg, #f87171 60%, #ef4444 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 20,
                padding: '6px 20px',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                marginLeft: 12,
                boxShadow: isDark ? '0 2px 8px #10131a33' : '0 2px 8px #e0e7ef33',
                transition: 'background 0.2s, box-shadow 0.2s, transform 0.1s',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                outline: 'none',
                position: 'relative',
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px) scale(1.04)'}
              onMouseOut={e => e.currentTarget.style.transform = 'none'}
              title={`Clear chat with ${selectedUser.name}`}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
              Clear Chat
            </button>
          )}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 8px 0' }}>
          {sidebarUsers.map(u => {
            const unread = getUnreadCount(currentUser?.email, u.email);
            return (
              <div
                key={u.email}
                onClick={() => {
                  setSelectedUser(u);
                  markConversationRead(currentUser.email, u.email);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 24px', cursor: 'pointer', background: selectedUser?.email === u.email ? (isDark ? '#232f45' : '#f3f6fd') : (isDark ? '#232a36' : '#fff'), borderLeft: selectedUser?.email === u.email ? '4px solid #3b82f6' : '4px solid transparent', transition: 'background 0.2s', position: 'relative'
                }}
              >
                <img src={getAvatar(u)} alt={u.name} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: isDark ? '2px solid #232a36' : '2px solid #e5e7eb' }} />
                <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
                  <div style={{ fontWeight: 600, fontSize: 16, color: isDark ? '#fff' : '#222', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</div>
                  {unread > 0 && (
                    <span style={{
                      background: '#3b82f6',
                      color: '#fff',
                      borderRadius: '10px',
                      fontSize: 13,
                      fontWeight: 700,
                      padding: '2px 8px',
                      marginLeft: 8,
                      verticalAlign: 'middle',
                      marginTop: 1
                    }}>{unread}</span>
                  )}
                </div>
                <div style={{ textAlign: 'right', minWidth: 48 }}>
                  <div style={{ fontSize: 12, color: isDark ? '#bfc7d5' : '#bfc7d5' }}>{formatTime(u.lastMsg?.timestamp)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Main chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: isDark ? '#181f2a' : '#f6f8fa' }}>
        {/* Chat header */}
        <div style={{ padding: '22px 32px', borderBottom: isDark ? '1px solid #232a36' : '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 16, background: isDark ? '#232a36' : '#fff', minHeight: 80 }}>
          {selectedUser ? (
            <>
              <img src={getAvatar(selectedUser)} alt={selectedUser.name} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: isDark ? '2px solid #232a36' : '2px solid #e5e7eb' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 18, color: isDark ? '#fff' : '#222' }}>{selectedUser.name}</div>
                {/* Removed online status indicator */}
              </div>
              <div style={{ color: isDark ? '#bfc7d5' : '#888', fontSize: 13 }}>{selectedUser.email}</div>
            </>
          ) : null}
        </div>
        {/* Chat messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 32px 0 32px', display: 'flex', flexDirection: 'column', gap: 10, justifyContent: selectedUser ? 'flex-start' : 'center' }}>
          {selectedUser ? (
            messages.length === 0 ? (
              <div style={{ color: isDark ? '#bfc7d5' : '#888', textAlign: 'center', marginTop: 40 }}>No messages yet. Start the conversation!</div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: msg.from === currentUser.email ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 10 }}>
                  <img src={getAvatar(msg.from === currentUser.email ? currentUser : selectedUser)} alt="avatar" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: isDark ? '2px solid #232a36' : '2px solid #e5e7eb' }} />
                  <div>
                    <div style={{
                      background: msg.from === currentUser.email ? (isDark ? '#3b82f6' : '#3b82f6') : (isDark ? '#232a36' : '#fff'),
                      color: msg.from === currentUser.email ? '#fff' : (isDark ? '#fff' : '#222'),
                      borderRadius: msg.from === currentUser.email ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      padding: '12px 18px',
                      fontSize: 15,
                      boxShadow: isDark ? '0 1px 4px #10131a' : '0 1px 4px #e0e7ef',
                      maxWidth: 340,
                      minWidth: 60,
                      marginBottom: 2,
                      wordBreak: 'break-word',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }} onMouseEnter={() => setHoveredMsg(idx)} onMouseLeave={() => setHoveredMsg(null)}>
                      {msg.file && msg.file.type.startsWith('image/') && (
                        <img src={msg.file.data} alt="attachment" style={{ maxWidth: 120, maxHeight: 120, borderRadius: 8, marginRight: 8 }} />
                      )}
                      {msg.file && msg.file.type === 'application/pdf' && (
                        <a href={msg.file.data} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', fontWeight: 600, marginRight: 8 }}>
                          PDF: {msg.file.name}
                        </a>
                      )}
                      {editIdx === idx ? (
                        <input
                          type="text"
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') saveEdit(idx);
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          style={{
                            flex: 1,
                            fontSize: 15,
                            border: '1px solid #3b82f6',
                            borderRadius: 8,
                            padding: '6px 10px',
                            outline: 'none',
                            background: isDark ? '#181f2a' : '#f6f8fa',
                            color: isDark ? '#fff' : '#222',
                            marginRight: 8
                          }}
                          autoFocus
                        />
                      ) : (
                        <span>{msg.text}</span>
                      )}
                      {/* Modern 3-dot menu for own messages */}
                      {msg.from === currentUser.email && editIdx !== idx && (
                        <div style={{ position: 'relative', marginLeft: 4 }}>
                          <button
                            style={{
                              background: 'none',
                              border: 'none',
                              color: msg.from === currentUser.email ? '#fff' : (isDark ? '#fff' : '#222'),
                              cursor: 'pointer',
                              fontSize: 18,
                              padding: 0,
                              opacity: hoveredMsg === idx ? 1 : 0.4,
                              transition: 'opacity 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                            onClick={() => setShowMenuIdx(showMenuIdx === idx ? null : idx)}
                            tabIndex={-1}
                            aria-label="Message actions"
                          >
                            <FiMoreVertical />
                          </button>
                          {showMenuIdx === idx && (
                            <div style={{
                              position: 'absolute',
                              top: 24,
                              right: 0,
                              background: isDark ? '#232a36' : '#fff',
                              border: isDark ? '1px solid #232a36' : '1px solid #e5e7eb',
                              borderRadius: 8,
                              boxShadow: isDark ? '0 2px 8px #10131a33' : '0 2px 8px #e0e7ef33',
                              zIndex: 10,
                              minWidth: 130, // increased from 90
                              padding: '8px 0', // increased vertical padding
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'stretch',
                            }}>
                              <button
                                onClick={() => { setShowMenuIdx(null); startEdit(idx, msg.text); }}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 8,
                                  width: '100%', background: 'none', border: 'none', color: isDark ? '#fff' : '#222', fontSize: 14, padding: '6px 16px', cursor: 'pointer', borderRadius: 6, transition: 'background 0.15s',
                                }}
                                onMouseOver={e => e.currentTarget.style.background = isDark ? '#181f2a' : '#f3f6fd'}
                                onMouseOut={e => e.currentTarget.style.background = 'none'}
                              >
                                <FiEdit2 size={16} /> Edit
                              </button>
                              <button
                                onClick={() => { setShowMenuIdx(null); deleteMessage(idx); }}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 8,
                                  width: '100%', background: 'none', border: 'none', color: '#ef4444', fontSize: 14, padding: '6px 16px', cursor: 'pointer', borderRadius: 6, transition: 'background 0.15s',
                                }}
                                onMouseOver={e => e.currentTarget.style.background = isDark ? '#181f2a' : '#f3f6fd'}
                                onMouseOut={e => e.currentTarget.style.background = 'none'}
                              >
                                <FiTrash2 size={16} /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      {/* ...existing save/cancel for edit mode ... */}
                    </div>
                    <div style={{ fontSize: 11, color: isDark ? '#bfc7d5' : '#bfc7d5', margin: msg.from === currentUser.email ? '0 8px 0 0' : '0 0 0 8px', textAlign: msg.from === currentUser.email ? 'right' : 'left' }}>
                      {formatTime(msg.timestamp)} {msg.from === currentUser.email ? '(You)' : ''}
                    </div>
                  </div>
                </div>
              ))
            )
          ) : (
            <div style={{ color: isDark ? '#bfc7d5' : '#888', fontSize: 18, fontWeight: 500, textAlign: 'center' }}>
              Select a user to start chatting
            </div>
          )}
          {!selectedUser && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: 400,
              gap: 24,
              color: isDark ? '#bfc7d5' : '#222',
              opacity: 0.95
            }}>
              <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="10" y="30" width="100" height="60" rx="18" fill={isDark ? '#232a36' : '#e3eafc'} />
                <rect x="25" y="45" width="70" height="10" rx="5" fill={isDark ? '#3b82f6' : '#60a5fa'} />
                <rect x="25" y="60" width="40" height="8" rx="4" fill={isDark ? '#334155' : '#cbd5e1'} />
                <circle cx="95" cy="80" r="8" fill={isDark ? '#3b82f6' : '#60a5fa'} />
              </svg>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 0.2, color: isDark ? '#fff' : '#232a36', textAlign: 'center' }}>
                Welcome to your Inbox
              </div>
              <div style={{ fontSize: 16, color: isDark ? '#bfc7d5' : '#6b7280', textAlign: 'center', maxWidth: 340 }}>
                Select a user from the left to start a conversation. Your messages, files, and notifications will appear here.
              </div>
            </div>
          )}
        </div>
        {/* Message input */}
        {selectedUser && (
          <form onSubmit={handleSend} style={{ display: 'flex', gap: 10, padding: '18px 32px', background: isDark ? '#232a36' : '#fff', borderTop: isDark ? '1px solid #232a36' : '1px solid #e5e7eb' }}>
            <input
              type="text"
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              placeholder="Type your message..."
              style={{ flex: 1, padding: 14, borderRadius: 8, border: isDark ? '1px solid #232a36' : '1px solid #e5e7eb', fontSize: 16, background: isDark ? '#181f2a' : '#f6f8fa', color: isDark ? '#fff' : '#222' }}
              autoFocus
            />
            <input
              type="file"
              accept="image/*,application/pdf"
              style={{ display: 'none' }}
              id="chat-file-input"
              onChange={handleFileChange}
            />
            <label htmlFor="chat-file-input" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', background: isDark ? '#232a36' : '#e5e7eb', borderRadius: 8, padding: '0 12px', fontSize: 22 }} title="Attach file">
              <FiPlus />
            </label>
            <button type="submit" style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '0 24px', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiSend />
            </button>
          </form>
        )}
        {/* File preview */}
        {file && (
          <div style={{ padding: '0 32px 10px 32px', display: 'flex', alignItems: 'center', gap: 12 }}>
            {file.type.startsWith('image/') ? (
              <img src={filePreview} alt="preview" style={{ maxHeight: 60, borderRadius: 8, border: '1px solid #e5e7eb' }} />
            ) : file.type === 'application/pdf' ? (
              <a href={filePreview} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', fontWeight: 600 }}>
                PDF: {file.name}
              </a>
            ) : null}
            <button onClick={() => { setFile(null); setFilePreview(null); }} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 18, cursor: 'pointer' }}>✖</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageInbox;
