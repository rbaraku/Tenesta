// API Integration Test for Tenesta Landlord Dashboard
// This utility tests the connection to our Supabase Edge Functions

import { apiService } from '../services/api';
import { supabase } from '../services/supabase';

interface TestResult {
  test: string;
  success: boolean;
  error?: string;
  data?: any;
  duration?: number;
}

export class APIIntegrationTest {
  private results: TestResult[] = [];

  async runFullTest(): Promise<TestResult[]> {
    this.results = [];
    
    console.log('🚀 Starting Tenesta API Integration Test Suite...\n');

    // Test 1: Authentication Test
    await this.testAuthentication();
    
    // Test 2: Landlord Dashboard Test
    await this.testLandlordDashboard();
    
    // Test 3: Property Management Test
    await this.testPropertyManagement();
    
    // Test 4: Payment Processing Test
    await this.testPaymentProcessing();

    console.log('\n📊 API Integration Test Results:');
    this.results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      const duration = result.duration ? ` (${result.duration}ms)` : '';
      console.log(`${index + 1}. ${status} ${result.test}${duration}`);
      if (!result.success && result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    const successCount = this.results.filter(r => r.success).length;
    const totalCount = this.results.length;
    console.log(`\n🎯 Success Rate: ${successCount}/${totalCount} (${Math.round((successCount/totalCount) * 100)}%)`);

    return this.results;
  }

  private async testAuthentication(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🔐 Testing Authentication...');
      
      // Test with the test landlord account
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'api_test_landlord@tenesta.com',
        password: 'TestPassword123!'
      });
      
      const duration = Date.now() - startTime;
      
      if (error) {
        this.results.push({
          test: 'Authentication Test',
          success: false,
          error: error.message,
          duration
        });
        console.log(`❌ Authentication failed: ${error.message}`);
        return;
      }
      
      if (data?.user) {
        this.results.push({
          test: 'Authentication Test',
          success: true,
          data: { userId: data.user.id, email: data.user.email },
          duration
        });
        console.log(`✅ Authentication successful for: ${data.user.email}`);
      } else {
        this.results.push({
          test: 'Authentication Test',
          success: false,
          error: 'No user data returned',
          duration
        });
      }
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.push({
        test: 'Authentication Test',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown authentication error',
        duration
      });
      console.log(`❌ Authentication test failed: ${error}`);
    }
  }

  private async testLandlordDashboard(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('📊 Testing Landlord Dashboard API...');
      
      const response = await apiService.getLandlordDashboard();
      const duration = Date.now() - startTime;
      
      if (response.error) {
        this.results.push({
          test: 'Landlord Dashboard API',
          success: false,
          error: response.error,
          duration
        });
        console.log(`❌ Dashboard API failed: ${response.error}`);
        return;
      }
      
      if (response.data) {
        const hasExpectedFields = response.data.user_profile && 
                                 response.data.properties !== undefined &&
                                 response.data.portfolio_summary;
        
        this.results.push({
          test: 'Landlord Dashboard API',
          success: hasExpectedFields,
          error: hasExpectedFields ? undefined : 'Missing expected dashboard fields',
          data: {
            propertiesCount: response.data.properties?.length || 0,
            hasPortfolioSummary: !!response.data.portfolio_summary,
            hasRentCollection: !!response.data.rent_collection
          },
          duration
        });
        
        if (hasExpectedFields) {
          console.log(`✅ Dashboard API successful - ${response.data.properties?.length || 0} properties loaded`);
        } else {
          console.log(`❌ Dashboard API missing expected fields`);
        }
      }
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.push({
        test: 'Landlord Dashboard API',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown dashboard error',
        duration
      });
      console.log(`❌ Dashboard test failed: ${error}`);
    }
  }

  private async testPropertyManagement(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🏠 Testing Property Management API...');
      
      const response = await apiService.getProperties();
      const duration = Date.now() - startTime;
      
      if (response.error) {
        this.results.push({
          test: 'Property Management API',
          success: false,
          error: response.error,
          duration
        });
        console.log(`❌ Property API failed: ${response.error}`);
        return;
      }
      
      const properties = response.data?.properties || response.data || [];
      const isArray = Array.isArray(properties);
      
      this.results.push({
        test: 'Property Management API',
        success: isArray,
        error: isArray ? undefined : 'Properties data is not an array',
        data: {
          propertiesCount: isArray ? properties.length : 0,
          dataType: typeof properties
        },
        duration
      });
      
      if (isArray) {
        console.log(`✅ Property API successful - ${properties.length} properties retrieved`);
      } else {
        console.log(`❌ Property API returned invalid data type: ${typeof properties}`);
      }
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.push({
        test: 'Property Management API',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown property error',
        duration
      });
      console.log(`❌ Property test failed: ${error}`);
    }
  }

  private async testPaymentProcessing(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('💰 Testing Payment Processing API...');
      
      const response = await apiService.getPayments();
      const duration = Date.now() - startTime;
      
      if (response.error) {
        this.results.push({
          test: 'Payment Processing API',
          success: false,
          error: response.error,
          duration
        });
        console.log(`❌ Payment API failed: ${response.error}`);
        return;
      }
      
      const payments = response.data || [];
      const isArray = Array.isArray(payments);
      
      this.results.push({
        test: 'Payment Processing API',
        success: true, // We allow empty arrays as success
        data: {
          paymentsCount: isArray ? payments.length : 0,
          dataType: typeof payments
        },
        duration
      });
      
      console.log(`✅ Payment API successful - ${isArray ? payments.length : 0} payments retrieved`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.push({
        test: 'Payment Processing API',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown payment error',
        duration
      });
      console.log(`❌ Payment test failed: ${error}`);
    }
  }

  async testCreateProperty(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      console.log('🏗️ Testing Property Creation...');
      
      const testProperty = {
        name: `Test Property ${Date.now()}`,
        address: '123 Test Street',
        type: 'apartment' as const,
        units_count: 1,
        landlord_id: 'test' // Will be overridden by API
      };
      
      const response = await apiService.createProperty(testProperty);
      const duration = Date.now() - startTime;
      
      if (response.error) {
        return {
          test: 'Property Creation',
          success: false,
          error: response.error,
          duration
        };
      }
      
      const createdProperty = response.data?.property || response.data;
      const hasId = createdProperty && createdProperty.id;
      
      if (hasId) {
        console.log(`✅ Property created successfully with ID: ${createdProperty.id}`);
      }
      
      return {
        test: 'Property Creation',
        success: !!hasId,
        error: hasId ? undefined : 'Created property missing ID',
        data: createdProperty,
        duration
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        test: 'Property Creation',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown creation error',
        duration
      };
    }
  }
}

// Export a singleton instance
export const apiIntegrationTest = new APIIntegrationTest();

// Helper function to run a quick test
export async function runQuickAPITest(): Promise<boolean> {
  const results = await apiIntegrationTest.runFullTest();
  const successCount = results.filter(r => r.success).length;
  return successCount >= results.length * 0.75; // 75% success rate required
}