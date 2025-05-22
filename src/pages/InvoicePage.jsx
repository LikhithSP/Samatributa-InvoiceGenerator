import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../App.css';
import InvoiceForm from '../components/InvoiceForm';
import InvoicePreview from '../components/InvoicePreview';
import invoiceLogic from '../lib/invoiceLogic';
import { defaultLogo, companyName } from '../assets/logoData';
import { useUserRole } from '../context/UserRoleContext';
import Modal from '../components/Modal';
import { supabase } from '../config/supabaseClient';

const InvoicePage = ({ onLogout, darkMode, toggleDarkMode }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showPreview, setShowPreview] = useState(false);
  const { isAdmin } = useUserRole();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showBackModal, setShowBackModal] = useState(false);
  const [pendingBack, setPendingBack] = useState(false);
  const [lastSavedInvoice, setLastSavedInvoice] = useState(null);
  
  // Get current user ID and information
  const currentUserId = localStorage.getItem('userId');
  const currentUserName = localStorage.getItem('userName');
  const currentUserRole = localStorage.getItem('userRole');
  const currentUserPosition = localStorage.getItem('userPosition');
  const isInvoicingAssociate = !isAdmin && currentUserPosition === 'Invoicing Associate';
  
  // Get the selected company from localStorage if available
  const [selectedCompany, setSelectedCompany] = useState(() => {
    const companyData = localStorage.getItem('selectedCompany');
    return companyData ? JSON.parse(companyData) : null;
  });
  
  // Define initial state
  const initialInvoiceData = {
    // Use recipientName for invoice number prefix
    invoiceNumber: invoiceLogic.generateInvoiceNumber('', false),
    invoiceDate: new Date().toISOString().split('T')[0],
    senderName: selectedCompany?.name || companyName,
    senderAddress: selectedCompany?.address || '',
    senderGSTIN: selectedCompany?.gstin || '',
    recipientName: '',
    recipientAddress: '',
    recipientGSTIN: '',
    recipientPAN: '',
    recipientEmail: '',
    recipientPhone: '',
    recipientWebsite: '',
    taxRate: 18,
    subtotalUSD: 0,
    subtotalINR: 0,
    taxAmountUSD: 0,
    taxAmountINR: 0,
    totalUSD: 0,
    totalINR: 0,
    currency: 'USD',
    exchangeRate: 82,
    logoUrl: selectedCompany?.logo || defaultLogo,
    notes: '',
    items: [
      {
        id: `item-${Math.random().toString(36).substr(2, 9)}`,
        name: '',
        description: '',
        amountUSD: 0,
        amountINR: 0,
        subServices: [], // Use subServices consistently instead of nestedRows
        type: 'main'
      }
    ],
    // Bank details - prefilled with requested values
    accountName: 'Samatributa Solutions LLP',
    bankName: 'Yes Bank Limited',
    accountNumber: '1111111',
    ifscCode: '11111',
    // Assignee information - automatically assign to Invoicing Associate if they're creating the invoice
    assigneeId: isInvoicingAssociate ? currentUserId : '',
    assigneeName: isInvoicingAssociate ? currentUserName : '',
    assigneeRole: isInvoicingAssociate ? currentUserRole : '',
    assigneePosition: isInvoicingAssociate ? currentUserPosition : ''
  };
  
  const [invoiceData, setInvoiceData] = useState(initialInvoiceData);

  // Fetch invoice from Supabase
  useEffect(() => {
    if (!id || id === 'new') {
      setIsAuthorized(true);
      setIsLoading(false);
      return;
    }
    const fetchInvoice = async () => {
      const { data, error } = await supabase.from('invoices').select('*').eq('id', id).single();
      if (error || !data) {
        alert('Invoice not found.');
        navigate('/dashboard');
        return;
      }
      // Authorization logic (admin or assigned user)
      const isUserAuthorized = isAdmin || data.assigneeId === currentUserId;
      if (!isUserAuthorized) {
        alert("You don't have permission to view this invoice. Only the assigned client can access it.");
        navigate('/dashboard');
        return;
      }
      setInvoiceData(data);
      setIsAuthorized(true);
      setIsLoading(false);
    };
    fetchInvoice();
  // REMOVED initialInvoiceData and selectedCompany from dependencies
  }, [id, navigate, isAdmin, currentUserId]);

  // Track last saved invoice data for unsaved changes detection
  useEffect(() => {
    setLastSavedInvoice(invoiceData);
  }, []); // On mount, treat initial as saved

  // Helper: check if invoice is saved (shallow compare main fields)
  const isInvoiceSaved = () => {
    if (!lastSavedInvoice) return false;
    return JSON.stringify(invoiceData) === JSON.stringify(lastSavedInvoice);
  };

  // Save and update lastSavedInvoice
  const handleSaveAndGoBack = () => {
    saveInvoice();
    setLastSavedInvoice(invoiceData);
    navigate('/dashboard');
  };

  // Back button click handler
  const handleBackClick = () => {
    if (isInvoiceSaved()) {
      navigate('/dashboard');
    } else {
      setShowBackModal(true);
    }
  };

  // Format date for input field (YYYY-MM-DD)
  const formatDateForInput = (date) => {
    const d = new Date(date);
    const month = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  };

  // Format date for display (DD/MM/YYYY)
  const formatDateForDisplay = (dateString) => {
    const d = new Date(dateString);
    const month = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${day}/${month}/${d.getFullYear()}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInvoiceData({ ...invoiceData, [name]: value });
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
  };

  // Save invoice to Supabase
  const saveInvoice = async () => {
    if (!isAuthorized) {
      alert("You don't have permission to edit this invoice.");
      return;
    }
    if (!invoiceData.invoiceNumber || !invoiceData.invoiceDate || !invoiceData.senderName) {
      alert('Please fill in required fields: Invoice Number, Date, and Company Name');
      return;
    }
    setIsLoading(true);
    let result;
    if (invoiceData.id) {
      // Update existing invoice
      result = await supabase.from('invoices').update({ ...invoiceData }).eq('id', invoiceData.id);
    } else {
      // Add new invoice
      result = await supabase.from('invoices').insert([{ ...invoiceData }]);
    }
    setIsLoading(false);
    if (result.error) {
      alert(result.error.message);
      return;
    }
    alert('Invoice saved successfully!');
    navigate('/dashboard');
  };

  const resetForm = () => {
    if (!isAuthorized) {
      alert("You don't have permission to edit this invoice.");
      return;
    }
    
    if (window.confirm('Are you sure you want to create a new invoice? All current data will be lost.')) {
      const today = new Date();
      
      // Determine if current user is an Invoicing Associate for auto-assignment
      const assignmentInfo = isInvoicingAssociate ? 
        {
          assigneeId: currentUserId,
          assigneeName: currentUserName,
          assigneeRole: currentUserRole,
          assigneePosition: currentUserPosition
        } : 
        {
          assigneeId: '',
          assigneeName: '',
          assigneeRole: '',
          assigneePosition: ''
        };
      
      setInvoiceData({
        id: '', // Reset the unique ID
        invoiceNumber: '', // Leave empty for user to fill in or auto-generate on save
        invoiceDate: formatDateForInput(today),
        taxRate: '5',
        currency: 'USD',
        logoUrl: selectedCompany?.logo || defaultLogo,
        senderName: selectedCompany?.name || companyName,
        companyId: selectedCompany?.id || null, // Store the company ID for linking to company
        senderAddress: selectedCompany?.address || '', // Populate company address
        senderGSTIN: selectedCompany?.gstin || '', // Populate company GSTIN
        // Bank details - prefilled with requested values
        accountName: 'Samatributa Solutions LLP',
        bankName: 'Yes Bank Limited',
        accountNumber: '1111111',
        ifscCode: '11111',
        recipientName: '',
        recipientEmail: '',
        recipientAddress: '',
        recipientPhone: '',
        recipientGSTIN: '',
        recipientPAN: '',
        notes: '',
        items: [
          {
            type: 'main',
            name: '',
            description: '',
            amountUSD: 0,
            amountINR: 0,
            subServices: []
          }
        ],
        subtotalUSD: 0,
        subtotalINR: 0,
        taxAmountUSD: 0,
        taxAmountINR: 0,
        totalUSD: 0,
        totalINR: 0,
        // Include assignee information based on user type
        ...assignmentInfo
      });
    }
  };

  // Delete the current invoice
  const deleteInvoice = async () => {
    // Check if user is authorized to delete
    // Only admin or invoice creator can delete
    if (!isAdmin && invoiceData.assigneeId !== currentUserId) {
      alert("You don't have permission to delete this invoice.");
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      await supabase.from('invoices').delete().eq('id', invoiceData.id);
      navigate('/dashboard');
    }
  };

  // Update company data when a company is updated from Company Page
  useEffect(() => {
    // Handler for when a company is updated
    const handleCompanyUpdate = (event) => {
      const { company, action } = event.detail;
      console.log(`Company ${action === 'edit' ? 'updated' : 'added'}:`, company);
      
      // Only update the current invoice if it's associated with this company
      if (invoiceData.companyId === company.id || 
          (!invoiceData.companyId && selectedCompany?.id === company.id)) {
        
        console.log('Updating current invoice with updated company details');
        
        // Update company-related fields in the current invoice
        setInvoiceData(prevData => ({
          ...prevData,
          senderName: company.name,
          senderAddress: company.address || '',
          senderGSTIN: company.gstin || '',
          logoUrl: company.logo || defaultLogo,
          companyId: company.id,
          accountName: company.bankDetails?.accountName || '',
          bankName: company.bankDetails?.bankName || '',
          accountNumber: company.bankDetails?.accountNumber || '',
          ifscCode: company.bankDetails?.ifscCode || ''
        }));
        
        // Update the selected company in our component state
        setSelectedCompany(company);
      }
      
      // Update all saved invoices that use this company
      const savedInvoices = JSON.parse(localStorage.getItem('savedInvoices')) || [];
      let updatedInvoices = false;
      
      const updatedInvoicesList = savedInvoices.map(invoice => {
        // Check if this invoice is associated with the updated company
        if (invoice.companyId === company.id) {
          updatedInvoices = true;
          
          // Update company details in the invoice
          return {
            ...invoice,
            senderName: company.name,
            senderAddress: company.address || '',
            senderGSTIN: company.gstin || '',
            logoUrl: company.logo || defaultLogo,
            accountName: company.bankDetails?.accountName || '',
            bankName: company.bankDetails?.bankName || '',
            accountNumber: company.bankDetails?.accountNumber || '',
            ifscCode: company.bankDetails?.ifscCode || ''
          };
        }
        return invoice;
      });
      
      // Only update localStorage if any invoices were modified
      if (updatedInvoices) {
        console.log('Updating saved invoices with new company details');
        localStorage.setItem('savedInvoices', JSON.stringify(updatedInvoicesList));
        
        // Notify other components that invoices have been updated
        window.dispatchEvent(new Event('invoicesUpdated'));
      }
    };

    // Add event listener for company updates
    window.addEventListener('companyUpdated', handleCompanyUpdate);
    
    // Cleanup function to remove event listener
    return () => {
      window.removeEventListener('companyUpdated', handleCompanyUpdate);
    };
  }, [invoiceData.companyId, selectedCompany, setInvoiceData, defaultLogo]);

  // If still loading, show a loading screen
  if (isLoading && id && id !== 'new') {
    return (
      <div className="loading-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 1000 }}>
        <div className="spinner"></div>
        <span style={{ marginTop: '20px', color: 'white' }}>Loading invoice...</span>
      </div>
    );
  }

  return (
    <div className="container">
      {!showPreview && (
        <header className="header">
          <button 
            className="back-btn" 
            onClick={handleBackClick}
            style={{
              background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', marginRight: 12, color: '#888', position: 'relative', top: 2
            }}
            title="Back to Dashboard"
          >
            &#10005;
          </button>
          <div className="logo" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
            <img 
              src={selectedCompany?.logo || defaultLogo} 
              alt={selectedCompany?.name || companyName}
              style={{ maxHeight: '40px' }}
            />
            {selectedCompany?.name || companyName}
          </div>
          <div className="user-actions">
            {/* Add Save Invoice button in the top bar */}
            {isAuthorized && (
              <button 
                onClick={saveInvoice} 
                className="btn btn-primary"
                disabled={isLoading}
                style={{ marginRight: '10px' }}
              >
                {isLoading ? 'Saving...' : 'Save Invoice'}
              </button>
            )}
            <button 
              onClick={toggleDarkMode} 
              className="btn btn-secondary"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              style={{ fontSize: '18px', padding: '8px 15px' }}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </header>
      )}
      
      {showPreview ? (
        <InvoicePreview 
          invoiceData={invoiceData}
          formatDate={formatDateForDisplay}
          onClose={closePreview}
        />
      ) : (
        <InvoiceForm 
          invoiceData={invoiceData}
          setInvoiceData={setInvoiceData}
          handleInputChange={handleInputChange}
          onPreview={handlePreview}
          onReset={resetForm}
          onSave={saveInvoice}
          onDelete={deleteInvoice}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          id={id}
          isAuthorized={isAuthorized}
        />
      )}
      
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <span>Processing...</span>
        </div>
      )}
      <Modal
        isOpen={showBackModal}
        onClose={() => setShowBackModal(false)}
        title="You have not saved the invoice"
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => { setShowBackModal(false); navigate('/dashboard'); }}>Go Back</button>
            <button className="btn btn-primary" onClick={handleSaveAndGoBack}>Save Invoice</button>
          </>
        }
      >
        <p>You have not saved the invoice. Would you like to save before leaving?</p>
      </Modal>
    </div>
  );
};

export default InvoicePage;