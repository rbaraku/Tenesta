import { createClient } from '@supabase/supabase-js';

// Secure configuration - no fallbacks with real credentials
const SUPABASE_URL = process.env['EXPO_PUBLIC_SUPABASE_URL'];
const SUPABASE_ANON_KEY = process.env['EXPO_PUBLIC_SUPABASE_ANON_KEY'];

// Validate environment variables are provided
if (!SUPABASE_URL || !SUPABASE_URL.startsWith('http')) {
  throw new Error('EXPO_PUBLIC_SUPABASE_URL environment variable is required and must be a valid URL');
}

if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.length < 50) {
  throw new Error('EXPO_PUBLIC_SUPABASE_ANON_KEY environment variable is required and must be a valid JWT token');
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