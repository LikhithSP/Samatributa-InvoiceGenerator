// CompanyPage.jsx - Dedicated page for company management
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiUpload, FiTrash2, FiPlus, FiSun, FiMoon } from 'react-icons/fi';
import { defaultLogo } from '../assets/logoData';
import './CompanyPage.css';

const CompanyPage = ({ darkMode, toggleDarkMode }) => {
  // Get companies from localStorage or use sample data
  const [companies, setCompanies] = useState(() => {
    const savedCompanies = localStorage.getItem('userCompanies');
    if (savedCompanies) {
      return JSON.parse(savedCompanies);
    }
    // Default sample companies if none exist
    return [
      { 
        id: 1, 
        name: 'Acme Corporation', 
        logo: './images/default-logo.png',
        address: '123 Corporate Ave, Business District',
        gstin: 'GST1234567890ABC',
        bankDetails: {
          accountName: 'Acme Corp Ltd.',
          bankName: 'First National Bank',
          accountNumber: '1234567890',
          ifscCode: 'FNBK0001234'
        }
      },
      { 
        id: 2, 
        name: 'Globex Industries', 
        logo: './images/c-logo.png',
        address: '456 Tech Park, Innovation Valley',
        gstin: 'GST9876543210XYZ',
        bankDetails: {
          accountName: 'Globex Industries Inc.',
          bankName: 'Global Banking Corp',
          accountNumber: '9876543210',
          ifscCode: 'GBCI0005678'
        }
      }
    ];
  });
  
  const [activeCompanyId, setActiveCompanyId] = useState(null);
  const [newCompany, setNewCompany] = useState({
    name: '',
    logo: defaultLogo,
    address: '',
    gstin: '',
    bankDetails: {
      accountName: '',
      bankName: '',
      accountNumber: '',
      ifscCode: ''
    }
  });
  const [isAddingCompany, setIsAddingCompany] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const handleCompanyChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('bankDetails.')) {
      const bankField = name.split('.')[1];
      setNewCompany({
        ...newCompany,
        bankDetails: {
          ...newCompany.bankDetails,
          [bankField]: value
        }
      });
    } else {
      setNewCompany({
        ...newCompany,
        [name]: value
      });
    }
  };
  
  const handleEditCompany = (id) => {
    setActiveCompanyId(id);
    const companyToEdit = companies.find(company => company.id === id);
    setNewCompany(companyToEdit);
    setIsAddingCompany(true);
  };
  
  const handleDeleteCompany = (id) => {
    if (window.confirm('Are you sure you want to delete this company?')) {
      const updatedCompanies = companies.filter(company => company.id !== id);
      setCompanies(updatedCompanies);
      localStorage.setItem('userCompanies', JSON.stringify(updatedCompanies));
      
      // If the deleted company was selected in localStorage, clear it
      const selectedCompany = localStorage.getItem('selectedCompany');
      if (selectedCompany) {
        const parsed = JSON.parse(selectedCompany);
        if (parsed.id === id) {
          localStorage.removeItem('selectedCompany');
        }
      }
    }
  };
  
  const handleLogoChange = (e) => {
    // In a real app, this would handle file uploads.
    // For this demo, we'll just alternate between some sample logos
    const logos = [
      './images/default-logo.png',
      './images/c-logo.png',
      './images/favicon.png',
      defaultLogo
    ];
    
    const currentIndex = logos.indexOf(newCompany.logo);
    const nextIndex = (currentIndex + 1) % logos.length;
    
    setNewCompany({
      ...newCompany,
      logo: logos[nextIndex]
    });
  };
  
  const handleAddCompany = () => {
    setIsAddingCompany(true);
    setActiveCompanyId(null);
    setNewCompany({
      name: '',
      logo: defaultLogo,
      address: '',
      gstin: '',
      bankDetails: {
        accountName: '',
        bankName: '',
        accountNumber: '',
        ifscCode: ''
      }
    });
  };
  
  const handleSaveCompany = () => {
    if (!newCompany.name) {
      alert('Company name is required');
      return;
    }
    
    let updatedCompanies;
    
    if (activeCompanyId !== null) {
      // Edit existing company
      updatedCompanies = companies.map(company => 
        company.id === activeCompanyId ? { ...newCompany, id: activeCompanyId } : company
      );
    } else {
      // Add new company
      const newId = Math.max(0, ...companies.map(c => c.id)) + 1;
      updatedCompanies = [...companies, { ...newCompany, id: newId }];
    }
    
    setCompanies(updatedCompanies);
    localStorage.setItem('userCompanies', JSON.stringify(updatedCompanies));
    setIsAddingCompany(false);
    
    // Show success message
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };
  
  const handleCancelCompanyEdit = () => {
    setIsAddingCompany(false);
  };
  
  return (
    <div className="company-container">
      <Link to="/dashboard" className="company-back-btn">
        <FiArrowLeft /> Back to Dashboard
      </Link>
      
      <div className="company-header">
        <h1>Company Management</h1>
        <p>Manage your companies for invoicing</p>
      </div>
      
      <button className="btn-toggle-theme" onClick={toggleDarkMode} title="Toggle Dark Mode">
        {darkMode ? <FiSun /> : <FiMoon />}
      </button>
      
      {!isAddingCompany ? (
        <div className="companies-section">
          <div className="section-header">
            <h3>My Companies</h3>
            <button className="btn-add" onClick={handleAddCompany}>
              <FiPlus /> Add Company
            </button>
          </div>
          
          <div className="companies-list">
            {companies.map(company => (
              <div key={company.id} className="company-card">
                <div className="company-card-header">
                  <img src={company.logo} alt={company.name} className="company-logo" />
                  <div className="company-info">
                    <h4>{company.name}</h4>
                    <p className="company-gstin">{company.gstin}</p>
                  </div>
                </div>
                <div className="company-address">
                  <p>{company.address}</p>
                </div>
                <div className="company-actions">
                  <button className="btn-icon" onClick={() => handleEditCompany(company.id)} title="Edit">
                    <FiSave />
                  </button>
                  <button className="btn-icon danger" onClick={() => handleDeleteCompany(company.id)} title="Delete">
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
            
            {companies.length === 0 && (
              <div className="no-companies">
                <p>You haven't added any companies yet.</p>
                <button className="btn" onClick={handleAddCompany}>
                  <FiPlus /> Add Your First Company
                </button>
              </div>
            )}
          </div>
          
          {saveSuccess && (
            <div className="success-message">
              Company information updated successfully!
            </div>
          )}
        </div>
      ) : (
        <div className="company-form">
          <h3>{activeCompanyId !== null ? 'Edit Company' : 'Add New Company'}</h3>
          
          <div className="logo-upload-section">
            <img src={newCompany.logo} alt="Company Logo" className="company-logo-preview" />
            <button type="button" className="btn-upload" onClick={handleLogoChange}>
              <FiUpload /> Change Logo
            </button>
            <small>(For demo: clicking cycles through sample logos)</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="companyName">Company Name*</label>
            <input
              type="text"
              id="companyName"
              name="name"
              value={newCompany.name}
              onChange={handleCompanyChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="companyAddress">Address</label>
            <textarea
              id="companyAddress"
              name="address"
              value={newCompany.address}
              onChange={handleCompanyChange}
              rows={3}
            ></textarea>
          </div>
          
          <div className="form-group">
            <label htmlFor="companyGstin">GSTIN</label>
            <input
              type="text"
              id="companyGstin"
              name="gstin"
              value={newCompany.gstin}
              onChange={handleCompanyChange}
            />
          </div>
          
          <div className="company-bank-details">
            <h4>Bank Details</h4>
            
            <div className="form-group">
              <label htmlFor="bankName">Bank Name</label>
              <input
                type="text"
                id="bankName"
                name="bankDetails.bankName"
                value={newCompany.bankDetails.bankName}
                onChange={handleCompanyChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="accountName">Account Name</label>
              <input
                type="text"
                id="accountName"
                name="bankDetails.accountName"
                value={newCompany.bankDetails.accountName}
                onChange={handleCompanyChange}
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="accountNumber">Account Number</label>
                <input
                  type="text"
                  id="accountNumber"
                  name="bankDetails.accountNumber"
                  value={newCompany.bankDetails.accountNumber}
                  onChange={handleCompanyChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="ifscCode">IFSC Code</label>
                <input
                  type="text"
                  id="ifscCode"
                  name="bankDetails.ifscCode"
                  value={newCompany.bankDetails.ifscCode}
                  onChange={handleCompanyChange}
                />
              </div>
            </div>
          </div>
          
          <div className="company-form-actions">
            <button type="button" className="btn btn-secondary" onClick={handleCancelCompanyEdit}>
              Cancel
            </button>
            <button type="button" className="btn" onClick={handleSaveCompany}>
              {activeCompanyId !== null ? 'Update Company' : 'Add Company'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyPage;