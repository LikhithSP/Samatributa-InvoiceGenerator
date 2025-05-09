import { APP_CONFIG } from '../config/appConfig';
import { supabase } from './supabaseClient';

const { storagePrefix } = APP_CONFIG.auth;

/**
 * Storage utility for handling localStorage with prefixed keys
 */
export const storage = {
  /**
   * Get an item from Supabase (or localStorage fallback)
   * @param {string} key - The key to retrieve
   * @param {any} defaultValue - Default value if key doesn't exist
   * @returns {any} The stored value or defaultValue
   */
  get: async (key, defaultValue = null) => {
    // Try Supabase first
    const { data, error } = await supabase
      .from('app_storage')
      .select('value')
      .eq('key', `${storagePrefix}${key}`)
      .single();
    if (error || !data) {
      // Fallback to localStorage
      const value = localStorage.getItem(`${storagePrefix}${key}`);
      if (value === null) return defaultValue;
      try {
        return JSON.parse(value);
      } catch (error) {
        return value;
      }
    }
    try {
      return JSON.parse(data.value);
    } catch (error) {
      return data.value;
    }
  },

  /**
   * Set an item in Supabase (and localStorage fallback)
   * @param {string} key - The key to set
   * @param {any} value - The value to store
   */
  set: async (key, value) => {
    const valueToStore = typeof value === 'object' ? JSON.stringify(value) : value;
    // Upsert to Supabase
    await supabase.from('app_storage').upsert({ key: `${storagePrefix}${key}`, value: valueToStore });
    // Also set in localStorage for offline support
    localStorage.setItem(`${storagePrefix}${key}`, valueToStore);
  },

  /**
   * Remove an item from Supabase (and localStorage fallback)
   * @param {string} key - The key to remove
   */
  remove: async (key) => {
    await supabase.from('app_storage').delete().eq('key', `${storagePrefix}${key}`);
    localStorage.removeItem(`${storagePrefix}${key}`);
  },

  /**
   * Clear all items from Supabase with prefix (and localStorage fallback)
   */
  clearAll: async () => {
    // Remove all with prefix from Supabase
    await supabase.from('app_storage').delete().ilike('key', `${storagePrefix}%`);
    Object.keys(localStorage)
      .filter(key => key.startsWith(storagePrefix))
      .forEach(key => localStorage.removeItem(key));
  },

  /**
   * Update the last activity timestamp
   */
  updateLastActivity: () => {
    storage.set('lastActivity', new Date().getTime());
  }
};

export default storage;