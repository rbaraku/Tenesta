import { createClient } from '@supabase/supabase-js';

// Fallback configuration for development
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://skjaxjaawqvjjhyxnxls.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNramF4amFhd3F2ampoeXhueGxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNzg3NzEsImV4cCI6MjA2NTk1NDc3MX0.ymoyzzqJtAjWejrTqUTsMjKTYh0iZQxAzpKpgJx6OB0';

if (!SUPABASE_URL.startsWith('http')) {
  console.warn('Invalid Supabase URL, using fallback');
}

if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.length < 50) {
  console.warn('Invalid Supabase key, using fallback');
}

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// Auth helper functions
export const authService = {
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { data, error };
    } catch (err) {
      console.error('Sign in error:', err);
      return { data: null, error: { message: 'Connection error' } };
    }
  },

  async signUp(email: string, password: string, fullName: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      return { data, error };
    } catch (err) {
      console.error('Sign up error:', err);
      return { data: null, error: { message: 'Connection error' } };
    }
  },

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (err) {
      console.error('Sign out error:', err);
      return { error: { message: 'Connection error' } };
    }
  },

  async resetPassword(email: string) {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email);
      return { data, error };
    } catch (err) {
      console.error('Reset password error:', err);
      return { data: null, error: { message: 'Connection error' } };
    }
  },

  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      return { user, error };
    } catch (err) {
      console.error('Get user error:', err);
      return { user: null, error: { message: 'Connection error' } };
    }
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    try {
      return supabase.auth.onAuthStateChange(callback);
    } catch (err) {
      console.error('Auth state change error:', err);
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
  },
};