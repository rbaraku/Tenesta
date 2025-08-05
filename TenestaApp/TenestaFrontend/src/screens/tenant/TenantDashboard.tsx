import React, { useEffect, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { fetchTenantDashboard } from '../../store/slices/userSlice';
import { fetchPayments } from '../../store/slices/paymentSlice';
import { apiService } from '../../services/api';
import { ErrorBoundary } from '../../components/common';
import {
  DashboardLayout,
  DashboardSection,
  DashboardGrid,
  PaymentStatusCard,
  PropertyInfoCard,
  MaintenanceRequestCard,
  MessagesCard,
  NotificationsCard,
  QuickActionButtons,
  PaymentHistoryCard,
  getResponsiveColumns,
} from '../../components/tenant';
import { 
  TenantDashboardData, 
  MaintenanceRequest, 
  Notification,
  Message,
  Payment,
} from '../../types';

const TenantDashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { dashboardData, isLoading } = useSelector((state: RootState) => state.user);
  const { payments } = useSelector((state: RootState) => state.payment);

  // Local state for enhanced dashboard data
  const [enhancedData, setEnhancedData] = useState<TenantDashboardData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setError(null);
      
      // Load basic dashboard data from Redux
      await Promise.all([
        dispatch(fetchTenantDashboard()),
        dispatch(fetchPayments()),
      ]);

      // Load enhanced tenant-specific data from the tenant-dashboard API
      const response = await apiService.getTenantDashboard();
      if (response.error) {
        throw new Error(response.error);
      }
      
      if (response.data) {
        setEnhancedData(response.data as TenantDashboardData);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load dashboard data';
      setError(errorMessage);
      
      // Only show alert if not refreshing (to avoid spam during pull-to-refresh)
      if (!refreshing) {
        Alert.alert('Error', errorMessage);
      }
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadDashboardData();
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Handler functions
  const handlePayRent = () => {
    // TODO: Navigate to payment screen
    Alert.alert('Pay Rent', 'Payment feature coming soon');
  };

  const handleViewDocuments = () => {
    // TODO: Navigate to documents screen
    Alert.alert('Documents', 'Document viewer coming soon');
  };

  const handleMaintenanceRequest = async (request: {
    title: string;
    description: string;
    category: string;
    priority: string;
  }) => {
    try {
      // TODO: Implement maintenance request creation
      console.log('Creating maintenance request:', request);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Refresh data after creation
      await loadDashboardData();
    } catch (error) {
      throw new Error('Failed to create maintenance request');
    }
  };

  const handleSendMessage = async (content: string) => {
    try {
      // TODO: Implement message sending
      console.log('Sending message:', content);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Refresh data after sending
      await loadDashboardData();
    } catch (error) {
      throw new Error('Failed to send message');
    }
  };

  const handleMarkMessageAsRead = async (messageId: string) => {
    try {
      // TODO: Implement mark as read
      console.log('Marking message as read:', messageId);
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  };

  const handleMarkNotificationAsRead = async (notificationId: string) => {
    try {
      // TODO: Implement mark notification as read
      console.log('Marking notification as read:', notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleContactLandlord = () => {
    // TODO: Implement contact landlord functionality
    Alert.alert('Contact Landlord', 'Contact feature coming soon');
  };

  const handleViewAllMessages = () => {
    // TODO: Navigate to messages screen
    Alert.alert('Messages', 'Full messages view coming soon');
  };

  const handleViewAllNotifications = () => {
    // TODO: Navigate to notifications screen
    Alert.alert('Notifications', 'Full notifications view coming soon');
  };

  const handleViewPaymentHistory = () => {
    // TODO: Navigate to payment history screen
    Alert.alert('Payment History', 'Full payment history coming soon');
  };

  const handleViewAllMaintenanceRequests = () => {
    // TODO: Navigate to maintenance requests screen
    Alert.alert('Maintenance', 'Full maintenance requests view coming soon');
  };

  // Get current payment status
  const currentPayment = payments?.find(p => p.type === 'rent' && p.status === 'pending');
  const recentPayments = payments?.filter(p => p.status === 'completed').slice(0, 5) || [];

  // Get data from enhanced dashboard
  const unreadMessages = enhancedData?.unread_messages || [];
  const notifications = enhancedData?.notifications || [];
  const maintenanceRequests = enhancedData?.maintenance_requests || [];
  const propertyDetails = enhancedData?.property_details;
  const currentTenancy = enhancedData?.current_tenancy;

  // Calculate counts for quick actions
  const unreadMessageCount = unreadMessages.length;
  const pendingMaintenanceCount = maintenanceRequests?.filter(r => r.status === 'submitted' || r.status === 'in_progress').length || 0;

  const userName = dashboardData?.user?.full_name || enhancedData?.user_profile?.full_name || 'Tenant';
  const landlordName = currentTenancy?.property?.landlord?.profile?.full_name || 'Landlord';

  return (
    <DashboardLayout
      title={`Welcome back, ${userName.split(' ')[0]}`}
      subtitle="Tenant Dashboard"
      isLoading={isLoading && !enhancedData}
      onRefresh={onRefresh}
      refreshing={refreshing}
    >
      {/* Payment Status - High Priority */}
      <DashboardSection title="Payment Status" spacing="medium">
        <ErrorBoundary fallbackMessage="Unable to load payment information">
          <PaymentStatusCard
            paymentStatus={currentPayment}
            isLoading={isLoading}
            onPayRent={handlePayRent}
          />
        </ErrorBoundary>
      </DashboardSection>

      {/* Quick Actions */}
      <DashboardSection title="Quick Actions">
        <QuickActionButtons
          onPayRent={handlePayRent}
          onViewDocuments={handleViewDocuments}
          onContactLandlord={handleContactLandlord}
          onViewPaymentHistory={handleViewPaymentHistory}
          onMaintenanceRequest={() => {}} // This will be handled by MaintenanceRequestCard
          onViewMessages={handleViewAllMessages}
          unreadMessageCount={unreadMessageCount}
          pendingMaintenanceCount={pendingMaintenanceCount}
        />
      </DashboardSection>

      {/* Property Information */}
      <DashboardSection title="Property Information" spacing="medium">
        <ErrorBoundary fallbackMessage="Unable to load property information">
          <PropertyInfoCard
            property={propertyDetails}
            unit={currentTenancy?.unit}
            tenancy={currentTenancy}
            isLoading={isLoading}
            onViewDetails={() => Alert.alert('Property Details', 'Property details view coming soon')}
          />
        </ErrorBoundary>
      </DashboardSection>

      {/* Messages and Notifications Grid */}
      <DashboardSection title="Communications" spacing="medium">
        <DashboardGrid columns={getResponsiveColumns(1)} spacing={16}>
          <ErrorBoundary fallbackMessage="Unable to load messages">
            <MessagesCard
              unreadMessages={unreadMessages}
              isLoading={isLoading}
              onSendMessage={handleSendMessage}
              onViewAllMessages={handleViewAllMessages}
              onMarkAsRead={handleMarkMessageAsRead}
              landlordName={landlordName}
            />
          </ErrorBoundary>
          <ErrorBoundary fallbackMessage="Unable to load notifications">
            <NotificationsCard
              notifications={notifications}
              isLoading={isLoading}
              onMarkAsRead={handleMarkNotificationAsRead}
              onViewAllNotifications={handleViewAllNotifications}
            />
          </ErrorBoundary>
        </DashboardGrid>
      </DashboardSection>

      {/* Maintenance Requests */}
      <DashboardSection title="Maintenance" spacing="medium">
        <ErrorBoundary fallbackMessage="Unable to load maintenance requests">
          <MaintenanceRequestCard
            recentRequests={maintenanceRequests}
            isLoading={isLoading}
            onCreateRequest={handleMaintenanceRequest}
            onViewAllRequests={handleViewAllMaintenanceRequests}
          />
        </ErrorBoundary>
      </DashboardSection>

      {/* Payment History */}
      <DashboardSection title="Payment History" spacing="large">
        <ErrorBoundary fallbackMessage="Unable to load payment history">
          <PaymentHistoryCard
            recentPayments={recentPayments}
            isLoading={isLoading}
            onViewFullHistory={handleViewPaymentHistory}
            onPaymentPress={(payment) => Alert.alert('Payment Details', `Payment ID: ${payment.id}`)}
          />
        </ErrorBoundary>
      </DashboardSection>
    </DashboardLayout>
  );
};

export default TenantDashboard;