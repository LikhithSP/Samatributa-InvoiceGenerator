import { supabase } from './supabaseClient';

// Generic error handler
const handleSupabaseError = (error, context) => {
  if (error) {
    console.error(`Error in ${context}:`, error.message);
    throw error;
  }
};

// Generic function to get a table name, ensuring it's user-specific if needed
// For this example, we'll assume public tables or tables with RLS policies.
// If you have user-specific tables or need to filter by user_id, adjust accordingly.

// --- Generic CRUD Functions ---

/**
 * Fetches all records from a table.
 * @param {string} tableName - The name of the Supabase table.
 * @returns {Promise<Array>} - A promise that resolves to an array of records.
 */
export const getAllRecords = async (tableName) => {
  const { data, error } = await supabase.from(tableName).select('*');
  handleSupabaseError(error, `getAllRecords from ${tableName}`);
  return data || [];
};

/**
 * Fetches a single record by its ID from a table.
 * @param {string} tableName - The name of the Supabase table.
 * @param {string|number} id - The ID of the record to fetch.
 * @returns {Promise<Object|null>} - A promise that resolves to the record or null if not found.
 */
export const getRecordById = async (tableName, id) => {
  const { data, error } = await supabase.from(tableName).select('*').eq('id', id).single();
  // PGRST116: single row not found, not necessarily an error to throw for a 'get by id'
  if (error && error.code !== 'PGRST116') {
    handleSupabaseError(error, `getRecordById from ${tableName}`);
  }
  return data;
};

/**
 * Creates a new record in a table.
 * @param {string} tableName - The name of the Supabase table.
 * @param {Object} recordData - The data for the new record.
 * @returns {Promise<Object>} - A promise that resolves to the created record.
 */
export const createRecord = async (tableName, recordData) => {
  // Assuming user_id should be associated with records if a user is logged in.
  // You might need to pass the user object or user.id to this function.
  // For now, this is a simplified version.
  // const { data: { user } } = await supabase.auth.getUser();
  // const dataToInsert = user ? { ...recordData, user_id: user.id } : recordData;
  
  const { data, error } = await supabase.from(tableName).insert([recordData]).select().single();
  handleSupabaseError(error, `createRecord in ${tableName}`);
  return data;
};

/**
 * Updates an existing record by its ID in a table.
 * @param {string} tableName - The name of the Supabase table.
 * @param {string|number} id - The ID of the record to update.
 * @param {Object} updatedData - The data to update the record with.
 * @returns {Promise<Object>} - A promise that resolves to the updated record.
 */
export const updateRecord = async (tableName, id, updatedData) => {
  const { data, error } = await supabase.from(tableName).update(updatedData).eq('id', id).select().single();
  handleSupabaseError(error, `updateRecord in ${tableName}`);
  return data;
};

/**
 * Deletes a record by its ID from a table.
 * @param {string} tableName - The name of the Supabase table.
 * @param {string|number} id - The ID of the record to delete.
 * @returns {Promise<void>}
 */
export const deleteRecord = async (tableName, id) => {
  const { error } = await supabase.from(tableName).delete().eq('id', id);
  handleSupabaseError(error, `deleteRecord in ${tableName}`);
};


// --- Specific Table Functions (examples, expand as needed) ---

// Example for a 'clients' table
export const getClients = async (userId) => {
  // Assuming clients are tied to a user_id
  // Adjust select query as per your RLS and table structure
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    // .eq('user_id', userId) // Uncomment if clients are user-specific and RLS is set up
    .order('created_at', { ascending: false });
  handleSupabaseError(error, 'getClients');
  return data || [];
};

export const addClient = async (clientData, userId) => {
  // const dataToInsert = { ...clientData, user_id: userId }; // Ensure user_id is included
  const { data, error } = await supabase.from('clients').insert([clientData]).select().single();
  handleSupabaseError(error, 'addClient');
  return data;
};

export const updateClient = async (id, clientData) => {
  const { data, error } = await supabase.from('clients').update(clientData).eq('id', id).select().single();
  handleSupabaseError(error, 'updateClient');
  return data;
};

export const deleteClient = async (id) => {
  const { error } = await supabase.from('clients').delete().eq('id', id);
  handleSupabaseError(error, 'deleteClient');
};


// Example for a 'companies' table
export const getCompanies = async (userId) => {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    // .eq('user_id', userId) // If company info is user-specific
    .order('created_at', { ascending: false });
  handleSupabaseError(error, 'getCompanies');
  return data || [];
};

export const addCompany = async (companyData, userId) => {
  // const dataToInsert = { ...companyData, user_id: userId };
  const { data, error } = await supabase.from('companies').insert([companyData]).select().single();
  handleSupabaseError(error, 'addCompany');
  return data;
};

export const updateCompany = async (id, companyData) => {
  const { data, error } = await supabase.from('companies').update(companyData).eq('id', id).select().single();
  handleSupabaseError(error, 'updateCompany');
  return data;
};

export const deleteCompany = async (id) => {
  const { error } = await supabase.from('companies').delete().eq('id', id);
  handleSupabaseError(error, 'deleteCompany');
};

// --- Invoice and Invoice Item Functions ---

/**
 * Fetches all invoices, optionally with their items.
 * @param {string} userId - The ID of the user to fetch invoices for (if applicable).
 * @param {boolean} fetchItems - Whether to also fetch related invoice items.
 * @returns {Promise<Array>} - A promise that resolves to an array of invoices.
 */
export const getInvoices = async (userId, fetchItems = false) => {
  let query = supabase
    .from('invoices')
    .select(fetchItems ? '*, invoice_items(*)' : '*')
    // .eq('user_id', userId) // Uncomment if invoices are user-specific and RLS is set up
    .order('created_at', { ascending: false });

  const { data, error } = await query;
  handleSupabaseError(error, 'getInvoices');
  return data || [];
};

/**
 * Fetches a single invoice by ID, optionally with its items.
 * @param {string|number} id - The ID of the invoice.
 * @param {boolean} fetchItems - Whether to also fetch related invoice items.
 * @returns {Promise<Object|null>}
 */
export const getInvoiceById = async (id, fetchItems = false) => {
  const { data, error } = await supabase
    .from('invoices')
    .select(fetchItems ? '*, invoice_items(*)' : '*')
    .eq('id', id)
    .single();
  if (error && error.code !== 'PGRST116') { // PGRST116: single row not found
    handleSupabaseError(error, `getInvoiceById ${id}`);
  }
  return data;
};

/**
 * Creates a new invoice along with its items.
 * This should ideally be done in a transaction if your Supabase version supports it via RPC,
 * or handled carefully with sequential inserts.
 * @param {Object} invoiceData - Data for the invoice.
 * @param {Array<Object>} itemsData - Array of data for invoice items.
 * @param {string} userId - The user ID to associate with the invoice.
 * @returns {Promise<Object>} - The created invoice with its items.
 */
export const createInvoiceWithItems = async (invoiceData, itemsData, userId) => {
  // const dataToInsert = { ...invoiceData, user_id: userId };
  // For simplicity, assuming user_id is part of invoiceData or handled by RLS
  
  // 1. Create the invoice
  const { data: newInvoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert([invoiceData])
    .select()
    .single();
  handleSupabaseError(invoiceError, 'createInvoiceWithItems (invoice)');
  if (!newInvoice) throw new Error('Invoice creation failed.');

  // 2. Create invoice items, linking them to the new invoice
  if (itemsData && itemsData.length > 0) {
    const itemsToInsert = itemsData.map(item => ({
      ...item,
      invoice_id: newInvoice.id,
      // user_id: userId // If items also need user_id directly
    }));
    const { data: newItems, error: itemsError } = await supabase
      .from('invoice_items')
      .insert(itemsToInsert)
      .select();
    handleSupabaseError(itemsError, 'createInvoiceWithItems (items)');
    newInvoice.invoice_items = newItems || [];
  } else {
    newInvoice.invoice_items = [];
  }

  return newInvoice;
};

/**
 * Updates an existing invoice and its items.
 * This can be complex: items might be added, removed, or updated.
 * A common approach is to delete existing items and re-insert the new set,
 * or perform more granular updates.
 * @param {string|number} invoiceId - The ID of the invoice to update.
 * @param {Object} invoiceData - Updated data for the invoice.
 * @param {Array<Object>} itemsData - Updated array of invoice items.
 * @returns {Promise<Object>} - The updated invoice with its items.
 */
export const updateInvoiceWithItems = async (invoiceId, invoiceData, itemsData) => {
  // 1. Update the invoice itself
  const { data: updatedInvoice, error: invoiceError } = await supabase
    .from('invoices')
    .update(invoiceData)
    .eq('id', invoiceId)
    .select()
    .single();
  handleSupabaseError(invoiceError, `updateInvoiceWithItems (invoice ${invoiceId})`);
  if (!updatedInvoice) throw new Error('Invoice update failed.');

  // 2. Handle invoice items (example: delete existing and re-insert)
  // This is a simple but potentially inefficient way for large item lists.
  // More sophisticated logic would diff and update/insert/delete selectively.
  const { error: deleteItemsError } = await supabase
    .from('invoice_items')
    .delete()
    .eq('invoice_id', invoiceId);
  handleSupabaseError(deleteItemsError, `updateInvoiceWithItems (delete items for ${invoiceId})`);

  if (itemsData && itemsData.length > 0) {
    const itemsToInsert = itemsData.map(item => ({
      ...item,
      invoice_id: invoiceId, // Ensure invoice_id is correctly set
      // user_id: updatedInvoice.user_id // if needed
    }));
    const { data: newItems, error: itemsError } = await supabase
      .from('invoice_items')
      .insert(itemsToInsert)
      .select();
    handleSupabaseError(itemsError, `updateInvoiceWithItems (re-insert items for ${invoiceId})`);
    updatedInvoice.invoice_items = newItems || [];
  } else {
    updatedInvoice.invoice_items = [];
  }

  return updatedInvoice;
};


/**
 * Deletes an invoice and its associated items (cascade delete should be set up in DB or handled here).
 * @param {string|number} invoiceId - The ID of the invoice to delete.
 */
export const deleteInvoice = async (invoiceId) => {
  // If cascade delete is not set on your Supabase table for invoice_items,
  // you must delete items first.
  const { error: itemsError } = await supabase
    .from('invoice_items')
    .delete()
    .eq('invoice_id', invoiceId);
  handleSupabaseError(itemsError, `deleteInvoice (items for ${invoiceId})`);
  
  const { error: invoiceError } = await supabase
    .from('invoices')
    .delete()
    .eq('id', invoiceId);
  handleSupabaseError(invoiceError, `deleteInvoice (invoice ${invoiceId})`);
};

// You might also need functions for individual invoice items if they can be managed separately.
// export const addInvoiceItem = async (itemData) => { ... }
// export const updateInvoiceItem = async (itemId, itemData) => { ... }
// export const deleteInvoiceItem = async (itemId) => { ... }

// --- End Invoice and Invoice Item Functions ---

// Add more specific functions for invoices, invoice_items, etc. as you refactor those pages.
// For example:
// export const getInvoicesWithDetails = async (userId) => { ... }
// export const createInvoiceWithItems = async (invoiceData, itemsData, userId) => { ... }

// Add a new function to generate the next invoice number for a user
export async function getNextInvoiceNumber(userId) {
  if (!userId) {
    console.error("User ID is required to generate invoice number");
    // It's better to throw an error or return a rejected promise
    // to ensure the calling code handles this explicitly.
    return Promise.reject(new Error("User ID is required for invoice number generation."));
  }
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('user_id', userId)
      .order('invoice_number', { ascending: false }) // Assumes invoice_number can be sorted to find the latest
      .limit(1);

    if (error) {
      console.error('Supabase error fetching last invoice number:', error);
      throw error;
    }

    if (data && data.length > 0) {
      const lastInvoiceNumberStr = data[0].invoice_number;
      // Attempt to extract a numeric part and increment.
      // This logic is highly dependent on the invoice number format.
      // Example: "INV-001" -> "001" -> 1 -> 2 -> "INV-002"
      // Example: "2024-001" -> "001" -> 1 -> 2 -> "2024-002" (prefix needs to be dynamic or known)
      // For simplicity, let's assume a prefix "INV-" and a padded number.
      const parts = lastInvoiceNumberStr.split('-');
      let numericPart = 1;
      let prefix = 'INV-';

      if (parts.length > 1) {
        const potentialNumericPart = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(potentialNumericPart)) {
          numericPart = potentialNumericPart + 1;
          prefix = parts.slice(0, -1).join('-') + '-';
        } else {
          // If the last part isn't numeric, or if there's no hyphen,
          // this indicates a format not handled by this simple logic.
          // Fallback: append a new sequence number to the existing string, or use a counter.
          // This fallback is very basic and likely needs refinement.
          numericPart = (data.length || 0) + 1; // Or query count of invoices for user
        }
      } else if (!isNaN(parseInt(lastInvoiceNumberStr, 10))) {
        // It's a simple number without a prefix
        numericPart = parseInt(lastInvoiceNumberStr, 10) + 1;
        prefix = ''; // No prefix
      } else {
         // Fallback if it's not a simple number and not in prefix-number format
         // This could be based on total count of invoices for the user + 1
         const { count, error: countError } = await supabase
            .from('invoices')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);
        if (countError) throw countError;
        numericPart = (count || 0) + 1;
      }
      return `${prefix}${numericPart.toString().padStart(3, '0')}`;
    } else {
      // No existing invoices for this user, start with the first number
      return 'INV-001'; // Or your preferred starting format
    }
  } catch (err) {
    console.error('Error generating next invoice number:', err.message);
    // It's important to decide how to handle this error in the UI.
    // Maybe return a placeholder or re-throw.
    // Throwing allows the calling component to catch and display an error.
    throw new Error('Failed to generate invoice number: ' + err.message);
  }
}

// Helper function to upload a file to Supabase Storage and return its public URL
export async function uploadFile(bucketName, filePath, file) {
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file, { cacheControl: '3600', upsert: true }); // upsert true overwrites if file exists

  if (error) {
    console.error('Supabase storage upload error:', error);
    throw error;
  }

  const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);

  if (!publicUrlData || !publicUrlData.publicUrl) {
    // Attempt to retrieve the URL again if it was null, sometimes there's a slight delay
    // This is a simple retry, more robust retry logic might be needed in some cases
    await new Promise(resolve => setTimeout(resolve, 500)); // wait 500ms
    const { data: delayedPublicUrlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);
    if (!delayedPublicUrlData || !delayedPublicUrlData.publicUrl) {
        console.error('Could not get public URL for uploaded file:', filePath);
        throw new Error('Could not get public URL for uploaded file.');
    }
    return delayedPublicUrlData.publicUrl;
  }
  return publicUrlData.publicUrl;
}

// Helper function to delete a file from Supabase Storage using its full public URL
export async function deleteFileByUrl(fileUrl) {
  if (!fileUrl) return;

  try {
    // Extract bucket name and file path from URL.
    // Example URL: https://<project_ref>.supabase.co/storage/v1/object/public/bucketName/path/to/file.png
    // Or: https://<project_ref>.supabase.co/storage/v1/object/sign/bucketName/path/to/file.png?token=... (for signed URLs)

    const storageBaseUrl = `${supabase.storageUrl}/object/public/`; // For public files
    const storageSignedBaseUrl = `${supabase.storageUrl}/object/sign/`; // For signed files

    let pathPart;
    let bucketName;

    if (fileUrl.startsWith(storageBaseUrl)) {
        pathPart = fileUrl.substring(storageBaseUrl.length);
    } else if (fileUrl.startsWith(storageSignedBaseUrl)) {
        pathPart = fileUrl.substring(storageSignedBaseUrl.length);
        // Remove query parameters if any (like token for signed URLs)
        pathPart = pathPart.split('?')[0];
    } else {
        console.warn(`Cannot parse file URL for deletion: ${fileUrl}. URL does not match expected Supabase storage patterns.`);
        // Fallback: try to infer bucket and path if URL structure is simpler or known
        // This part is tricky without knowing the exact URL structure if it's not standard.
        // For now, we'll assume one of the above two. If not, we can't reliably parse.
        // A common pattern is /bucketName/filePath.
        const afterStorageV1Object = fileUrl.split('/storage/v1/object/')[1];
        if (afterStorageV1Object) {
            const parts = afterStorageV1Object.split('/'); // e.g., public/bucketName/path or sign/bucketName/path
            if (parts.length > 2) {
                bucketName = parts[1];
                pathPart = parts.slice(2).join('/');
            }
        }
        if (!bucketName || !pathPart) {
             console.warn(`Could not extract bucket and path from URL: ${fileUrl}`);
             return;
        }
    }
    
    if (!bucketName && pathPart) { // If bucketName wasn't parsed from a non-standard URL but pathPart was
        const pathSegments = pathPart.split('/');
        bucketName = pathSegments[0];
        filePath = pathSegments.slice(1).join('/');
    } else if (pathPart) { // Standard parsing where pathPart is bucketName/filePath
        const pathSegments = pathPart.split('/');
        bucketName = pathSegments[0];
        filePath = pathSegments.slice(1).join('/');
    }


    if (!bucketName || !filePath) {
      console.warn(`Could not extract bucket name or file path from URL: ${fileUrl}`);
      return;
    }
    
    console.log(`Attempting to delete from bucket: ${bucketName}, path: ${filePath}`);
    const { error } = await supabase.storage.from(bucketName).remove([filePath]);

    if (error && error.message !== 'The resource was not found') { // Don't throw if file simply not there
      console.warn(`Supabase storage error deleting file (${filePath}):`, error.message);
      // Optionally re-throw if it's critical: throw error;
    }
  } catch (e) {
    console.error(`Error processing file deletion from URL ${fileUrl}:`, e);
  }
}

// --- Message Functions ---

/**
 * Generates a consistent conversation key for two user IDs.
 * @param {string} userId1 - ID of the first user.
 * @param {string} userId2 - ID of the second user.
 * @returns {string} - A sorted, concatenated string representing the conversation.
 */
const getConversationKey = (userId1, userId2) => {
  return [userId1, userId2].sort().join('__');
};

/**
 * Fetches messages for a conversation between two users.
 * @param {string} userId1 - ID of the first user.
 * @param {string} userId2 - ID of the second user.
 * @returns {Promise<Array>} - A promise that resolves to an array of messages.
 */
export const getMessages = async (userId1, userId2) => {
  const conversationKey = getConversationKey(userId1, userId2);
  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:sender_id(id, full_name, avatar_url), receiver:receiver_id(id, full_name, avatar_url)') // Fetch sender/receiver profiles
    .or(`conversation_key.eq.${conversationKey}`)
    .order('created_at', { ascending: true });
  handleSupabaseError(error, `getMessages for conversation ${conversationKey}`);
  return data || [];
};

/**
 * Sends a new message.
 * @param {Object} messageData - Data for the new message.
 *   Expected fields: sender_id, receiver_id, content, [file_url, file_name, file_type]
 * @returns {Promise<Object>} - A promise that resolves to the created message.
 */
export const sendMessage = async (messageData) => {
  const conversationKey = getConversationKey(messageData.sender_id, messageData.receiver_id);
  const dataToInsert = {
    ...messageData,
    conversation_key: conversationKey,
    is_read: false, // Default to unread
  };
  const { data, error } = await supabase
    .from('messages')
    .insert([dataToInsert])
    .select('*, sender:sender_id(id, full_name, avatar_url), receiver:receiver_id(id, full_name, avatar_url)')
    .single();
  handleSupabaseError(error, 'sendMessage');
  return data;
};

/**
 * Marks messages as read for a given receiver in a conversation.
 * @param {string} receiverId - The ID of the user for whom messages should be marked as read.
 * @param {string} senderId - The ID of the other user in the conversation.
 */
export const markMessagesAsRead = async (receiverId, senderId) => {
  const conversationKey = getConversationKey(receiverId, senderId);
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_key', conversationKey)
    .eq('receiver_id', receiverId)
    .eq('is_read', false);
  handleSupabaseError(error, `markMessagesAsRead for receiver ${receiverId} in conversation with ${senderId}`);
};

/**
 * Updates the content of a specific message.
 * @param {string} messageId - The ID of the message to update.
 * @param {string} newContent - The new text content for the message.
 * @param {string} currentUserId - The ID of the user attempting the edit (for RLS/policy check).
 * @returns {Promise<Object>} - The updated message.
 */
export const editMessage = async (messageId, newContent, currentUserId) => {
  const { data, error } = await supabase
    .from('messages')
    .update({ content: newContent, updated_at: new Date().toISOString() })
    .eq('id', messageId)
    .eq('sender_id', currentUserId) // Ensure only sender can edit
    .select('*, sender:sender_id(id, full_name, avatar_url), receiver:receiver_id(id, full_name, avatar_url)')
    .single();
  handleSupabaseError(error, `editMessage ${messageId}`);
  return data;
};

/**
 * Deletes a specific message.
 * @param {string} messageId - The ID of the message to delete.
 * @param {string} currentUserId - The ID of the user attempting the delete (for RLS/policy check).
 */
export const deleteMessage = async (messageId, currentUserId) => {
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId)
    .eq('sender_id', currentUserId); // Ensure only sender can delete
  handleSupabaseError(error, `deleteMessage ${messageId}`);
};

/**
 * Fetches the last message for each conversation for the current user.
 * This is a more complex query and might need a dedicated database function/view for optimization.
 * @param {string} userId - The ID of the current user.
 * @returns {Promise<Array>} - Array of objects, each containing user info and last message details.
 */
export const getConversations = async (userId) => {
  // This is a simplified approach. A proper implementation might involve:
  // 1. Getting all distinct conversation_keys involving the user.
  // 2. For each key, getting the last message.
  // This can be done more efficiently with a custom RPC function in Supabase.
  
  // For now, let's fetch all messages involving the user and process client-side or use a view.
  // This is NOT efficient for many messages.
  // A better approach would be a database view or function `get_user_conversations`

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, email')
    .neq('id', userId); // Get all other users
  handleSupabaseError(profilesError, 'getConversations (profiles)');
  if (!profiles) return [];

  const conversations = await Promise.all(
    profiles.map(async (profile) => {
      const conversationKey = getConversationKey(userId, profile.id);
      const { data: lastMsgData, error: lastMsgError } = await supabase
        .from('messages')
        .select('id, content, created_at, sender_id, is_read, receiver_id, file_url, file_type') // Added id, file_url, file_type
        .eq('conversation_key', conversationKey)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(); // Use maybeSingle to avoid error if no messages

      handleSupabaseError(lastMsgError, `getConversations (lastMsg for ${profile.id})`);
      
      const { count, error: unreadError } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_key', conversationKey)
        .eq('receiver_id', userId)
        .eq('is_read', false);
      
      handleSupabaseError(unreadError, `getConversations (unreadCount for ${profile.id})`);

      return {
        ...profile, // Other user's profile
        lastMessage: lastMsgData,
        unreadCount: count || 0,
      };
    })
  );
  // Sort by last message time, most recent first
  return conversations.sort((a, b) => {
    const aTime = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0;
    const bTime = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0;
    return bTime - aTime;
  });
};

/**
 * Fetches details for a single conversation (other user's profile, last message, unread count).
 * @param {string} currentUserId - The ID of the current user.
 * @param {string} otherUserId - The ID of the other user in the conversation.
 * @returns {Promise<Object|null>} - An object with conversation details or null if profile not found.
 */
export const getSingleConversationDetails = async (currentUserId, otherUserId) => {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, email')
    .eq('id', otherUserId)
    .single();

  handleSupabaseError(profileError, `getSingleConversationDetails (profile for ${otherUserId})`);
  if (!profile) return null;

  const conversationKey = getConversationKey(currentUserId, otherUserId);

  const { data: lastMsgData, error: lastMsgError } = await supabase
    .from('messages')
    .select('id, content, created_at, sender_id, is_read, receiver_id, file_url, file_type')
    .eq('conversation_key', conversationKey)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  handleSupabaseError(lastMsgError, `getSingleConversationDetails (lastMsg for ${conversationKey})`);

  const { count, error: unreadError } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('conversation_key', conversationKey)
    .eq('receiver_id', currentUserId)
    .eq('is_read', false);

  handleSupabaseError(unreadError, `getSingleConversationDetails (unreadCount for ${conversationKey})`);

  return {
    ...profile, // Other user's profile (id, full_name, avatar_url, email)
    lastMessage: lastMsgData, // Can be null if no messages
    unreadCount: count || 0,
    isConversation: true, // Indicates this is an active or potential conversation partner
  };
};


/**
 * Gets the total unread message count for a user across all conversations.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<number>} - Total unread messages.
 */
export const getTotalUnreadCount = async (userId) => {
    const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', userId)
        .eq('is_read', false);
    handleSupabaseError(error, `getTotalUnreadCount for user ${userId}`);
    return count || 0;
};

// --- End Message Functions ---

