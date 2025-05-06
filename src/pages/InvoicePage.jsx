import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../App.css';
import InvoiceForm from '../components/InvoiceForm';
import InvoicePreview from '../components/InvoicePreview';
import invoiceLogic from '../lib/invoiceLogic';
import { defaultLogo, companyName } from '../assets/logoData';
import { useUserRole } from '../context/UserRoleContext';
import Modal from '../components/Modal';

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
    // Pass false to avoid incrementing the counter until we actually save
    invoiceNumber: invoiceLogic.generateInvoiceNumber(selectedCompany?.name, false),
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

  // Generate invoice number on load OR load existing invoice if id is provided
  useEffect(() => {
    // Always consider new invoice creation as authorized
    if (!id || id === 'new') {
      setIsAuthorized(true);
      setIsLoading(false);
      return;
    }
    
    // For existing invoices, check authorization
    const checkAuthorization = () => {
      // Check if we're editing an existing invoice
      if (id && id !== 'new') {
        // Load the existing invoice data
        const savedInvoices = JSON.parse(localStorage.getItem('savedInvoices')) || [];
        
        // Log for debugging purposes
        console.log('Loading invoice with ID:', id);
        
        // Find invoice by unique ID (primary lookup method)
        const existingInvoice = savedInvoices.find(invoice => invoice.id === id);
        
        if (!existingInvoice) {
          console.log('Invoice not found with ID:', id);
          alert('Invoice not found.');
          navigate('/dashboard');
          return;
        }
        
        // Check if user is authorized to view this invoice
        // Admins can access all invoices, normal users can only access invoices assigned to them
        const isUserAuthorized = isAdmin || existingInvoice.assigneeId === currentUserId;
        
        if (!isUserAuthorized) {
          alert("You don't have permission to view this invoice. Only the assigned client can access it.");
          navigate('/dashboard');
          return;
        }
        
        // User is authorized - set the flag and continue loading the invoice
        setIsAuthorized(true);
        
        // Process items to ensure they have the correct structure
        const processedItems = (existingInvoice.items || []).map(item => {
          // Determine which property to use for sub-services (standardize on subServices)
          const sourceSubServices = item.subServices || item.nestedRows || [];
          
          // Process subServices recursively to ensure they have the correct structure
          const processedSubServices = sourceSubServices.map(subService => {
            return {
              id: subService.id || `subitem-${Math.random().toString(36).substr(2, 9)}`,
              name: subService.name || '',
              description: subService.description || '',
              amountUSD: parseFloat(subService.amountUSD) || 0,
              amountINR: parseFloat(subService.amountINR) || 0
            };
          });
          
          // For backward compatibility, check if this is a main service or a direct service item
          const isMainService = item.type === 'main' || Array.isArray(sourceSubServices);
          
          // Ensure all item properties exist
          return {
            id: item.id || `item-${Math.random().toString(36).substr(2, 9)}`,
            name: item.name || '',
            description: item.description || '',
            amountUSD: parseFloat(item.amountUSD) || 0,
            amountINR: parseFloat(item.amountINR) || 0,
            // Always use the processed subServices and explicitly remove nestedRows to avoid confusion
            subServices: isMainService ? processedSubServices : [],
            // Ensure type is properly set
            type: isMainService ? 'main' : (item.type || 'main')
          };
        });
        
        console.log('Processed invoice items:', processedItems);
        
        // If no items exist, add a default empty item
        if (processedItems.length === 0) {
          processedItems.push({
            id: `item-${Math.random().toString(36).substr(2, 9)}`,
            name: '',
            description: '',
            amountUSD: 0,
            amountINR: 0,
            subServices: [],
            type: 'main'
          });
        }
        
        // Set loaded company if the invoice has a companyId
        if (existingInvoice.companyId) {
          const companies = JSON.parse(localStorage.getItem('userCompanies')) || [];
          const invoiceCompany = companies.find(c => c.id === existingInvoice.companyId);
          if (invoiceCompany && invoiceCompany.id !== selectedCompany?.id) {
            setSelectedCompany(invoiceCompany);
          }
        }
        
        // Extract the stored calculation values and ensure they're numeric
        const {
          subtotalUSD = 0,
          subtotalINR = 0,
          taxAmountUSD = 0,
          taxAmountINR = 0,
          totalUSD = 0,
          totalINR = 0,
          exchangeRate = 82,
          taxRate = 18
        } = existingInvoice;
        
        // Create a deep copy of the existing invoice with all necessary properties
        const loadedInvoice = {
          // Set default values first to ensure all expected properties exist
          ...initialInvoiceData,
          // Then apply all existing invoice data
          ...existingInvoice,
          // Explicitly set the processed items to ensure proper structure
          items: processedItems,
          // Explicitly set the calculation values as numbers to ensure consistency
          subtotalUSD: parseFloat(subtotalUSD) || 0,
          subtotalINR: parseFloat(subtotalINR) || 0,
          taxAmountUSD: parseFloat(taxAmountUSD) || 0,
          taxAmountINR: parseFloat(taxAmountINR) || 0,
          totalUSD: parseFloat(totalUSD) || 0,
          totalINR: parseFloat(totalINR) || 0,
          exchangeRate: parseFloat(exchangeRate) || 82,
          taxRate: parseFloat(taxRate) || 18
        };
        
        // Apply the loaded invoice to state
        setInvoiceData(loadedInvoice);
        setIsLoading(false);
        
        console.log('Loaded invoice with calculations:', {
          subtotalUSD: loadedInvoice.subtotalUSD,
          subtotalINR: loadedInvoice.subtotalINR,
          taxAmountUSD: loadedInvoice.taxAmountUSD,
          taxAmountINR: loadedInvoice.taxAmountINR,
          totalUSD: loadedInvoice.totalUSD,
          totalINR: loadedInvoice.totalINR
        });
      }
    };
    
    checkAuthorization();
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

  // Save invoice to localStorage
  const saveInvoice = () => {
    // Check if user is authorized to edit
    if (!isAuthorized) {
      alert("You don't have permission to edit this invoice.");
      return;
    }
    
    // Check if invoice number is empty and needs to be generated
    if (!invoiceData.invoiceNumber.trim()) {
      // Generate a new invoice number using the company name, but don't save the increment yet
      const newInvoiceNumber = invoiceLogic.generateInvoiceNumber(invoiceData.senderName, false);
      
      // Set the new invoice number
      setInvoiceData(prevData => ({
        ...prevData,
        invoiceNumber: newInvoiceNumber
      }));
      
      // Return early - we'll let the state update and then save
      setTimeout(() => saveInvoice(), 100);
      return;
    }

    // Validate invoice has required fields
    if (!invoiceData.invoiceNumber || !invoiceData.invoiceDate || !invoiceData.senderName) {
      alert('Please fill in required fields: Invoice Number, Date, and Company Name');
      return;
    }

    setIsLoading(true);

    try {
      // Get existing invoices from localStorage or initialize empty array
      const savedInvoices = JSON.parse(localStorage.getItem('savedInvoices')) || [];
      
      // Now that we're actually saving, generate the final invoice number with increment
      // Only regenerate if we're creating a new invoice (not editing an existing one)
      let finalInvoiceNumber = invoiceData.invoiceNumber;
      if (!invoiceData.id) {
        finalInvoiceNumber = invoiceLogic.generateInvoiceNumber(invoiceData.senderName, true);
      }
      
      // Process the items to ensure correct structure before saving
      const processedItems = invoiceData.items.map(item => {
        // Make sure we're handling sub-services properly
        const processedSubServices = (item.subServices || []).map(subService => ({
          id: subService.id || `subitem-${Math.random().toString(36).substr(2, 9)}`,
          name: subService.name || '',
          description: subService.description || '',
          amountUSD: parseFloat(subService.amountUSD) || 0,
          amountINR: parseFloat(subService.amountINR) || 0
        }));
        
        return {
          id: item.id || `item-${Math.random().toString(36).substr(2, 9)}`,
          name: item.name || '',
          description: item.description || '',
          amountUSD: parseFloat(item.amountUSD) || 0,
          amountINR: parseFloat(item.amountINR) || 0,
          // Always use subServices and not nestedRows to ensure consistency
          subServices: processedSubServices,
          type: item.type || 'main'
        };
      });
      
      // Auto-assign to current user if they are an Invoicing Associate
      let assigneeInfo = {};
      
      // For existing invoices, keep existing assignment if there is one
      if (invoiceData.assigneeId) {
        assigneeInfo = {
          assigneeId: invoiceData.assigneeId,
          assigneeName: invoiceData.assigneeName,
          assigneeRole: invoiceData.assigneeRole,
          assigneePosition: invoiceData.assigneePosition
        };
      }
      // For new invoices created by Invoicing Associates, auto-assign to them
      else if (isInvoicingAssociate) {
        assigneeInfo = {
          assigneeId: currentUserId,
          assigneeName: currentUserName,
          assigneeRole: currentUserRole,
          assigneePosition: currentUserPosition
        };
      }
      
      console.log('Saving invoice with auto-assignment:', isInvoicingAssociate, assigneeInfo);
      
      // Check if this invoice already has an ID (existing invoice)
      let invoiceToSave = {
        ...invoiceData,
        // Use the final invoice number with increment
        invoiceNumber: finalInvoiceNumber,
        // Ensure processed items are used
        items: processedItems,
        // Ensure calculation values are numbers
        subtotalUSD: parseFloat(invoiceData.subtotalUSD) || 0,
        subtotalINR: parseFloat(invoiceData.subtotalINR) || 0,
        taxAmountUSD: parseFloat(invoiceData.taxAmountUSD) || 0,
        taxAmountINR: parseFloat(invoiceData.taxAmountINR) || 0,
        totalUSD: parseFloat(invoiceData.totalUSD) || 0,
        totalINR: parseFloat(invoiceData.totalINR) || 0,
        // Ensure companyId is explicitly set from the selected company
        companyId: selectedCompany?.id || invoiceData.companyId,
        // Explicitly set assignee information
        ...assigneeInfo,
        timestamp: new Date().getTime(),
        status: invoiceData.status || 'Pending' // Set default status if not already set
      };
      
      // If no ID exists, generate one
      if (!invoiceToSave.id) {
        invoiceToSave.id = invoiceLogic.generateUniqueId();
      }
      
      // Check if invoice with this ID already exists
      const existingInvoiceIndex = savedInvoices.findIndex(
        invoice => invoice.id === invoiceToSave.id
      );
      
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
  const deleteInvoice = () => {
    // Check if user is authorized to delete
    // Only admin or invoice creator can delete
    if (!isAdmin && invoiceData.assigneeId !== currentUserId) {
      alert("You don't have permission to delete this invoice.");
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this invoice? It will be moved to the Bin for 30 days before permanent removal.')) {
      try {
        // Get existing invoices from localStorage
        const savedInvoices = JSON.parse(localStorage.getItem('savedInvoices')) || [];
        
        // Get the invoice to be deleted
        const invoiceToDelete = savedInvoices.find(invoice => invoice.id === invoiceData.id);
        
        if (invoiceToDelete) {
          // Add deletion timestamp and move to bin
          invoiceToDelete.deletedAt = new Date().getTime();
          
          // Get existing bin or create new one
          const bin = JSON.parse(localStorage.getItem('invoiceBin')) || [];
          bin.push(invoiceToDelete);
          
          // Save updated bin back to localStorage
          localStorage.setItem('invoiceBin', JSON.stringify(bin));
          
          // Filter out the current invoice using the unique ID
          const updatedInvoices = savedInvoices.filter(
            invoice => invoice.id !== invoiceData.id
          );
          
          // Save updated invoices array back to localStorage
          localStorage.setItem('savedInvoices', JSON.stringify(updatedInvoices));
          
          // Trigger a custom event to notify other components about the change
          window.dispatchEvent(new Event('invoicesUpdated'));
          window.dispatchEvent(new Event('invoiceBinUpdated'));
          
          // Navigate back to dashboard
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error deleting invoice:', error);
        alert('Failed to delete invoice. Please try again.');
      }
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