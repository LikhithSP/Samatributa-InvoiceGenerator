import React, { useState, useEffect, useContext } from 'react';
import { supabase } from '../services/supabaseClient'; // Direct Supabase client
import { getCompanies, addCompany, updateCompany, deleteCompany } from '../services/database';
import useAuth from '../hooks/useAuth';
import { NotificationContext } from '../context/NotificationContext';
import './CompanyPage.css'; // Ensure styles are appropriate

// Basic Modal component (replace with your actual Modal component if different)
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {children}
        <button onClick={onClose} className="modal-close-button">Close</button>
      </div>
    </div>
  );
};

const CompanyPage = () => {
  const { user } = useAuth();
  const { addNotification } = useContext(NotificationContext);
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCompany, setCurrentCompany] = useState(null); // For editing
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    logo_url: '', // For Supabase Storage URL
    // user_id will be handled by RLS or explicitly if needed
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);


  const fetchCompanies = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // Assuming getCompanies might take userId if companies are user-specific
      const data = await getCompanies(user.id); 
      setCompanies(data);
    } catch (error) {
      addNotification('Failed to fetch companies: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCompanies();
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetFormData = () => {
    setFormData({ name: '', address: '', phone: '', email: '', logo_url: '' });
    setCurrentCompany(null);
    setUploadingLogo(false);
  };

  const handleLogoUpload = async (event) => {
    if (!event.target.files || event.target.files.length === 0) return;
    if (!user) {
        addNotification('User not found for logo upload.', 'error');
        return;
    }

    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    // Unique filename: company_logo_user_<user_id>_timestamp
    const fileName = `company_logo_user_${user.id}_${Date.now()}.${fileExt}`;
    const filePath = `company-logos/${fileName}`; // Define a folder in your bucket

    setUploadingLogo(true);
    try {
      // Check if there's an old logo URL and if it's a Supabase storage URL
      if (currentCompany && currentCompany.logo_url && currentCompany.logo_url.includes(supabase.storage.url)) {
        const oldLogoPath = currentCompany.logo_url.substring(currentCompany.logo_url.lastIndexOf('company-logos/'));
        if (oldLogoPath && oldLogoPath !== filePath) { // Don't remove if it's the same path (upsert handles this)
            await supabase.storage.from('company-assets').remove([oldLogoPath]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('company-assets') // Bucket for company logos, ensure it exists and has policies
        .upload(filePath, file, { upsert: true }); // upsert:true will overwrite if file with same path exists

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('company-assets').getPublicUrl(filePath);
      if (!data.publicUrl) throw new Error("Could not get public URL for logo.");
      
      setFormData(prev => ({ ...prev, logo_url: data.publicUrl }));
      addNotification('Logo uploaded successfully!', 'success');

    } catch (error) {
      addNotification('Error uploading logo: ' + error.message, 'error');
      console.error("Logo upload error:", error);
    } finally {
      setUploadingLogo(false);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      addNotification('You must be logged in.', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const companyData = { ...formData };
      // Ensure user_id is associated if your RLS/database policies require it.
      // Example: const dataToSave = { ...companyData, user_id: user.id };

      if (currentCompany) {
        await updateCompany(currentCompany.id, companyData);
        addNotification('Company updated successfully!', 'success');
      } else {
        // If logo_url is part of the companyData, it's saved here.
        // Pass user.id if your addCompany function or Supabase policies expect it
        await addCompany(companyData, user.id); 
        addNotification('Company added successfully!', 'success');
      }
      fetchCompanies();
      setIsModalOpen(false);
      resetFormData();
    } catch (error) {
      addNotification('Error saving company: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (company) => {
    setCurrentCompany(company);
    setFormData({
      name: company.name || '',
      address: company.address || '',
      phone: company.phone || '',
      email: company.email || '',
      logo_url: company.logo_url || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (companyId) => {
    if (!window.confirm('Are you sure you want to delete this company? This might affect associated invoices.')) return;
    
    const companyToDelete = companies.find(c => c.id === companyId);
    setIsLoading(true);
    try {
      // Delete company record from database
      await deleteCompany(companyId);

      // If company had a logo, delete it from Supabase Storage
      if (companyToDelete && companyToDelete.logo_url && companyToDelete.logo_url.includes(supabase.storage.url)) {
        // Extract the path from the public URL. This needs to be robust.
        // Example: publicUrl = "https://<project-ref>.supabase.co/storage/v1/object/public/company-assets/company-logos/some-file.png"
        // path = "company-logos/some-file.png"
        const urlParts = companyToDelete.logo_url.split('/company-assets/');
        if (urlParts.length > 1) {
            const logoPath = 'company-logos/' + urlParts[1].substring(urlParts[1].indexOf('company-logos/') + 'company-logos/'.length);
            if(logoPath && logoPath.startsWith('company-logos/')) { // Basic check
                await supabase.storage.from('company-assets').remove([logoPath]);
                addNotification('Company logo deleted from storage.', 'info');
            }
        } else {
            console.warn('Could not determine logo path for deletion:', companyToDelete.logo_url);
        }
      }

      addNotification('Company deleted successfully!', 'success');
      fetchCompanies();
    } catch (error) {
      addNotification('Error deleting company: ' + error.message, 'error');
      console.error("Delete company error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const openAddModal = () => {
    resetFormData();
    setIsModalOpen(true);
  };


  if (isLoading && companies.length === 0) {
    return <div className="loading-indicator">Loading companies...</div>;
  }

  return (
    <div className="company-page-container">
      <h2>Manage Companies</h2>
      <button onClick={openAddModal} className="add-company-button" disabled={isLoading || uploadingLogo}>
        Add New Company
      </button>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h3>{currentCompany ? 'Edit Company' : 'Add New Company'}</h3>
        <form onSubmit={handleSubmit} className="company-form">
          <div className="form-group">
            <label htmlFor="name">Company Name:</label>
            <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} />
          </div>
          <div className="form-group">
            <label htmlFor="phone">Phone:</label>
            <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} />
          </div>
          <div className="form-group">
            <label htmlFor="address">Address:</label>
            <textarea id="address" name="address" value={formData.address} onChange={handleInputChange}></textarea>
          </div>
          <div className="form-group">
            <label htmlFor="logo-upload">Logo:</label>
            <input 
              type="file" 
              id="logo-upload" 
              accept="image/*" 
              onChange={handleLogoUpload} 
              disabled={uploadingLogo || isLoading}
            />
            {uploadingLogo && <p>Uploading logo...</p>}
            {formData.logo_url && (
              <div className="logo-preview-container">
                <p>Current Logo:</p>
                <img src={formData.logo_url} alt="Company Logo" style={{ maxWidth: '100px', maxHeight: '100px', marginTop: '10px' }} />
              </div>
            )}
          </div>
          <button type="submit" className="submit-button" disabled={isLoading || uploadingLogo}>
            {isLoading ? 'Saving...' : (currentCompany ? 'Update Company' : 'Add Company')}
          </button>
        </form>
      </Modal>

      {isLoading && companies.length > 0 && <p>Updating company list...</p>}
      {!isLoading && companies.length === 0 && (
        <p>No companies found. Add one to get started!</p>
      )}

      <div className="companies-list">
        {companies.map(company => (
          <div key={company.id} className="company-card">
            {company.logo_url && <img src={company.logo_url} alt={`${company.name} logo`} className="company-logo-thumbnail" />}
            <h4>{company.name}</h4>
            <p>{company.email}</p>
            <p>{company.phone}</p>
            <p>{company.address}</p>
            <div className="company-actions">
              <button onClick={() => handleEdit(company)} disabled={isLoading || uploadingLogo}>Edit</button>
              <button onClick={() => handleDelete(company.id)} disabled={isLoading || uploadingLogo} className="delete-button">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompanyPage;