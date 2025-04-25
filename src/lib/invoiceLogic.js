import { INVOICE_CONSTANTS } from '../constants';
import exchangeRateService from '../services/exchangeRateService';

/**
 * Invoice business logic
 */
const invoiceLogic = {
  /**
   * Generate a new invoice number 
   * @returns {string} Formatted invoice number
   */
  generateInvoiceNumber: () => {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 9000 + 1000);
    
    return `${INVOICE_CONSTANTS.NUMBER_PREFIX}${year}${month}-${random}`;
  },
  
  /**
   * Calculate invoice totals
   * @param {Array} items - Invoice items
   * @param {number} taxRate - Tax rate percentage
   * @returns {Object} Calculated totals
   */
  calculateTotals: (items, taxRate) => {
    // Calculate subtotals
    let subtotalUSD = 0;
    let subtotalINR = 0;
    
    items.forEach(item => {
      subtotalUSD += parseFloat(item.amountUSD) || 0;
      subtotalINR += parseFloat(item.amountINR) || 0;
    });
    
    // Calculate tax amounts
    const taxRateValue = parseFloat(taxRate) || 0;
    const taxAmountUSD = (subtotalUSD * taxRateValue) / 100;
    const taxAmountINR = (subtotalINR * taxRateValue) / 100;
    
    // Calculate totals
    const totalUSD = subtotalUSD + taxAmountUSD;
    const totalINR = subtotalINR + taxAmountINR;
    
    return {
      subtotalUSD,
      subtotalINR,
      taxAmountUSD,
      taxAmountINR,
      totalUSD,
      totalINR
    };
  },
  
  /**
   * Recalculate all values based on exchange rate
   * @param {Array} items - Invoice items
   * @param {number} taxRate - Tax rate percentage
   * @param {number} exchangeRate - USD to INR exchange rate
   * @returns {Object} Updated items and totals
   */
  recalculateWithExchangeRate: (items, taxRate, exchangeRate) => {
    // Update all item amounts based on exchange rate
    const updatedItems = items.map(item => {
      const newItem = { ...item };
      
      // If USD amount exists, calculate INR
      if (newItem.amountUSD) {
        newItem.amountINR = (parseFloat(newItem.amountUSD) * exchangeRate).toFixed(2);
      } 
      // If INR amount exists but USD doesn't, calculate USD
      else if (newItem.amountINR && !newItem.amountUSD) {
        newItem.amountUSD = (parseFloat(newItem.amountINR) / exchangeRate).toFixed(2);
      }
      
      return newItem;
    });
    
    // Calculate all totals with updated items
    const totals = invoiceLogic.calculateTotals(updatedItems, taxRate);
    
    return {
      items: updatedItems,
      ...totals
    };
  },
  
  /**
   * Create a default empty invoice data structure
   * @returns {Object} Default invoice data
   */
  createDefaultInvoice: () => {
    return {
      invoiceNumber: invoiceLogic.generateInvoiceNumber(),
      invoiceDate: new Date().toISOString().split('T')[0],
      taxRate: 5,
      currency: INVOICE_CONSTANTS.CURRENCY.USD,
      logoUrl: '',
      senderName: '',
      senderAddress: '',
      senderGSTIN: '',
      recipientName: '',
      recipientEmail: '',
      recipientAddress: '',
      recipientPhone: '',
      recipientGSTIN: '',
      recipientPAN: '',
      notes: 'Payment Terms: Due on receipt\nBank Details: [Your Bank Details Here]\nThank you for your business!',
      items: [],
      subtotalUSD: 0,
      subtotalINR: 0,
      taxAmountUSD: 0,
      taxAmountINR: 0,
      totalUSD: 0,
      totalINR: 0
    };
  }
};

export default invoiceLogic;