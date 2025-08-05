#!/usr/bin/env node

/**
 * Tenesta API Integration Test Runner
 * Tests all backend APIs with real data
 */

const https = require('https');
const http = require('http');

// Test configuration
const SUPABASE_URL = 'https://skjaxjaawqvjjhyxnxls.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNramF4amFhd3F2ampoeXhueGxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNzg3NzEsImV4cCI6MjA2NTk1NDc3MX0.ymoyzzqJtAjWejrTqUTsMjKTYh0iZQxAzpKpgJx6OB0';
const BASE_URL = `${SUPABASE_URL}/functions/v1`;

// Test tenant credentials
const TEST_TENANT_EMAIL = 'api_test_tenant@tenesta.com';
const TEST_TENANT_PASSWORD = 'TestPassword123!';

class TenestaAPITester {
  constructor() {
    this.results = [];
    this.accessToken = null;
  }

  async makeRequest(endpoint, options = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(`${BASE_URL}${endpoint}`);
      const requestOptions = {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          ...(this.accessToken && {
            'Authorization': `Bearer ${this.accessToken}`,
          }),
          ...options.headers,
        },
      };

      if (options.body) {
        requestOptions.headers['Content-Length'] = Buffer.byteLength(options.body);
      }

      const req = https.request(url, requestOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const jsonData = data ? JSON.parse(data) : {};
            resolve({
              status: res.statusCode,
              data: jsonData,
              headers: res.headers,
            });
          } catch (err) {
            resolve({
              status: res.statusCode,
              data: data,
              error: 'Invalid JSON response',
            });
          }
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      if (options.body) {
        req.write(options.body);
      }
      req.end();
    });
  }

  addResult(test, success, message, data = null) {
    const result = {
      test,
      success,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
    this.results.push(result);
    
    const status = success ? '✅' : '❌';
    console.log(`${status} ${test}: ${message}`);
    
    if (!success && data) {
      console.log(`   Details: ${JSON.stringify(data, null, 2)}`);
    }
  }

  async authenticateTestUser() {
    console.log('\n🔐 Authenticating Test User...');
    
    try {
      const response = await this.makeRequest('/auth', {
        method: 'POST',
        body: JSON.stringify({
          email: TEST_TENANT_EMAIL,
          password: TEST_TENANT_PASSWORD,
        }),
      });

      if (response.status === 200 && response.data.access_token) {
        this.accessToken = response.data.access_token;
        this.addResult('Authentication', true, 'Successfully authenticated test user');
        return true;
      } else {
        this.addResult('Authentication', false, 'Failed to authenticate', response.data);
        return false;
      }
    } catch (error) {
      this.addResult('Authentication', false, 'Authentication error', error.message);
      return false;
    }
  }

  async testTenantDashboardAPI() {
    console.log('\n📊 Testing Tenant Dashboard API...');
    
    try {
      const response = await this.makeRequest('/tenant-dashboard');
      
      if (response.status === 200) {
        const data = response.data;
        
        // Validate response structure
        const requiredFields = [
          'user_profile',
          'current_tenancy', 
          'payment_status',
          'upcoming_payments',
          'recent_payments',
          'unread_messages',
          'notifications'
        ];
        
        const missingFields = requiredFields.filter(field => !(field in data));
        
        if (missingFields.length === 0) {
          this.addResult('Tenant Dashboard API', true, 
            `API returned complete data structure with ${data.upcoming_payments?.length || 0} payments`);
          
          // Test specific data integrity
          if (data.current_tenancy) {
            this.addResult('Tenant Dashboard - Tenancy Data', true, 
              `Active tenancy found: $${data.current_tenancy.rent_amount}`);
          }
          
          if (data.payment_status) {
            this.addResult('Tenant Dashboard - Payment Status', true, 
              `Payment status: ${data.payment_status.status} - Due: ${data.payment_status.due_date}`);
          }
          
        } else {
          this.addResult('Tenant Dashboard API', false, 
            `Missing required fields: ${missingFields.join(', ')}`, data);
        }
      } else {
        this.addResult('Tenant Dashboard API', false, 
          `HTTP ${response.status}`, response.data);
      }
    } catch (error) {
      this.addResult('Tenant Dashboard API', false, 'Request failed', error.message);
    }
  }

  async testPaymentProcessAPI() {
    console.log('\n💳 Testing Payment Process API...');
    
    try {
      const response = await this.makeRequest('/payment-process');
      
      if (response.status === 200 || response.status === 405) {
        // GET might not be allowed, test POST
        const testPayment = {
          tenancy_id: 'b67efe43-8047-4907-9d25-bd8ee5aca4e8',
          amount: 100.00,
          payment_method: 'test_card',
        };
        
        const postResponse = await this.makeRequest('/payment-process', {
          method: 'POST',
          body: JSON.stringify(testPayment),
        });
        
        if (postResponse.status === 200) {
          this.addResult('Payment Process API', true, 'Payment API accepts requests');
        } else {
          this.addResult('Payment Process API', false, 
            `Payment POST failed: HTTP ${postResponse.status}`, postResponse.data);
        }
      } else {
        this.addResult('Payment Process API', false, 
          `HTTP ${response.status}`, response.data);
      }
    } catch (error) {
      this.addResult('Payment Process API', false, 'Request failed', error.message);
    }
  }

  async testMaintenanceRequestsAPI() {
    console.log('\n🔧 Testing Maintenance Requests API...');
    
    try {
      // Test GET
      const getResponse = await this.makeRequest('/maintenance-requests');
      
      if (getResponse.status === 200) {
        this.addResult('Maintenance Requests GET', true, 
          `Retrieved maintenance requests data`);
        
        // Test POST - Create new maintenance request
        const newRequest = {
          tenancy_id: 'b67efe43-8047-4907-9d25-bd8ee5aca4e8',
          title: 'API Test Request',
          description: 'This is a test maintenance request created by API testing',
          priority: 'medium',
          category: 'other',
        };
        
        const postResponse = await this.makeRequest('/maintenance-requests', {
          method: 'POST',
          body: JSON.stringify(newRequest),
        });
        
        if (postResponse.status === 200 || postResponse.status === 201) {
          this.addResult('Maintenance Requests POST', true, 
            'Successfully created maintenance request');
        } else {
          this.addResult('Maintenance Requests POST', false, 
            `Create request failed: HTTP ${postResponse.status}`, postResponse.data);
        }
        
      } else {
        this.addResult('Maintenance Requests GET', false, 
          `HTTP ${getResponse.status}`, getResponse.data);
      }
    } catch (error) {
      this.addResult('Maintenance Requests API', false, 'Request failed', error.message);
    }
  }

  async testMessagingSystemAPI() {
    console.log('\n💬 Testing Messaging System API...');
    
    try {
      // Test GET messages
      const getResponse = await this.makeRequest('/messaging-system');
      
      if (getResponse.status === 200) {
        this.addResult('Messaging System GET', true, 'Retrieved messages data');
        
        // Test POST - Send message
        const newMessage = {
          recipient_id: '22222222-2222-2222-2222-222222222222', // landlord
          content: 'This is a test message from API testing',
          message_type: 'general',
        };
        
        const postResponse = await this.makeRequest('/messaging-system', {
          method: 'POST',
          body: JSON.stringify(newMessage),
        });
        
        if (postResponse.status === 200 || postResponse.status === 201) {
          this.addResult('Messaging System POST', true, 'Successfully sent message');
        } else {
          this.addResult('Messaging System POST', false, 
            `Send message failed: HTTP ${postResponse.status}`, postResponse.data);
        }
        
      } else {
        this.addResult('Messaging System GET', false, 
          `HTTP ${getResponse.status}`, getResponse.data);
      }
    } catch (error) {
      this.addResult('Messaging System API', false, 'Request failed', error.message);
    }
  }

  async testAPIEndpoints() {
    console.log('\n🌐 Testing Individual API Endpoints...');
    
    const endpoints = [
      '/landlord-dashboard',
      '/property-management',
      '/household-management',
      '/document-management',
      '/admin-panel',
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await this.makeRequest(endpoint);
        
        if (response.status === 200) {
          this.addResult(`API ${endpoint}`, true, 'Endpoint accessible');
        } else if (response.status === 401 || response.status === 403) {
          this.addResult(`API ${endpoint}`, true, 'Endpoint secured (auth required)');
        } else {
          this.addResult(`API ${endpoint}`, false, `HTTP ${response.status}`);
        }
      } catch (error) {
        this.addResult(`API ${endpoint}`, false, 'Request failed', error.message);
      }
    }
  }

  async runAllTests() {
    console.log('🧪 Starting Tenesta API Integration Tests...\n');
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`Test User: ${TEST_TENANT_EMAIL}\n`);
    
    // Authenticate first
    const authenticated = await this.authenticateTestUser();
    
    // Run API tests
    await this.testTenantDashboardAPI();
    await this.testPaymentProcessAPI();
    await this.testMaintenanceRequestsAPI();
    await this.testMessagingSystemAPI();
    await this.testAPIEndpoints();
    
    // Generate summary
    this.generateSummary();
    
    return this.results;
  }

  generateSummary() {
    console.log('\n📊 API Integration Test Summary');
    console.log('================================');
    
    const total = this.results.length;
    const passed = this.results.filter(r => r.success).length;
    const failed = total - passed;
    const passRate = ((passed / total) * 100).toFixed(1);
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} (${passRate}%)`);
    console.log(`Failed: ${failed}`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.filter(r => !r.success).forEach(r => {
        console.log(`  - ${r.test}: ${r.message}`);
      });
    }
    
    console.log('\n✅ Recommendations:');
    if (passed >= total * 0.8) {
      console.log('  - API integration is working well!');
      console.log('  - Ready for frontend integration testing');
    } else {
      console.log('  - Several API endpoints need attention');
      console.log('  - Check authentication and data setup');
    }
    
    console.log('\n🎯 Next Steps:');
    console.log('  - Run frontend component tests');
    console.log('  - Test mobile app integration');
    console.log('  - Perform end-to-end user flows');
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new TenestaAPITester();
  tester.runAllTests().catch(console.error);
}

module.exports = TenestaAPITester;