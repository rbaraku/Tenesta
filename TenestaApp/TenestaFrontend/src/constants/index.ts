export * from './colors';
export * from './typography';
export * from './spacing';

// Safe environment variable access with fallbacks
export const API_CONFIG = {
  SUPABASE_URL: 'https://skjaxjaawqvjjhyxnxls.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNramF4amFhd3F2ampoeXhueGxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNzg3NzEsImV4cCI6MjA2NTk1NDc3MX0.ymoyzzqJtAjWejrTqUTsMjKTYh0iZQxAzpKpgJx6OB0',
  STRIPE_PUBLISHABLE_KEY: 'pk_test_demo_key',
} as const;

export const ROUTES = {
  // Auth
  SIGN_IN: 'SignIn',
  SIGN_UP: 'SignUp',
  FORGOT_PASSWORD: 'ForgotPassword',
  
  // Main App
  TENANT_DASHBOARD: 'TenantDashboard',
  LANDLORD_DASHBOARD: 'LandlordDashboard',
  
  // Tenant
  RENT_PAYMENT: 'RentPayment',
  LEASE_DOCUMENTS: 'LeaseDocuments',
  MAINTENANCE_REQUESTS: 'MaintenanceRequests',
  TENANT_MESSAGES: 'TenantMessages',
  
  // Landlord
  PROPERTY_MANAGEMENT: 'PropertyManagement',
  TENANT_MANAGEMENT: 'TenantManagement',
  RENT_COLLECTION: 'RentCollection',
  LANDLORD_MESSAGES: 'LandlordMessages',
  ANALYTICS: 'Analytics',
  
  // Shared
  PROFILE: 'Profile',
  SETTINGS: 'Settings',
  NOTIFICATIONS: 'Notifications',
} as const;

export const STORAGE_KEYS = {
  USER_TOKEN: 'user_token',
  USER_PROFILE: 'user_profile',
  THEME_PREFERENCE: 'theme_preference',
} as const;