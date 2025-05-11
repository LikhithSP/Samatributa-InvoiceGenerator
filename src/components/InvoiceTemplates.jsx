import React from 'react';

// Classic Template (current default style)
export const ClassicTemplate = ({ invoiceData, formatDate, defaultLogo, exchangeRate }) => {
  const items = invoiceData.items || [];
  const company = invoiceData.company || {};
  const client = invoiceData.client || {};

  const subtotal = parseFloat(invoiceData.subtotal) || 0;
  const total = parseFloat(invoiceData.total) || 0;
  const taxAmount = total - subtotal;
  const taxRateToDisplay = subtotal > 0 ? (taxAmount / subtotal * 100) : 0;

  return (
    <div className="classic-template">
      {/* 1. Top Header Section with Company Logo and Invoice Title */}
      <div className="preview-header">
        <div className="company-info">
          <img 
            className="preview-logo" 
            src={invoiceData.logo_url || company.logo_url || defaultLogo} 
            alt="Company Logo" 
          />
          <div className="company-name-header">
            <h1>{company.name || 'Your Company'}</h1>
          </div>
        </div>
        <div className="invoice-title">
          <h2>INVOICE</h2>
        </div>
      </div>
      
      {/* 2. Company and Invoice Details Section */}
      <div className="details-section">
        <div className="company-details">
          <p>{company.address || 'Company Address'}</p>
          <p>GSTIN: {company.gstin || 'N/A'}</p> {/* Assuming company has gstin */}
        </div>
        <div className="invoice-details">
          <div className="invoice-number">
            <p><strong>Invoice #:</strong> {invoiceData.invoice_number}</p>
          </div>
          <div className="invoice-date">
            <p><strong>Date:</strong> {invoiceData.issue_date ? formatDate(invoiceData.issue_date) : 'N/A'}</p>
          </div>
        </div>
      </div>
      
      {/* 3. Client Information Section */}
      <div className="bill-to-section">
        <h3>Bill To:</h3>
        <div className="customer-info">
          <div className="info-row full-width">
            <p><strong>{client.name || 'Client Name'}</strong></p>
          </div>
          <div className="info-row full-width">
            <p>{client.address || 'Client Address'}</p>
          </div>
          <div className="info-row half-width">
            <p><strong>Phone:</strong> {client.phone || 'N/A'}</p>
          </div>
          <div className="info-row half-width">
            <p><strong>Email:</strong> {client.email || 'N/A'}</p>
          </div>
          <div className="info-row half-width">
            <p><strong>GSTIN:</strong> {client.gstin || 'N/A'}</p>
          </div>
          <div className="info-row half-width">
            <p><strong>PAN:</strong> {client.pan || 'N/A'}</p> {/* Assuming client has pan */}
          </div>
        </div>
      </div>
      
      {/* 4. Invoice Rate Information */}
      <div className="invoice-summary">
        <div className="rate-info">
          {invoiceData.currency === 'USD' && exchangeRate && <p><strong>USD to INR Rate:</strong> {exchangeRate}</p>}
          <p><strong>GST Rate:</strong> {taxRateToDisplay.toFixed(2)}%</p>
        </div>
      </div>
      
      {/* 5. Service Items Table */}
      <div className="service-table">
        <table>
          <thead>
            <tr>
              <th style={{ width: '70%' }}>Description</th>
              {/* Dynamic headers based on currency */}
              <th style={{ width: '15%' }}>Amount ({invoiceData.currency || 'CUR'})</th>
              {invoiceData.currency === 'USD' && exchangeRate && <th style={{ width: '15%' }}>Amount (INR)</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const itemTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
              const itemTotalInr = invoiceData.currency === 'USD' && exchangeRate ? itemTotal * exchangeRate : 0;
              return (
                <tr key={index}>
                  <td>
                    <strong>{item.description || 'Service'}</strong>
                    {/* If item has further details, display them here. For now, just description. */}
                  </td>
                  <td className="text-right">{itemTotal.toFixed(2)}</td>
                  {invoiceData.currency === 'USD' && exchangeRate && <td className="text-right">{itemTotalInr.toFixed(2)}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* 6. Totals Section */}
      <div className="totals-section">
        <table>
          <tbody>
            <tr>
              <td>Subtotal:</td>
              <td className="text-right">
                {subtotal.toFixed(2)} {invoiceData.currency}
                {invoiceData.currency === 'USD' && exchangeRate && ` / ₹${(subtotal * exchangeRate).toFixed(2)}`}
              </td>
            </tr>
            <tr>
              <td>GST ({taxRateToDisplay.toFixed(2)}%):</td>
              <td className="text-right">
                {taxAmount.toFixed(2)} {invoiceData.currency}
                {invoiceData.currency === 'USD' && exchangeRate && ` / ₹${(taxAmount * exchangeRate).toFixed(2)}`}
              </td>
            </tr>
            <tr className="grand-total">
              <td>Grand Total:</td>
              <td className="text-right">
                {total.toFixed(2)} {invoiceData.currency}
                {invoiceData.currency === 'USD' && exchangeRate && ` / ₹${(total * exchangeRate).toFixed(2)}`}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* 7. Beneficiary Bank Details */}
      <div className="bank-details">
        <h3>Beneficiary Account Details</h3>
        <div className="account-info">
          <div className="info-row full-width">
            <p><strong>Account Name:</strong> {company.account_name || extractAccountName(invoiceData.notes)}</p>
          </div>
          <div className="info-row full-width">
            <p><strong>Bank Name:</strong> {company.bank_name || extractBankName(invoiceData.notes)}</p>
          </div>
          <div className="info-row half-width">
            <p><strong>Account Number:</strong> {company.account_number || extractAccountNumber(invoiceData.notes)}</p>
          </div>
          <div className="info-row half-width">
            <p><strong>IFSC Code:</strong> {company.ifsc_code || extractIFSCCode(invoiceData.notes)}</p>
          </div>
        </div>
      </div>
      
      {/* 8. Footer Section */}
      <div className="invoice-footer">
        <p>Thank you for your business!</p>
      </div>
    </div>
  );
};

// Modern Template - more minimalist with a different color scheme and font
export const ModernTemplate = ({ invoiceData, formatDate, defaultLogo, exchangeRate }) => {
  const items = invoiceData.items || [];
  const company = invoiceData.company || {};
  const client = invoiceData.client || {};

  const subtotal = parseFloat(invoiceData.subtotal) || 0;
  const total = parseFloat(invoiceData.total) || 0;
  const taxAmount = total - subtotal;
  const taxRateToDisplay = subtotal > 0 ? (taxAmount / subtotal * 100) : 0;

  return (
    <div className="modern-template" style={{ fontFamily: "'Poppins', sans-serif", color: '#333', background: 'linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%)' }}>
      {/* Header with Gradient Banner */}
      <div style={{ 
        background: 'linear-gradient(135deg, #65c7f7 0%, #0052D4 100%)',
        borderRadius: '12px',
        padding: '25px',
        marginBottom: '30px',
        display: 'flex',
        justifyContent: 'space-between',
        boxShadow: '0 4px 20px rgba(0, 82, 212, 0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', background: 'white', padding: '15px', borderRadius: '10px' }}>
          <img 
            src={invoiceData.logo_url || company.logo_url || defaultLogo} 
            alt="Company Logo"
            style={{ width: '70px', height: 'auto', marginRight: '15px' }}
          />
          <div>
            <h1 style={{ fontSize: '22px', margin: 0, color: '#333' }}>{company.name || 'Your Company'}</h1>
            <p style={{ fontSize: '13px', margin: '5px 0 0 0', color: '#666' }}>{company.address || 'Company Address'}</p>
          </div>
        </div>
        <div style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.9)', 
          padding: '15px', 
          borderRadius: '10px', 
          textAlign: 'center',
          minWidth: '140px'
        }}>
          <h2 style={{ color: '#0052D4', fontSize: '28px', margin: '0', fontWeight: '600', letterSpacing: '1px' }}>INVOICE</h2>
          <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#333' }}>#{invoiceData.invoice_number}</p>
          <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#666' }}>Date: {invoiceData.issue_date ? formatDate(invoiceData.issue_date) : 'N/A'}</p>
        </div>
      </div>

      {/* Client and Rate Info in Card Layout */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{ 
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
          background: 'white'
        }}>
          <h3 style={{ 
            color: '#0052D4', 
            marginTop: 0, 
            fontSize: '18px',
            borderBottom: '2px solid #e6f2ff',
            paddingBottom: '10px'
          }}>Bill To</h3>
          <p style={{ margin: '12px 0 5px 0', fontWeight: 'bold', fontSize: '16px' }}>{client.name || 'Client Name'}</p>
          <p style={{ margin: '8px 0', fontSize: '14px', color: '#555' }}>{client.address || 'Client Address'}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px', color: '#666', marginTop: '10px' }}>
            <p style={{ margin: '5px 0' }}><strong>Phone:</strong> {client.phone || 'N/A'}</p>
            <p style={{ margin: '5px 0' }}><strong>Email:</strong> {client.email || 'N/A'}</p>
            <p style={{ margin: '5px 0' }}><strong>GSTIN:</strong> {client.gstin || 'N/A'}</p>
            <p style={{ margin: '5px 0' }}><strong>PAN:</strong> {client.pan || 'N/A'}</p>
          </div>
        </div>
        
        <div style={{ 
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
          background: 'white'
        }}>
          <h3 style={{ 
            color: '#0052D4', 
            marginTop: 0, 
            fontSize: '18px',
            borderBottom: '2px solid #e6f2ff',
            paddingBottom: '10px'
          }}>Payment Information</h3>
          {invoiceData.currency === 'USD' && exchangeRate && (
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '15px 0', padding: '10px', background: '#f7faff', borderRadius: '8px' }}>
              <span style={{ fontWeight: '600' }}>USD to INR Rate:</span> 
              <span style={{ color: '#0052D4', fontWeight: '600' }}>{exchangeRate}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '15px 0', padding: '10px', background: '#f7faff', borderRadius: '8px' }}>
            <span style={{ fontWeight: '600' }}>GST Rate:</span> 
            <span style={{ color: '#0052D4', fontWeight: '600' }}>{taxRateToDisplay.toFixed(2)}%</span>
          </div>
          <div style={{ fontSize: '13px', marginTop: '8px', color: '#666', fontStyle: 'italic' }}>
            <p>Invoice issued on {invoiceData.issue_date ? formatDate(invoiceData.issue_date) : 'N/A'}</p>
            {invoiceData.due_date && <p>Payment due on {formatDate(invoiceData.due_date)}</p>}
          </div>
        </div>
      </div>

      {/* Service Items Table with Modern Styling */}
      <div style={{ 
        marginBottom: '30px',
        borderRadius: '10px',
        overflow: 'hidden',
        boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
      }}>
        <div style={{ background: 'linear-gradient(to right, #65c7f7, #0052D4)', padding: '15px 20px' }}>
          <h3 style={{ color: 'white', margin: 0, fontSize: '18px', fontWeight: '500' }}>Services</h3>
        </div>
        <div style={{ background: 'white', padding: '5px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e6f2ff' }}>
                <th style={{ padding: '15px', textAlign: 'left', fontSize: '15px', color: '#0052D4', width: invoiceData.currency === 'USD' && exchangeRate ? '60%' : '70%' }}>Description</th>
                <th style={{ padding: '15px', textAlign: 'right', fontSize: '15px', color: '#0052D4', width: '20%' }}>{invoiceData.currency || 'CUR'}</th>
                {invoiceData.currency === 'USD' && exchangeRate && <th style={{ padding: '15px', textAlign: 'right', fontSize: '15px', color: '#0052D4', width: '20%' }}>INR</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const itemTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
                const itemTotalInr = invoiceData.currency === 'USD' && exchangeRate ? itemTotal * exchangeRate : 0;
                return (
                  <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '15px' }}>
                      <strong style={{ color: '#444', fontSize: '15px' }}>{item.description || 'Service'}</strong>
                      {/* Optional: item sub-description if available */}
                    </td>
                    <td style={{ padding: '15px', textAlign: 'right', color: '#444' }}>{itemTotal.toFixed(2)}</td>
                    {invoiceData.currency === 'USD' && exchangeRate && <td style={{ padding: '15px', textAlign: 'right', color: '#444' }}>{itemTotalInr.toFixed(2)}</td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals Section with Gradient Card */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '30px' }}>
        <div style={{ 
          width: '350px',
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
        }}>
          <div style={{ padding: '15px 20px', background: 'white' }}>
            <div style={{ padding: '10px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0' }}>
              <span style={{ color: '#555' }}>Subtotal:</span>
              <span style={{ color: '#555', fontWeight: '500' }}>
                {subtotal.toFixed(2)} {invoiceData.currency}
                {invoiceData.currency === 'USD' && exchangeRate && ` / ₹${(subtotal * exchangeRate).toFixed(2)}`}
              </span>
            </div>
            <div style={{ padding: '10px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0' }}>
              <span style={{ color: '#555' }}>GST ({taxRateToDisplay.toFixed(2)}%):</span>
              <span style={{ color: '#555', fontWeight: '500' }}>
                {taxAmount.toFixed(2)} {invoiceData.currency}
                {invoiceData.currency === 'USD' && exchangeRate && ` / ₹${(taxAmount * exchangeRate).toFixed(2)}`}
              </span>
            </div>
          </div>
          <div style={{ 
            padding: '15px 20px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            background: 'linear-gradient(to right, #65c7f7, #0052D4)', 
            color: 'white',
          }}>
            <span style={{ fontWeight: 'bold' }}>Grand Total:</span>
            <span style={{ fontWeight: 'bold' }}>
              {total.toFixed(2)} {invoiceData.currency}
              {invoiceData.currency === 'USD' && exchangeRate && ` / ₹${(total * exchangeRate).toFixed(2)}`}
            </span>
          </div>
        </div>
      </div>

      {/* Bank Details with Modern Card UI */}
      <div style={{ 
        borderRadius: '10px',
        padding: '25px',
        marginBottom: '30px',
        background: 'white',
        boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          width: '10px',
          height: '100%',
          background: 'linear-gradient(to bottom, #65c7f7, #0052D4)'
        }}></div>
        <h3 style={{ color: '#0052D4', marginTop: 0, marginLeft: '15px', marginBottom: '20px', fontSize: '18px' }}>
          Beneficiary Account Details
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '14px', paddingLeft: '15px' }}>
          <div style={{ padding: '10px 15px', background: '#f7faff', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#888' }}>Account Name</p>
            <p style={{ margin: 0, fontWeight: '600', color: '#333' }}>{company.account_name || extractAccountName(invoiceData.notes) || 'N/A'}</p>
          </div>
          <div style={{ padding: '10px 15px', background: '#f7faff', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#888' }}>Bank Name</p>
            <p style={{ margin: 0, fontWeight: '600', color: '#333' }}>{company.bank_name || extractBankName(invoiceData.notes) || 'N/A'}</p>
          </div>
          <div style={{ padding: '10px 15px', background: '#f7faff', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#888' }}>Account Number</p>
            <p style={{ margin: 0, fontWeight: '600', color: '#333' }}>{company.account_number || extractAccountNumber(invoiceData.notes) || 'N/A'}</p>
          </div>
          <div style={{ padding: '10px 15px', background: '#f7faff', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#888' }}>IFSC Code</p>
            <p style={{ margin: 0, fontWeight: '600', color: '#333' }}>{company.ifsc_code || extractIFSCCode(invoiceData.notes) || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Modern Footer */}
      <div style={{ 
        padding: '20px', 
        textAlign: 'center',
        background: 'white',
        borderRadius: '10px',
        boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
      }}>
        <div style={{ fontSize: '18px', fontWeight: '600', color: '#0052D4', marginBottom: '10px' }}>
          Thank you for your business!
        </div>
        <p style={{ margin: 0, fontSize: '13px', color: '#888' }}>Invoice generated on {invoiceData.issue_date ? formatDate(invoiceData.issue_date) : 'N/A'}</p>
      </div>
    </div>
  );
};

// Professional Template - elegant design with light colors and modern layout
export const ProfessionalTemplate = ({ invoiceData, formatDate, defaultLogo, exchangeRate }) => {
  const items = invoiceData.items || [];
  const company = invoiceData.company || {};
  const client = invoiceData.client || {};

  const subtotal = parseFloat(invoiceData.subtotal) || 0;
  const total = parseFloat(invoiceData.total) || 0;
  const taxAmount = total - subtotal;
  const taxRateToDisplay = subtotal > 0 ? (taxAmount / subtotal * 100) : 0;

  return (
    <div className="professional-template" style={{ fontFamily: "'Playfair Display', serif", color: '#444', background: '#fafafa' }}>
      {/* Header with elegant gold and cream colors */}
      <div style={{ 
        backgroundColor: '#f8f6f0',
        borderBottom: '2px solid #d4b483',
        padding: '30px',
        marginBottom: '30px',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', maxWidth: '60%' }}>
            <img 
              src={invoiceData.logo_url || company.logo_url || defaultLogo} 
              alt="Company Logo"
              style={{ width: '80px', height: 'auto', marginRight: '25px', padding: '5px', border: '1px solid #d4b483', borderRadius: '4px' }}
            />
            <div>
              <h1 style={{ fontSize: '28px', margin: '0', color: '#54352d', fontWeight: '700' }}>
                {company.name || 'Your Company'}
              </h1>
              <p style={{ margin: '8px 0 0 0', color: '#777', fontSize: '15px', maxWidth: '300px' }}>{company.address || 'Company Address'}</p>
            </div>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <div style={{ 
              display: 'inline-block',
              border: '1px solid #d4b483',
              padding: '12px 30px',
              color: '#54352d',
              position: 'relative',
              background: 'linear-gradient(45deg, #fcf8ef, #ffffff)'
            }}>
              <h2 style={{ margin: '0', fontWeight: '700', fontSize: '22px', letterSpacing: '2px' }}>INVOICE</h2>
              <div style={{ 
                position: 'absolute',
                top: '-2px',
                left: '-2px',
                right: '-2px',
                height: '2px',
                background: 'linear-gradient(90deg, #d4b483, #e3d3b3)'
              }}></div>
              <div style={{ 
                position: 'absolute',
                bottom: '-2px',
                left: '-2px',
                right: '-2px',
                height: '2px',
                background: 'linear-gradient(90deg, #d4b483, #e3d3b3)'
              }}></div>
            </div>
            <p style={{ margin: '15px 0 0 0', fontSize: '15px', color: '#777' }}>Invoice #: <span style={{ fontWeight: '600', color: '#54352d' }}>{invoiceData.invoice_number}</span></p>
            <p style={{ margin: '5px 0 0 0', fontSize: '15px', color: '#777' }}>Date: <span style={{ fontWeight: '600', color: '#54352d' }}>{invoiceData.issue_date ? formatDate(invoiceData.issue_date) : 'N/A'}</span></p>
          </div>
        </div>
        
        <div style={{ 
          position: 'absolute',
          bottom: '-10px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '50px',
          height: '20px',
          background: '#f8f6f0',
          borderLeft: '2px solid #d4b483',
          borderRight: '2px solid #d4b483',
          borderBottom: '2px solid #d4b483',
          borderBottomLeftRadius: '25px',
          borderBottomRightRadius: '25px',
        }}></div>
      </div>

      {/* Main Content with elegant styling */}
      <div style={{ padding: '0 30px' }}>
        {/* Client and Payment Information in a sophisticated two-column layout */}
        <div style={{ 
          display: 'flex',
          gap: '40px',
          marginBottom: '40px',
        }}>
          {/* Bill To Section */}
          <div style={{ flex: 1 }}>
            <h3 style={{ 
              color: '#54352d', 
              fontSize: '18px',
              fontWeight: '600',
              borderBottom: '1px solid #d4b483',
              paddingBottom: '10px',
              marginBottom: '15px',
              position: 'relative'
            }}>
              Client Information
              <span style={{ 
                position: 'absolute',
                bottom: '-1px',
                left: '0',
                width: '60px',
                height: '3px',
                background: '#d4b483'
              }}></span>
            </h3>
            <div style={{ background: '#fff', padding: '20px', borderLeft: '3px solid #d4b483', boxShadow: '0 3px 10px rgba(0,0,0,0.03)' }}>
              <p style={{ margin: '0 0 10px 0', fontWeight: '700', fontSize: '17px', color: '#54352d' }}>{client.name || 'Client Name'}</p>
              <p style={{ margin: '0 0 15px 0', fontSize: '15px', color: '#666', lineHeight: '1.4' }}>{client.address || 'Client Address'}</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
                <div>
                  <p style={{ margin: '0', color: '#888' }}>Phone</p>
                  <p style={{ margin: '3px 0 8px 0', color: '#444', fontWeight: '500' }}>{client.phone || 'N/A'}</p>
                </div>
                <div>
                  <p style={{ margin: '0', color: '#888' }}>Email</p>
                  <p style={{ margin: '3px 0 8px 0', color: '#444', fontWeight: '500' }}>{client.email || 'N/A'}</p>
                </div>
                <div>
                  <p style={{ margin: '0', color: '#888' }}>GSTIN</p>
                  <p style={{ margin: '3px 0 8px 0', color: '#444', fontWeight: '500' }}>{client.gstin || 'N/A'}</p>
                </div>
                <div>
                  <p style={{ margin: '0', color: '#888' }}>PAN</p>
                  <p style={{ margin: '3px 0 8px 0', color: '#444', fontWeight: '500' }}>{client.pan || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div style={{ flex: 1 }}>
            <h3 style={{ 
              color: '#54352d', 
              fontSize: '18px',
              fontWeight: '600',
              borderBottom: '1px solid #d4b483',
              paddingBottom: '10px',
              marginBottom: '15px',
              position: 'relative'
            }}>
              Payment Details
              <span style={{ 
                position: 'absolute',
                bottom: '-1px',
                left: '0',
                width: '60px',
                height: '3px',
                background: '#d4b483'
              }}></span>
            </h3>
            <div style={{ background: '#fff', padding: '20px', borderLeft: '3px solid #d4b483', boxShadow: '0 3px 10px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', padding: '8px 0', borderBottom: '1px dashed #eee' }}>
                <span style={{ fontSize: '15px', color: '#666' }}>USD to INR Rate:</span>
                <span style={{ fontSize: '16px', color: '#54352d', fontWeight: '600' }}>{exchangeRate}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', padding: '8px 0', borderBottom: '1px dashed #eee' }}>
                <span style={{ fontSize: '15px', color: '#666' }}>GST Rate:</span>
                <span style={{ fontSize: '16px', color: '#54352d', fontWeight: '600' }}>{taxRateToDisplay.toFixed(2)}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                <span style={{ fontSize: '15px', color: '#666' }}>Invoice Date:</span>
                <span style={{ fontSize: '16px', color: '#54352d', fontWeight: '600' }}>{invoiceData.issue_date ? formatDate(invoiceData.issue_date) : 'N/A'}</span>
              </div>

              <div style={{ 
                marginTop: '20px',
                padding: '10px 15px',
                background: '#f8f6f0',
                borderRadius: '4px',
                fontSize: '14px',
                color: '#777',
                fontStyle: 'italic',
                textAlign: 'center'
              }}>
                Please reference invoice number when making payment
              </div>
            </div>
          </div>
        </div>

        {/* Services Table with Clean, Elegant Styling */}
        <div style={{ marginBottom: '40px' }}>
          <h3 style={{ 
            color: '#54352d', 
            fontSize: '18px',
            fontWeight: '600',
            borderBottom: '1px solid #d4b483',
            paddingBottom: '10px',
            marginBottom: '20px',
            position: 'relative'
          }}>
            Services
            <span style={{ 
              position: 'absolute',
              bottom: '-1px',
              left: '0',
              width: '60px',
              height: '3px',
              background: '#d4b483'
            }}></span>
          </h3>
          
          <div style={{ background: '#fff', boxShadow: '0 3px 15px rgba(0,0,0,0.04)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '15px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f0e7d6' }}>
                  <th style={{ 
                    padding: '15px 20px', 
                    textAlign: 'left', 
                    color: '#54352d', 
                    fontWeight: '600',
                    width: '70%' 
                  }}>Description</th>
                  <th style={{ 
                    padding: '15px 20px', 
                    textAlign: 'right', 
                    color: '#54352d',
                    fontWeight: '600',
                    width: '15%' 
                  }}>Amount (USD)</th>
                  <th style={{ 
                    padding: '15px 20px', 
                    textAlign: 'right', 
                    color: '#54352d',
                    fontWeight: '600',
                    width: '15%' 
                  }}>Amount (INR)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <React.Fragment key={index}>
                    {item.type === 'main' ? (
                      <>
                        <tr style={{ backgroundColor: '#fcf9f2' }}>
                          <td colSpan="3" style={{ 
                            padding: '12px 20px', 
                            fontWeight: '600', 
                            color: '#54352d', 
                            fontSize: '16px',
                            borderBottom: '1px solid #f0e7d6'
                          }}>
                            {item.name || 'Service'}
                          </td>
                        </tr>
                        {item.subServices && Array.isArray(item.subServices) && item.subServices.length > 0 ? (
                          item.subServices.map((subService, subIndex) => (
                            <tr key={`${index}-sub-${subIndex}`} style={{ borderBottom: '1px solid #f0e7d6' }}>
                              <td style={{ padding: '15px 20px 15px 35px' }}>
                                <div style={{ fontWeight: '500', color: '#666' }}>{subService.name || 'Sub-service'}</div>
                                {subService.description && (
                                  <div style={{ margin: '5px 0 0 0', color: '#888', fontSize: '14px', lineHeight: '1.4' }}>{subService.description}</div>
                                )}
                              </td>
                              <td style={{ padding: '15px 20px', textAlign: 'right', color: '#555', fontWeight: '500' }}>${parseFloat(subService.amountUSD || 0).toFixed(2)}</td>
                              <td style={{ padding: '15px 20px', textAlign: 'right', color: '#555', fontWeight: '500' }}>₹{parseFloat(subService.amountINR || 0).toFixed(2)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr style={{ borderBottom: '1px solid #f0e7d6' }}>
                            <td colSpan="3" style={{ padding: '10px 20px 10px 35px', color: '#999', fontSize: '14px', fontStyle: 'italic' }}>
                              No sub-services available
                            </td>
                          </tr>
                        )}
                      </>
                    ) : (
                      <tr style={{ borderBottom: '1px solid #f0e7d6' }}>
                        <td style={{ padding: '15px 20px' }}>
                          <div style={{ fontWeight: '500', color: '#666' }}>{item.name || 'Service'}</div>
                          {item.description && (
                            <div style={{ margin: '5px 0 0 0', color: '#888', fontSize: '14px', lineHeight: '1.4' }}>{item.description || ''}</div>
                          )}
                        </td>
                        <td style={{ padding: '15px 20px', textAlign: 'right', color: '#555', fontWeight: '500' }}>${parseFloat(item.amountUSD || 0).toFixed(2)}</td>
                        <td style={{ padding: '15px 20px', textAlign: 'right', color: '#555', fontWeight: '500' }}>₹{parseFloat(item.amountINR || 0).toFixed(2)}</td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals Section with Elegant Styling */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
          <div style={{ width: '350px' }}>
            <div style={{ background: '#fff', borderTop: '3px solid #d4b483', boxShadow: '0 3px 15px rgba(0,0,0,0.04)' }}>
              <div style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0e7d6' }}>
                <span style={{ color: '#666' }}>Subtotal:</span>
                <span style={{ color: '#555', fontWeight: '500' }}>${invoiceData.subtotalUSD.toFixed(2)} / ₹{invoiceData.subtotalINR.toFixed(2)}</span>
              </div>
              <div style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0e7d6' }}>
                <span style={{ color: '#666' }}>GST ({invoiceData.taxRate}%):</span>
                <span style={{ color: '#555', fontWeight: '500' }}>${invoiceData.taxAmountUSD.toFixed(2)} / ₹{invoiceData.taxAmountINR.toFixed(2)}</span>
              </div>
              <div style={{ 
                padding: '18px 20px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                background: '#fcf9f2', 
                borderBottom: '1px solid #f0e7d6'
              }}>
                <span style={{ fontWeight: '600', color: '#54352d', fontSize: '16px' }}>Grand Total:</span>
                <span style={{ fontWeight: '600', color: '#54352d', fontSize: '16px' }}>${invoiceData.totalUSD.toFixed(2)} / ₹{invoiceData.totalINR.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bank Details with Elegant Card */}
        <div style={{ marginBottom: '40px' }}>
          <h3 style={{ 
            color: '#54352d', 
            fontSize: '18px',
            fontWeight: '600',
            borderBottom: '1px solid #d4b483',
            paddingBottom: '10px',
            marginBottom: '20px',
            position: 'relative'
          }}>
            Beneficiary Account Details
            <span style={{ 
              position: 'absolute',
              bottom: '-1px',
              left: '0',
              width: '60px',
              height: '3px',
              background: '#d4b483'
            }}></span>
          </h3>
          
          <div style={{ 
            background: '#fff',
            padding: '25px',
            boxShadow: '0 3px 15px rgba(0,0,0,0.04)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            position: 'relative'
          }}>
            <div>
              <p style={{ margin: '0 0 5px 0', color: '#999', fontSize: '13px' }}>Account Name</p>
              <p style={{ margin: '0', fontWeight: '600', fontSize: '15px', color: '#444' }}>{company.account_name || extractAccountName(invoiceData.notes) || 'N/A'}</p>
            </div>
            <div>
              <p style={{ margin: '0 0 5px 0', color: '#999', fontSize: '13px' }}>Bank Name</p>
              <p style={{ margin: '0', fontWeight: '600', fontSize: '15px', color: '#444' }}>{company.bank_name || extractBankName(invoiceData.notes) || 'N/A'}</p>
            </div>
            <div>
              <p style={{ margin: '0 0 5px 0', color: '#999', fontSize: '13px' }}>Account Number</p>
              <p style={{ margin: '0', fontWeight: '600', fontSize: '15px', color: '#444' }}>{company.account_number || extractAccountNumber(invoiceData.notes) || 'N/A'}</p>
            </div>
            <div>
              <p style={{ margin: '0 0 5px 0', color: '#999', fontSize: '13px' }}>IFSC Code</p>
              <p style={{ margin: '0', fontWeight: '600', fontSize: '15px', color: '#444' }}>{company.ifsc_code || extractIFSCCode(invoiceData.notes) || 'N/A'}</p>
            </div>
            
            <div style={{ 
              position: 'absolute',
              top: '10px',
              right: '10px',
              width: '30px',
              height: '30px',
              background: '#fcf9f2',
              borderRadius: '50%',
              border: '1px solid #f0e7d6',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: '18px',
              color: '#d4b483',
              fontWeight: 'bold'
            }}>
              $
            </div>
          </div>
        </div>

        {/* Elegant Footer */}
        <div style={{ 
          marginBottom: '20px',
          backgroundColor: '#fcf9f2',
          padding: '25px',
          textAlign: 'center',
          borderRadius: '4px',
          border: '1px dashed #d4b483',
        }}>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#54352d', marginBottom: '5px', letterSpacing: '1px' }}>
            Thank you for your business
          </div>
          <p style={{ margin: '10px 0 0 0', fontSize: '13px', color: '#888' }}>
            If you have any questions about this invoice, please contact us
          </p>
        </div>
      </div>
    </div>
  );
};

// Helper functions to extract payment details from notes
const extractAccountName = (notes) => {
  if (!notes) return 'N/A';
  const match = notes.match(/Account Name:?\s*([^\n]*)/i);
  return match ? match[1].trim() : 'N/A';
};

const extractBankName = (notes) => {
  if (!notes) return 'N/A';
  const match = notes.match(/Bank Name:?\s*([^\n]*)/i);
  return match ? match[1].trim() : 'N/A';
};

const extractAccountNumber = (notes) => {
  if (!notes) return 'N/A';
  const match = notes.match(/Account Number:?\s*([^\n]*)/i);
  return match ? match[1].trim() : 'N/A';
};

const extractIFSCCode = (notes) => {
  if (!notes) return 'N/A';
  const match = notes.match(/IFSC Code:?\s*([^\n]*)/i);
  return match ? match[1].trim() : 'N/A';
};