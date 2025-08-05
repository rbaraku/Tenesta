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

// Maintenance Request types
export interface MaintenanceRequest {
  id: string;
  tenancy_id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'submitted' | 'in_progress' | 'completed' | 'cancelled';
  category: 'plumbing' | 'electrical' | 'hvac' | 'appliance' | 'general' | 'other';
  created_at: string;
  updated_at: string;
  completed_at?: string;
  assigned_to?: string;
  photos?: string[];
  notes?: string;
}

// Notification types
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'payment' | 'maintenance' | 'lease' | 'message' | 'system';
  status: 'unread' | 'read';
  action_url?: string;
  metadata?: Record<string, any>;
  created_at: string;
  read_at?: string;
}

// Dispute types
export interface Dispute {
  id: string;
  tenancy_id: string;
  type: 'rent' | 'deposit' | 'maintenance' | 'eviction' | 'other';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  title: string;
  description: string;
  amount?: number;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

// Enhanced Property and Unit types with amenities
export interface PropertyAmenity {
  id: string;
  name: string;
  description?: string;
  category: 'building' | 'unit' | 'outdoor' | 'parking' | 'other';
}

export interface EnhancedProperty extends Property {
  amenities?: PropertyAmenity[];
  description?: string;
  rules?: string[];
  emergency_contact?: {
    name: string;
    phone: string;
    email?: string;
  };
}

export interface EnhancedUnit extends Unit {
  amenities?: string[];
  description?: string;
  lease_terms?: {
    lease_start: string;
    lease_end: string;
    rent_due_date: number; // day of month
    late_fee_amount?: number;
    late_fee_grace_days?: number;
  };
}

// Tenant Dashboard specific data structure
export interface TenantDashboardData {
  user_profile: UserProfile;
  current_tenancy?: Tenancy & {
    property: EnhancedProperty;
    unit?: EnhancedUnit;
  };
  payment_status?: Payment;
  upcoming_payments: Payment[];
  recent_payments: Payment[];
  active_disputes: Dispute[];
  unread_messages: Message[];
  notifications: Notification[];
  property_details?: EnhancedProperty;
  lease_documents: Document[];
  maintenance_requests?: MaintenanceRequest[];
}

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

// Landlord-specific dashboard data structures
export interface LandlordPortfolioData {
  totalProperties: number;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  maintenanceUnits: number;
  occupancyRate: number;
  totalMonthlyRent: number;
  averageRentPerUnit: number;
}

export interface RentCollectionData {
  totalExpected: number;
  totalCollected: number;  
  totalPending: number;
  totalOverdue: number;
  collectionRate: number;
  overdueCount: number;
  pendingCount: number;
}

export interface TenantSummary {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  unit: string;
  property: string;
  rentAmount: number;
  leaseEndDate: string;
  paymentStatus: 'current' | 'pending' | 'overdue';
  lastPaymentDate?: string;
  daysUntilLeaseEnd: number;
}

export interface MaintenanceSummary {
  totalRequests: number;
  pendingRequests: number;
  inProgressRequests: number;
  urgentRequests: number;
  averageResolutionTime: number;
  monthlyRequestCount: number;
}

export interface FinancialSummary {
  monthlyIncome: number;
  monthlyExpenses: number;
  netIncome: number;
  ytdIncome: number;
  ytdExpenses: number;
  incomeGrowth: number;
  expenseCategories: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
}

export interface LandlordActivity {
  id: string;
  type: 'payment' | 'maintenance' | 'lease' | 'tenant' | 'system';
  title: string;
  description: string;
  timestamp: string;
  property?: string;
  unit?: string;
  tenant?: string;
  amount?: number;
  status?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface PropertyMetrics {
  id: string;
  name: string;
  address: string;
  totalUnits: number;
  occupiedUnits: number;
  monthlyIncome: number;
  occupancyRate: number;
  maintenanceRequests: number;
  avgRentPerUnit: number;
  lastInspectionDate?: string;
  nextInspectionDue?: string;
}

// Enhanced Landlord Dashboard Data
export interface LandlordDashboardData {
  user: UserProfile;
  portfolio: LandlordPortfolioData;
  rentCollection: RentCollectionData;
  tenantSummaries: TenantSummary[];
  maintenanceSummary: MaintenanceSummary;
  financialSummary: FinancialSummary;
  recentActivity: LandlordActivity[];
  propertyMetrics: PropertyMetrics[];
  upcomingEvents: Array<{
    id: string;
    type: 'lease_expiry' | 'inspection' | 'maintenance' | 'payment_due';
    title: string;
    date: string;
    property: string;
    unit?: string;
    priority: 'low' | 'medium' | 'high';
  }>;
}