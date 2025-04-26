import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../App.css';
import InvoiceForm from '../components/InvoiceForm';
import InvoicePreview from '../components/InvoicePreview';
import { defaultLogo, companyName } from '../assets/logoData';

const InvoicePage = ({ onLogout, darkMode, toggleDarkMode }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showPreview, setShowPreview] = useState(false);
  
  // Get the selected company from localStorage if available
  const [selectedCompany, setSelectedCompany] = useState(() => {
    const companyData = localStorage.getItem('selectedCompany');
    return companyData ? JSON.parse(companyData) : null;
  });
  
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: '',
    invoiceDate: '',
    taxRate: '5',
    currency: 'USD',
    logoUrl: selectedCompany?.logo || defaultLogo, // Use selected company logo if available
    senderName: selectedCompany?.name || companyName, // Use selected company name if available
    companyId: selectedCompany?.id || null, // Store the company ID for linking invoice to company
    senderAddress: '',
    senderGSTIN: '',
    recipientName: '',
    recipientEmail: '',
    recipientAddress: '',
    recipientPhone: '',
    recipientGSTIN: '',
    recipientPAN: '',
    notes: `Account Name:
Bank Name:
Account Number:
IFSC Code:`,
    items: [
      {
        name: '',
        description: '',
        amountUSD: 0,
        amountINR: 0,
        nestedRows: []
      }
    ],
    subtotalUSD: 0,
    subtotalINR: 0,
    taxAmountUSD: 0,
    taxAmountINR: 0,
    totalUSD: 0,
    totalINR: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  // Generate invoice number on load OR load existing invoice if id is provided
  useEffect(() => {
    // Check if we're editing an existing invoice
    if (id && id !== 'new') {
      // Load the existing invoice data
      const savedInvoices = JSON.parse(localStorage.getItem('savedInvoices')) || [];
      const existingInvoice = savedInvoices.find(invoice => invoice.invoiceNumber === id);
      
      if (existingInvoice) {
        // Found the invoice, load it into state
        setInvoiceData(existingInvoice);
        return; // Exit early, don't generate a new invoice number
      } else {
        // Invoice not found, show error and redirect
        alert('Invoice not found.');
        navigate('/dashboard');
        return;
      }
    }
    
    // Otherwise generate a new invoice number for new invoices
    const currentYear = new Date().getFullYear();
    let lastInvoiceNumber = parseInt(localStorage.getItem('lastInvoiceNumber')) || 0;
    lastInvoiceNumber += 1;
    localStorage.setItem('lastInvoiceNumber', lastInvoiceNumber);
    
    const today = new Date();
    const formattedDate = formatDateForInput(today);

    setInvoiceData(prevData => ({
      ...prevData,
      invoiceNumber: `${currentYear}-${lastInvoiceNumber}`,
      invoiceDate: formattedDate
    }));
  }, [id, navigate]);

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

  // Save invoice to localStorage
  const saveInvoice = () => {
    // Validate invoice has required fields
    if (!invoiceData.invoiceNumber || !invoiceData.invoiceDate || !invoiceData.senderName) {
      alert('Please fill in required fields: Invoice Number, Date, and Company Name');
      return;
    }

    setIsLoading(true);

    try {
      // Get existing invoices from localStorage or initialize empty array
      const savedInvoices = JSON.parse(localStorage.getItem('savedInvoices')) || [];
      
      // Check if invoice with this number already exists
      const existingInvoiceIndex = savedInvoices.findIndex(
        invoice => invoice.invoiceNumber === invoiceData.invoiceNumber
      );
      
      // Add timestamp for sorting purposes
      const invoiceToSave = {
        ...invoiceData,
        timestamp: new Date().getTime(),
        status: invoiceData.status || 'Pending' // Set default status if not already set
      };
      
      // Either update existing invoice or add new one
      if (existingInvoiceIndex >= 0) {
        savedInvoices[existingInvoiceIndex] = invoiceToSave;
      } else {
        savedInvoices.push(invoiceToSave);
      }
      
      // Save updated invoices array back to localStorage
      localStorage.setItem('savedInvoices', JSON.stringify(savedInvoices));
      
      setIsLoading(false);
      alert('Invoice saved successfully!');
      
      // Navigate back to dashboard 
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving invoice:', error);
      setIsLoading(false);
      alert('Failed to save invoice. Please try again.');
    }
  };

  const resetForm = () => {
    if (window.confirm('Are you sure you want to create a new invoice? All current data will be lost.')) {
      const currentYear = new Date().getFullYear();
      let lastInvoiceNumber = parseInt(localStorage.getItem('lastInvoiceNumber')) || 0;
      lastInvoiceNumber += 1;
      localStorage.setItem('lastInvoiceNumber', lastInvoiceNumber);
      
      const today = new Date();
      
      setInvoiceData({
        invoiceNumber: `${currentYear}-${lastInvoiceNumber}`,
        invoiceDate: formatDateForInput(today),
        taxRate: '5',
        currency: 'USD',
        logoUrl: selectedCompany?.logo || defaultLogo, // Use selected company logo if available
        senderName: selectedCompany?.name || companyName, // Use selected company name if available
        senderAddress: '',
        senderGSTIN: '',
        recipientName: '',
        recipientEmail: '',
        recipientAddress: '',
        recipientPhone: '',
        recipientGSTIN: '',
        recipientPAN: '',
        notes: `Account Name:
Bank Name:
Account Number:
IFSC Code:`,
        items: [
          {
            name: '',
            description: '',
            amountUSD: 0,
            amountINR: 0,
            nestedRows: []
          }
        ],
        subtotalUSD: 0,
        subtotalINR: 0,
        taxAmountUSD: 0,
        taxAmountINR: 0,
        totalUSD: 0,
        totalINR: 0
      });
    }
  };

  // Delete the current invoice
  const deleteInvoice = () => {
    if (window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      try {
        // Get existing invoices from localStorage
        const savedInvoices = JSON.parse(localStorage.getItem('savedInvoices')) || [];
        
        // Filter out the current invoice
        const updatedInvoices = savedInvoices.filter(
          invoice => invoice.invoiceNumber !== invoiceData.invoiceNumber
        );
        
        // Save updated invoices array back to localStorage
        localStorage.setItem('savedInvoices', JSON.stringify(updatedInvoices));
        
        // Trigger a custom event to notify other components about the change
        window.dispatchEvent(new Event('invoicesUpdated'));
        
        // Navigate back to dashboard
        navigate('/dashboard');
      } catch (error) {
        console.error('Error deleting invoice:', error);
        alert('Failed to delete invoice. Please try again.');
      }
    }
  };

  return (
    <div className="container">
      <header className="header">
        <div className="logo" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
          <img 
            src={selectedCompany?.logo || defaultLogo} 
            alt={selectedCompany?.name || companyName}
            style={{ maxHeight: '40px' }}
          />
          {selectedCompany?.name || companyName}
        </div>
        <div className="user-actions">
          <button 
            onClick={toggleDarkMode} 
            className="btn btn-secondary"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={{ padding: '8px 15px' }}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button onClick={() => navigate('/profile')} className="btn btn-secondary">Profile</button>
          <button onClick={onLogout} className="btn">Logout</button>
        </div>
      </header>
      
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
        />
      )}
      
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <span>Processing...</span>
        </div>
      )}
    </div>
  );
};

export default InvoicePage;