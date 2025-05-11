import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPlus, faPaperPlane, faSave, faTimes, faSpinner, faUpload, faEye, faFilePdf } from '@fortawesome/free-solid-svg-icons';
// import { sendInvoiceEmail } from '../services/emailService'; // Keep for now, might be used later
// import { generateInvoicePDF } from '../services/pdfService'; // Keep for now

import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabaseClient'; // Direct supabase client for specific needs if any
import {
  getClients,
  getCompanies,
  getInvoiceById,
  getInvoiceItems,
  getNextInvoiceNumber,
  createInvoiceWithItems,
  updateInvoiceWithItems,
  uploadFile,
  deleteFileByUrl,
  // Assuming getSettings is available or will be added to database.js if needed for currency/defaults
  // getSettings 
} from '../services/database';

// Zod schema for validation (simplified, expand as needed)
const itemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(0, 'Quantity must be positive'),
  unit_price: z.number().min(0, 'Unit price must be positive'),
  // tax_rate: z.number().min(0).max(100).optional().nullable(), // Assuming tax_rate is handled
});

const invoiceSchema = z.object({
  invoice_number: z.string().min(1, 'Invoice number is required'),
  client_id: z.string().uuid('Please select a client'),
  company_id: z.string().uuid('Please select your company'),
  issue_date: z.date('Issue date is required'),
  due_date: z.date('Due date is required'),
  currency: z.string().min(1, 'Currency is required'),
  items: z.array(itemSchema).min(1, 'At least one item is required'),
  notes: z.string().optional(),
  payment_terms: z.string().optional(),
  status: z.string().optional().default('draft'), // Default status
  logo_url: z.string().url().optional().nullable(),
  // exchangeRate: z.number().optional().nullable(), // If using multi-currency
});


const InvoiceForm = () => {
  const { id: invoiceId } = useParams(); // Existing invoice ID for editing
  const navigate = useNavigate();
  const { user: currentUser, loading: authLoading } = useAuth();

  const [clients, setClients] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [initialLogoUrl, setInitialLogoUrl] = useState(null); // For managing old logo deletion

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [error, setError] = useState(null);
  
  // Default currency - ideally from user settings or company settings
  const [defaultCurrency, setDefaultCurrency] = useState('USD'); 
  // const [userSettings, setUserSettings] = useState(null); // For future use

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoice_number: '',
      client_id: '',
      company_id: '',
      issue_date: new Date(),
      due_date: new Date(new Date().setDate(new Date().getDate() + 30)), // Default due date 30 days from now
      currency: defaultCurrency,
      items: [{ description: '', quantity: 1, unit_price: 0, tax_rate: 0 }],
      notes: '',
      payment_terms: 'Payment due within 30 days',
      status: 'draft',
      logo_url: null,
      // exchangeRate: 1,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = watch('items');
  const watchedCurrency = watch('currency');
  // const watchedExchangeRate = watch('exchangeRate');

  // Fetch clients and companies
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      setIsFetchingData(true);
      try {
        const [clientsData, companiesData] = await Promise.all([
          getClients(currentUser.id), // Assuming getClients can be filtered by user_id or fetches all accessible
          getCompanies(currentUser.id)  // Assuming getCompanies is filtered by user_id
        ]);
        setClients(clientsData || []);
        setCompanies(companiesData || []);
        
        // Set default company if available
        if (companiesData && companiesData.length > 0) {
          const defaultComp = companiesData.find(c => c.is_default) || companiesData[0];
          setValue('company_id', defaultComp.id);
          setSelectedCompany(defaultComp);
          if (defaultComp.default_currency) {
            setDefaultCurrency(defaultComp.default_currency);
            setValue('currency', defaultComp.default_currency);
          }
          // Potentially set default payment terms from company
          if (defaultComp.default_payment_terms) {
            setValue('payment_terms', defaultComp.default_payment_terms);
          }
        }

      } catch (err) {
        toast.error(`Failed to load clients/companies: ${err.message}`);
        setError(`Failed to load clients/companies: ${err.message}`);
      } finally {
        setIsFetchingData(false);
      }
    };
    if (currentUser) {
      fetchData();
    }
  }, [currentUser, setValue]);

  // Load existing invoice data or generate new invoice number
  useEffect(() => {
    const loadInvoice = async () => {
      if (!currentUser || !invoiceId) return;
      setIsFetchingData(true);
      try {
        const invoiceData = await getInvoiceById(invoiceId);
        if (invoiceData && invoiceData.user_id !== currentUser.id) {
            toast.error("You are not authorized to edit this invoice.");
            navigate("/invoices");
            return;
        }
        if (invoiceData) {
          const itemsData = await getInvoiceItems(invoiceId);
          reset({
            ...invoiceData,
            issue_date: new Date(invoiceData.issue_date),
            due_date: new Date(invoiceData.due_date),
            items: itemsData || [{ description: '', quantity: 1, unit_price: 0, tax_rate: 0 }],
            // client_id, company_id should be part of invoiceData
          });
          if (invoiceData.logo_url) {
            setLogoPreview(invoiceData.logo_url);
            setInitialLogoUrl(invoiceData.logo_url); // Store initial for comparison on save
          }
          if (invoiceData.client_id) {
            const clientDetail = clients.find(c => c.id === invoiceData.client_id);
            setSelectedClient(clientDetail || null);
          }
          if (invoiceData.company_id) {
            const companyDetail = companies.find(c => c.id === invoiceData.company_id);
            setSelectedCompany(companyDetail || null);
          }
        } else {
          toast.error('Invoice not found.');
          navigate('/invoices');
        }
      } catch (err) {
        toast.error(`Failed to load invoice: ${err.message}`);
        setError(`Failed to load invoice: ${err.message}`);
      } finally {
        setIsFetchingData(false);
      }
    };

    const generateNewInvoiceNumber = async () => {
      if (!currentUser || invoiceId) return; // Only for new invoices
      setIsFetchingData(true);
      try {
        const nextNumber = await getNextInvoiceNumber(currentUser.id);
        setValue('invoice_number', nextNumber);
      } catch (err) {
        toast.error(`Failed to generate invoice number: ${err.message}`);
        // Keep form usable, user can manually enter or try again
      } finally {
        setIsFetchingData(false);
      }
    };

    if (invoiceId && currentUser && clients.length > 0 && companies.length > 0) { // Ensure clients/companies are loaded before populating form for existing invoice
      loadInvoice();
    } else if (!invoiceId && currentUser) {
      generateNewInvoiceNumber();
      // Set default currency from user/company settings if not already set
      if (selectedCompany && selectedCompany.default_currency) {
         setValue('currency', selectedCompany.default_currency);
      } else {
         setValue('currency', defaultCurrency); // Fallback
      }
    }
  }, [invoiceId, currentUser, reset, setValue, navigate, clients, companies, selectedCompany, defaultCurrency]);


  const handleClientChange = (e) => {
    const clientId = e.target.value;
    setValue('client_id', clientId);
    const client = clients.find((c) => c.id === clientId);
    setSelectedClient(client || null);
  };

  const handleCompanyChange = (e) => {
    const companyId = e.target.value;
    setValue('company_id', companyId);
    const company = companies.find((c) => c.id === companyId);
    setSelectedCompany(company || null);
    if (company && company.default_currency) {
      setValue('currency', company.default_currency);
    }
    if (company && company.logo_url && !logoFile && !initialLogoUrl) { // If company has a logo and no invoice logo is set yet
        setLogoPreview(company.logo_url);
        setValue('logo_url', company.logo_url); // Use company logo as default for new invoice
    }
     if (company && company.default_payment_terms) {
        setValue('payment_terms', company.default_payment_terms);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setValue('logo_url', ''); // Clear any existing URL, new one will be generated on upload
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setValue('logo_url', null); // Explicitly set to null for Supabase
  };

  const calculateSubtotal = useCallback(() => {
    return watchedItems.reduce((acc, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unit_price) || 0;
      return acc + quantity * unitPrice;
    }, 0);
  }, [watchedItems]);

  const calculateTotal = useCallback(() => {
    // This is simplified. Add tax calculation if needed.
    // const subtotal = calculateSubtotal();
    // const taxAmount = subtotal * (parseFloat(watchedTaxRate) / 100 || 0);
    // return subtotal + taxAmount;
    return calculateSubtotal(); // Assuming no tax for now or tax is part of line items
  }, [calculateSubtotal]);


  const onSubmit = async (data) => {
    if (!currentUser) {
      toast.error('You must be logged in to save an invoice.');
      return;
    }
    setIsLoading(true);
    setError(null);

    let uploadedLogoUrl = initialLogoUrl; // Start with existing logo URL or null

    try {
      // 1. Handle Logo Upload/Deletion
      if (logoFile) { // New logo uploaded
        const fileName = `${currentUser.id}/${Date.now()}_${logoFile.name}`;
        const newUrl = await uploadFile('invoice-logos', fileName, logoFile);
        uploadedLogoUrl = newUrl;
        if (initialLogoUrl && initialLogoUrl !== newUrl) {
          // Delete old logo only if it was different and existed
          await deleteFileByUrl(initialLogoUrl); 
        }
      } else if (initialLogoUrl && !data.logo_url) { 
        // Logo was removed (data.logo_url is nullified by handleRemoveLogo)
        await deleteFileByUrl(initialLogoUrl);
        uploadedLogoUrl = null;
      }
      // If no new logo file, and data.logo_url is still initialLogoUrl, no change.
      // If company logo was used as default (data.logo_url set from company), and no new file, it remains.

      const invoicePayload = {
        ...data,
        user_id: currentUser.id,
        logo_url: uploadedLogoUrl, // Use the final determined logo URL
        subtotal: calculateSubtotal(),
        total: calculateTotal(),
        // Ensure dates are in ISO format for Supabase
        issue_date: new Date(data.issue_date).toISOString(),
        due_date: new Date(data.due_date).toISOString(),
        // status: data.status || 'draft', // Already handled by defaultValues or form
      };
      
      // Remove items with empty descriptions or zero quantity/price if necessary
      const validItems = data.items.filter(
        item => item.description && parseFloat(item.quantity) > 0 && parseFloat(item.unit_price) >= 0
      );
      
      if (validItems.length === 0 && data.items.length > 0) {
          toast.warn("Please ensure all items have a description and valid quantity/price, or remove empty items.");
          // Optionally, filter out invalid items before submission if schema allows partial items
      }


      if (invoiceId) { // Update existing invoice
        await updateInvoiceWithItems(invoiceId, invoicePayload, validItems);
        toast.success('Invoice updated successfully!');
      } else { // Create new invoice
        const newInvoice = await createInvoiceWithItems(invoicePayload, validItems);
        toast.success('Invoice created successfully!');
        // navigate(`/invoices/${newInvoice.id}`); // Navigate to new invoice view if desired
      }
      navigate('/invoices'); // Or to a specific invoice page
    } catch (err) {
      console.error("Submit error:", err);
      toast.error(`Failed to save invoice: ${err.message}`);
      setError(`Failed to save invoice: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // ... (UI rendering code will go here, it's extensive)
  // For brevity, I'll show a condensed structure of the return statement.
  // The actual JSX will be much larger.

  if (authLoading || isFetchingData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <FontAwesomeIcon icon={faSpinner} spin size="3x" />
        <p className="ml-2">Loading form...</p>
      </div>
    );
  }
  
  if (!currentUser && !authLoading) {
      navigate('/login');
      return null; // Or a message prompting login
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl bg-white dark:bg-gray-800 shadow-xl rounded-lg">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
        {invoiceId ? 'Edit Invoice' : 'Create Invoice'}
      </h1>
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Invoice Details Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="invoice_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Invoice Number</label>
            <Controller
              name="invoice_number"
              control={control}
              render={({ field }) => <input {...field} type="text" id="invoice_number" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white" />}
            />
            {errors.invoice_number && <p className="text-red-500 text-xs mt-1">{errors.invoice_number.message}</p>}
          </div>

          <div>
            <label htmlFor="company_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Your Company</label>
            <Controller
              name="company_id"
              control={control}
              render={({ field }) => (
                <select {...field} id="company_id" onChange={(e) => { field.onChange(e); handleCompanyChange(e); }} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white">
                  <option value="">Select Company</option>
                  {companies.map(comp => <option key={comp.id} value={comp.id}>{comp.name}</option>)}
                </select>
              )}
            />
            {errors.company_id && <p className="text-red-500 text-xs mt-1">{errors.company_id.message}</p>}
          </div>
        </div>

        {/* Client Selection */}
        <div>
          <label htmlFor="client_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Client</label>
          <Controller
            name="client_id"
            control={control}
            render={({ field }) => (
              <select {...field} id="client_id" onChange={(e) => { field.onChange(e); handleClientChange(e); }} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white">
                <option value="">Select Client</option>
                {clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}
              </select>
            )}
          />
          {errors.client_id && <p className="text-red-500 text-xs mt-1">{errors.client_id.message}</p>}
        </div>
        {selectedClient && (
          <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-sm text-gray-600 dark:text-gray-300">
            <p><strong>{selectedClient.name}</strong></p>
            <p>{selectedClient.email}</p>
            <p>{selectedClient.address}</p>
          </div>
        )}

        {/* Dates Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="issue_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Issue Date</label>
            <Controller
              name="issue_date"
              control={control}
              render={({ field }) => <DatePicker selected={field.value} onChange={field.onChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white" dateFormat="MMMM d, yyyy" />}
            />
            {errors.issue_date && <p className="text-red-500 text-xs mt-1">{errors.issue_date.message}</p>}
          </div>
          <div>
            <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Due Date</label>
            <Controller
              name="due_date"
              control={control}
              render={({ field }) => <DatePicker selected={field.value} onChange={field.onChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white" dateFormat="MMMM d, yyyy" />}
            />
            {errors.due_date && <p className="text-red-500 text-xs mt-1">{errors.due_date.message}</p>}
          </div>
        </div>
        
        {/* Currency */}
        <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Currency</label>
            <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                    <input {...field} type="text" id="currency" placeholder="e.g., USD, EUR" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white" />
                )}
            />
            {errors.currency && <p className="text-red-500 text-xs mt-1">{errors.currency.message}</p>}
        </div>

        {/* Items Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Items</h3>
          {fields.map((item, index) => (
            <div key={item.id} className="grid grid-cols-12 gap-3 p-3 border dark:border-gray-700 rounded-md">
              <div className="col-span-12 md:col-span-5">
                <label htmlFor={`items[${index}].description`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <Controller
                  name={`items[${index}].description`}
                  control={control}
                  render={({ field }) => <input {...field} type="text" placeholder="Item description" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm sm:text-sm dark:bg-gray-700 dark:text-white" />}
                />
                {errors.items?.[index]?.description && <p className="text-red-500 text-xs mt-1">{errors.items[index].description.message}</p>}
              </div>
              <div className="col-span-4 md:col-span-2">
                <label htmlFor={`items[${index}].quantity`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</label>
                <Controller
                  name={`items[${index}].quantity`}
                  control={control}
                  render={({ field }) => <input {...field} type="number" placeholder="1" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm sm:text-sm dark:bg-gray-700 dark:text-white" onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />}
                />
                 {errors.items?.[index]?.quantity && <p className="text-red-500 text-xs mt-1">{errors.items[index].quantity.message}</p>}
              </div>
              <div className="col-span-4 md:col-span-2">
                <label htmlFor={`items[${index}].unit_price`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">Unit Price</label>
                <Controller
                  name={`items[${index}].unit_price`}
                  control={control}
                  render={({ field }) => <input {...field} type="number" placeholder="0.00" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm sm:text-sm dark:bg-gray-700 dark:text-white" onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />}
                />
                {errors.items?.[index]?.unit_price && <p className="text-red-500 text-xs mt-1">{errors.items[index].unit_price.message}</p>}
              </div>
              <div className="col-span-4 md:col-span-2 flex items-end">
                <p className="mt-1 block w-full sm:text-sm dark:text-white">
                  {(parseFloat(watchedItems[index]?.quantity) || 0) * (parseFloat(watchedItems[index]?.unit_price) || 0).toFixed(2)} {watchedCurrency}
                </p>
              </div>
              <div className="col-span-12 md:col-span-1 flex items-end justify-end">
                {fields.length > 1 && (
                  <button type="button" onClick={() => remove(index)} className="text-red-500 hover:text-red-700">
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                )}
              </div>
            </div>
          ))}
          <button type="button" onClick={() => append({ description: '', quantity: 1, unit_price: 0, tax_rate: 0 })} className="mt-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <FontAwesomeIcon icon={faPlus} className="mr-2" /> Add Item
          </button>
        </div>

        {/* Totals Section */}
        <div className="mt-6 pt-6 border-t dark:border-gray-700">
            <div className="flex justify-end mb-2">
                <span className="text-lg font-medium text-gray-700 dark:text-gray-300">Subtotal:</span>
                <span className="ml-4 text-lg font-medium text-gray-900 dark:text-white">{calculateSubtotal().toFixed(2)} {watchedCurrency}</span>
            </div>
            {/* Add Tax calculation display here if needed */}
            <div className="flex justify-end">
                <span className="text-xl font-bold text-gray-700 dark:text-gray-300">Total:</span>
                <span className="ml-4 text-xl font-bold text-gray-900 dark:text-white">{calculateTotal().toFixed(2)} {watchedCurrency}</span>
            </div>
        </div>

        {/* Logo Upload Section */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Invoice Logo</label>
          <div className="mt-1 flex items-center space-x-4">
            {logoPreview && <img src={logoPreview} alt="Logo Preview" className="h-16 w-auto object-contain bg-gray-100 dark:bg-gray-700 p-1 rounded" />}
            <input type="file" id="logo" onChange={handleLogoChange} accept="image/*" className="hidden" />
            <label htmlFor="logo" className="cursor-pointer px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
              <FontAwesomeIcon icon={faUpload} className="mr-2" /> {logoPreview ? 'Change Logo' : 'Upload Logo'}
            </label>
            {logoPreview && (
              <button type="button" onClick={handleRemoveLogo} className="text-red-500 hover:text-red-700 text-sm">
                <FontAwesomeIcon icon={faTimes} className="mr-1" /> Remove Logo
              </button>
            )}
          </div>
           <Controller name="logo_url" control={control} render={({ field }) => <input {...field} type="hidden" />} /> {/* For validation if needed, actual value managed by state/upload */}
        </div>

        {/* Notes and Payment Terms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
                <Controller
                    name="notes"
                    control={control}
                    render={({ field }) => <textarea {...field} id="notes" rows="3" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white" placeholder="Any additional notes for the client..."></textarea>}
                />
            </div>
            <div>
                <label htmlFor="payment_terms" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Terms</label>
                <Controller
                    name="payment_terms"
                    control={control}
                    render={({ field }) => <textarea {...field} id="payment_terms" rows="3" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white" placeholder="e.g., Payment due upon receipt"></textarea>}
                />
            </div>
        </div>
        
        {/* Status (optional, could be hidden or for admin) */}
         <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
            <Controller
                name="status"
                control={control}
                render={({ field }) => (
                    <select {...field} id="status" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white">
                        <option value="draft">Draft</option>
                        <option value="sent">Sent</option>
                        <option value="paid">Paid</option>
                        <option value="overdue">Overdue</option>
                        <option value="void">Void</option>
                    </select>
                )}
            />
        </div>


        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t dark:border-gray-700">
          <button type="button" onClick={() => navigate('/invoices')} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Cancel
          </button>
          <button type="submit" disabled={isLoading || isFetchingData} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
            {isLoading ? <FontAwesomeIcon icon={faSpinner} spin className="mr-2"/> : <FontAwesomeIcon icon={faSave} className="mr-2" />}
            {invoiceId ? 'Update Invoice' : 'Save Invoice'}
          </button>
          {/* Add other actions like "Save and Send" if emailService is integrated */}
        </div>
      </form>
    </div>
  );
};

export default InvoiceForm;