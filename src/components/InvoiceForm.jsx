import React, { useState, useEffect } from 'react';
import InvoiceItemsTable from './InvoiceItemsTable';
import emailService from '../services/emailService';
import pdfService from '../services/pdfService';
import exchangeRateService from '../services/exchangeRateService';
import { useNotification } from '../context/ErrorContext';
import Modal from './Modal';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const InvoiceForm = ({ 
  invoiceData, 
  setInvoiceData, 
  handleInputChange, 
  onPreview, 
  onReset,
  onSave,
  onDelete,
  isLoading,
  setIsLoading
}) => {
  // Initialize state and hooks
  const [exchangeRate, setExchangeRate] = useState(82);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const { setNotification } = useNotification();
  
  // Fetch exchange rate on component mount
  useEffect(() => {
    fetchExchangeRate();
  }, []);
  
  // Fetch current exchange rate using the exchangeRateService
  const fetchExchangeRate = async () => {
    try {
      const rate = await exchangeRateService.fetchExchangeRate();
      setExchangeRate(rate);
      // Recalculate with new exchange rate
      updateCalculationsWithRate(invoiceData.items, rate);
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      // Continue with default exchange rate if API fails
      const defaultRate = exchangeRateService.getCurrentRate();
      setExchangeRate(defaultRate);
    }
  };
  
  const updateCalculationsWithRate = (items, rate) => {
    // Calculate subtotals with the provided exchange rate
    let subtotalUSD = 0;
    let subtotalINR = 0;
    
    items.forEach(item => {
      subtotalUSD += parseFloat(item.amountUSD) || 0;
      // Recalculate INR amounts based on new exchange rate
      if (item.amountUSD) {
        const newAmountINR = parseFloat(item.amountUSD) * rate;
        item.amountINR = newAmountINR.toFixed(2);
      }
      subtotalINR += parseFloat(item.amountINR) || 0;
    });
    
    // Calculate tax amounts
    const taxRate = parseFloat(invoiceData.taxRate) || 0;
    const taxAmountUSD = (subtotalUSD * taxRate) / 100;
    const taxAmountINR = (subtotalINR * taxRate) / 100;
    
    // Calculate totals
    const totalUSD = subtotalUSD + taxAmountUSD;
    const totalINR = subtotalINR + taxAmountINR;
    
    // Update invoice data
    setInvoiceData(prevData => ({
      ...prevData,
      items: [...items],
      subtotalUSD,
      subtotalINR,
      taxAmountUSD,
      taxAmountINR,
      totalUSD,
      totalINR
    }));
  };
  
  // Calculate totals whenever items or tax rate changes
  useEffect(() => {
    updateCalculations();
  }, [invoiceData.items, invoiceData.taxRate]);
  
  const updateCalculations = () => {
    // Calculate subtotals
    let subtotalUSD = 0;
    let subtotalINR = 0;
    
    invoiceData.items.forEach(item => {
      subtotalUSD += parseFloat(item.amountUSD) || 0;
      subtotalINR += parseFloat(item.amountINR) || 0;
    });
    
    // Calculate tax amounts
    const taxRate = parseFloat(invoiceData.taxRate) || 0;
    const taxAmountUSD = (subtotalUSD * taxRate) / 100;
    const taxAmountINR = (subtotalINR * taxRate) / 100;
    
    // Calculate totals
    const totalUSD = subtotalUSD + taxAmountUSD;
    const totalINR = subtotalINR + taxAmountINR;
    
    // Update invoice data
    setInvoiceData(prevData => ({
      ...prevData,
      subtotalUSD,
      subtotalINR,
      taxAmountUSD,
      taxAmountINR,
      totalUSD,
      totalINR
    }));
  };
  
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setNotification('Please upload a valid image file (JPEG, PNG, SVG, or GIF)', 'error');
        return;
      }
      
      // Validate file size (max 2MB)
      const maxSize = 2 * 1024 * 1024; // 2MB in bytes
      if (file.size > maxSize) {
        setNotification('Image file is too large. Please upload an image smaller than 2MB.', 'error');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setInvoiceData(prevData => ({
          ...prevData,
          logoUrl: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleCurrencyToggle = (e) => {
    setInvoiceData(prevData => ({
      ...prevData,
      currency: e.target.value
    }));
  };
  
  // Add comprehensive form validation
  const validateForm = () => {
    // Required fields
    const requiredFields = {
      'Invoice Number': invoiceData.invoiceNumber,
      'Invoice Date': invoiceData.invoiceDate,
      'Company Name': invoiceData.senderName,
      'Client Name': invoiceData.recipientName
    };
    
    // Check required fields
    for (const [fieldName, value] of Object.entries(requiredFields)) {
      if (!value || value.trim() === '') {
        setNotification(`${fieldName} is required.`, 'error');
        return false;
      }
    }
    
    // Validate email if provided
    if (invoiceData.recipientEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(invoiceData.recipientEmail)) {
        setNotification('Please enter a valid email address.', 'error');
        return false;
      }
    }
    
    // Ensure there's at least one invoice item
    if (invoiceData.items.length === 0) {
      setNotification('Please add at least one item to the invoice.', 'error');
      return false;
    }
    
    // Check if any item has a description but no amount
    const invalidItems = invoiceData.items.filter(
      item => item.description.trim() !== '' && 
      ((!item.amountUSD || parseFloat(item.amountUSD) === 0) && 
       (!item.amountINR || parseFloat(item.amountINR) === 0))
    );
    
    if (invalidItems.length > 0) {
      setNotification('All items must have an amount in USD or INR.', 'error');
      return false;
    }
    
    return true;
  };
  
  const sendInvoice = async () => {
    // Validate form before sending
    if (!validateForm()) {
      return;
    }
    
    // Additional validation for email which is required for sending
    if (!invoiceData.recipientEmail) {
      setNotification('Please enter the recipient\'s email address.', 'error');
      return;
    }
    
    // Show loading indicator
    setIsLoading(true);
    
    try {
      // First generate PDF content
      const previewElement = document.getElementById('invoicePreview');
      
      if (!previewElement) {
        // If preview element doesn't exist, show preview first
        onPreview();
        // Then set up a modal to confirm email sending once preview is ready
        setShowSendModal(true);
        setIsLoading(false);
        return;
      }
      
      const canvas = await html2canvas(previewElement, {
        scale: 1,
        useCORS: true,
        scrollY: 0,
      });
      
      // Convert to base64 for email attachment
      const imgData = canvas.toDataURL('image/png');
      
      const emailParams = {
        to_email: invoiceData.recipientEmail,
        subject: `Invoice - ${invoiceData.invoiceNumber}`,
        message: `Please find attached the invoice ${invoiceData.invoiceNumber} from ${invoiceData.senderName || 'Your Company'}.`,
        attachment: imgData
      };
      
      // Use emailService instead of direct emailjs calls
      await emailService.sendInvoice(emailParams);
      
      setIsLoading(false);
      setNotification('Invoice sent successfully!', 'success');
    } catch (error) {
      console.error('Error sending email:', error);
      setIsLoading(false);
      setNotification('Failed to send the invoice: ' + error.message, 'error');
    }
  };
  
  const downloadPDF = async () => {
    // Validate form before downloading
    if (!validateForm()) {
      return;
    }
    
    // Show loading indicator
    setIsLoading(true);
    
    try {
      // First ensure we're in preview mode
      onPreview();
      
      // Wait for the preview element to be ready
      try {
        const previewElement = await pdfService.waitForElement('invoicePreview');
        
        // Use our centralized PDF service to generate the PDF
        await pdfService.generatePDF(
          previewElement, 
          `Invoice_${invoiceData.invoiceNumber}.pdf`
        );
        
        setIsLoading(false);
        setNotification('PDF downloaded successfully!', 'success');
      } catch (error) {
        throw new Error(`Failed to generate preview: ${error.message}`);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      setIsLoading(false);
      setNotification('Failed to generate PDF: ' + error.message, 'error');
    }
  };
  
  return (
    <div className="grid">
      {/* Left Column */}
      <div>
        {/* Invoice Details */}
        <div className="card">
          <h2 className="card-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M1.92.506a.5.5 0 0 1 .434.14L3 1.293l.646-.647a.5.5 0 0 1 .708 0L5 1.293l.646-.647a.5.5 0 0 1 .708 0L7 1.293l.646-.647a.5.5 0 0 1 .708 0L9 1.293l.646-.647a.5.5 0 0 1 .708 0l.646.647.646-.647a.5.5 0 0 1 .708.13l.5 1A.5.5 0 0 1 15 2v12a.5.5 0 0 1-.053.224l-.5 1a.5.5 0 0 1-.8.13L13 14.707l-.646.647a.5.5 0 0 1-.708 0L11 14.707l-.646.647a.5.5 0 0 1-.708 0L9 14.707l-.646.647a.5.5 0 0 1-.708 0L7 14.707l-.646.647a.5.5 0 0 1-.708 0L5 14.707l-.646.647a.5.5 0 0 1-.708 0L3 14.707l-.646.647a.5.5 0 0 1-.801-.13l-.5-1A.5.5 0 0 1 1 14V2a.5.5 0 0 1 .053-.224l.5-1a.5.5 0 0 1 .367-.27zm.217 1.338L2 2.118v11.764l.137.274.51-.51a.5.5 0 0 1 .707 0l.646.647.646-.647a.5.5 0 0 1 .708 0l.646.647.646-.647a.5.5 0 0 1 .708 0l.509.509.137-.274V2.118l-.137-.274-.51.51a.5.5 0 0 1-.707 0L12 1.707l-.646.647a.5.5 0 0 1-.708 0L10 1.707l-.646.647a.5.5 0 0 1-.708 0L8 1.707l-.646.647a.5.5 0 0 1-.708 0L6 1.707l-.646.647a.5.5 0 0 1-.708 0L4 1.707l-.646.647a.5.5 0 0 1-.708 0l-.509-.51z"/>
              <path d="M3 4.5a.5.5 0 0 1 .5-.5h6a.5.5 0 1 1 0 1h-6a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h6a.5.5 0 1 1 0 1h-6a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h6a.5.5 0 1 1 0 1h-6a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h6a.5.5 0 1 1 0 1h-6a.5.5 0 0 1-.5-.5zm8-6a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5z"/>
            </svg>
            Invoice Details
          </h2>
          
          <div className="form-group">
            <label htmlFor="invoiceNumber">Invoice Number</label>
            <input 
              type="text" 
              id="invoiceNumber" 
              name="invoiceNumber" 
              value={invoiceData.invoiceNumber} 
              onChange={handleInputChange} 
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="invoiceDate">Invoice Date</label>
            <input 
              type="date" 
              id="invoiceDate" 
              name="invoiceDate" 
              value={invoiceData.invoiceDate} 
              onChange={handleInputChange} 
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="taxRate">Tax Rate (%)</label>
            <input 
              type="number" 
              id="taxRate" 
              name="taxRate" 
              value={invoiceData.taxRate} 
              onChange={handleInputChange} 
              min="0" 
              max="100" 
              step="0.01" 
            />
          </div>
          
          <div className="form-group">
            <label>Primary Currency</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <label>
                <input 
                  type="radio" 
                  name="currency" 
                  value="USD" 
                  checked={invoiceData.currency === 'USD'} 
                  onChange={handleCurrencyToggle} 
                /> USD
              </label>
              <label>
                <input 
                  type="radio" 
                  name="currency" 
                  value="INR" 
                  checked={invoiceData.currency === 'INR'} 
                  onChange={handleCurrencyToggle} 
                /> INR
              </label>
            </div>
          </div>
        </div>
        
        {/* Sender Information */}
        <div className="card">
          <h2 className="card-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M6 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-5 6s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H1zM11 3.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5zm.5 2.5a.5.5 0 0 0 0 1h4a.5.5 0 0 0 0-1h-4zm2 3a.5.5 0 0 0 0 1h2a.5.5 0 0 0 0-1h-2zm0 3a.5.5 0 0 0 0 1h2a.5.5 0 0 0 0-1h-2z"/>
            </svg>
            Your Company Information
          </h2>
          
          <div className="form-group">
            <label htmlFor="companyLogo">Company Logo</label>
            <input 
              type="file" 
              id="companyLogo" 
              accept="image/*" 
              onChange={handleLogoUpload} 
            />
            {invoiceData.logoUrl && (
              <div style={{ marginTop: '10px' }}>
                <img 
                  src={invoiceData.logoUrl} 
                  alt="Company Logo" 
                  style={{ maxWidth: '200px', maxHeight: '100px' }} 
                />
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="senderName">Company Name</label>
            <input 
              type="text" 
              id="senderName" 
              name="senderName" 
              value={invoiceData.senderName} 
              onChange={handleInputChange} 
              placeholder="Your Company Name" 
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="senderAddress">Company Address</label>
            <textarea 
              id="senderAddress" 
              name="senderAddress" 
              value={invoiceData.senderAddress} 
              onChange={handleInputChange} 
              placeholder="Company Address" 
            ></textarea>
          </div>
          
          <div className="form-group">
            <label htmlFor="senderGSTIN">Company GSTIN</label>
            <input 
              type="text" 
              id="senderGSTIN" 
              name="senderGSTIN" 
              value={invoiceData.senderGSTIN} 
              onChange={handleInputChange} 
              placeholder="GSTIN (if applicable)" 
            />
          </div>
        </div>
      </div>
      
      {/* Right Column */}
      <div>
        {/* Client Information */}
        <div className="card">
          <h2 className="card-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
              <path fillRule="evenodd" d="M5.216 14A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216z"/>
              <path d="M4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/>
            </svg>
            Client Information
          </h2>
          
          <div className="form-group">
            <label htmlFor="recipientName">Client Name</label>
            <input 
              type="text" 
              id="recipientName" 
              name="recipientName" 
              value={invoiceData.recipientName} 
              onChange={handleInputChange} 
              placeholder="Client Name" 
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="recipientEmail">Client Email</label>
            <input 
              type="email" 
              id="recipientEmail" 
              name="recipientEmail" 
              value={invoiceData.recipientEmail} 
              onChange={handleInputChange} 
              placeholder="client@example.com" 
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="recipientAddress">Client Address</label>
            <textarea 
              id="recipientAddress" 
              name="recipientAddress" 
              value={invoiceData.recipientAddress} 
              onChange={handleInputChange} 
              placeholder="Client Address" 
            ></textarea>
          </div>
          
          <div className="form-group">
            <label htmlFor="recipientPhone">Client Phone</label>
            <input 
              type="text" 
              id="recipientPhone" 
              name="recipientPhone" 
              value={invoiceData.recipientPhone} 
              onChange={handleInputChange} 
              placeholder="Client Phone Number" 
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="recipientGSTIN">Client GSTIN</label>
            <input 
              type="text" 
              id="recipientGSTIN" 
              name="recipientGSTIN" 
              value={invoiceData.recipientGSTIN} 
              onChange={handleInputChange} 
              placeholder="GSTIN (if applicable)" 
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="recipientPAN">Client PAN</label>
            <input 
              type="text" 
              id="recipientPAN" 
              name="recipientPAN" 
              value={invoiceData.recipientPAN} 
              onChange={handleInputChange} 
              placeholder="PAN (if applicable)" 
            />
          </div>
        </div>
        
        {/* Notes */}
        <div className="card">
          <h2 className="card-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M14.5 3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h13zm-13-1A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2h-13z"/>
              <path d="M7 5.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm-1.496-.854a.5.5 0 0 1 0 .708l-1.5 1.5a.5.5 0 0 1-.708 0l-.5-.5a.5.5 0 1 1 .708-.708l.146.147 1.146-1.147a.5.5 0 0 1 .708 0zM7 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm-1.496-.854a.5.5 0 0 1 0 .708l-1.5 1.5a.5.5 0 0 1-.708 0l-.5-.5a.5.5 0 0 1 .708-.708l.146.147 1.146-1.147a.5.5 0 0 1 .708 0z"/>
            </svg>
            Notes or Terms
          </h2>
          
          <div className="form-group">
            <label htmlFor="notes">Payment Details & Notes</label>
            <textarea 
              id="notes" 
              name="notes" 
              value={invoiceData.notes} 
              onChange={handleInputChange} 
              placeholder="Enter payment details and any additional notes here" 
            ></textarea>
          </div>
        </div>
      </div>
      
      {/* Invoice Items - Full Width */}
      <div style={{ gridColumn: '1 / -1' }}>
        <div className="card">
          <h2 className="card-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm-3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
            </svg>
            Invoice Items
          </h2>
          
          <InvoiceItemsTable 
            items={invoiceData.items}
            setItems={(newItems) => setInvoiceData({...invoiceData, items: newItems})}
            exchangeRate={exchangeRate}
            currency={invoiceData.currency}
          />
          
          <div style={{ marginTop: '20px', textAlign: 'right' }}>
            <table style={{ width: '300px', marginLeft: 'auto' }}>
              <tbody>
                <tr>
                  <td>Subtotal:</td>
                  <td>
                    ${invoiceData.subtotalUSD.toFixed(2)} / 
                    ₹{invoiceData.subtotalINR.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td>Tax ({invoiceData.taxRate}%):</td>
                  <td>
                    ${invoiceData.taxAmountUSD.toFixed(2)} / 
                    ₹{invoiceData.taxAmountINR.toFixed(2)}
                  </td>
                </tr>
                <tr style={{ fontWeight: 'bold' }}>
                  <td>Total:</td>
                  <td>
                    ${invoiceData.totalUSD.toFixed(2)} / 
                    ₹{invoiceData.totalINR.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Actions - Full Width */}
      <div style={{ gridColumn: '1 / -1' }}>
        <div className="actions">
          <button onClick={onPreview} className="btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '5px' }}>
              <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/>
              <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/>
            </svg>
            Preview Invoice
          </button>
          
          <button onClick={downloadPDF} className="btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '5px' }}>
              <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
              <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
            </svg>
            Download PDF
          </button>
          
          <button onClick={() => setShowSendModal(true)} className="btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '5px' }}>
              <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576 6.636 10.07Zm6.787-8.201L1.591 6.602l4.339 2.76 7.494-7.493Z"/>
            </svg>
            Send Invoice
          </button>
          
          <button onClick={onSave} className="btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '5px' }}>
              <path d="M2 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H9.5a1 1 0 0 0-1 1v7.293l2.646-2.647a.5.5 0 0 1 .708.708l-3.5 3.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L7.5 9.293V2a2 2 0 0 1 2-2H14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h2.5a2 2 0 0 1 2 2v7.293l3.05-3.05a.5.5 0 1 1 .707.707l-3.5 3.5a.5.5 0 0 1-.707 0l-3.5-3.5a.5.5 0 1 1 .707-.707l2.646 2.647V2a1 1 0 0 0-1-1H2z"/>
            </svg>
            Save Invoice
          </button>
          
          <button onClick={onDelete} className="btn btn-danger">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '5px' }}>
              <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
              <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
            </svg>
            Delete Invoice
          </button>
        </div>
      </div>
      
      {/* Custom Modals */}
      <Modal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        title="Send Invoice"
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => setShowSendModal(false)}>
              Cancel
            </button>
            <button 
              className="btn" 
              onClick={() => {
                setShowSendModal(false);
                sendInvoice();
              }}
            >
              Send
            </button>
          </>
        }
      >
        <p>Send invoice to {invoiceData.recipientEmail}?</p>
      </Modal>
      
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="New Invoice"
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => setShowResetModal(false)}>
              Cancel
            </button>
            <button 
              className="btn" 
              onClick={() => {
                setShowResetModal(false);
                onReset();
              }}
            >
              Create New
            </button>
          </>
        }
      >
        <p>Are you sure you want to create a new invoice? All current data will be lost.</p>
      </Modal>
    </div>
  );
};

export default InvoiceForm;