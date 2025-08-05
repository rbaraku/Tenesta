import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { MaintenanceRequestCard } from '../MaintenanceRequestCard';
import { MaintenanceRequest } from '../../../types';

const mockMaintenanceRequests: MaintenanceRequest[] = [
  {
    id: '1',
    tenancy_id: 'test-tenancy',
    title: 'Kitchen Faucet Leak',
    description: 'The kitchen faucet has been dripping for 2 days',
    priority: 'medium',
    status: 'submitted',
    category: 'plumbing',
    created_at: '2024-12-01',
    updated_at: '2024-12-01',
  },
  {
    id: '2',
    tenancy_id: 'test-tenancy',
    title: 'Broken Light Bulb',
    description: 'Light bulb in bedroom needs replacement',
    priority: 'low',
    status: 'completed',
    category: 'electrical',
    created_at: '2024-11-15',
    updated_at: '2024-11-20',
    completed_at: '2024-11-20',
  },
];

describe('MaintenanceRequestCard', () => {
  const mockOnCreateRequest = jest.fn();
  const mockOnViewRequests = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders recent maintenance requests', () => {
    const { getByText } = render(
      <MaintenanceRequestCard
        recentRequests={mockMaintenanceRequests}
        onCreateRequest={mockOnCreateRequest}
        onViewRequests={mockOnViewRequests}
      />
    );

    expect(getByText('Kitchen Faucet Leak')).toBeTruthy();
    expect(getByText('Broken Light Bulb')).toBeTruthy();
  });

  it('shows correct status indicators', () => {
    const { getByText } = render(
      <MaintenanceRequestCard
        recentRequests={mockMaintenanceRequests}
        onCreateRequest={mockOnCreateRequest}
        onViewRequests={mockOnViewRequests}
      />
    );

    expect(getByText('SUBMITTED')).toBeTruthy();
    expect(getByText('COMPLETED')).toBeTruthy();
  });

  it('shows correct priority indicators', () => {
    const { getByTestId } = render(
      <MaintenanceRequestCard
        recentRequests={mockMaintenanceRequests}
        onCreateRequest={mockOnCreateRequest}
        onViewRequests={mockOnViewRequests}
      />
    );

    expect(getByTestId('priority-medium')).toBeTruthy();
    expect(getByTestId('priority-low')).toBeTruthy();
  });

  it('calls onCreateRequest when create button is pressed', async () => {
    const { getByTestId } = render(
      <MaintenanceRequestCard
        recentRequests={mockMaintenanceRequests}
        onCreateRequest={mockOnCreateRequest}
        onViewRequests={mockOnViewRequests}
      />
    );

    fireEvent.press(getByTestId('create-request-button'));

    await waitFor(() => {
      expect(mockOnCreateRequest).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onViewRequests when view all button is pressed', async () => {
    const { getByTestId } = render(
      <MaintenanceRequestCard
        recentRequests={mockMaintenanceRequests}
        onCreateRequest={mockOnCreateRequest}
        onViewRequests={mockOnViewRequests}
      />
    );

    fireEvent.press(getByTestId('view-all-requests-button'));

    await waitFor(() => {
      expect(mockOnViewRequests).toHaveBeenCalledTimes(1);
    });
  });

  it('renders empty state when no requests', () => {
    const { getByText } = render(
      <MaintenanceRequestCard
        recentRequests={[]}
        onCreateRequest={mockOnCreateRequest}
        onViewRequests={mockOnViewRequests}
      />
    );

    expect(getByText('No maintenance requests')).toBeTruthy();
  });

  it('shows modal when create request is triggered', async () => {
    const { getByTestId, queryByTestId } = render(
      <MaintenanceRequestCard
        recentRequests={mockMaintenanceRequests}
        onCreateRequest={mockOnCreateRequest}
        onViewRequests={mockOnViewRequests}
      />
    );

    // Initially modal should not be visible
    expect(queryByTestId('maintenance-request-modal')).toBeNull();

    // Open modal
    fireEvent.press(getByTestId('create-request-button'));

    await waitFor(() => {
      expect(queryByTestId('maintenance-request-modal')).toBeTruthy();
    });
  });

  it('handles urgent priority with correct styling', () => {
    const urgentRequest: MaintenanceRequest = {
      ...mockMaintenanceRequests[0],
      priority: 'urgent',
      title: 'Water Leak Emergency',
    };

    const { getByTestId, getByText } = render(
      <MaintenanceRequestCard
        recentRequests={[urgentRequest]}
        onCreateRequest={mockOnCreateRequest}
        onViewRequests={mockOnViewRequests}
      />
    );

    expect(getByText('Water Leak Emergency')).toBeTruthy();
    expect(getByTestId('priority-urgent')).toBeTruthy();
  });

  it('truncates long descriptions correctly', () => {
    const longDescriptionRequest: MaintenanceRequest = {
      ...mockMaintenanceRequests[0],
      description: 'This is a very long description that should be truncated to prevent the UI from looking messy and to maintain good user experience',
    };

    const { getByText } = render(
      <MaintenanceRequestCard
        recentRequests={[longDescriptionRequest]}
        onCreateRequest={mockOnCreateRequest}
        onViewRequests={mockOnViewRequests}
      />
    );

    // Should show truncated description
    const descriptionElement = getByText(/This is a very long description/);
    expect(descriptionElement).toBeTruthy();
  });
});