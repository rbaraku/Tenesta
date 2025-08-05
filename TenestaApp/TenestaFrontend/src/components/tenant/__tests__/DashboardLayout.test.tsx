import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { DashboardLayout } from '../DashboardLayout';
import { Text } from 'react-native';

describe('DashboardLayout', () => {
  const mockOnRefresh = jest.fn();
  const mockChildren = <Text testID="test-child">Test Content</Text>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders title and subtitle correctly', () => {
    const { getByText } = render(
      <DashboardLayout
        title="Welcome back, John"
        subtitle="Tenant Dashboard"
        onRefresh={mockOnRefresh}
        refreshing={false}
      >
        {mockChildren}
      </DashboardLayout>
    );

    expect(getByText('Welcome back, John')).toBeTruthy();
    expect(getByText('Tenant Dashboard')).toBeTruthy();
  });

  it('renders children content', () => {
    const { getByTestId } = render(
      <DashboardLayout
        title="Test Title"
        onRefresh={mockOnRefresh}
        refreshing={false}
      >
        {mockChildren}
      </DashboardLayout>
    );

    expect(getByTestId('test-child')).toBeTruthy();
  });

  it('handles pull-to-refresh correctly', async () => {
    const { getByTestId } = render(
      <DashboardLayout
        title="Test Title"
        onRefresh={mockOnRefresh}
        refreshing={false}
      >
        {mockChildren}
      </DashboardLayout>
    );

    const scrollView = getByTestId('dashboard-scroll-view');
    fireEvent(scrollView, 'refresh');

    await waitFor(() => {
      expect(mockOnRefresh).toHaveBeenCalledTimes(1);
    });
  });

  it('shows refreshing state correctly', () => {
    const { getByTestId } = render(
      <DashboardLayout
        title="Test Title"
        onRefresh={mockOnRefresh}
        refreshing={true}
      >
        {mockChildren}
      </DashboardLayout>
    );

    const scrollView = getByTestId('dashboard-scroll-view');
    expect(scrollView.props.refreshing).toBe(true);
  });

  it('renders without subtitle', () => {
    const { getByText, queryByTestId } = render(
      <DashboardLayout
        title="Just Title"
        onRefresh={mockOnRefresh}
        refreshing={false}
      >
        {mockChildren}
      </DashboardLayout>
    );

    expect(getByText('Just Title')).toBeTruthy();
    expect(queryByTestId('dashboard-subtitle')).toBeNull();
  });

  it('applies safe area handling', () => {
    const { getByTestId } = render(
      <DashboardLayout
        title="Test Title"
        onRefresh={mockOnRefresh}
        refreshing={false}
      >
        {mockChildren}
      </DashboardLayout>
    );

    const container = getByTestId('dashboard-container');
    expect(container).toBeTruthy();
  });

  it('handles empty children gracefully', () => {
    const { getByTestId } = render(
      <DashboardLayout
        title="Test Title"
        onRefresh={mockOnRefresh}
        refreshing={false}
      >
        {null}
      </DashboardLayout>
    );

    expect(getByTestId('dashboard-scroll-view')).toBeTruthy();
  });

  it('applies correct accessibility properties', () => {
    const { getByTestId } = render(
      <DashboardLayout
        title="Dashboard Title"
        subtitle="Dashboard Subtitle"
        onRefresh={mockOnRefresh}
        refreshing={false}
      >
        {mockChildren}
      </DashboardLayout>
    );

    const header = getByTestId('dashboard-header');
    expect(header.props.accessibilityRole).toBe('header');
  });
});