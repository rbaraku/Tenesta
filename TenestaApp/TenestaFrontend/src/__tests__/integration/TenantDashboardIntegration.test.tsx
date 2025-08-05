import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { configureStore } from '@reduxjs/toolkit';
import TenantDashboard from '../../screens/tenant/TenantDashboard';
import { apiService } from '../../services/api';
import { authService } from '../../services/supabase';

// Mock the API service
jest.mock('../../services/api');
jest.mock('../../services/supabase');

const mockApiService = apiService as jest.Mocked<typeof apiService>;
const mockAuthService = authService as jest.Mocked<typeof authService>;

// Mock data that matches our test database
const mockTenantDashboardData = {
  user_profile: {
    id: '34afabe2-bca7-4ce6-b3e8-de32511c138c',
    email: 'api_test_tenant@tenesta.com',
    role: 'tenant',
    profile: {
      phone: '+1234567890',
      full_name: 'API Test Tenant',
      avatar_url: null,
    },
    organization_id: 'test-org',
    subscription_status: 'active',
    preferences: {},
  },
  current_tenancy: {
    id: 'b67efe43-8047-4907-9d25-bd8ee5aca4e8',
    tenant_id: '34afabe2-bca7-4ce6-b3e8-de32511c138c',
    property_id: '66666666-6666-6666-6666-666666666666',
    rent_amount: 2500.00,
    security_deposit: 5000.00,
    lease_start: '2024-01-01',
    lease_end: '2024-12-31',
    status: 'active',
    property: {
      id: '66666666-6666-6666-6666-666666666666',
      address: '123 Test Street',
      city: 'Test City',
      state: 'TS',
      zip_code: '12345',
      bedrooms: 2,
      bathrooms: 1,
      square_feet: 1000,
      amenities: ['parking', 'laundry'],
    },
  },
  payment_status: {
    id: '04f1b46a-4f89-480d-bb91-e166cb8714fd',
    tenancy_id: 'b67efe43-8047-4907-9d25-bd8ee5aca4e8',
    amount: 2500.00,
    status: 'pending',
    due_date: '2025-01-01',
    payment_period_start: '2025-01-01',
    payment_period_end: '2025-01-31',
  },
  upcoming_payments: [
    {
      id: '04f1b46a-4f89-480d-bb91-e166cb8714fd',
      tenancy_id: 'b67efe43-8047-4907-9d25-bd8ee5aca4e8',
      amount: 2500.00,
      status: 'pending',
      due_date: '2025-01-01',
      payment_period_start: '2025-01-01',
      payment_period_end: '2025-01-31',
    },
    {
      id: '7b104d85-1bf9-4031-b785-e885571187c3',
      tenancy_id: 'b67efe43-8047-4907-9d25-bd8ee5aca4e8',
      amount: 2500.00,
      status: 'pending',
      due_date: '2025-02-01',
      payment_period_start: '2025-02-01',
      payment_period_end: '2025-02-28',
    },
  ],
  recent_payments: [
    {
      id: 'e0483da7-c968-41d4-b4f8-130386e8797f',
      tenancy_id: 'b67efe43-8047-4907-9d25-bd8ee5aca4e8',
      amount: 2500.00,
      status: 'paid',
      due_date: '2024-12-01',
      paid_date: '2024-11-28',
      payment_period_start: '2024-12-01',
      payment_period_end: '2024-12-31',
    },
  ],
  unread_messages: [
    {
      id: 'c6703035-b36c-46c6-9eb9-053ba254241f',
      sender_id: '22222222-2222-2222-2222-222222222222',
      recipient_id: '34afabe2-bca7-4ce6-b3e8-de32511c138c',
      content: 'Welcome to your new apartment! Please let me know if you need anything.',
      message_type: 'general',
      read_at: null,
      created_at: '2024-12-01',
    },
  ],
  notifications: [],
  maintenance_requests: [
    {
      id: 'd4e395d7-9484-46f5-91f5-d2f7b0f029b0',
      tenancy_id: 'b67efe43-8047-4907-9d25-bd8ee5aca4e8',
      title: 'Kitchen Faucet Leak',
      description: 'The kitchen faucet has been dripping for 2 days',
      priority: 'medium',
      status: 'pending',
      category: 'plumbing',
      created_at: '2024-12-01',
      updated_at: '2024-12-01',
    },
  ],
};

// Create a test store
const createTestStore = () => {
  return configureStore({
    reducer: {
      auth: (state = { user: null, isAuthenticated: false }, action) => state,
      dashboard: (state = { data: null, loading: false }, action) => state,
    },
  });
};

const renderWithProviders = (component: React.ReactElement) => {
  const store = createTestStore();
  return render(
    <Provider store={store}>
      <NavigationContainer>
        {component}
      </NavigationContainer>
    </Provider>
  );
};

describe('Tenant Dashboard Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockAuthService.getCurrentUser.mockResolvedValue({
      user: mockTenantDashboardData.user_profile,
      error: null,
    });

    mockApiService.getTenantDashboard.mockResolvedValue({
      data: mockTenantDashboardData,
      message: 'Success',
    });
  });

  it('loads and displays tenant dashboard data correctly', async () => {
    const { getByText, getByTestId } = renderWithProviders(<TenantDashboard />);

    // Wait for data to load
    await waitFor(() => {
      expect(mockApiService.getTenantDashboard).toHaveBeenCalled();
    });

    // Check if main dashboard elements are rendered
    expect(getByText('Welcome back, API Test Tenant')).toBeTruthy();
    expect(getByText('$2,500.00')).toBeTruthy(); // Payment amount
    expect(getByText('Due Jan 1, 2025')).toBeTruthy(); // Due date
  });

  it('displays property information correctly', async () => {
    const { getByText } = renderWithProviders(<TenantDashboard />);

    await waitFor(() => {
      expect(getByText('123 Test Street')).toBeTruthy();
      expect(getByText('2 bed • 1 bath • 1,000 sq ft')).toBeTruthy();
    });
  });

  it('shows maintenance requests with correct data', async () => {
    const { getByText } = renderWithProviders(<TenantDashboard />);

    await waitFor(() => {
      expect(getByText('Kitchen Faucet Leak')).toBeTruthy();
      expect(getByText('PENDING')).toBeTruthy();
    });
  });

  it('displays unread messages count', async () => {
    const { getByTestId } = renderWithProviders(<TenantDashboard />);

    await waitFor(() => {
      const messagesBadge = getByTestId('messages-badge');
      expect(messagesBadge).toBeTruthy();
      expect(getByText('1')).toBeTruthy(); // Unread count
    });
  });

  it('handles payment button interaction', async () => {
    const { getByTestId } = renderWithProviders(<TenantDashboard />);

    await waitFor(() => {
      const payButton = getByTestId('pay-rent-button');
      expect(payButton).toBeTruthy();
      
      fireEvent.press(payButton);
      // Should navigate or trigger payment flow
    });
  });

  it('handles pull-to-refresh correctly', async () => {
    const { getByTestId } = renderWithProviders(<TenantDashboard />);

    await waitFor(() => {
      const scrollView = getByTestId('dashboard-scroll-view');
      fireEvent(scrollView, 'refresh');
      
      expect(mockApiService.getTenantDashboard).toHaveBeenCalledTimes(2);
    });
  });

  it('shows loading state initially', () => {
    // Mock loading state
    mockApiService.getTenantDashboard.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );

    const { getByTestId } = renderWithProviders(<TenantDashboard />);
    
    expect(getByTestId('dashboard-loading')).toBeTruthy();
  });

  it('handles API error gracefully', async () => {
    mockApiService.getTenantDashboard.mockResolvedValue({
      data: null,
      error: 'Failed to load dashboard data',
    });

    const { getByText } = renderWithProviders(<TenantDashboard />);

    await waitFor(() => {
      expect(getByText(/error/i)).toBeTruthy();
    });
  });

  it('shows correct payment history', async () => {
    const { getByText } = renderWithProviders(<TenantDashboard />);

    await waitFor(() => {
      expect(getByText('PAID')).toBeTruthy(); // Recent payment status
      expect(getByText('Paid Nov 28, 2024')).toBeTruthy();
    });
  });

  it('displays quick action buttons with badges', async () => {
    const { getByTestId } = renderWithProviders(<TenantDashboard />);

    await waitFor(() => {
      expect(getByTestId('quick-action-pay-rent')).toBeTruthy();
      expect(getByTestId('quick-action-maintenance')).toBeTruthy();
      expect(getByTestId('quick-action-messages')).toBeTruthy();
    });
  });

  it('handles no tenancy state', async () => {
    const noTenancyData = {
      ...mockTenantDashboardData,
      current_tenancy: null,
      payment_status: null,
      upcoming_payments: [],
    };

    mockApiService.getTenantDashboard.mockResolvedValue({
      data: noTenancyData,
      message: 'Success',
    });

    const { getByText } = renderWithProviders(<TenantDashboard />);

    await waitFor(() => {
      expect(getByText('No active lease')).toBeTruthy();
    });
  });

  it('updates real-time data correctly', async () => {
    const { rerender } = renderWithProviders(<TenantDashboard />);

    // Simulate real-time update
    const updatedData = {
      ...mockTenantDashboardData,
      payment_status: {
        ...mockTenantDashboardData.payment_status,
        status: 'paid',
      },
    };

    mockApiService.getTenantDashboard.mockResolvedValue({
      data: updatedData,
      message: 'Success',
    });

    rerender(
      <Provider store={createTestStore()}>
        <NavigationContainer>
          <TenantDashboard />
        </NavigationContainer>
      </Provider>
    );

    await waitFor(() => {
      expect(getByText('PAID')).toBeTruthy();
    });
  });
});