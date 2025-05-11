import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faUserCircle, faSearch, faEdit, faTrashAlt, faFileAlt, faSpinner, faExclamationCircle, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { useUserNotifications } from '../context/UserNotificationsContext';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabaseClient'; // Added for real-time
import {
  getProfiles,
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  getConversations,
  getTotalUnreadCount,
  markMessagesAsRead,
  uploadFile, // For Part 4
  deleteFileByUrl, // For Part 4
  getSingleConversationDetails // For refinement of deleted message handling
} from '../services/database';

// Removed local getConversationKey - Supabase service functions handle this logic.
// Removed local getAvatar - using the one defined in the component.

// Helper function to generate conversation key (moved outside or could be memoized if inside component and using props/state)
const getConversationKeyForUsers = (userId1, userId2) => {
  if (!userId1 || !userId2) return null;
  return [userId1, userId2].sort().join('__');
};

const MessageInbox = () => {
  const { authUser } = useAuth();
  const { addNotification } = useUserNotifications();

  const [allUsers, setAllUsers] = useState([]); // Still used to show users not yet in conversations
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null); // This will be a profile object
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [editingMessage, setEditingMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [fileAttachment, setFileAttachment] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  // New state for Part 2
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);

  // Memoized sort function for conversations based on last message time
  const sortConversationsList = useCallback((convos) => {
    return [...convos].sort((a, b) => {
      const timeA = a.lastMsgTimestamp ? new Date(a.lastMsgTimestamp).getTime() : (a.lastMessage?.created_at ? new Date(a.lastMessage.created_at).getTime() : 0);
      const timeB = b.lastMsgTimestamp ? new Date(b.lastMsgTimestamp).getTime() : (b.lastMessage?.created_at ? new Date(b.lastMessage.created_at).getTime() : 0);
      
      // If both have no valid timestamp (e.g. new contacts not yet part of a conversation from `allUsers` perspective,
      // though this sort is primarily for `conversations` state which should have timestamps if messages exist)
      // This part of the logic is more relevant for the combined list in `sidebarUsers`.
      // For `conversations` state itself, we primarily sort by time.
      if (timeA === 0 && timeB === 0) {
        return (a.full_name || a.email || '').localeCompare(b.full_name || b.email || '');
      }
      return timeB - timeA; // Most recent first
    });
  }, []);

  // Fetch all user profiles from Supabase (primarily for starting new chats)
  useEffect(() => {
    if (authUser) {
      setLoadingUsers(true);
      getProfiles()
        .then(profiles => {
          if (profiles && profiles.length > 0) {
            const filteredProfiles = profiles.filter(p => p.id !== authUser.id);
            setAllUsers(filteredProfiles); // These are potential users to chat with
            const userProfile = profiles.find(p => p.id === authUser.id);
            setCurrentUserProfile(userProfile);
            if (!userProfile) {
                addNotification('Could not load your profile information.', 'error');
            }
          } else {
            setAllUsers([]);
            // addNotification('No other users found or error fetching profiles.', 'info'); // Might be too noisy
          }
        })
        .catch(error => {
          console.error('Error fetching profiles:', error);
          addNotification(`Error fetching user profiles: ${error.message}`, 'error');
          setAllUsers([]);
        })
        .finally(() => {
          setLoadingUsers(false);
        });
    } else {
      setAllUsers([]);
      setCurrentUserProfile(null);
      setLoadingUsers(false);
    }
  }, [authUser, addNotification]);

  // Fetch conversations for the sidebar (Part 2)
  useEffect(() => {
    if (currentUserProfile?.id) {
      setLoadingConversations(true);
      getConversations(currentUserProfile.id)
        .then(fetchedConversations => {
          setConversations(sortConversationsList(fetchedConversations || []));
        })
        .catch(error => {
          console.error('Error fetching conversations:', error);
          addNotification(`Error fetching conversations: ${error.message}`, 'error');
          setConversations([]);
        })
        .finally(() => {
          setLoadingConversations(false);
        });
    } else {
      setConversations([]);
    }
  }, [currentUserProfile, addNotification, sortConversationsList]);

  // Fetch total unread messages count (Part 2)
  // This useEffect now also reacts to `conversations` state changes triggered by real-time updates.
  useEffect(() => {
    if (currentUserProfile?.id) {
      getTotalUnreadCount(currentUserProfile.id)
        .then(count => {
          setTotalUnreadMessages(count || 0);
        })
        .catch(error => {
          console.error('Error fetching total unread count:', error);
          addNotification(`Error fetching total unread count: ${error.message}`, 'error');
          setTotalUnreadMessages(0);
        });
    } else {
        setTotalUnreadMessages(0);
    }
  }, [currentUserProfile, addNotification, conversations]); // Re-fetch if conversations change (e.g., new message)

  // Fetch messages for a selected conversation (Part 2)
  useEffect(() => {
    if (selectedUser && currentUserProfile) {
      setLoadingMessages(true);
      setMessages([]); // Clear previous messages
      getMessages(currentUserProfile.id, selectedUser.id)
        .then(fetchedMessages => {
          setMessages(fetchedMessages || []);
          // Mark messages as read when conversation is opened
          const unreadMessagesExist = fetchedMessages && fetchedMessages.some(m => m.receiver_id === currentUserProfile.id && !m.is_read);
          if (unreadMessagesExist) {
            markMessagesAsRead(currentUserProfile.id, selectedUser.id)
              .then(() => {
                // Optimistically update conversations list for the current chat
                setConversations(prevConvos => {
                  const updated = prevConvos.map(convo =>
                    convo.id === selectedUser.id ? { ...convo, unreadCount: 0 } : convo
                  );
                  return sortConversationsList(updated);
                });
                // Re-calculate total unread after marking as read for the active chat
                 getTotalUnreadCount(currentUserProfile.id)
                    .then(setTotalUnreadMessages)
                    .catch(err => console.error("Error re-fetching total unread after markAsRead:", err));
              })
              .catch(error => {
                console.error('Error marking messages as read:', error);
                addNotification(`Error marking messages as read: ${error.message}`, 'error');
              });
          }
        })
        .catch(error => {
          console.error('Error fetching messages:', error);
          addNotification(`Error fetching messages for ${selectedUser.full_name || selectedUser.email}: ${error.message}`, 'error');
          setMessages([]);
        })
        .finally(() => {
          setLoadingMessages(false);
        });
    } else {
      setMessages([]);
    }
  }, [selectedUser, currentUserProfile, addNotification, sortConversationsList]);

  // Real-time subscriptions for messages
  useEffect(() => {
    if (!currentUserProfile?.id) {
      return;
    }

    const handleNewMessage = (newMessagePayload) => {
      if (!currentUserProfile?.id) return; // Ensure profile is still valid

      // 1. Update messages list if current chat matches
      if (selectedUser && getConversationKeyForUsers(currentUserProfile.id, selectedUser.id) === newMessagePayload.conversation_key) {
        setMessages(prev => prev.find(m => m.id === newMessagePayload.id) ? prev : [...prev, newMessagePayload]);
        
        if (newMessagePayload.receiver_id === currentUserProfile.id) {
          markMessagesAsRead(currentUserProfile.id, selectedUser.id)
            .then(() => {
              setConversations(prevConvos => {
                const updated = prevConvos.map(c =>
                  c.id === selectedUser.id ? { ...c, unreadCount: 0 } : c
                );
                return sortConversationsList(updated);
              });
              getTotalUnreadCount(currentUserProfile.id).then(setTotalUnreadMessages)
                .catch(err => console.error("RT: Error getting total unread after markAsRead:", err));
            })
            .catch(err => console.error("RT: Error marking new message as read:", err));
        }
      }

      // 2. Update conversations list (sidebar)
      setConversations(prevConvos => {
        const otherUserId = newMessagePayload.sender_id === currentUserProfile.id ? newMessagePayload.receiver_id : newMessagePayload.sender_id;
        let convoExists = false;
        let newUnreadForThisConvo = 0;

        const updatedConvos = prevConvos.map(convo => {
          if (convo.id === otherUserId) {
            convoExists = true;
            newUnreadForThisConvo = convo.unreadCount || 0;
            if (newMessagePayload.receiver_id === currentUserProfile.id &&
                (!selectedUser || selectedUser.id !== newMessagePayload.sender_id || document.hidden)) {
              newUnreadForThisConvo++;
            }
            return {
              ...convo,
              lastMessage: newMessagePayload,
              lastMsgTimestamp: newMessagePayload.created_at,
              unreadCount: newUnreadForThisConvo,
            };
          }
          return convo;
        });

        if (!convoExists) {
          const contactProfile = newMessagePayload.sender_id === currentUserProfile.id ? newMessagePayload.receiver : newMessagePayload.sender;
          if (contactProfile) {
            newUnreadForThisConvo = (newMessagePayload.receiver_id === currentUserProfile.id && (!selectedUser || selectedUser.id !== newMessagePayload.sender_id || document.hidden)) ? 1 : 0;
            updatedConvos.push({
              id: contactProfile.id,
              full_name: contactProfile.full_name,
              avatar_url: contactProfile.avatar_url,
              email: contactProfile.email,
              lastMessage: newMessagePayload,
              lastMsgTimestamp: newMessagePayload.created_at,
              unreadCount: newUnreadForThisConvo,
              isConversation: true,
            });
          }
        }
        return sortConversationsList(updatedConvos);
      });

      // 3. Notify if message is for current user but not current chat / tab not focused
      if (newMessagePayload.receiver_id === currentUserProfile.id && (!selectedUser || selectedUser.id !== newMessagePayload.sender_id || document.hidden)) {
          addNotification(`New message from ${newMessagePayload.sender?.full_name || 'a user'}`, 'info');
          // Total unread count will be updated by its own useEffect that depends on `conversations`
      }
    };

    const handleUpdatedMessage = (updatedMessagePayload) => {
      if (!currentUserProfile?.id) return;
      // 1. Update message in main list if current chat
      if (selectedUser && getConversationKeyForUsers(currentUserProfile.id, selectedUser.id) === updatedMessagePayload.conversation_key) {
        setMessages(prev => prev.map(m => m.id === updatedMessagePayload.id ? updatedMessagePayload : m));
      }

      // 2. Update conversation list (last message if it changed, read status)
      setConversations(prevConvos => {
        const otherUserId = updatedMessagePayload.sender_id === currentUserProfile.id ? updatedMessagePayload.receiver_id : updatedMessagePayload.sender_id;
        const updated = prevConvos.map(convo => {
          if (convo.id === otherUserId) {
            let newLastMsg = convo.lastMessage;
            if (convo.lastMessage?.id === updatedMessagePayload.id) {
              newLastMsg = updatedMessagePayload;
            }
            // If is_read changed for a message to the current user, total unread count will be recalculated by its useEffect.
            // Individual conversation unread counts are tricky to perfectly sync here without more data or refetching for non-active chats.
            // The markMessagesAsRead effect handles the active chat's unread count optimistically.
            return { ...convo, lastMessage: newLastMsg };
          }
          return convo;
        });
        return sortConversationsList(updated);
      });
    };

    const handleDeletedMessage = (deletedMessagePayload) => {
      if (!currentUserProfile?.id) return;
      // 1. Update messages list if current chat
      if (selectedUser && getConversationKeyForUsers(currentUserProfile.id, selectedUser.id) === deletedMessagePayload.conversation_key) {
        setMessages(prev => prev.filter(m => m.id !== deletedMessagePayload.id));
      }

      // 2. Update conversations list
      setConversations(prevConvos => {
        const otherUserId = deletedMessagePayload.sender_id === currentUserProfile.id ? deletedMessagePayload.receiver_id : deletedMessagePayload.sender_id;
        let conversationWasUpdated = false;

        const updatedConvos = prevConvos.map(convo => {
          if (convo.id === otherUserId) {
            conversationWasUpdated = true;
            let newLastMsg = convo.lastMessage;
            let newTimestamp = convo.lastMsgTimestamp;
            let newUnread = convo.unreadCount || 0;

            if (convo.lastMessage?.id === deletedMessagePayload.id) {
              // Last message was deleted, need to fetch the new one for this conversation
              // We will mark it as null for now and fetch outside the map, then update.
              newLastMsg = null; 
              newTimestamp = null; 
            }
            // Adjust unread count if the deleted message was unread and for the current user
            if (deletedMessagePayload.receiver_id === currentUserProfile.id && !deletedMessagePayload.is_read) {
              newUnread = Math.max(0, (convo.unreadCount || 0) - 1); 
            }
            return { ...convo, lastMessage: newLastMsg, lastMsgTimestamp: newTimestamp, unreadCount: newUnread };
          }
          return convo;
        });

        // If the conversation involving the deleted message was found and its last message was the one deleted,
        // fetch new details for that specific conversation.
        if (conversationWasUpdated && updatedConvos.find(c => c.id === otherUserId && c.lastMessage === null)) {
          getSingleConversationDetails(currentUserProfile.id, otherUserId)
            .then(updatedConvoDetails => {
              if (updatedConvoDetails) {
                setConversations(prev => {
                  const finalUpdated = prev.map(c => c.id === otherUserId ? { ...c, ...updatedConvoDetails, lastMsgTimestamp: updatedConvoDetails.lastMessage?.created_at } : c);
                  return sortConversationsList(finalUpdated);
                });
              } else {
                // If details couldn't be fetched (e.g., other user profile gone, though unlikely here)
                // or no more messages, ensure the conversation reflects that (lastMessage is null)
                setConversations(prev => sortConversationsList(prev.map(c => c.id === otherUserId ? {...c, lastMessage: null, lastMsgTimestamp: null} : c)));
              }
            })
            .catch(err => {
              console.error(`Error fetching updated conversation details for ${otherUserId}:`, err);
              // Potentially leave the conversation with lastMessage as null or try to re-sort
              setConversations(prev => sortConversationsList(prev)); 
            });
        }
        return sortConversationsList(updatedConvos);
      });
       // Total unread count will be updated by its own useEffect that depends on `conversations` changes.
    };

    const messagesListener = supabase
      .channel('public-messages-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        (payload) => {
          console.log('Realtime event:', payload);
          if (!currentUserProfile?.id) return; // Double check profile still exists

          // Filter out events that are not relevant to the current user's conversations
          // This basic check helps, but more specific RLS or function calls might be better for large scale.
          const involvedInPayload = payload.new?.sender_id === currentUserProfile.id || payload.new?.receiver_id === currentUserProfile.id ||
                                  payload.old?.sender_id === currentUserProfile.id || payload.old?.receiver_id === currentUserProfile.id;
          
          if (!involvedInPayload && payload.eventType !== 'DELETE') { // For delete, old data might be key
             if (payload.eventType === 'DELETE' && payload.old && (payload.old.sender_id === currentUserProfile.id || payload.old.receiver_id === currentUserProfile.id)) {
                // This is a delete relevant to current user
             } else if (payload.eventType !== 'DELETE') {
                // console.log("RT event not directly involving current user, skipping detailed processing for now.");
                return; 
             }
          }


          switch (payload.eventType) {
            case 'INSERT':
              handleNewMessage(payload.new);
              break;
            case 'UPDATE':
              handleUpdatedMessage(payload.new); // payload.old could be used if needed
              break;
            case 'DELETE':
              if (payload.old && Object.keys(payload.old).length > 0) {
                   // Ensure the deleted message is relevant (e.g. by conversation_key or involved users)
                   // The initial check for `involvedInPayload` (adapted for `payload.old`) should cover this.
                   if (payload.old.sender_id === currentUserProfile.id || payload.old.receiver_id === currentUserProfile.id) {
                        handleDeletedMessage(payload.old);
                   }
              } else {
                  console.warn("RT DELETE event with insufficient old data. May need to refresh.");
                  // Fallback:
                  getConversations(currentUserProfile.id).then(setConversations);
                  getTotalUnreadCount(currentUserProfile.id).then(setTotalUnreadMessages);
              }
              break;
            default:
              break;
          }
        }
      )
      .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
              console.log('Subscribed to messages channel!');
          }
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
              console.error('Messages subscription error/closed:', status, err);
              addNotification('Real-time connection issue. Some updates might be delayed.', 'warning');
              // Optionally attempt to resubscribe or prompt user
          }
      });

    return () => {
      if (messagesListener) {
        supabase.removeChannel(messagesListener).catch(err => console.error("Error removing channel:", err));
      }
    };
  }, [currentUserProfile, selectedUser, addNotification, sortConversationsList]); // Dependencies for the subscription effect

  const getAvatar = useCallback((user) => {
    if (user && user.avatar_url) {
      return <img src={user.avatar_url} alt={user.full_name || user.email} className="w-10 h-10 rounded-full object-cover" />;
    }
    return <FontAwesomeIcon icon={faUserCircle} className="w-10 h-10 text-gray-400" />;
  }, []);

  // Removed getLastMessage and getUnreadCount callbacks, data comes from `conversations` state

  const handleUserSelect = useCallback((user) => { // user here is a profile object from conversations or allUsers
    setSelectedUser(user);
    setEditingMessage(null);
    setNewMessage(''); // Clear message input when changing user
    // Marking messages as read is now handled in the useEffect for fetching messages
  }, []);

  const handleSend = async () => {
    if (!newMessage.trim() && !fileAttachment) return;
    if (!currentUserProfile || !selectedUser) {
      addNotification('Cannot send message: user context is missing.', 'error');
      return;
    }

    let fileUrl = null;
    let fileType = null;

    if (fileAttachment) {
      try {
        // Create a unique file path, e.g., public/user_id/timestamp-filename
        // The 'public' part in the path here refers to how it might be structured within the bucket,
        // not necessarily public access without RLS on the bucket itself.
        // Supabase storage paths usually don't start with 'public/' unless that's a folder you created.
        // A common pattern is just 'user_id/filename' or 'chat_attachments/user_id/filename'.
        // Let's use a folder structure within the bucket for organization.
        const filePath = `chat_attachments/${currentUserProfile.id}/${Date.now()}-${fileAttachment.name}`;
        
        // Assuming 'message-attachments' is your Supabase Storage bucket name
        fileUrl = await uploadFile('message-attachments', filePath, fileAttachment);
        fileType = fileAttachment.type;
        addNotification('File uploaded successfully.', 'success');
      } catch (uploadError) {
        console.error('Error uploading file:', uploadError);
        addNotification(`Error uploading file: ${uploadError.message}`, 'error');
        return; // Stop message sending if file upload fails
      }
    }

    const messageData = {
      sender_id: currentUserProfile.id,
      receiver_id: selectedUser.id,
      content: newMessage.trim(),
      file_url: fileUrl, 
      file_type: fileType,
    };

    try {
      const sentMessage = await sendMessage(messageData); // sendMessage should return the full message object
      // Optimistic update for current chat view
      if (sentMessage) {
        setMessages(prevMessages => [...prevMessages, sentMessage]);
      }
      addNotification('Message sent.', 'success');
      setNewMessage('');
      setFileAttachment(null);
      setFilePreview(null);
      // Real-time subscription will handle updating conversations list and total unread count.
      // No more manual getMessages or getConversations here.
    } catch (error) {
      addNotification(`Error sending message: ${error.message}`, 'error');
    }
  };

  const saveEdit = async () => {
    if (!editingMessage || !newMessage.trim()) return;
    if (!currentUserProfile) return;

    try {
      const updatedMessage = await editMessage(editingMessage.id, newMessage.trim(), currentUserProfile.id);
      // Optimistic update for current chat view
      if (updatedMessage) {
        setMessages(prevMessages => prevMessages.map(msg => msg.id === editingMessage.id ? updatedMessage : msg));
      }
      addNotification('Message edited.', 'success');
      setNewMessage('');
      setEditingMessage(null);
      // Real-time subscription will handle updating conversations list (last message).
      // No more manual getMessages or getConversations here.
    } catch (error) {
      addNotification(`Error editing message: ${error.message}`, 'error');
    }
  };

  const deleteMessageLocal = async (messageId) => { 
    if (!currentUserProfile || !selectedUser) return;
    
    const messageToDelete = messages.find(msg => msg.id === messageId);
    if (!messageToDelete) return;

    // Part 4: Delete file from Supabase Storage if it exists
    if (messageToDelete.file_url) {
      try {
        // Assuming 'message-attachments' is the bucket name, though deleteFileByUrl should parse it.
        // The deleteFileByUrl function in database.js needs to correctly parse the bucket and path from the URL.
        await deleteFileByUrl(messageToDelete.file_url);
        addNotification('Associated file deleted from storage.', 'info');
      } catch (fileDeleteError) {
        console.error('Error deleting file from storage:', fileDeleteError);
        addNotification(`Could not delete file from storage: ${fileDeleteError.message}. Message will still be deleted.`, 'warning');
        // Do not block message deletion if file deletion fails, but notify the user.
      }
    }

    try {
      await deleteMessage(messageId, currentUserProfile.id);
      // Optimistic update for current chat view
      setMessages(prevMessages => prevMessages.filter(msg => msg.id !== messageId));
      addNotification('Message deleted.', 'info');
      // Real-time subscription will handle updating conversations list (last message, unread count).
      // No more manual getMessages or getConversations here.
    } catch (error) {
      addNotification(`Error deleting message: ${error.message}`, 'error');
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFileAttachment(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(file.name);
      }
    }
  };

  const removeAttachment = () => {
    setFileAttachment(null);
    setFilePreview(null);
    const fileInput = document.getElementById('file-attachment-input');
    if (fileInput) fileInput.value = '';
  };

  const renderFilePreview = (message) => {
    if (!message.file_url) return null;
    if (message.file_type?.startsWith('image/')) {
      return <img src={message.file_url} alt="attachment" className="max-w-xs max-h-xs my-2 rounded" />;
    }
    return (
      <a href={message.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline my-2 block">
        <FontAwesomeIcon icon={faFileAlt} className="mr-2" />
        {message.file_url.substring(message.file_url.lastIndexOf('/') + 1) || 'Attached File'}
      </a>
    );
  };
  
  const sidebarUsers = useMemo(() => {
    // Combine existing conversations with other users who haven't had a conversation yet.
    const existingConversationUserIds = conversations.map(convo => convo.id); // convo.id is the other user's ID
    const usersWithoutConversation = allUsers.filter(user => !existingConversationUserIds.includes(user.id));

    const combinedList = [
      ...conversations.map(convo => ({
        id: convo.id, // This is the other user's ID
        full_name: convo.full_name,
        email: convo.email,
        avatar_url: convo.avatar_url,
        lastMsg: convo.lastMessage?.content || '',
        lastMsgTimestamp: convo.lastMessage?.created_at,
        unreadCount: convo.unreadCount || 0,
        isConversation: true,
      })),
      ...usersWithoutConversation.map(user => ({
        ...user, // Spread user profile
        lastMsg: 'Start a conversation',
        unreadCount: 0,
        isConversation: false,
      }))
    ];
    
    // Filter by search term
    const filtered = combinedList.filter(user => {
      const name = user.full_name || '';
      const email = user.email || '';
      return name.toLowerCase().includes(searchTerm.toLowerCase()) || email.toLowerCase().includes(searchTerm.toLowerCase());
    });

    // Sort: conversations with messages first (isConversation), then by last message time, then users without conversations by name
    return filtered.sort((a, b) => {
        const aIsActiveConvo = a.isConversation && (a.lastMessage || a.lastMsgTimestamp);
        const bIsActiveConvo = b.isConversation && (b.lastMessage || b.lastMsgTimestamp);

        if (aIsActiveConvo && !bIsActiveConvo) return -1;
        if (!aIsActiveConvo && bIsActiveConvo) return 1;

        if (aIsActiveConvo && bIsActiveConvo) {
            const timeA = new Date(a.lastMsgTimestamp || a.lastMessage?.created_at || 0).getTime();
            const timeB = new Date(b.lastMsgTimestamp || b.lastMessage?.created_at || 0).getTime();
            return timeB - timeA; // Most recent first
        }
        
        // Fallback for users without active convos (or new users from allUsers list) - sort by name
        return (a.full_name || a.email || '').localeCompare(b.full_name || b.email || '');
    });

  }, [conversations, allUsers, searchTerm]);

  if (loadingUsers && !authUser) {
    return (
      <div className="flex justify-center items-center h-screen">
        <FontAwesomeIcon icon={faSpinner} spin size="3x" />
        <p className="ml-4 text-xl">Loading user data...</p>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-center p-4">
        <FontAwesomeIcon icon={faExclamationCircle} size="3x" className="text-red-500 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
        <p className="text-gray-600">Please log in to access the message inbox.</p>
      </div>
    );
  }

  if (loadingUsers && !currentUserProfile) { // Show if authUser is present but profile/users still loading
     return (
      <div className="flex justify-center items-center h-screen">
        <FontAwesomeIcon icon={faSpinner} spin size="3x" />
        <p className="ml-4 text-xl">Loading your profile and contacts...</p>
      </div>
    );
  }

  if (!currentUserProfile) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-center p-4">
        <FontAwesomeIcon icon={faExclamationCircle} size="3x" className="text-yellow-500 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Profile Not Found</h2>
        <p className="text-gray-600">We couldn't load your profile information. Please try again later or contact support.</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-var(--navbar-height))] bg-gray-100">
      {/* Sidebar */}
      <div className="w-1/3 lg:w-1/4 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center mb-3">
            {getAvatar(currentUserProfile)}
            <div className="ml-3">
              <h2 className="text-lg font-semibold truncate" title={currentUserProfile.full_name || currentUserProfile.email}>{currentUserProfile.full_name || currentUserProfile.email}</h2>
            </div>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search or start new chat..."
              className="w-full p-2 border border-gray-300 rounded-md pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          {totalUnreadMessages > 0 && (
            <p className="text-sm text-blue-500 mt-2">Total Unread: {totalUnreadMessages}</p>
          )}
        </div>
        <div className="overflow-y-auto flex-grow">
          {(loadingUsers || loadingConversations) && <div className="p-4 text-center text-gray-500">Loading contacts...</div>}
          {!(loadingUsers || loadingConversations) && sidebarUsers.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              {searchTerm ? 'No users match your search.' : 'No contacts yet. Search to start a new chat.'}
            </div>
          )}
          {!(loadingUsers || loadingConversations) && sidebarUsers.map(user => (
            <div
              key={user.id}
              className={`p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-200 ${selectedUser?.id === user.id ? 'bg-gray-100' : ''}`}
              onClick={() => handleUserSelect(user)} // user here is a profile object
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {getAvatar(user)}
                  <div className="ml-3">
                    <h3 className="font-semibold text-sm truncate" title={user.full_name || user.email}>{user.full_name || user.email}</h3>
                    {user.lastMsg && <p className="text-xs text-gray-500 truncate max-w-[150px]">{user.lastMsg}</p>}
                  </div>
                </div>
                {user.unreadCount > 0 && (
                  <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                    {user.unreadCount}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="w-2/3 lg:w-3/4 flex flex-col bg-gray-50">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b border-gray-200 flex items-center">
              {getAvatar(selectedUser)}
              <div className="ml-3">
                <h2 className="text-lg font-semibold truncate" title={selectedUser.full_name || selectedUser.email}>{selectedUser.full_name || selectedUser.email}</h2>
                {/* Online status can be added later */}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-grow p-4 overflow-y-auto space-y-4">
              {loadingMessages && (
                <div className="flex justify-center items-center h-full">
                  <FontAwesomeIcon icon={faSpinner} spin size="2x" />
                  <p className="ml-2">Loading messages...</p>
                </div>
              )}
              {!loadingMessages && messages.length === 0 && (
                <div className="text-center text-gray-500 mt-10">
                  No messages yet. Start the conversation!
                </div>
              )}
              {!loadingMessages && messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender_id === currentUserProfile?.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-md lg:max-w-lg p-3 rounded-lg ${msg.sender_id === currentUserProfile?.id ? 'bg-blue-500 text-white' : 'bg-white text-gray-800 shadow'}`}>
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p> {/* Ensure content wraps */}
                    {renderFilePreview(msg)}
                    <div className="text-xs mt-1 opacity-75 flex items-center">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {msg.sender_id === currentUserProfile?.id && (
                        <>
                          <button onClick={() => { setEditingMessage(msg); setNewMessage(msg.content); }} className="ml-2 hover:text-yellow-300">
                            <FontAwesomeIcon icon={faEdit} size="xs"/>
                          </button>
                          <button onClick={() => deleteMessageLocal(msg.id)} className="ml-2 hover:text-red-300">
                            <FontAwesomeIcon icon={faTrashAlt} size="xs"/>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              {editingMessage && (
                <div className="mb-2 text-sm text-gray-600">
                  Editing message...{' '}
                  <button onClick={() => { setEditingMessage(null); setNewMessage(''); }} className="text-blue-500 hover:underline">Cancel</button>
                </div>
              )}
              {filePreview && (
                <div className="mb-2 p-2 border rounded-md bg-gray-50 flex justify-between items-center">
                  <div>
                    {fileAttachment?.type?.startsWith('image/') ? (
                      <img src={filePreview} alt="Preview" className="max-h-20 rounded" />
                    ) : (
                      <p className="text-sm flex items-center"><FontAwesomeIcon icon={faFileAlt} className="mr-2" /> {filePreview}</p>
                    )}
                  </div>
                  <button onClick={removeAttachment} className="text-red-500 hover:text-red-700 text-xl leading-none p-1">&times;</button>
                </div>
              )}
              <div className="flex items-center">
                <input
                  id="file-attachment-input"
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="file-attachment-input" className="mr-2 p-2 text-gray-600 hover:text-blue-500 cursor-pointer">
                  <FontAwesomeIcon icon={faFileAlt} size="lg" />
                </label>
                <input
                  type="text"
                  className="flex-grow p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault(); // Prevent newline in input
                      editingMessage ? saveEdit() : handleSend();
                    }
                  }}
                />
                <button
                  onClick={editingMessage ? saveEdit : handleSend}
                  disabled={(!newMessage.trim() && !fileAttachment) || loadingMessages}
                  className="bg-blue-500 text-white p-2 rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={editingMessage ? faCheckCircle : faPaperPlane} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-grow flex flex-col justify-center items-center text-center p-4">
            <FontAwesomeIcon icon={faUserCircle} size="6x" className="text-gray-300 mb-6" />
            <h2 className="text-2xl font-semibold text-gray-700">Select or start a conversation</h2>
            <p className="text-gray-500 mt-2">
              { (loadingUsers || loadingConversations) ? 'Loading contacts...' :
                (allUsers.length > 0 || conversations.length > 0) ? 'Choose someone from the list on the left or search to start a new chat.' : 'There are no other users available to message right now.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageInbox;
