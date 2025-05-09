// BinPage.jsx - For managing deleted invoices
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArchive, FiArrowLeft, FiTrash2, FiRefreshCw, FiClock, FiAlertTriangle } from 'react-icons/fi';
import '../App.css';
import './BinPage.css';

const BinPage = ({ onLogout, darkMode, toggleDarkMode }) => {
  const navigate = useNavigate();
  const [deletedInvoices, setDeletedInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load deleted invoices from localStorage on component mount
  useEffect(() => {
    loadDeletedInvoices();
    
    // Listen for updates to the bin
    window.addEventListener('invoiceBinUpdated', loadDeletedInvoices);
    
    return () => {
      window.removeEventListener('invoiceBinUpdated', loadDeletedInvoices);
    };
  }, []);
  
  // Load deleted invoices from localStorage
  const loadDeletedInvoices = () => {
    try {
      setIsLoading(true);
      
      // Get invoices from bin
      const binInvoices = JSON.parse(localStorage.getItem('invoiceBin')) || [];
      
      // Sort by deletion date (newest first)
      const sortedInvoices = binInvoices.sort((a, b) => b.deletedAt - a.deletedAt);
      
      // Clean up invoices older than 30 days
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      let currentInvoices = sortedInvoices.filter(invoice => invoice.deletedAt > thirtyDaysAgo);
      
      // If some invoices were removed due to age, update localStorage
      if (currentInvoices.length < sortedInvoices.length) {
        localStorage.setItem('invoiceBin', JSON.stringify(currentInvoices));
      }
      
      // Filter by user role: only show invoices deleted by the current user
      const currentUserId = localStorage.getItem('userId');
      currentInvoices = currentInvoices.filter(inv => inv.deletedBy === currentUserId);
      
      setDeletedInvoices(currentInvoices);
    } catch (error) {
      console.error('Error loading bin invoices:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Restore invoice from bin
  const restoreInvoice = (invoiceId) => {
    try {
      // Get current invoices from bin
      const binInvoices = JSON.parse(localStorage.getItem('invoiceBin')) || [];
      
      // Find invoice to restore
      const invoiceToRestore = binInvoices.find(invoice => invoice.id === invoiceId);
      
      if (invoiceToRestore) {
        // Remove deletedAt property
        delete invoiceToRestore.deletedAt;
        
        // Get existing invoices and add the restored one
        const savedInvoices = JSON.parse(localStorage.getItem('savedInvoices')) || [];
        savedInvoices.push(invoiceToRestore);
        localStorage.setItem('savedInvoices', JSON.stringify(savedInvoices));
        
        // Remove from bin
        const updatedBin = binInvoices.filter(invoice => invoice.id !== invoiceId);
        localStorage.setItem('invoiceBin', JSON.stringify(updatedBin));
        
        // Update state
        setDeletedInvoices(updatedBin);
        
        // Notify other components
        window.dispatchEvent(new Event('invoicesUpdated'));
        window.dispatchEvent(new Event('invoiceBinUpdated'));
        
        alert('Invoice has been restored successfully.');
      }
    } catch (error) {
      console.error('Error restoring invoice:', error);
      alert('Failed to restore invoice. Please try again.');
    }
  };
  
  // Permanently delete an invoice
  const permanentlyDeleteInvoice = (invoiceId) => {
    if (window.confirm('Are you sure you want to permanently delete this invoice? This action cannot be undone.')) {
      try {
        // Get current invoices from bin
        const binInvoices = JSON.parse(localStorage.getItem('invoiceBin')) || [];
        
        // Remove invoice from bin
        const updatedBin = binInvoices.filter(invoice => invoice.id !== invoiceId);
        localStorage.setItem('invoiceBin', JSON.stringify(updatedBin));
        
        // Update state
        setDeletedInvoices(updatedBin);
        
        // Notify other components
        window.dispatchEvent(new Event('invoiceBinUpdated'));
        
        alert('Invoice has been permanently deleted.');
      } catch (error) {
        console.error('Error permanently deleting invoice:', error);
        alert('Failed to delete invoice. Please try again.');
      }
    }
  };
  
  // Empty the bin (remove all deleted invoices)
  const emptyBin = () => {
    if (window.confirm('Are you sure you want to permanently delete all invoices in the bin? This action cannot be undone.')) {
      try {
        // Clear bin in localStorage
        localStorage.setItem('invoiceBin', JSON.stringify([]));
        
        // Update state
        setDeletedInvoices([]);
        
        // Notify other components
        window.dispatchEvent(new Event('invoiceBinUpdated'));
        
        alert('Bin has been emptied successfully.');
      } catch (error) {
        console.error('Error emptying bin:', error);
        alert('Failed to empty bin. Please try again.');
      }
    }
  };
  
  // Calculate time left before permanent deletion
  const getTimeLeft = (deletedAt) => {
    const deleteTime = new Date(deletedAt);
    const expiryTime = new Date(deletedAt + (30 * 24 * 60 * 60 * 1000)); // 30 days after deletion
    const now = new Date();
    
    // Calculate days left
    const daysLeft = Math.ceil((expiryTime - now) / (24 * 60 * 60 * 1000));
    
    if (daysLeft === 1) {
      return '1 day left';
    } else {
      return `${daysLeft} days left`;
    }
  };
  
  // Header with navigation, title, and theme toggle
  const Header = () => (
    <header className="header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: 80 }}>
      <div className="header-left" style={{ position: 'absolute', left: 0, top: 0, height: '100%', display: 'flex', alignItems: 'center', paddingLeft: 24 }}>
        <div className="back-button" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: 28, color: darkMode ? '#fff' : '#232a36' }}>
          <FiArrowLeft />
        </div>
      </div>
      <div className="header-title" style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'center', width: '100%' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 38, fontWeight: 800, color: darkMode ? '#fff' : '#232a36', margin: 0 }}><FiArchive size={38} /> Invoice Bin</h1>
      </div>
      <div className="header-right" style={{ width: 48 }}></div>
    </header>
  );
  
  return (
    <div className="bin-page" style={{
      minHeight: '90vh',
      background: darkMode
        ? 'linear-gradient(135deg, #181f2a 0%, #232a36 100%)'
        : 'linear-gradient(135deg, #f6f8fa 0%, #e3eafc 100%)',
      borderRadius: 24,
      boxShadow: darkMode
        ? '0 4px 32px 0 #10131a99, 0 1.5px 6px #232a36'
        : '0 4px 32px 0 #e0e7ef99, 0 1.5px 6px #e3eafc',
      margin: '40px auto',
      padding: '32px 0',
      maxWidth: 1100,
      border: darkMode ? '1.5px solid #232a36' : '1.5px solid #e5e7eb',
      transition: 'background 0.3s, box-shadow 0.3s',
    }}>
      <Header />
      <div className="bin-content" style={{ maxWidth: 900, margin: '0 auto' }}>
        <div className="bin-description" style={{
          background: darkMode ? '#232a36' : '#fff',
          boxShadow: darkMode ? '0 1px 4px #10131a33' : '0 1px 4px #e0e7ef33',
          borderRadius: 16,
          marginBottom: 32,
          padding: '24px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: 24
        }}>
          <div className="bin-info" style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 18, fontWeight: 600, color: darkMode ? '#fff' : '#232a36' }}>
              <FiClock size={22} />
              Deleted invoices are kept for 30 days before permanent removal.
            </div>
            <div style={{ color: darkMode ? '#bfc7d5' : '#6b7280', marginTop: 6, fontSize: 15 }}>
              You can restore invoices to your active list or delete them permanently at any time.
            </div>
          </div>
          {deletedInvoices.length > 0 && (
            <div className="bin-actions">
              <button onClick={emptyBin} className="btn btn-danger" style={{
                background: 'linear-gradient(90deg, #ef4444 60%, #b91c1c 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 16,
                padding: '10px 24px',
                fontWeight: 600,
                fontSize: 16,
                boxShadow: darkMode ? '0 2px 8px #10131a33' : '0 2px 8px #e0e7ef33',
                display: 'flex', alignItems: 'center', gap: 8
              }}>
                <FiTrash2 /> Empty Bin
              </button>
            </div>
          )}
        </div>
        {isLoading ? (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <p>Loading deleted invoices...</p>
          </div>
        ) : deletedInvoices.length === 0 ? (
          <div className="empty-bin" style={{
            background: darkMode ? '#232a36' : '#fff',
            borderRadius: 16,
            boxShadow: darkMode ? '0 1px 4px #10131a33' : '0 1px 4px #e0e7ef33',
            marginTop: 40,
            padding: '64px 24px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 18
          }}>
            <svg width="110" height="110" viewBox="0 0 110 110" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: 18 }}>
              <rect x="15" y="35" width="80" height="40" rx="16" fill={darkMode ? '#232a36' : '#e3eafc'} />
              <rect x="30" y="50" width="50" height="8" rx="4" fill={darkMode ? '#3b82f6' : '#60a5fa'} />
              <rect x="30" y="62" width="28" height="6" rx="3" fill={darkMode ? '#334155' : '#cbd5e1'} />
              <circle cx="85" cy="70" r="7" fill={darkMode ? '#3b82f6' : '#60a5fa'} />
              <rect x="45" y="25" width="20" height="8" rx="4" fill={darkMode ? '#bfc7d5' : '#cbd5e1'} />
            </svg>
            <h2 style={{ fontWeight: 700, fontSize: 26, color: darkMode ? '#fff' : '#232a36', marginBottom: 6 }}>Bin is empty</h2>
            <div style={{ color: darkMode ? '#bfc7d5' : '#6b7280', fontSize: 17, marginBottom: 18 }}>No deleted invoices were found.</div>
            <button onClick={() => navigate('/dashboard')} className="btn" style={{
              background: 'linear-gradient(90deg, #3b82f6 60%, #2563eb 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 16,
              padding: '10px 28px',
              fontWeight: 600,
              fontSize: 16,
              boxShadow: darkMode ? '0 2px 8px #10131a33' : '0 2px 8px #e0e7ef33',
              marginTop: 8
            }}>
              Return to Dashboard
            </button>
          </div>
        ) : (
          <div className="bin-invoice-list" style={{ marginTop: 24 }}>
            <table className="bin-table" style={{
              background: darkMode ? '#232a36' : '#fff',
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: darkMode ? '0 1px 4px #10131a33' : '0 1px 4px #e0e7ef33',
              fontSize: 16
            }}>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Deleted On</th>
                  <th>Time Left</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deletedInvoices.map((invoice, idx) => {
                  const deletedDate = new Date(invoice.deletedAt).toLocaleDateString();
                  const timeLeft = getTimeLeft(invoice.deletedAt);
                  return (
                    <tr key={invoice.id} style={{ background: idx % 2 === 0 ? (darkMode ? '#232a36' : '#f6f8fa') : 'transparent', transition: 'background 0.2s' }}>
                      <td style={{ fontWeight: 600 }}>{invoice.invoiceNumber}</td>
                      <td>{invoice.recipientName || 'N/A'}</td>
                      <td>{new Date(invoice.invoiceDate).toLocaleDateString()}</td>
                      <td>
                        <span style={{ color: '#3b82f6', fontWeight: 600 }}>${invoice.totalUSD ? invoice.totalUSD.toFixed(2) : '0.00'}</span>
                        <span style={{ color: '#6b7280', marginLeft: 6 }}>/ ₹{invoice.totalINR ? invoice.totalINR.toFixed(2) : '0.00'}</span>
                      </td>
                      <td>{deletedDate}</td>
                      <td><span style={{ color: '#f59e0b', fontWeight: 500 }}>{timeLeft}</span></td>
                      <td>
                        <div className="bin-actions" style={{ gap: 8 }}>
                          <button 
                            onClick={() => restoreInvoice(invoice.id)}
                            className="btn btn-secondary bin-action-btn"
                            title="Restore Invoice"
                            style={{
                              background: 'linear-gradient(90deg, #60a5fa 60%, #3b82f6 100%)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 10,
                              fontWeight: 600,
                              fontSize: 15,
                              padding: '7px 18px',
                              display: 'flex', alignItems: 'center', gap: 7,
                              boxShadow: darkMode ? '0 1px 4px #10131a33' : '0 1px 4px #e0e7ef33',
                            }}
                          >
                            <FiRefreshCw /> Restore
                          </button>
                          <button
                            onClick={() => permanentlyDeleteInvoice(invoice.id)}
                            className="btn btn-danger bin-action-btn"
                            title="Delete Permanently"
                            style={{
                              background: 'linear-gradient(90deg, #ef4444 60%, #b91c1c 100%)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 10,
                              fontWeight: 600,
                              fontSize: 15,
                              padding: '7px 18px',
                              display: 'flex', alignItems: 'center', gap: 7,
                              boxShadow: darkMode ? '0 1px 4px #10131a33' : '0 1px 4px #e0e7ef33',
                            }}
                          >
                            <FiTrash2 /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BinPage;