// User types
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'tenant' | 'landlord' | 'admin';
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile extends User {
  organization_id: string;
  subscription_status: 'active' | 'trial' | 'expired' | 'cancelled';
  preferences: Record<string, any>;
}

// Property types
export interface Property {
  id: string;
  name: string;
  address: string;
  type: 'apartment' | 'house' | 'condo' | 'commercial';
  units_count: number;
  landlord_id: string;
  created_at: string;
  updated_at: string;
}

export interface Unit {
  id: string;
  property_id: string;
  unit_number: string;
  bedrooms: number;
  bathrooms: number;
  square_feet?: number;
  rent_amount: number;
  status: 'available' | 'occupied' | 'maintenance';
  created_at: string;
  updated_at: string;
}

// Tenancy types
export interface Tenancy {
  id: string;
  unit_id: string;
  tenant_id: string;
  start_date: string;
  end_date: string;
  rent_amount: number;
  security_deposit: number;
  status: 'active' | 'pending' | 'expired' | 'terminated';
  created_at: string;
  updated_at: string;
}

// Payment types
export interface Payment {
  id: string;
  tenancy_id: string;
  amount: number;
  type: 'rent' | 'security_deposit' | 'late_fee' | 'utility';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  due_date: string;
  paid_date?: string;
  payment_method?: string;
  stripe_payment_intent_id?: string;
  created_at: string;
  updated_at: string;
}

// Message types
export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  type: 'text' | 'image' | 'document';
  read: boolean;
  created_at: string;
}

// Document types
export interface Document {
  id: string;
  tenancy_id: string;
  type: 'lease' | 'receipt' | 'notice' | 'other';
  name: string;
  file_url: string;
  file_size: number;
  uploaded_by: string;
  created_at: string;
}

// Navigation types
export type RootStackParamList = {
  // Auth screens
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  
  // Main app screens
  TenantDashboard: undefined;
  LandlordDashboard: undefined;
  RentPayment: { tenancyId: string };
  LeaseDocuments: undefined;
  MaintenanceRequests: undefined;
  TenantMessages: undefined;
  PropertyManagement: undefined;
  TenantManagement: { propertyId?: string };
  RentCollection: undefined;
  LandlordMessages: undefined;
  Analytics: undefined;
  Profile: undefined;
  Settings: undefined;
  Notifications: undefined;
};

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface DashboardData {
  user: UserProfile;
  properties?: Property[];
  tenancies?: Tenancy[];
  payments?: Payment[];
  messages?: Message[];
  documents?: Document[];
  analytics?: {
    totalRent: number;
    paidRent: number;
    pendingRent: number;
    occupancyRate: number;
  };
}