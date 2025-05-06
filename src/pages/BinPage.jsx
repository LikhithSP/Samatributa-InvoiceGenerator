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
      
      // Filter by user role: admin sees all, others see only their own deleted invoices
      const currentUserId = localStorage.getItem('userId');
      const currentUserRole = localStorage.getItem('userRole');
      const isAdmin = currentUserRole === 'admin';
      if (!isAdmin) {
        currentInvoices = currentInvoices.filter(inv => inv.deletedBy === currentUserId);
      }
      
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
    <header className="header">
      <div className="header-left">
        <div className="back-button" onClick={() => navigate('/dashboard')}>
          <FiArrowLeft /> Back to Dashboard
        </div>
      </div>
      <div className="header-title">
        <h1><FiArchive /> Invoice Bin</h1>
      </div>
      <div className="header-right">
        {/* Add theme toggle or other controls here if needed */}
      </div>
    </header>
  );
  
  return (
    <div className="bin-page">
      <Header />
      
      <div className="bin-content">
        <div className="bin-description">
          <div className="bin-info">
            <p><FiClock /> Deleted invoices are kept for 30 days before permanent removal.</p>
            <p>You can restore invoices to your active list or delete them permanently at any time.</p>
          </div>
          
          {deletedInvoices.length > 0 && (
            <div className="bin-actions">
              <button onClick={emptyBin} className="btn btn-danger">
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
          <div className="empty-bin">
            <div className="empty-bin-icon">
              <FiArchive size={48} />
            </div>
            <h2>Bin is empty</h2>
            <p>No deleted invoices were found.</p>
            <button onClick={() => navigate('/dashboard')} className="btn">
              Return to Dashboard
            </button>
          </div>
        ) : (
          <div className="bin-invoice-list">
            <table className="bin-table">
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
                {deletedInvoices.map((invoice) => {
                  const deletedDate = new Date(invoice.deletedAt).toLocaleDateString();
                  const timeLeft = getTimeLeft(invoice.deletedAt);
                  
                  return (
                    <tr key={invoice.id}>
                      <td>{invoice.invoiceNumber}</td>
                      <td>{invoice.recipientName || 'N/A'}</td>
                      <td>{new Date(invoice.invoiceDate).toLocaleDateString()}</td>
                      <td>
                        ${invoice.totalUSD ? invoice.totalUSD.toFixed(2) : '0.00'} / 
                        ₹{invoice.totalINR ? invoice.totalINR.toFixed(2) : '0.00'}
                      </td>
                      <td>{deletedDate}</td>
                      <td>{timeLeft}</td>
                      <td>
                        <div className="bin-actions">
                          <button 
                            onClick={() => restoreInvoice(invoice.id)}
                            className="btn btn-secondary bin-action-btn"
                            title="Restore Invoice"
                          >
                            <FiRefreshCw /> Restore
                          </button>
                          <button
                            onClick={() => permanentlyDeleteInvoice(invoice.id)}
                            className="btn btn-danger bin-action-btn"
                            title="Delete Permanently"
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