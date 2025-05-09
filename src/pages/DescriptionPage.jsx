// DescriptionPage.jsx - Dedicated page for service description management
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiTrash2, FiPlus, FiSun, FiMoon } from 'react-icons/fi';
import './ClientPage.css'; // Reuse ClientPage styling
import { storage } from '../utils/storage';

const DescriptionPage = ({ darkMode, toggleDarkMode }) => {
  // Add a ref to track if we're dispatching our own events
  const isSelfDispatch = React.useRef(false);

  const [descriptions, setDescriptions] = useState([]);

  useEffect(() => {
    (async () => {
      let savedDescriptions = await storage.get('serviceDescriptions');
      if (!savedDescriptions) {
        // If not found, set default descriptions
        const defaultDescriptions = [
          { id: 1, text: 'Preparation and filing of US Federal Income Tax Return (Form 1120)' },
          { id: 2, text: 'Foreign related party disclosure form with respect to a foreign subsidiary (Form 5417)' },
          { id: 3, text: 'Foreign related party disclosure form with respect to a foreign shareholders (Form 5472)' },
          { id: 4, text: 'Application for Automatic Extension of Time To File Business Income Tax (Form 7004)' }
        ];
        await storage.set('serviceDescriptions', defaultDescriptions);
        savedDescriptions = defaultDescriptions;
      }
      setDescriptions(savedDescriptions);
    })();
  }, []);

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
  
  const handleDeleteDescription = async (id) => {
    if (window.confirm('Are you sure you want to delete this description?')) {
      const updatedDescriptions = descriptions.filter(desc => desc.id !== id);
      setDescriptions(updatedDescriptions);
      await storage.set('serviceDescriptions', updatedDescriptions);
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
  
  const handleSaveDescription = async () => {
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
    await storage.set('serviceDescriptions', updatedDescriptions);
    
    // Set the flag to indicate we're dispatching our own event
    isSelfDispatch.current = true;
    
    // Dispatch a custom event with updated description data
    const updatedDescription = isEditing 
      ? { ...newDescription, id: activeDescriptionId } 
      : { ...newDescription, id: Math.max(0, ...descriptions.map(d => d.id)) + 1 };
    
    window.dispatchEvent(new CustomEvent('descriptionUpdated', {
      detail: { description: updatedDescription, action: isEditing ? 'edit' : 'add' }
    }));
    
    // Reset the flag after a short delay to ensure the event handler has time to check it
    setTimeout(() => {
      isSelfDispatch.current = false;
    }, 100);
    
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
      // Make sure we're only responding to descriptionUpdated events
      if (event.type !== 'descriptionUpdated') return;
      
      // Skip processing if we dispatched this event ourselves
      if (isSelfDispatch.current) return;
      
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