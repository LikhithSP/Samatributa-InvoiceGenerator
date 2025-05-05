// DescriptionPage.jsx - Dedicated page for service description management
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiTrash2, FiPlus, FiSun, FiMoon } from 'react-icons/fi';
import './ClientPage.css'; // Reuse ClientPage styling

const DescriptionPage = ({ darkMode, toggleDarkMode }) => {
  // Get descriptions from localStorage or use sample data
  const [descriptions, setDescriptions] = useState(() => {
    const savedDescriptions = localStorage.getItem('serviceDescriptions');
    if (savedDescriptions) {
      return JSON.parse(savedDescriptions);
    }
    // Default sample descriptions if none exist
    const defaultDescriptions = [
      { 
        id: 1, 
        text: 'US Federal Corporation Income Tax Return (Form 1120)' 
      },
      { 
        id: 2, 
        text: 'Foreign related party disclosure form with respect to a foreign subsidiary (Form 5417)' 
      },
      { 
        id: 3,
        text: 'Foreign related party disclosure form with respect to a foreign shareholders (Form 5472)'
      },
      {
        id: 4,
        text: 'Application for Automatic Extension of Time To File Business Income Tax (Form 7004)'
      }
    ];
    
    // Save the default descriptions to localStorage immediately
    localStorage.setItem('serviceDescriptions', JSON.stringify(defaultDescriptions));
    
    return defaultDescriptions;
  });

  const [activeDescriptionId, setActiveDescriptionId] = useState(null);
  const [newDescription, setNewDescription] = useState({
    text: ''
  });
  const [isAddingDescription, setIsAddingDescription] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleDescriptionChange = (e) => {
    const { value } = e.target;
    setNewDescription({
      ...newDescription,
      text: value
    });
  };
  
  const handleEditDescription = (id) => {
    setActiveDescriptionId(id);
    const descriptionToEdit = descriptions.find(desc => desc.id === id);
    setNewDescription(descriptionToEdit);
    setIsAddingDescription(true);
  };
  
  const handleDeleteDescription = (id) => {
    if (window.confirm('Are you sure you want to delete this description?')) {
      // Update the descriptions list
      const updatedDescriptions = descriptions.filter(desc => desc.id !== id);
      setDescriptions(updatedDescriptions);
      localStorage.setItem('serviceDescriptions', JSON.stringify(updatedDescriptions));
      
      // Dispatch event to notify other components about the description changes
      window.dispatchEvent(new Event('descriptionsUpdated'));
    }
  };
  
  const handleAddDescription = () => {
    setIsAddingDescription(true);
    setActiveDescriptionId(null);
    setNewDescription({
      text: ''
    });
  };
  
  const handleSaveDescription = () => {
    if (!newDescription.text) {
      alert('Description text is required');
      return;
    }
    
    let updatedDescriptions;
    const isEditing = activeDescriptionId !== null;
    
    if (isEditing) {
      // Edit existing description
      updatedDescriptions = descriptions.map(desc => 
        desc.id === activeDescriptionId ? { ...newDescription, id: activeDescriptionId } : desc
      );
    } else {
      // Add new description
      const newId = Math.max(0, ...descriptions.map(d => d.id)) + 1;
      updatedDescriptions = [...descriptions, { ...newDescription, id: newId }];
    }
    
    setDescriptions(updatedDescriptions);
    localStorage.setItem('serviceDescriptions', JSON.stringify(updatedDescriptions));
    
    // Dispatch a custom event with updated description data
    const updatedDescription = isEditing 
      ? { ...newDescription, id: activeDescriptionId } 
      : { ...newDescription, id: Math.max(0, ...descriptions.map(d => d.id)) + 1 };
    
    window.dispatchEvent(new CustomEvent('descriptionUpdated', {
      detail: { description: updatedDescription, action: isEditing ? 'edit' : 'add' }
    }));
    
    setIsAddingDescription(false);
    
    // Show success message
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };
  
  const handleCancelDescriptionEdit = () => {
    setIsAddingDescription(false);
  };

  useEffect(() => {
    // Listen for description updates from other components/tabs
    const handleDescriptionUpdated = (event) => {
      if (event.detail && event.detail.description) {
        const { description, action } = event.detail;
        
        if (action === 'add') {
          setDescriptions(prev => [...prev, description]);
        } else if (action === 'edit') {
          setDescriptions(prev => prev.map(d => d.id === description.id ? description : d));
        }
      }
    };
    
    window.addEventListener('descriptionUpdated', handleDescriptionUpdated);
    
    return () => {
      window.removeEventListener('descriptionUpdated', handleDescriptionUpdated);
    };
  }, []);
  
  return (
    <div className="client-container">
      <Link to="/dashboard" className="client-back-btn">
        <FiArrowLeft /> Back to Dashboard
      </Link>
      
      <div className="client-header">
        <h1>Service Descriptions</h1>
        <p>Manage your service descriptions for invoicing</p>
      </div>
      
      <button className="btn-toggle-theme" onClick={toggleDarkMode} title="Toggle Dark Mode">
        {darkMode ? <FiSun /> : <FiMoon />}
      </button>
      
      {!isAddingDescription ? (
        <div className="clients-section">
          <div className="section-header">
            <h3>My Descriptions</h3>
            <button className="btn-add" onClick={handleAddDescription}>
              <FiPlus /> Add Description
            </button>
          </div>
          
          <div className="clients-list">
            {descriptions.map(description => (
              <div key={description.id} className="client-card">
                <div className="client-card-header">
                  <div className="client-info">
                    <h4>{description.text}</h4>
                  </div>
                </div>
                <div className="client-actions">
                  <button className="btn-icon" onClick={() => handleEditDescription(description.id)} title="Edit">
                    <FiSave />
                  </button>
                  <button className="btn-icon danger" onClick={() => handleDeleteDescription(description.id)} title="Delete">
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
            
            {descriptions.length === 0 && (
              <div className="no-clients">
                <p>You haven't added any service descriptions yet.</p>
                <button className="btn" onClick={handleAddDescription}>
                  <FiPlus /> Add Your First Description
                </button>
              </div>
            )}
          </div>
          
          {saveSuccess && (
            <div className="success-message">
              Description updated successfully!
            </div>
          )}
        </div>
      ) : (
        <div className="client-form">
          <h3>{activeDescriptionId !== null ? 'Edit Description' : 'Add New Description'}</h3>
          
          <div className="form-group">
            <label htmlFor="descriptionText">Description Text*</label>
            <textarea
              id="descriptionText"
              name="text"
              value={newDescription.text}
              onChange={handleDescriptionChange}
              rows={3}
              required
            ></textarea>
          </div>
          
          <div className="client-form-actions">
            <button type="button" className="btn btn-secondary" onClick={handleCancelDescriptionEdit}>
              Cancel
            </button>
            <button type="button" className="btn" onClick={handleSaveDescription}>
              {activeDescriptionId !== null ? 'Update Description' : 'Add Description'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DescriptionPage;