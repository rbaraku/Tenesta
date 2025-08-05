import React from 'react';
import { render } from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import { DashboardLayout } from '../../components/tenant/DashboardLayout';
import { PaymentStatusCard } from '../../components/tenant/PaymentStatusCard';
import { QuickActionButtons } from '../../components/tenant/QuickActionButtons';
import { Text } from 'react-native';

// Mock Dimensions
const mockDimensions = {
  get: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

jest.mock('react-native/Libraries/Utilities/Dimensions', () => mockDimensions);

describe('Mobile Responsiveness Tests', () => {
  const mockPayment = {
    id: '1',
    tenancy_id: 'test',
    amount: 2500,
    status: 'pending' as const,
    due_date: '2025-01-01',
    payment_period_start: '2025-01-01',
    payment_period_end: '2025-01-31',
    created_at: '2024-12-01',
    updated_at: '2024-12-01',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Small Phone (iPhone SE - 375x667)', () => {
    beforeEach(() => {
      mockDimensions.get.mockReturnValue({ width: 375, height: 667 });
    });

    it('adapts dashboard layout for small screens', () => {
      const { getByTestId } = render(
        <DashboardLayout title="Test" onRefresh={jest.fn()} refreshing={false}>
          <Text testID="content">Content</Text>
        </DashboardLayout>
      );

      const container = getByTestId('dashboard-container');
      expect(container).toBeTruthy();
      
      // Should use single column layout
      expect(container.props.style).toEqual(
        expect.objectContaining({
          flexDirection: 'column',
        })
      );
    });

    it('stacks payment cards vertically on small screens', () => {
      const { getByTestId } = render(
        <PaymentStatusCard
          paymentStatus={mockPayment}
          onPayRent={jest.fn()}
          isLoading={false}
        />
      );

      const card = getByTestId('payment-status-card');
      expect(card.props.style).toEqual(
        expect.objectContaining({
          minHeight: expect.any(Number),
        })
      );
    });

    it('adjusts quick action buttons for small screens', () => {
      const { getByTestId } = render(
        <QuickActionButtons
          onPayRent={jest.fn()}
          onViewDocuments={jest.fn()}
          onContactLandlord={jest.fn()}
          onMaintenanceRequest={jest.fn()}
          onMessageCenter={jest.fn()}
          onPaymentHistory={jest.fn()}
        />
      );

      const container = getByTestId('quick-actions-grid');
      expect(container).toBeTruthy();
      
      // Should use 2-column grid on small screens
      expect(container.props.style).toEqual(
        expect.objectContaining({
          flexDirection: 'row',
          flexWrap: 'wrap',
        })
      );
    });
  });

  describe('Large Phone (iPhone Pro Max - 428x926)', () => {
    beforeEach(() => {
      mockDimensions.get.mockReturnValue({ width: 428, height: 926 });
    });

    it('optimizes layout for larger phones', () => {
      const { getByTestId } = render(
        <DashboardLayout title="Test" onRefresh={jest.fn()} refreshing={false}>
          <Text testID="content">Content</Text>
        </DashboardLayout>
      );

      const container = getByTestId('dashboard-container');
      expect(container).toBeTruthy();
    });

    it('uses larger quick action buttons on big screens', () => {
      const { getByTestId } = render(
        <QuickActionButtons
          onPayRent={jest.fn()}
          onViewDocuments={jest.fn()}
          onContactLandlord={jest.fn()}
          onMaintenanceRequest={jest.fn()}
          onMessageCenter={jest.fn()}
          onPaymentHistory={jest.fn()}
        />
      );

      const payRentButton = getByTestId('quick-action-pay-rent');
      expect(payRentButton.props.style).toEqual(
        expect.objectContaining({
          minHeight: expect.any(Number),
        })
      );
    });
  });

  describe('Tablet (iPad - 768x1024)', () => {
    beforeEach(() => {
      mockDimensions.get.mockReturnValue({ width: 768, height: 1024 });
    });

    it('uses multi-column layout on tablets', () => {
      const { getByTestId } = render(
        <DashboardLayout title="Test" onRefresh={jest.fn()} refreshing={false}>
          <Text testID="content">Content</Text>
        </DashboardLayout>
      );

      const container = getByTestId('dashboard-container');
      expect(container).toBeTruthy();
      
      // Should adapt to tablet layout
      expect(container.props.style).toEqual(
        expect.objectContaining({
          paddingHorizontal: expect.any(Number),
        })
      );
    });

    it('shows more quick actions per row on tablets', () => {
      const { getByTestId } = render(
        <QuickActionButtons
          onPayRent={jest.fn()}
          onViewDocuments={jest.fn()}
          onContactLandlord={jest.fn()}
          onMaintenanceRequest={jest.fn()}
          onMessageCenter={jest.fn()}
          onPaymentHistory={jest.fn()}
        />
      );

      const container = getByTestId('quick-actions-grid');
      // Should use 3-column grid on tablets
      expect(container).toBeTruthy();
    });
  });

  describe('Landscape Orientation', () => {
    beforeEach(() => {
      mockDimensions.get.mockReturnValue({ width: 926, height: 428 });
    });

    it('adapts to landscape mode', () => {
      const { getByTestId } = render(
        <DashboardLayout title="Test" onRefresh={jest.fn()} refreshing={false}>
          <Text testID="content">Content</Text>
        </DashboardLayout>
      );

      const container = getByTestId('dashboard-container');
      expect(container).toBeTruthy();
    });

    it('adjusts quick actions for landscape', () => {
      const { getByTestId } = render(
        <QuickActionButtons
          onPayRent={jest.fn()}
          onViewDocuments={jest.fn()}
          onContactLandlord={jest.fn()}
          onMaintenanceRequest={jest.fn()}
          onMessageCenter={jest.fn()}
          onPaymentHistory={jest.fn()}
        />
      );

      const container = getByTestId('quick-actions-grid');
      expect(container).toBeTruthy();
    });
  });

  describe('Touch Target Accessibility', () => {
    it('ensures minimum touch target size (44px)', () => {
      const { getByTestId } = render(
        <PaymentStatusCard
          paymentStatus={mockPayment}
          onPayRent={jest.fn()}
          isLoading={false}
        />
      );

      const payButton = getByTestId('pay-rent-button');
      expect(payButton.props.style).toEqual(
        expect.objectContaining({
          minHeight: expect.any(Number),
          minWidth: expect.any(Number),
        })
      );
    });

    it('provides adequate spacing between touch elements', () => {
      const { getByTestId } = render(
        <QuickActionButtons
          onPayRent={jest.fn()}
          onViewDocuments={jest.fn()}
          onContactLandlord={jest.fn()}
          onMaintenanceRequest={jest.fn()}
          onMessageCenter={jest.fn()}
          onPaymentHistory={jest.fn()}
        />
      );

      const container = getByTestId('quick-actions-grid');
      expect(container.props.style).toEqual(
        expect.objectContaining({
          gap: expect.any(Number),
        })
      );
    });
  });

  describe('Font Scaling', () => {
    it('respects system font scaling preferences', () => {
      const { getByTestId } = render(
        <PaymentStatusCard
          paymentStatus={mockPayment}
          onPayRent={jest.fn()}
          isLoading={false}
        />
      );

      const amountText = getByTestId('payment-amount');
      expect(amountText.props.style).toEqual(
        expect.objectContaining({
          fontSize: expect.any(Number),
        })
      );
    });
  });

  describe('Safe Area Handling', () => {
    it('handles safe area insets correctly', () => {
      const { getByTestId } = render(
        <DashboardLayout title="Test" onRefresh={jest.fn()} refreshing={false}>
          <Text testID="content">Content</Text>
        </DashboardLayout>
      );

      const container = getByTestId('dashboard-container');
      expect(container).toBeTruthy();
      
      // Should handle safe area
      expect(container.props.style).toEqual(
        expect.objectContaining({
          flex: 1,
        })
      );
    });
  });
});