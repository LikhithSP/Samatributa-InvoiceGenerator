import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient'; // Direct client, if needed
import { 
  getInvoices, 
  deleteInvoice,
  // Assuming createInvoiceWithItems and updateInvoiceWithItems will be used within a form/modal component
  // getInvoiceById might be used if navigating to a detailed view or editing
} from '../services/database';
import useAuth from '../hooks/useAuth';
import { NotificationContext } from '../context/NotificationContext';
// import InvoiceForm from '../components/InvoiceForm'; // Assuming you have this for C/U ops
// import InvoicePreview from '../components/InvoicePreview'; // For viewing
import Modal from '../components/Modal'; // Assuming a generic modal

// Styles - ensure these are present or adapt
import './InvoicePage.css'; 

const InvoicePage = () => {
  const { user } = useAuth();
  const { addNotification } = useContext(NotificationContext);
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null); // For view/edit/delete context
  
  // States for managing a Create/Edit Modal if InvoiceForm is used within this page's modal
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null); // Invoice data for the form

  const fetchInvoices = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // Fetch invoices and their items. Adjust `fetchItems` as needed.
      const data = await getInvoices(user.id, true); 
      setInvoices(data);
    } catch (error) {
      addNotification('Failed to fetch invoices: ' + error.message, 'error');
      console.error("Error fetching invoices:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, addNotification]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleAddNewInvoice = () => {
    setEditingInvoice(null); // Clear any existing editing data
    // navigate('/invoices/new'); // Or open a modal form
    setIsFormModalOpen(true); 
  };

  const handleEditInvoice = (invoice) => {
    // navigate(`/invoices/edit/${invoice.id}`); // Or open a modal form
    setEditingInvoice(invoice);
    setIsFormModalOpen(true);
  };
  
  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice); // For a preview modal or navigate
    // Example: navigate(`/invoices/${invoice.id}`);
    // For now, let's assume a simple preview modal might be triggered here
    // This part would need your InvoicePreview component
    addNotification(`Viewing invoice: ${invoice.invoice_number || invoice.id}`, 'info');
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (!window.confirm('Are you sure you want to delete this invoice and its items?')) return;
    setIsLoading(true);
    try {
      await deleteInvoice(invoiceId);
      addNotification('Invoice deleted successfully!', 'success');
      fetchInvoices(); // Refresh the list
    } catch (error) {
      addNotification('Error deleting invoice: ' + error.message, 'error');
      console.error("Error deleting invoice:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // This would be called from InvoiceForm when submitted
  const handleFormSubmitSuccess = () => {
    setIsFormModalOpen(false);
    setEditingInvoice(null);
    fetchInvoices(); // Refresh data
  };

  if (isLoading && invoices.length === 0) {
    return <div className="loading-indicator">Loading invoices...</div>;
  }

  return (
    <div className="invoice-page-container">
      <div className="invoice-page-header">
        <h2>Manage Invoices</h2>
        <button onClick={handleAddNewInvoice} className="add-invoice-button" disabled={isLoading}>
          Add New Invoice
        </button>
      </div>

      {/* Modal for Create/Edit Invoice Form */}
      {isFormModalOpen && (
        <Modal isOpen={isFormModalOpen} onClose={() => { setIsFormModalOpen(false); setEditingInvoice(null); }}>
          {/* 
            Assuming InvoiceForm takes `invoiceToEdit` and `onSuccess` props.
            You'll need to create/refactor InvoiceForm.jsx for Supabase.
          */}
          {/* 
          <InvoiceForm 
            invoiceToEdit={editingInvoice} 
            onSuccess={handleFormSubmitSuccess} 
            userId={user?.id} // Pass user ID for associating invoice
          /> 
          */}
          <p>InvoiceForm component would be here.</p>
          <p>{editingInvoice ? 'Editing: ' + (editingInvoice.invoice_number || editingInvoice.id) : 'Creating New Invoice'}</p>
        </Modal>
      )}
      
      {/* Modal for Viewing Invoice (simplified) */}
      {selectedInvoice && (
         <Modal isOpen={!!selectedInvoice} onClose={() => setSelectedInvoice(null)}>
            <h3>Invoice Preview: {selectedInvoice.invoice_number || selectedInvoice.id}</h3>
            {/* 
              Assuming InvoicePreview takes an `invoice` prop.
              You'll need to create/refactor InvoicePreview.jsx for Supabase.
            */}
            {/* <InvoicePreview invoice={selectedInvoice} /> */}
            <pre>{JSON.stringify(selectedInvoice, null, 2)}</pre>
         </Modal>
      )}

      {isLoading && invoices.length > 0 && <p>Refreshing invoice list...</p>}
      
      {!isLoading && invoices.length === 0 && (
        <p>No invoices found. Click "Add New Invoice" to get started!</p>
      )}

      <div className="invoices-list">
        {invoices.map(invoice => (
          <div key={invoice.id} className="invoice-card">
            <h4>Invoice #{invoice.invoice_number || invoice.id}</h4>
            <p>Client: {invoice.client_id || 'N/A'} {/* Replace with client name if joining */}</p>
            <p>Date: {new Date(invoice.invoice_date || invoice.created_at).toLocaleDateString()}</p>
            <p>Due Date: {new Date(invoice.due_date).toLocaleDateString()}</p>
            <p>Total: {invoice.total_amount} {invoice.currency}</p>
            <p>Status: {invoice.status}</p>
            <div className="invoice-actions">
              <button onClick={() => handleViewInvoice(invoice)} disabled={isLoading}>View</button>
              <button onClick={() => handleEditInvoice(invoice)} disabled={isLoading}>Edit</button>
              <button onClick={() => handleDeleteInvoice(invoice.id)} disabled={isLoading} className="delete-button">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InvoicePage;