import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { configureStore } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

import App from '../../App';
import { apiService } from '../../services/api';
import { authService } from '../../services/supabase';

// Mock services
jest.mock('../../services/api');
jest.mock('../../services/supabase');
jest.mock('@react-native-async-storage/async-storage');

const mockApiService = apiService as jest.Mocked<typeof apiService>;
const mockAuthService = authService as jest.Mocked<typeof authService>;
const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('End-to-End Tenant User Flows', () => {
  const createMockStore = (initialState = {}) => {
    return configureStore({
      reducer: {
        auth: (state = { user: null, isAuthenticated: false }, action) => {
          switch (action.type) {
            case 'auth/login':
              return { user: action.payload, isAuthenticated: true };
            case 'auth/logout':
              return { user: null, isAuthenticated: false };
            default:
              return state;
          }
        },
        dashboard: (state = { data: null, loading: false }, action) => {
          switch (action.type) {
            case 'dashboard/setLoading':
              return { ...state, loading: action.payload };
            case 'dashboard/setData':
              return { ...state, data: action.payload, loading: false };
            default:
              return state;
          }
        },
      },
      preloadedState: initialState,
    });
  };

  const mockTenantData = {
    user_profile: {
      id: '34afabe2-bca7-4ce6-b3e8-de32511c138c',
      email: 'api_test_tenant@tenesta.com',
      role: 'tenant',
      profile: { full_name: 'Test Tenant' },
    },
    current_tenancy: {
      id: 'test-tenancy',
      rent_amount: 2500,
      property: {
        address: '123 Test St',
        city: 'Test City',
      },
    },
    payment_status: {
      id: 'test-payment',
      amount: 2500,
      status: 'pending',
      due_date: '2025-01-01',
    },
    upcoming_payments: [],
    recent_payments: [],
    unread_messages: [],
    notifications: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mocks
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue(undefined);
    
    mockAuthService.getCurrentUser.mockResolvedValue({
      user: null,
      error: null,
    });
  });

  describe('Complete Login to Dashboard Flow', () => {
    it('allows user to sign in and navigate to dashboard', async () => {
      // Mock successful authentication
      mockAuthService.signIn.mockResolvedValue({
        user: mockTenantData.user_profile,
        error: null,
      });

      mockAuthService.getCurrentUser.mockResolvedValue({
        user: mockTenantData.user_profile,
        error: null,
      });

      mockApiService.getTenantDashboard.mockResolvedValue({
        data: mockTenantData,
        message: 'Success',
      });

      const store = createMockStore();
      const { getByTestId, getByText } = render(
        <Provider store={store}>
          <NavigationContainer>
            <App />
          </NavigationContainer>
        </Provider>
      );

      // Should start on sign in screen
      await waitFor(() => {
        expect(getByTestId('sign-in-screen')).toBeTruthy();
      });

      // Fill in credentials
      const emailInput = getByTestId('email-input');
      const passwordInput = getByTestId('password-input');
      const signInButton = getByTestId('sign-in-button');

      fireEvent.changeText(emailInput, 'api_test_tenant@tenesta.com');
      fireEvent.changeText(passwordInput, 'TestPassword123!');

      // Submit sign in
      await act(async () => {
        fireEvent.press(signInButton);
      });

      // Should navigate to dashboard
      await waitFor(() => {
        expect(getByText('Welcome back, Test Tenant')).toBeTruthy();
        expect(getByText('$2,500.00')).toBeTruthy();
      });
    });

    it('handles sign in error gracefully', async () => {
      mockAuthService.signIn.mockResolvedValue({
        user: null,
        error: { message: 'Invalid credentials' },
      });

      const store = createMockStore();
      const { getByTestId, getByText } = render(
        <Provider store={store}>
          <NavigationContainer>
            <App />
          </NavigationContainer>
        </Provider>
      );

      await waitFor(() => {
        expect(getByTestId('sign-in-screen')).toBeTruthy();
      });

      const emailInput = getByTestId('email-input');
      const passwordInput = getByTestId('password-input');
      const signInButton = getByTestId('sign-in-button');

      fireEvent.changeText(emailInput, 'wrong@email.com');
      fireEvent.changeText(passwordInput, 'wrongpassword');

      await act(async () => {
        fireEvent.press(signInButton);
      });

      await waitFor(() => {
        expect(getByText('Invalid credentials')).toBeTruthy();
      });
    });
  });

  describe('Payment Flow', () => {
    it('allows user to initiate rent payment', async () => {
      // Setup authenticated state
      const store = createMockStore({
        auth: {
          user: mockTenantData.user_profile,
          isAuthenticated: true,
        },
      });

      mockApiService.getTenantDashboard.mockResolvedValue({
        data: mockTenantData,
        message: 'Success',
      });

      mockApiService.processPayment.mockResolvedValue({
        data: {
          payment: { id: 'new-payment', status: 'completed' },
          client_secret: 'pi_test_secret',
        },
        message: 'Payment initiated',
      });

      const { getByTestId, getByText } = render(
        <Provider store={store}>
          <NavigationContainer>
            <App />
          </NavigationContainer>
        </Provider>
      );

      // Wait for dashboard to load
      await waitFor(() => {
        expect(getByText('$2,500.00')).toBeTruthy();
      });

      // Click pay rent button
      const payButton = getByTestId('pay-rent-button');
      
      await act(async () => {
        fireEvent.press(payButton);
      });

      // Should navigate to payment screen or show payment modal
      await waitFor(() => {
        expect(getByTestId('payment-screen') || getByTestId('payment-modal')).toBeTruthy();
      });
    });
  });

  describe('Maintenance Request Flow', () => {
    it('allows user to create maintenance request', async () => {
      const store = createMockStore({
        auth: {
          user: mockTenantData.user_profile,
          isAuthenticated: true,
        },
      });

      mockApiService.getTenantDashboard.mockResolvedValue({
        data: mockTenantData,
        message: 'Success',
      });

      const { getByTestId, getByText } = render(
        <Provider store={store}>
          <NavigationContainer>
            <App />
          </NavigationContainer>
        </Provider>
      );

      await waitFor(() => {
        expect(getByTestId('maintenance-card')).toBeTruthy();
      });

      // Open maintenance request creation
      const createButton = getByTestId('create-request-button');
      
      await act(async () => {
        fireEvent.press(createButton);
      });

      // Should show maintenance request form
      await waitFor(() => {
        expect(getByTestId('maintenance-request-modal')).toBeTruthy();
      });

      // Fill out form
      const titleInput = getByTestId('maintenance-title-input');
      const descriptionInput = getByTestId('maintenance-description-input');
      const submitButton = getByTestId('submit-maintenance-request');

      fireEvent.changeText(titleInput, 'Test Leak');
      fireEvent.changeText(descriptionInput, 'Kitchen faucet is leaking');

      await act(async () => {
        fireEvent.press(submitButton);
      });

      // Should show success message
      await waitFor(() => {
        expect(getByText(/request submitted/i)).toBeTruthy();
      });
    });
  });

  describe('Messaging Flow', () => {
    it('allows user to view and send messages', async () => {
      const messagesData = {
        ...mockTenantData,
        unread_messages: [
          {
            id: 'msg1',
            sender_id: 'landlord-id',
            content: 'Hello tenant!',
            created_at: '2024-12-01',
          },
        ],
      };

      const store = createMockStore({
        auth: {
          user: mockTenantData.user_profile,
          isAuthenticated: true,
        },
      });

      mockApiService.getTenantDashboard.mockResolvedValue({
        data: messagesData,
        message: 'Success',
      });

      const { getByTestId, getByText } = render(
        <Provider store={store}>
          <NavigationContainer>
            <App />
          </NavigationContainer>
        </Provider>
      );

      await waitFor(() => {
        expect(getByTestId('messages-card')).toBeTruthy();
      });

      // Should show unread message count
      expect(getByText('1')).toBeTruthy(); // Badge count

      // Click on messages
      const messagesButton = getByTestId('quick-action-messages');
      
      await act(async () => {
        fireEvent.press(messagesButton);
      });

      // Should navigate to messages screen
      await waitFor(() => {
        expect(getByTestId('messages-screen')).toBeTruthy();
      });
    });
  });

  describe('Pull-to-Refresh Flow', () => {
    it('refreshes dashboard data when user pulls down', async () => {
      const store = createMockStore({
        auth: {
          user: mockTenantData.user_profile,
          isAuthenticated: true,
        },
      });

      mockApiService.getTenantDashboard.mockResolvedValue({
        data: mockTenantData,
        message: 'Success',
      });

      const { getByTestId } = render(
        <Provider store={store}>
          <NavigationContainer>
            <App />
          </NavigationContainer>
        </Provider>
      );

      await waitFor(() => {
        expect(getByTestId('dashboard-scroll-view')).toBeTruthy();
      });

      const scrollView = getByTestId('dashboard-scroll-view');

      // Trigger refresh
      await act(async () => {
        fireEvent(scrollView, 'refresh');
      });

      // Should call API again
      await waitFor(() => {
        expect(mockApiService.getTenantDashboard).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Error Handling Flow', () => {
    it('handles network errors gracefully', async () => {
      const store = createMockStore({
        auth: {
          user: mockTenantData.user_profile,
          isAuthenticated: true,
        },
      });

      mockApiService.getTenantDashboard.mockRejectedValue(
        new Error('Network error')
      );

      const { getByTestId, getByText } = render(
        <Provider store={store}>
          <NavigationContainer>
            <App />
          </NavigationContainer>
        </Provider>
      );

      await waitFor(() => {
        expect(getByText(/error/i)).toBeTruthy();
      });

      // Should show retry button
      const retryButton = getByTestId('retry-button');
      expect(retryButton).toBeTruthy();

      // Retry should work when network is restored
      mockApiService.getTenantDashboard.mockResolvedValue({
        data: mockTenantData,
        message: 'Success',
      });

      await act(async () => {
        fireEvent.press(retryButton);
      });

      await waitFor(() => {
        expect(getByText('Welcome back, Test Tenant')).toBeTruthy();
      });
    });
  });

  describe('Navigation Flow', () => {
    it('allows navigation between different screens', async () => {
      const store = createMockStore({
        auth: {
          user: mockTenantData.user_profile,
          isAuthenticated: true,
        },
      });

      mockApiService.getTenantDashboard.mockResolvedValue({
        data: mockTenantData,
        message: 'Success',
      });

      const { getByTestId } = render(
        <Provider store={store}>
          <NavigationContainer>
            <App />
          </NavigationContainer>
        </Provider>
      );

      await waitFor(() => {
        expect(getByTestId('tenant-dashboard')).toBeTruthy();
      });

      // Navigate to documents
      const documentsButton = getByTestId('quick-action-documents');
      
      await act(async () => {
        fireEvent.press(documentsButton);
      });

      await waitFor(() => {
        expect(getByTestId('documents-screen')).toBeTruthy();
      });

      // Navigate back
      const backButton = getByTestId('back-button');
      
      await act(async () => {
        fireEvent.press(backButton);
      });

      await waitFor(() => {
        expect(getByTestId('tenant-dashboard')).toBeTruthy();
      });
    });
  });
});