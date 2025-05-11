import React, { useState, useEffect, useContext } from 'react';
import { supabase } from '../services/supabaseClient';
import useAuth from '../hooks/useAuth';
import { UserRoleContext } from '../context/UserRoleContext'; // May need adjustment
import defaultLogo from '/public/images/default-logo.png'; // Check path
import './ProfilePage.css';
import { NotificationContext } from '../context/NotificationContext';

const ProfilePage = () => {
  const { user, loading: authLoading } = useAuth();
  const { addNotification } = useContext(NotificationContext);
  // const { userRole, setUserRole } = useContext(UserRoleContext); // Role might come from user.user_metadata

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [position, setPosition] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(defaultLogo);
  const [uploading, setUploading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (user) {
      // Fetch profile data from Supabase 'profiles' table (assuming you have one)
      // or from user.user_metadata
      setLoadingData(true);
      setEmail(user.email); // Email is usually from auth user object

      // Example: Fetching from a 'profiles' table
      const fetchProfile = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles') // Assuming a 'profiles' table
            .select('full_name, position, phone, avatar_url')
            .eq('id', user.id)
            .single();

          if (error && error.code !== 'PGRST116') { // PGRST116: 'single' row not found
            throw error;
          }
          if (data) {
            setName(data.full_name || '');
            setPosition(data.position || '');
            setPhone(data.phone || '');
            setAvatarUrl(data.avatar_url || defaultLogo);
            // If role is stored in profiles table:
            // setUserRole(data.role || 'user'); 
          } else {
            // Initialize with defaults or metadata if profile doesn't exist
            setName(user.user_metadata?.full_name || '');
            // setPosition(user.user_metadata?.position || ''); // if you store it in metadata
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
          addNotification('Failed to load profile data.', 'error');
        } finally {
          setLoadingData(false);
        }
      };

      fetchProfile();
    } else {
      setLoadingData(false);
    }
  }, [user, addNotification]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!user) return;

    setUploading(true);
    try {
      // Update user metadata (for things like name if not in a separate table)
      // const { error: metaError } = await supabase.auth.updateUser({
      //   data: { full_name: name } 
      // });
      // if (metaError) throw metaError;

      // Upsert profile data into 'profiles' table
      const updates = {
        id: user.id,
        full_name: name,
        position,
        phone,
        avatar_url: avatarUrl, // This assumes avatarUrl is updated after upload
        updated_at: new Date(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);

      if (error) {
        throw error;
      }
      addNotification('Profile updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      addNotification(`Error updating profile: ${error.message}`, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleAvatarUpload = async (event) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    if (!user) return;

    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}.${fileExt}`; // Unique filename using user ID
    const filePath = `avatars/${fileName}`;

    setUploading(true);
    try {
      // Remove old avatar if it exists and you want to replace it
      // This requires listing files or knowing the old avatar's path structure
      // For simplicity, this example overwrites or creates a new one.
      // Consider deleting the old avatar if the extension changes or if you want to clean up.

      const { error: uploadError } = await supabase.storage
        .from('avatars') // Supabase storage bucket name
        .upload(filePath, file, { upsert: true }); // upsert:true will overwrite if exists

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL for the uploaded avatar
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      if (!data.publicUrl) {
        throw new Error("Could not get public URL for avatar.");
      }
      
      setAvatarUrl(data.publicUrl); // Update state to show new avatar

      // Update the avatar_url in the user's profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', user.id);

      if (profileError) {
        throw profileError;
      }

      addNotification('Avatar uploaded successfully!', 'success');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      addNotification(`Error uploading avatar: ${error.message}`, 'error');
    } finally {
      setUploading(false);
    }
  };

  if (authLoading || loadingData) {
    return <div>Loading profile...</div>;
  }

  if (!user) {
    return <div>Please log in to view your profile.</div>; // Or redirect
  }

  return (
    <div className="profile-page">
      <h2>User Profile</h2>
      <form onSubmit={handleProfileUpdate} className="profile-form">
        <div className="avatar-section">
          <img src={avatarUrl || defaultLogo} alt="User Avatar" className="avatar-preview" />
          <label htmlFor="avatar-upload" className="avatar-upload-label">
            {uploading ? 'Uploading...' : 'Change Avatar'}
          </label>
          <input
            type="file"
            id="avatar-upload"
            accept="image/*"
            onChange={handleAvatarUpload}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </div>

        <div className="form-group">
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={uploading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            disabled // Email usually not changed here directly, or requires special handling
          />
        </div>
        <div className="form-group">
          <label htmlFor="position">Position:</label>
          <input
            type="text"
            id="position"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            disabled={uploading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="phone">Phone:</label>
          <input
            type="tel"
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={uploading}
          />
        </div>
        <button type="submit" disabled={uploading}>
          {uploading ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
};

export default ProfilePage;