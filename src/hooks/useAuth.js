import { useState, useEffect, useContext, useCallback } from 'react'; // Added useCallback
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { UserRoleContext } from '../context/UserRoleContext'; 

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null); // Added profile state 
  const [loading, setLoading] = useState(true);
  const { setUserRole } = useContext(UserRoleContext); 
  const navigate = useNavigate();

  const fetchUserProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      // setUserRole(null); // Assuming role might be part of profile or fetched based on the role
      return;
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        setProfile(null);
        // setUserRole(null);
        return;
      }
      setProfile(data);
      // Example: if your profile table has a 'role' column
      // if (data && data.role) setUserRole(data.role); 
    } catch (error) {
      console.error('Exception fetching user profile:', error);
      setProfile(null);
      // setUserRole(null);
    }
  }, [/*setUserRole*/]); // Removed setUserRole from dependencies for now, can be added if role logic is tied here

  useEffect(() => {
    setLoading(true);
    const getCurrentSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error getting session:", error);
        setLoading(false);
        return;
      }
      
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setProfile(null);
        // setUserRole(null);
      }
      setLoading(false);
    };

    getCurrentSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setLoading(true);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setProfile(null);
          // setUserRole(null); 
        }
        setLoading(false);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [fetchUserProfile/*, setUserRole*/]);

  const login = async (email, password) => {
    setLoading(true);
    const { data: loginData, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      throw error;
    }
    if (loginData?.user) {
      await fetchUserProfile(loginData.user.id);
    }
    setLoading(false);
    // Role fetching might happen here or in onAuthStateChange
  };

  const signUp = async (email, password, metadata = {}) => {
    setLoading(true);
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata }, 
    });

    if (signUpError) {
      setLoading(false);
      throw signUpError;
    }

    if (signUpData?.user) {
      // Create a profile entry
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{ id: signUpData.user.id, ...metadata }]); // Ensure metadata keys match profile columns

      if (profileError) {
        console.error('Error creating user profile:', profileError);
        // Optionally, handle this error, e.g., by trying to delete the auth user or notifying the user
      } else {
        // Profile created, now fetch it to update the state
        await fetchUserProfile(signUpData.user.id);
      }
    }
    setLoading(false);
  };

  const logout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setLoading(false);
    if (error) throw error;
    setUser(null);
    setProfile(null); // Clear profile on logout
    // setUserRole(null); 
  };

  // ... existing sendPasswordResetEmail and updateUserPassword functions ...
  const sendPasswordResetEmail = async (email) => {
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/update-password', // URL to your password update page
    });
    setLoading(false);
    if (error) throw error;
  };

  const updateUserPassword = async (newPassword) => {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) throw error;
  };

  return { user, profile, login, signUp, logout, loading, sendPasswordResetEmail, updateUserPassword }; // Added profile
};

export default useAuth;