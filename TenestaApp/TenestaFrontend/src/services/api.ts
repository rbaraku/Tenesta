import { supabase } from './supabase';
import { ApiResponse, DashboardData, User, Property, Payment } from '../types';

const BASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL + '/functions/v1';

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
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          data: null as T,
          error: data.error || 'Request failed',
        };
      }

      return {
        data,
        message: data.message,
      };
    } catch (error) {
      console.error('API Request Error:', error);
      return {
        data: null as T,
        error: 'Network error occurred',
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
    return this.makeRequest<DashboardData>('/landlord-dashboard', {
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
    return this.makeRequest<Property[]>('/property-management', {
      method: 'GET',
    });
  }

  async createProperty(propertyData: Omit<Property, 'id' | 'created_at' | 'updated_at'>) {
    return this.makeRequest<Property>('/property-management', {
      method: 'POST',
      body: JSON.stringify(propertyData),
    });
  }

  // Payment Processing
  async getPayments() {
    return this.makeRequest<Payment[]>('/payment-processing', {
      method: 'GET',
    });
  }

  async processPayment(paymentData: {
    tenancy_id: string;
    amount: number;
    payment_method: string;
  }) {
    return this.makeRequest<{ payment: Payment; client_secret: string }>('/payment-processing', {
      method: 'POST',
      body: JSON.stringify(paymentData),
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
}

export const apiService = new ApiService();