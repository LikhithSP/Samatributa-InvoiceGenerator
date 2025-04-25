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

  // Generate invoice number on load
  useEffect(() => {
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
  }, []);

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
          <div className="auth-status">
            <span className="status-dot"></span>
            <span>{localStorage.getItem('userEmail') || 'Logged in'}</span>
          </div>
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