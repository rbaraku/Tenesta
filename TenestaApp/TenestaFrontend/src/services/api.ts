import { supabase } from './supabase';
import { ApiResponse, DashboardData, User, Property, Payment } from '../types';

const BASE_URL = (process.env['EXPO_PUBLIC_SUPABASE_URL'] || 'https://skjaxjaawqvjjhyxnxls.supabase.co') + '/functions/v1';

class ApiService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const { data: { session } } = await supabase.auth.getSession();
    
    const headers = {
      'Content-Type': 'application/json',
      ...(session?.access_token && {
        'Authorization': `Bearer ${session.access_token}`,
      }),
      ...options.headers,
    };

    try {
      console.log(`🌐 API Request: ${options.method || 'GET'} ${BASE_URL}${endpoint}`);
      console.log('📤 Request Headers:', headers);
      if (options.body) {
        console.log('📤 Request Body:', options.body);
      }

      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      console.log(`📥 Response Status: ${response.status} ${response.statusText}`);

      const data = await response.json();
      console.log('📥 Response Data:', JSON.stringify(data, null, 2));

      if (!response.ok) {
        console.error('❌ API Error Response:', data);
        return {
          data: null as T,
          error: data.error || `Request failed with status ${response.status}`,
        };
      }

      console.log('✅ API Request Successful');
      return {
        data,
        message: data.message,
      };
    } catch (error) {
      console.error('❌ API Network Error:', error);
      return {
        data: null as T,
        error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  // Authentication
  async loginUser(email: string, password: string) {
    return this.makeRequest<{ user: User; session: any }>('/auth-handler', {
      method: 'POST',
      body: JSON.stringify({
        action: 'login',
        email,
        password,
      }),
    });
  }

  async registerUser(email: string, password: string, fullName: string, role: 'tenant' | 'landlord') {
    return this.makeRequest<{ user: User }>('/auth-handler', {
      method: 'POST',
      body: JSON.stringify({
        action: 'register',
        email,
        password,
        full_name: fullName,
        role,
      }),
    });
  }

  // Dashboard APIs
  async getTenantDashboard() {
    return this.makeRequest<DashboardData>('/tenant-dashboard', {
      method: 'GET',
    });
  }

  async getLandlordDashboard() {
    return this.makeRequest<any>('/landlord-dashboard', {
      method: 'GET',
    });
  }

  // User Profile
  async getUserProfile() {
    return this.makeRequest<User>('/user-profile', {
      method: 'GET',
    });
  }

  async updateUserProfile(updates: Partial<User>) {
    return this.makeRequest<User>('/user-profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Property Management
  async getProperties() {
    return this.makeRequest<any>('/property-management', {
      method: 'POST',
      body: JSON.stringify({
        action: 'list_properties'
      }),
    });
  }

  async createProperty(propertyData: Omit<Property, 'id' | 'created_at' | 'updated_at'>) {
    return this.makeRequest<any>('/property-management', {
      method: 'POST',
      body: JSON.stringify({
        action: 'create_property',
        address: propertyData.address,
        city: 'Unknown', // Default values since Edge Function expects them
        state: 'Unknown',
        zip_code: '00000',
        rent_amount: 1000, // Default rent amount
        security_deposit: 500, // Default security deposit
        status: 'available'
      }),
    });
  }

  async updateProperty(propertyId: string, updates: Partial<Property>) {
    return this.makeRequest<any>('/property-management', {
      method: 'POST',
      body: JSON.stringify({
        action: 'update_property',
        property_id: propertyId,
        address: updates.address,
        rent_amount: 1000, // Fixed amount for now
        status: 'available' // Fixed status for now
      }),
    });
  }

  async deleteProperty(propertyId: string) {
    return this.makeRequest<any>('/property-management', {
      method: 'POST',
      body: JSON.stringify({
        action: 'delete_property',
        property_id: propertyId
      }),
    });
  }

  async getPropertyDetails(propertyId: string) {
    return this.makeRequest<any>('/property-management', {
      method: 'POST',
      body: JSON.stringify({
        action: 'get_property',
        property_id: propertyId
      }),
    });
  }

  // Payment Processing  
  async getPayments() {
    // For now, get payments through landlord dashboard
    const dashboardResult = await this.getLandlordDashboard();
    if (dashboardResult.data && dashboardResult.data.rent_collection) {
      // Extract payment data from dashboard
      return {
        data: dashboardResult.data.rent_collection.overdue_payments || [],
        error: null
      };
    }
    return { data: [], error: null };
  }

  async processPayment(paymentData: {
    tenancy_id: string;
    amount: number;
    payment_method: string;
  }) {
    return this.makeRequest<{ payment: Payment; client_secret: string }>('/payment-process', {
      method: 'POST',
      body: JSON.stringify({
        action: 'create_intent',
        payment_id: paymentData.tenancy_id,
        amount: paymentData.amount
      }),
    });
  }

  // Messaging
  async getMessages() {
    return this.makeRequest<any>('/messaging', {
      method: 'GET',
    });
  }

  async sendMessage(recipientId: string, content: string) {
    return this.makeRequest<any>('/messaging', {
      method: 'POST',
      body: JSON.stringify({
        recipient_id: recipientId,
        content,
        type: 'text',
      }),
    });
  }

  // Lease Documents
  async getLeaseDocuments() {
    return this.makeRequest<any>('/lease-documents', {
      method: 'GET',
    });
  }

  // Notifications
  async getNotifications() {
    return this.makeRequest<any>('/notifications', {
      method: 'GET',
    });
  }

  // Landlord-specific APIs
  async getRentCollectionData() {
    const dashboardResult = await this.getLandlordDashboard();
    if (dashboardResult.data && dashboardResult.data.rent_collection) {
      return {
        data: dashboardResult.data.rent_collection,
        error: null
      };
    }
    return { data: null, error: 'Failed to get rent collection data' };
  }

  async getPortfolioData() {
    const dashboardResult = await this.getLandlordDashboard();
    if (dashboardResult.data && dashboardResult.data.portfolio_summary) {
      return {
        data: dashboardResult.data.portfolio_summary,
        error: null
      };
    }
    return { data: null, error: 'Failed to get portfolio data' };
  }

  async getTenantSummaries() {
    const dashboardResult = await this.getLandlordDashboard();
    if (dashboardResult.data && dashboardResult.data.properties) {
      // Extract tenant data from properties
      const tenantSummaries = dashboardResult.data.properties.flatMap((property: any) => 
        (property.tenancies || []).map((tenancy: any) => ({
          id: tenancy.tenant?.id || '',
          name: tenancy.tenant?.profile?.full_name || tenancy.tenant?.email || 'Unknown',
          email: tenancy.tenant?.email || '',
          unit: property.address || 'Unknown',
          property: property.address || 'Unknown',
          rentAmount: tenancy.rent_amount || 0,
          leaseEndDate: tenancy.lease_end || '',
          paymentStatus: tenancy.payments?.[0]?.status || 'unknown',
          lastPaymentDate: tenancy.payments?.[0]?.paid_date || null,
          daysUntilLeaseEnd: 0 // Calculate if needed
        }))
      );
      return {
        data: tenantSummaries,
        error: null
      };
    }
    return { data: [], error: 'Failed to get tenant summaries' };
  }

  async updatePaymentStatus(paymentId: string, status: string) {
    return this.makeRequest<any>('/payment-process', {
      method: 'POST',
      body: JSON.stringify({
        action: 'mark_paid',
        payment_id: paymentId
      }),
    });
  }

  async sendPaymentReminder(paymentId: string) {
    return this.makeRequest<any>('/messaging-system', {
      method: 'POST',
      body: JSON.stringify({
        action: 'send_payment_reminder',
        payment_id: paymentId
      }),
    });
  }
}

export const apiService = new ApiService();