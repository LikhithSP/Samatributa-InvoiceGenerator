// ClientPage.jsx - Dedicated page for client management
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiUpload, FiTrash2, FiPlus, FiSun, FiMoon } from 'react-icons/fi';
import './ClientPage.css';

const ClientPage = ({ darkMode, toggleDarkMode }) => {
  // Add a ref to track if we're dispatching our own events
  const isSelfDispatch = React.useRef(false);
  
  // Get clients from localStorage or use sample data
  const [clients, setClients] = useState(() => {
    const savedClients = localStorage.getItem('userClients');
    if (savedClients) {
      return JSON.parse(savedClients);
    }
    // Default sample clients if none exist - REMOVED
    return []; // Initialize with an empty array
  });

  const [activeClientId, setActiveClientId] = useState(null);
  const [newClient, setNewClient] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    gstin: '',
    pan: ''
  });
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const handleClientChange = (e) => {
    const { name, value } = e.target;
    setNewClient({
      ...newClient,
      [name]: value
    });
  };
  
  const handleEditClient = (id) => {
    setActiveClientId(id);
    const clientToEdit = clients.find(client => client.id === id);
    setNewClient(clientToEdit);
    setIsAddingClient(true);
  };
  
  const handleDeleteClient = (id) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      // Update the clients list
      const updatedClients = clients.filter(client => client.id !== id);
      setClients(updatedClients);
      localStorage.setItem('userClients', JSON.stringify(updatedClients));
      
      // Dispatch event to notify other components about the client changes
      window.dispatchEvent(new Event('clientsUpdated'));
    }
  };
  
  const handleAddClient = () => {
    setIsAddingClient(true);
    setActiveClientId(null);
    setNewClient({
      name: '',
      address: '',
      phone: '',
      email: '',
      website: '',
      gstin: '',
      pan: ''
    });
  };
  
  const handleSaveClient = () => {
    if (!newClient.name) {
      alert('Client name is required');
      return;
    }
    
    let updatedClients;
    const isEditing = activeClientId !== null;
    
    if (isEditing) {
      // Edit existing client
      updatedClients = clients.map(client => 
        client.id === activeClientId ? { ...newClient, id: activeClientId } : client
      );
    } else {
      // Add new client
      const newId = Math.max(0, ...clients.map(c => c.id)) + 1;
      updatedClients = [...clients, { ...newClient, id: newId }];
    }
    
    setClients(updatedClients);
    localStorage.setItem('userClients', JSON.stringify(updatedClients));
    
    // Set the flag to indicate we're dispatching our own event
    isSelfDispatch.current = true;
    
    // Dispatch a custom event with updated client data
    const updatedClient = isEditing 
      ? { ...newClient, id: activeClientId } 
      : { ...newClient, id: Math.max(0, ...clients.map(c => c.id)) + 1 };
    
    window.dispatchEvent(new CustomEvent('clientUpdated', {
      detail: { client: updatedClient, action: isEditing ? 'edit' : 'add' }
    }));
    
    // Reset the flag after a short delay to ensure the event handler has time to check it
    setTimeout(() => {
      isSelfDispatch.current = false;
    }, 100);
    
    setIsAddingClient(false);
    
    // Show success message
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };
  
  const handleCancelClientEdit = () => {
    setIsAddingClient(false);
  };

  useEffect(() => {
    // Listen for client updates from other components/tabs
    const handleClientUpdated = (event) => {
      // Make sure we're only responding to clientUpdated events
      if (event.type !== 'clientUpdated') return;
      
      // Skip processing if we dispatched this event ourselves
      if (isSelfDispatch.current) return;
      
      if (event.detail && event.detail.client) {
        const { client, action } = event.detail;
        
        if (action === 'add') {
          setClients(prev => [...prev, client]);
        } else if (action === 'edit') {
          setClients(prev => prev.map(c => c.id === client.id ? client : c));
        }
      }
    };
    
    window.addEventListener('clientUpdated', handleClientUpdated);
    
    return () => {
      window.removeEventListener('clientUpdated', handleClientUpdated);
    };
  }, []);
  
  return (
    <div className="client-container">
      <Link to="/dashboard" className="client-back-btn">
        <FiArrowLeft /> Back to Dashboard
      </Link>
      
      <div className="client-header">
        <h1>Client Management</h1>
        <p>Manage your clients for invoicing</p>
      </div>
      
      <button className="btn-toggle-theme" onClick={toggleDarkMode} title="Toggle Dark Mode">
        {darkMode ? <FiSun /> : <FiMoon />}
      </button>
      
      {!isAddingClient ? (
        <div className="clients-section">
          <div className="section-header">
            <h3>My Clients</h3>
            <button className="btn-add" onClick={handleAddClient}>
              <FiPlus /> Add Client
            </button>
          </div>
          
          <div className="clients-list">
            {clients.map(client => (
              <div key={client.id} className="client-card">
                <div className="client-card-header">
                  <div className="client-info">
                    <h4>{client.name}</h4>
                    {client.gstin && <p className="client-gstin">GSTIN: {client.gstin}</p>}
                  </div>
                </div>
                <div className="client-details">
                  {client.address && <p><strong>Address:</strong> {client.address}</p>}
                  {client.phone && <p><strong>Phone:</strong> {client.phone}</p>}
                  {client.email && <p><strong>Email:</strong> {client.email}</p>}
                  {client.website && <p><strong>Website:</strong> {client.website}</p>}
                  {client.pan && <p><strong>PAN:</strong> {client.pan}</p>}
                </div>
                <div className="client-actions">
                  <button className="btn-icon" onClick={() => handleEditClient(client.id)} title="Edit">
                    <FiSave />
                  </button>
                  <button className="btn-icon danger" onClick={() => handleDeleteClient(client.id)} title="Delete">
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
            
            {clients.length === 0 && (
              <div className="no-clients">
                <p>You haven't added any clients yet.</p>
                <button className="btn" onClick={handleAddClient}>
                  <FiPlus /> Add Your First Client
                </button>
              </div>
            )}
          </div>
          
          {saveSuccess && (
            <div className="success-message">
              Client information updated successfully!
            </div>
          )}
        </div>
      ) : (
        <div className="client-form">
          <h3>{activeClientId !== null ? 'Edit Client' : 'Add New Client'}</h3>
          
          <div className="form-group">
            <label htmlFor="clientName">Client Name*</label>
            <input
              type="text"
              id="clientName"
              name="name"
              value={newClient.name}
              onChange={handleClientChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="clientAddress">Address</label>
            <textarea
              id="clientAddress"
              name="address"
              value={newClient.address}
              onChange={handleClientChange}
              rows={3}
            ></textarea>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="clientPhone">Phone Number</label>
              <input
                type="text"
                id="clientPhone"
                name="phone"
                value={newClient.phone}
                onChange={handleClientChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="clientEmail">Email</label>
              <input
                type="email"
                id="clientEmail"
                name="email"
                value={newClient.email}
                onChange={handleClientChange}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="clientWebsite">Website</label>
            <input
              type="text"
              id="clientWebsite"
              name="website"
              value={newClient.website}
              onChange={handleClientChange}
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="clientGstin">GSTIN</label>
              <input
                type="text"
                id="clientGstin"
                name="gstin"
                value={newClient.gstin}
                onChange={handleClientChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="clientPan">PAN</label>
              <input
                type="text"
                id="clientPan"
                name="pan"
                value={newClient.pan}
                onChange={handleClientChange}
              />
            </div>
          </div>
          
          <div className="client-form-actions">
            <button type="button" className="btn btn-secondary" onClick={handleCancelClientEdit}>
              Cancel
            </button>
            <button type="button" className="btn" onClick={handleSaveClient}>
              {activeClientId !== null ? 'Update Client' : 'Add Client'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientPage;