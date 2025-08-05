import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { PaymentStatusCard } from '../PaymentStatusCard';
import { Payment } from '../../../types';

// Mock data
const mockPayment: Payment = {
  id: '1',
  tenancy_id: 'test-tenancy',
  amount: 2500,
  status: 'pending',
  due_date: '2025-01-01',
  payment_period_start: '2025-01-01',
  payment_period_end: '2025-01-31',
  created_at: '2024-12-01',
  updated_at: '2024-12-01',
};

const mockOverduePayment: Payment = {
  ...mockPayment,
  due_date: '2024-11-01', // Past date
  status: 'pending',
};

const mockPaidPayment: Payment = {
  ...mockPayment,
  status: 'paid',
  paid_date: '2024-12-28',
};

describe('PaymentStatusCard', () => {
  const mockOnPayRent = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state correctly', () => {
    const { getByTestId } = render(
      <PaymentStatusCard
        paymentStatus={undefined}
        isLoading={true}
        onPayRent={mockOnPayRent}
      />
    );

    expect(getByTestId('payment-status-loading')).toBeTruthy();
  });

  it('renders pending payment correctly', () => {
    const { getByText, getByTestId } = render(
      <PaymentStatusCard
        paymentStatus={mockPayment}
        isLoading={false}
        onPayRent={mockOnPayRent}
      />
    );

    expect(getByText('$2,500.00')).toBeTruthy();
    expect(getByText('Due Jan 1, 2025')).toBeTruthy();
    expect(getByTestId('pay-rent-button')).toBeTruthy();
  });

  it('renders overdue payment with warning styles', () => {
    const { getByText, getByTestId } = render(
      <PaymentStatusCard
        paymentStatus={mockOverduePayment}
        isLoading={false}
        onPayRent={mockOnPayRent}
      />
    );

    expect(getByText('OVERDUE')).toBeTruthy();
    expect(getByTestId('overdue-indicator')).toBeTruthy();
  });

  it('renders paid payment status', () => {
    const { getByText, queryByTestId } = render(
      <PaymentStatusCard
        paymentStatus={mockPaidPayment}
        isLoading={false}
        onPayRent={mockOnPayRent}
      />
    );

    expect(getByText('PAID')).toBeTruthy();
    expect(getByText('Paid Dec 28, 2024')).toBeTruthy();
    expect(queryByTestId('pay-rent-button')).toBeNull();
  });

  it('calls onPayRent when pay button is pressed', async () => {
    const { getByTestId } = render(
      <PaymentStatusCard
        paymentStatus={mockPayment}
        isLoading={false}
        onPayRent={mockOnPayRent}
      />
    );

    fireEvent.press(getByTestId('pay-rent-button'));

    await waitFor(() => {
      expect(mockOnPayRent).toHaveBeenCalledTimes(1);
    });
  });

  it('renders no payment state', () => {
    const { getByText } = render(
      <PaymentStatusCard
        paymentStatus={undefined}
        isLoading={false}
        onPayRent={mockOnPayRent}
      />
    );

    expect(getByText('No payments due')).toBeTruthy();
  });

  it('handles different payment amounts correctly', () => {
    const expensivePayment = { ...mockPayment, amount: 5000 };
    const { getByText } = render(
      <PaymentStatusCard
        paymentStatus={expensivePayment}
        isLoading={false}
        onPayRent={mockOnPayRent}
      />
    );

    expect(getByText('$5,000.00')).toBeTruthy();
  });

  it('applies correct accessibility props', () => {
    const { getByTestId } = render(
      <PaymentStatusCard
        paymentStatus={mockPayment}
        isLoading={false}
        onPayRent={mockOnPayRent}
      />
    );

    const card = getByTestId('payment-status-card');
    expect(card.props.accessibilityRole).toBe('button');
    expect(card.props.accessibilityLabel).toContain('Payment status');
  });
});