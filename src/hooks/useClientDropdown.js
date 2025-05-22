import { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';

/**
 * Custom hook for handling client dropdown functionality
 * @param {Function} setInvoiceData - Function to update invoice data
 * @returns {Object} - Client dropdown state and functions
 */
const useClientDropdown = (setInvoiceData) => {
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch clients from Supabase
  useEffect(() => {
    const fetchClients = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.from('clients').select('*');
        
        if (error) {
          console.error('Error fetching clients:', error);
          setError(error.message);
        } else {
          console.log('Clients fetched successfully:', data);
          setClients(data || []);
          setError(null);
        }
      } catch (err) {
        console.error('Exception fetching clients:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
  }, []);

  // Handle client selection and autofill
  const handleClientSelect = (e) => {
    const clientId = e.target.value ? parseInt(e.target.value) : null;
    setSelectedClientId(e.target.value);
    
    if (!clientId) {
      // Clear all client fields if no client is selected
      console.log('Clearing client fields');
      setInvoiceData(prevData => ({
        ...prevData,
        recipientName: '',
        recipientAddress: '',
        recipientPhone: '',
        recipientEmail: '',
        recipientWebsite: '',
        recipientGSTIN: '',
        recipientPAN: ''
      }));
      return;
    }
    
    const selectedClient = clients.find(client => client.id === clientId);
    console.log('Selected client:', selectedClient);
    
    if (selectedClient) {
      // Force a complete re-render by creating a new object
      setInvoiceData(prevData => {
        const updated = {
          ...prevData,
          recipientName: selectedClient.name || '',
          recipientAddress: selectedClient.address || '',
          recipientPhone: selectedClient.phone || '',
          recipientEmail: selectedClient.email || '',
          recipientWebsite: selectedClient.website || '',
          recipientGSTIN: selectedClient.gstin || '',
          recipientPAN: selectedClient.pan || ''
        };
        console.log('Updated invoice data with client details:', updated);
        return updated;
      });
    }
  };

  return {
    clients,
    selectedClientId,
    isLoading,
    error,
    handleClientSelect,
    setSelectedClientId
  };
};

export default useClientDropdown;
