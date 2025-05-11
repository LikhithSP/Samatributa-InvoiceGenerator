import React, { useState, useEffect, useContext } from 'react';
import { supabase } from '../services/supabaseClient'; // Direct Supabase client for potential specific needs
import { getClients, addClient, updateClient, deleteClient } from '../services/database'; // Specific client functions
import useAuth from '../hooks/useAuth';
import { NotificationContext } from '../context/NotificationContext';
import './ClientPage.css'; // Ensure styles are appropriate

// Modal component (basic example, replace with your actual Modal component if different)
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

const ClientPage = () => {
  const { user } = useAuth();
  const { addNotification } = useContext(NotificationContext);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState(null); // For editing
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    // user_id will be set automatically if your RLS/database policies require it based on auth
  });

  const fetchClients = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await getClients(user.id); // Pass user.id if clients are user-specific
      setClients(data);
    } catch (error) {
      addNotification('Failed to fetch clients: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user]); // Refetch if user changes

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetFormData = () => {
    setFormData({ name: '', email: '', phone: '', address: '' });
    setCurrentClient(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      addNotification('You must be logged in to manage clients.', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const clientData = { ...formData };
      // If your Supabase table for clients has a user_id column and RLS policies
      // that require it, ensure your 'addClient' and 'updateClient' functions
      // or Supabase policies handle associating the client with the user.id.
      // For example, you might pass user.id to addClient:
      // await addClient({ ...clientData, user_id: user.id });
      // Or, rely on RLS policies and database defaults: `auth.uid()`

      if (currentClient) { // Editing existing client
        await updateClient(currentClient.id, clientData);
        addNotification('Client updated successfully!', 'success');
      } else { // Adding new client
        // Pass user.id if your addClient function or Supabase policies expect it for associating the client with the user
        await addClient(clientData, user.id); 
        addNotification('Client added successfully!', 'success');
      }
      fetchClients(); // Refresh list
      setIsModalOpen(false);
      resetFormData();
    } catch (error) {
      addNotification('Error saving client: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (client) => {
    setCurrentClient(client);
    setFormData({
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (clientId) => {
    if (!window.confirm('Are you sure you want to delete this client?')) return;
    setIsLoading(true);
    try {
      await deleteClient(clientId);
      addNotification('Client deleted successfully!', 'success');
      fetchClients(); // Refresh list
    } catch (error) {
      addNotification('Error deleting client: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const openAddModal = () => {
    resetFormData();
    setIsModalOpen(true);
  };

  if (isLoading && clients.length === 0) { // Show loading only on initial load
    return <div className="loading-indicator">Loading clients...</div>;
  }

  return (
    <div className="client-page-container">
      <h2>Manage Clients</h2>
      <button onClick={openAddModal} className="add-client-button" disabled={isLoading}>
        Add New Client
      </button>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h3>{currentClient ? 'Edit Client' : 'Add New Client'}</h3>
        <form onSubmit={handleSubmit} className="client-form">
          <div className="form-group">
            <label htmlFor="name">Name:</label>
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
          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? 'Saving...' : (currentClient ? 'Update Client' : 'Add Client')}
          </button>
        </form>
      </Modal>

      {isLoading && clients.length > 0 && <p>Updating client list...</p>} {/* Show this if loading but clients are already there */}
      
      {!isLoading && clients.length === 0 && (
        <p>No clients found. Add one to get started!</p>
      )}

      <div className="clients-list">
        {clients.map(client => (
          <div key={client.id} className="client-card">
            <h4>{client.name}</h4>
            <p>{client.email}</p>
            <p>{client.phone}</p>
            <p>{client.address}</p>
            <div className="client-actions">
              <button onClick={() => handleEdit(client)} disabled={isLoading}>Edit</button>
              <button onClick={() => handleDelete(client.id)} disabled={isLoading} className="delete-button">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClientPage;