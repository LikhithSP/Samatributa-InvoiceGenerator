// src/utils/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://enkcmybhwzayjwrheqzt.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVua2NteWJod3pheWp3cmhlcXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MDA4MTMsImV4cCI6MjA2MjM3NjgxM30.z7_hdK3jT2x6JBgJZwXYrxF_qJf7M0GH3lRXrHyHJ-U";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
