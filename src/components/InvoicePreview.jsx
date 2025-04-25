import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const InvoicePreview = ({ invoiceData, formatDate, onClose }) => {
  // Default logo if none is provided
  const defaultLogo = "data:image/png;base64,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";
  
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