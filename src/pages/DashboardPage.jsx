import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiSettings, FiLogOut, FiUser, FiPlus, FiChevronDown } from 'react-icons/fi';
import { FiSun, FiMoon } from 'react-icons/fi';
import '../App.css';
import { defaultLogo } from '../assets/logoData';

const DashboardPage = ({ onLogout, darkMode, toggleDarkMode }) => {
  const navigate = useNavigate();
  
  // Sample companies data for demonstration
  const sampleCompanies = [
    { id: 1, name: 'Acme Corporation', logo: '/images/favicon.png' },
    { id: 2, name: 'Globex Industries', logo: '/images/c-logo.png' },
    { id: 3, name: 'Initech LLC', logo: '/images/favicon.png' },
    { id: 4, name: 'Umbrella Corp', logo: '/images/favicon.png' },
    { id: 5, name: 'Stark Industries', logo: '/images/favicon.png'}
  ];
  
  // State for selected company and dashboard view
  const [selectedCompany, setSelectedCompany] = useState(() => {
    const savedCompany = localStorage.getItem('selectedCompany');
    return savedCompany ? JSON.parse(savedCompany) : null;
  });
  
  const [showAllInvoices, setShowAllInvoices] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sort state
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showSortOptions, setShowSortOptions] = useState(false);
  
  // Update localStorage when selected company changes
  useEffect(() => {
    if (selectedCompany) {
      localStorage.setItem('selectedCompany', JSON.stringify(selectedCompany));
      setShowAllInvoices(false);
    }
  }, [selectedCompany]);
  
  const handleCompanySelect = (company) => {
    setSelectedCompany(company);
    setShowAllInvoices(false);
  };
  
  const handleShowAllInvoices = () => {
    setShowAllInvoices(true);
  };
  
  // Sort handlers
  const handleSortChange = (field) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with default desc direction
      setSortField(field);
      setSortDirection('desc');
    }
    setShowSortOptions(false);
  };
  
  const toggleSortOptions = () => {
    setShowSortOptions(!showSortOptions);
  };
  
  const getSortLabel = () => {
    const labels = {
      'date': 'Date',
      'name': 'Company Name',
      'amount': 'Amount',
      'status': 'Status'
    };
    return `Sort by: ${labels[sortField]} (${sortDirection === 'asc' ? 'Ascending' : 'Descending'})`;
  };
  
  // Function to sort invoices
  const sortInvoices = (invoices) => {
    return [...invoices].sort((a, b) => {
      let comparison = 0;
      
      // Extract the values to compare based on the sort field
      let aValue, bValue;
      switch (sortField) {
        case 'date':
          aValue = new Date(2025, 3, 1 + a);
          bValue = new Date(2025, 3, 1 + b);
          break;
        case 'name':
          aValue = sampleCompanies[a % sampleCompanies.length].name;
          bValue = sampleCompanies[b % sampleCompanies.length].name;
          break;
        case 'amount':
          aValue = 2500 + (a * 100);
          bValue = 2500 + (b * 100);
          break;
        case 'status':
          aValue = a % 2 === 0 ? 'Paid' : 'Pending';
          bValue = b % 2 === 0 ? 'Paid' : 'Pending';
          break;
        default:
          aValue = a;
          bValue = b;
      }
      
      // Compare the values
      if (aValue < bValue) {
        comparison = -1;
      } else if (aValue > bValue) {
        comparison = 1;
      }
      
      // Reverse for descending order
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  const handleCreateInvoice = () => {
    navigate('/invoice/new');
  };
  
  return (
    <div className="dashboard-container">
      {/* Sidebar with company list */}
      <aside className="dashboard-sidebar">
        <div className="company-logo-container">
          <img src="/images/c-logo.png" alt="CIA App" className="main-company-logo" />
          <h3>CIA App</h3>
        </div>
        
        <div className="company-list">
          <div 
            className={`company-item ${showAllInvoices ? 'active' : ''}`}
            onClick={handleShowAllInvoices}
          >
            <FiUser className="company-icon" />
            <span className="company-name">Show All Invoices</span>
          </div>
          
          <div className="section-title" style={{ padding: '10px', fontSize: '12px', color: 'var(--light-text)', fontWeight: 'bold' }}>
            YOUR COMPANIES
          </div>
          
          {sampleCompanies.map((company) => (
            <div 
              key={company.id}
              className={`company-item ${selectedCompany?.id === company.id && !showAllInvoices ? 'active' : ''}`}
              onClick={() => handleCompanySelect(company)}
            >
              <img src={company.logo} alt={company.name} className="company-icon" />
              <span className="company-name">{company.name}</span>
            </div>
          ))}
          
          <div 
            className="company-item"
            style={{ marginTop: '10px', color: 'var(--light-text)' }}
            onClick={() => navigate('/profile')}
          >
            <FiPlus className="company-icon" />
            <span className="company-name">Add New Company</span>
          </div>
        </div>
        
        <div className="sidebar-footer">
          <button onClick={() => navigate('/profile')} className="btn-icon" title="Profile">
            <FiUser />
          </button>
          <button onClick={() => navigate('/diagnostics')} className="btn-icon" title="Settings">
            <FiSettings />
          </button>
          <button onClick={onLogout} className="btn-logout" title="Logout">
            <FiLogOut style={{ marginRight: '5px' }} /> Logout
          </button>
        </div>
      </aside>
      
      {/* Top navigation bar */}
      <div className="dashboard-topbar" style={{
        gridArea: 'topbar',
        padding: '15px 25px',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'var(--card-bg)'
      }}>
        <div className="user-actions" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div className="auth-status">
            <span className="status-dot"></span>
            <span>{localStorage.getItem('userEmail') || 'Logged in'}</span>
          </div>
          <div className="theme-switch-wrapper">
            <label className="theme-switch">
              <input type="checkbox" checked={darkMode} onChange={toggleDarkMode} />
              <span className="slider">
                <span className="sun-icon"><FiSun /></span>
                <span className="moon-icon"><FiMoon /></span>
              </span>
            </label>
          </div>
          <div className="user-profile" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            cursor: 'pointer'
          }} onClick={() => navigate('/profile')}>
            <div className="avatar" style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--dark-text)',
              fontWeight: 'bold'
            }}>
              {(localStorage.getItem('userEmail') || 'U')[0].toUpperCase()}
            </div>
            <span>My Profile</span>
          </div>
        </div>
      </div>
      
      {/* Main content area */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <h2>
            {showAllInvoices 
              ? 'All Invoices' 
              : selectedCompany 
                ? `${selectedCompany.name} Invoices` 
                : 'Invoices'}
          </h2>
          <div className="dashboard-controls">
            <div className="search-container">
              <FiSearch className="search-icon" />
              <input 
                type="text" 
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Sort dropdown */}
            <div className="sort-container" style={{ position: 'relative' }}>
              <button 
                className="btn-sort" 
                onClick={toggleSortOptions}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  padding: '8px 12px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                {getSortLabel()} <FiChevronDown />
              </button>
              
              {showSortOptions && (
                <div 
                  className="sort-options" 
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: '0',
                    width: '200px',
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    zIndex: 10,
                    marginTop: '5px'
                  }}
                >
                  <div className="sort-option-group" style={{ padding: '10px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Sort by:</div>
                    {['date', 'name', 'amount', 'status'].map(field => (
                      <div 
                        key={field}
                        className={`sort-option ${sortField === field ? 'active' : ''}`}
                        onClick={() => handleSortChange(field)}
                        style={{
                          padding: '8px 10px',
                          cursor: 'pointer',
                          backgroundColor: sortField === field ? 'var(--primary-color-light)' : 'transparent',
                          borderRadius: '4px',
                          margin: '2px 0',
                          display: 'flex',
                          justifyContent: 'space-between'
                        }}
                      >
                        <span>{field === 'date' ? 'Date' : 
                               field === 'name' ? 'Company Name' : 
                               field === 'amount' ? 'Amount' : 'Status'}</span>
                        {sortField === field && (
                          <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="sort-direction-group" style={{ padding: '10px', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Direction:</div>
                    <div 
                      className={`sort-option ${sortDirection === 'asc' ? 'active' : ''}`}
                      onClick={() => setSortDirection('asc')}
                      style={{
                        padding: '8px 10px',
                        cursor: 'pointer',
                        backgroundColor: sortDirection === 'asc' ? 'var(--primary-color-light)' : 'transparent',
                        borderRadius: '4px',
                        margin: '2px 0'
                      }}
                    >
                      Ascending (A-Z, 0-9)
                    </div>
                    <div 
                      className={`sort-option ${sortDirection === 'desc' ? 'active' : ''}`}
                      onClick={() => setSortDirection('desc')}
                      style={{
                        padding: '8px 10px',
                        cursor: 'pointer',
                        backgroundColor: sortDirection === 'desc' ? 'var(--primary-color-light)' : 'transparent',
                        borderRadius: '4px',
                        margin: '2px 0'
                      }}
                    >
                      Descending (Z-A, 9-0)
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <button className="btn-create" onClick={handleCreateInvoice}>
              Create New Invoice
            </button>
          </div>
        </header>
        
        {/* Invoice List */}
        <div className="invoice-list">
          {/* Generate sample invoices and apply sorting */}
          {sortInvoices(Array.from({ length: 10 }).map((_, i) => i))
            .filter(index => {
              // If a company is selected, only show invoices for that company
              const invoiceCompany = sampleCompanies[index % sampleCompanies.length];
              
              if (!showAllInvoices && selectedCompany && invoiceCompany.id !== selectedCompany.id) {
                return false;
              }
              
              // Filter by search term if provided
              const invoiceNumber = `2025-${1000 + index}`;
              if (searchTerm && !invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) && 
                  !invoiceCompany.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false;
              }
              
              return true;
            })
            .map(index => {
              const invoiceCompany = sampleCompanies[index % sampleCompanies.length];
              const invoiceNumber = `2025-${1000 + index}`;
              const invoiceDate = new Date(2025, 3, 1 + index);
              const invoiceAmount = 2500 + (index * 100);
              const invoiceStatus = index % 2 === 0 ? 'Paid' : 'Pending';
              
              return (
                <div key={index} className="invoice-card" onClick={() => navigate(`/invoice/${1000 + index}`)}>
                  <div className="invoice-card-header">
                    <img 
                      src={invoiceCompany.logo} 
                      alt={invoiceCompany.name} 
                      className="invoice-company-logo"
                    />
                    <div className="invoice-info">
                      <span className="invoice-number">{invoiceNumber}</span>
                      <span className="invoice-company">{invoiceCompany.name}</span>
                    </div>
                  </div>
                  <div className="invoice-card-details">
                    <div className="invoice-amount">
                      <span className="amount">${invoiceAmount.toLocaleString()}</span>
                      <span className="currency">USD</span>
                    </div>
                    <div className="invoice-date">
                      <span className="label">Date:</span>
                      <span className="value">{invoiceDate.toLocaleDateString()}</span>
                    </div>
                    <div className="invoice-status">
                      <span className={`status ${invoiceStatus.toLowerCase()}`}>
                        {invoiceStatus}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          
          {/* Show message if no invoices match the filter */}
          {sortInvoices(Array.from({ length: 10 }).map((_, i) => i))
            .filter(index => {
              const invoiceCompany = sampleCompanies[index % sampleCompanies.length];
              const invoiceNumber = `2025-${1000 + index}`;
              
              if (!showAllInvoices && selectedCompany && invoiceCompany.id !== selectedCompany.id) {
                return false;
              }
              
              if (searchTerm && !invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) && 
                  !invoiceCompany.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false;
              }
              
              return true;
            }).length === 0 && (
            <div className="no-invoices-message">
              <p>No invoices found with the current filter.</p>
              <button className="btn-clear-filter" onClick={() => setSearchTerm('')}>
                Clear Search
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;