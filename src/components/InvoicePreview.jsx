import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const InvoicePreview = ({ invoiceData, formatDate, onClose }) => {
  // Default logo if none is provided
  const defaultLogo = `${import.meta.env.BASE_URL}images/default-logo.png`;

  const downloadPDF = async () => {
    try {
      const previewElement = document.getElementById('invoicePreview');
      
      if (!previewElement) {
        throw new Error('Preview element not found');
      }
      
      const canvas = await html2canvas(previewElement, {
        scale: 2,
        useCORS: true,
        scrollY: 0,
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const ratio = canvas.width / canvas.height;
      const imgWidth = pdfWidth;
      const imgHeight = imgWidth / ratio;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Invoice_${invoiceData.invoiceNumber}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <div id="invoicePreview" className="invoice-preview">
      <div className="preview-container">
        <div className="actions" style={{ marginBottom: '20px' }}>
          <button className="btn" onClick={downloadPDF}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '5px' }}>
              <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
              <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
            </svg>
            Download PDF
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '5px' }}>
              <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
            </svg>
            Back to Invoice
          </button>
        </div>
        
        <div className="preview-header">
        <img 
  className="preview-logo" 
  src={invoiceData.logoUrl || defaultLogo} 
  alt="Company Logo" 
  onError={(e) => {
    e.target.onerror = null;
    e.target.src = defaultLogo;
  }}
          />
          <div>
            <h2>INVOICE</h2>
            <p>Invoice #: <span>{invoiceData.invoiceNumber}</span></p>
            <p>Date: <span>{formatDate(invoiceData.invoiceDate)}</span></p>
          </div>
        </div>
        
        <div className="preview-grid">
          <div className="preview-details">
            <h3>From</h3>
            <p><strong>{invoiceData.senderName || 'Your Company'}</strong></p>
            <p style={{ whiteSpace: 'pre-line' }}>{invoiceData.senderAddress || 'Company Address'}</p>
            <p>GSTIN: <span>{invoiceData.senderGSTIN || 'N/A'}</span></p>
          </div>
          
          <div className="preview-details">
            <h3>To</h3>
            <p><strong>{invoiceData.recipientName || 'Client Name'}</strong></p>
            <p>Email: <span>{invoiceData.recipientEmail || 'client@example.com'}</span></p>
            {invoiceData.recipientPhone && <p>Phone: <span>{invoiceData.recipientPhone}</span></p>}
            {invoiceData.recipientAddress && <p style={{ whiteSpace: 'pre-line' }}>{invoiceData.recipientAddress}</p>}
            {invoiceData.recipientGSTIN && <p>GSTIN: <span>{invoiceData.recipientGSTIN}</span></p>}
            {invoiceData.recipientPAN && <p>PAN: <span>{invoiceData.recipientPAN}</span></p>}
          </div>
        </div>
        
        <div className="preview-items">
          <h3>Invoice Items</h3>
          <table>
            <thead>
              <tr>
                <th style={{ width: '40%' }}>Item</th>
                <th style={{ width: '30%' }}>Description</th>
                <th style={{ width: '15%' }}>Amount (USD)</th>
                <th style={{ width: '15%' }}>Amount (INR)</th>
              </tr>
            </thead>
            <tbody>
              {invoiceData.items.map((item, index) => (
                <React.Fragment key={index}>
                  <tr>
                    <td>{item.name || 'Item name'}</td>
                    <td>{item.description || 'Description'}</td>
                    <td className="text-right">${parseFloat(item.amountUSD).toFixed(2)}</td>
                    <td className="text-right">₹{parseFloat(item.amountINR).toFixed(2)}</td>
                  </tr>
                  {item.nestedRows?.map((row, rowIndex) => (
                    <tr key={`${index}-${rowIndex}`} className="nested-row">
                      <td colSpan={4}>{row}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="preview-totals">
          <table>
            <tbody>
              <tr>
                <td>Subtotal:</td>
                <td className="text-right">
                  ${invoiceData.subtotalUSD.toFixed(2)} / 
                  ₹{invoiceData.subtotalINR.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td>Tax ({invoiceData.taxRate}%):</td>
                <td className="text-right">
                  ${invoiceData.taxAmountUSD.toFixed(2)} / 
                  ₹{invoiceData.taxAmountINR.toFixed(2)}
                </td>
              </tr>
              <tr style={{ fontWeight: 'bold' }}>
                <td>Total:</td>
                <td className="text-right">
                  ${invoiceData.totalUSD.toFixed(2)} / 
                  ₹{invoiceData.totalINR.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="preview-notes">
          <h3>Notes</h3>
          <p style={{ whiteSpace: 'pre-line' }}>{invoiceData.notes}</p>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;