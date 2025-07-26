import { supabase } from '../config/supabase';

export class ApiService {
  static async makeEdgeFunctionCall(functionName, payload = {}) {
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error(`Error calling ${functionName}:`, error);
      return { data: null, error };
    }
  }

  // Tenant Dashboard API
  static async getTenantDashboard() {
    return this.makeEdgeFunctionCall('tenant-dashboard');
  }

  // Landlord Dashboard API
  static async getLandlordDashboard() {
    return this.makeEdgeFunctionCall('landlord-dashboard');
  }

  // Property Management API
  static async createProperty(propertyData) {
    return this.makeEdgeFunctionCall('property-management', {
      action: 'create_property',
      ...propertyData,
    });
  }

  static async updateProperty(propertyId, updates) {
    return this.makeEdgeFunctionCall('property-management', {
      action: 'update_property',
      property_id: propertyId,
      ...updates,
    });
  }

  static async getProperty(propertyId) {
    return this.makeEdgeFunctionCall('property-management', {
      action: 'get_property',
      property_id: propertyId,
    });
  }

  static async listProperties() {
    return this.makeEdgeFunctionCall('property-management', {
      action: 'list_properties',
    });
  }

  // Payment Processing API
  static async getPaymentStatus(paymentId) {
    return this.makeEdgeFunctionCall('payment-process', {
      payment_id: paymentId,
      action: 'get_status',
    });
  }

  static async createPaymentIntent(paymentId) {
    return this.makeEdgeFunctionCall('payment-process', {
      payment_id: paymentId,
      action: 'create_intent',
    });
  }

  // Dispute Management API
  static async createDispute(disputeData) {
    return this.makeEdgeFunctionCall('dispute-management', {
      action: 'create',
      ...disputeData,
    });
  }

  static async getDispute(disputeId) {
    return this.makeEdgeFunctionCall('dispute-management', {
      action: 'get',
      dispute_id: disputeId,
    });
  }

  static async listDisputes() {
    return this.makeEdgeFunctionCall('dispute-management', {
      action: 'list',
    });
  }

  static async updateDispute(disputeId, updates) {
    return this.makeEdgeFunctionCall('dispute-management', {
      action: 'update',
      dispute_id: disputeId,
      ...updates,
    });
  }
}
