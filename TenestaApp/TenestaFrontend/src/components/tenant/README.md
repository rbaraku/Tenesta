# Tenant Dashboard Components

A comprehensive set of React Native components built for the Tenesta tenant dashboard experience. These components provide a modular, accessible, and responsive interface for tenants to manage their rental experience.

## Components Overview

### Core Dashboard Components

#### `PaymentStatusCard`
Displays current payment status, due dates, and payment actions.
- Shows rent amount and due date
- Overdue status indicators
- Payment button integration
- Multiple payment types support

#### `PropertyInfoCard`
Shows detailed property and lease information.
- Property details and address
- Unit information (bedrooms, bathrooms, sq ft)
- Lease terms and dates
- Amenities display
- Emergency contact information

#### `MaintenanceRequestCard`
Handles maintenance request creation and status tracking.
- Create new maintenance requests
- View recent requests
- Priority and status indicators
- Category selection
- Modal form interface

#### `MessagesCard`
Messaging interface between tenant and landlord.
- Unread message display
- Quick message composition
- Message preview with timestamps
- Attachment indicators

#### `NotificationsCard`
System notifications and alerts display.
- Unread notification count
- Type-based icons and colors
- Action URL support
- Mark as read functionality

#### `QuickActionButtons`
Grid of common tenant actions.
- Pay rent
- View documents
- Contact landlord
- Maintenance requests
- Message center
- Payment history
- Badge notifications

#### `PaymentHistoryCard`
Recent payment transaction history.
- Payment status indicators
- Transaction details
- Payment method information
- Expandable history view

### Layout Components

#### `DashboardLayout`
Main layout wrapper with responsive design.
- Pull-to-refresh support
- Loading states
- Header management
- Safe area handling
- Responsive breakpoints

#### `DashboardSection`
Sectioned content areas with titles.
- Configurable spacing
- Accessibility headers
- Region labeling

#### `DashboardGrid`
Responsive grid system for components.
- Adaptive column counts
- Tablet and desktop optimization
- Configurable spacing

#### `DashboardCardWrapper`
Priority-based card container.
- High/medium/low priority styling
- Responsive span control
- Elevation effects

### Utility Components

#### `ErrorBoundary`
Error handling and fallback UI.
- Component-level error catching
- User-friendly error messages
- Retry functionality
- Development error details

#### `LoadingState`
Consistent loading UI patterns.
- Activity indicators
- Skeleton loading
- Card placeholders
- Configurable messaging

## Usage Examples

### Basic Dashboard Implementation

```tsx
import {
  DashboardLayout,
  DashboardSection,
  PaymentStatusCard,
  QuickActionButtons,
  PropertyInfoCard,
} from '../../components/tenant';

const TenantDashboard = () => {
  return (
    <DashboardLayout
      title="Welcome back, John"
      subtitle="Tenant Dashboard"
      onRefresh={handleRefresh}
      refreshing={refreshing}
    >
      <DashboardSection title="Payment Status">
        <PaymentStatusCard
          paymentStatus={currentPayment}
          onPayRent={handlePayRent}
        />
      </DashboardSection>
      
      <DashboardSection title="Quick Actions">
        <QuickActionButtons
          onPayRent={handlePayRent}
          onViewDocuments={handleViewDocuments}
          unreadMessageCount={5}
        />
      </DashboardSection>
      
      <DashboardSection title="Property Information">
        <PropertyInfoCard
          property={propertyDetails}
          unit={unitDetails}
          tenancy={tenancyInfo}
        />
      </DashboardSection>
    </DashboardLayout>
  );
};
```

### Grid Layout Example

```tsx
import { DashboardGrid, MessagesCard, NotificationsCard } from '../../components/tenant';

<DashboardSection title="Communications">
  <DashboardGrid columns={2} spacing={16}>
    <MessagesCard
      unreadMessages={messages}
      onSendMessage={handleSendMessage}
    />
    <NotificationsCard
      notifications={notifications}
      onMarkAsRead={handleMarkAsRead}
    />
  </DashboardGrid>
</DashboardSection>
```

### Error Handling Example

```tsx
import { ErrorBoundary } from '../../components/common';

<ErrorBoundary fallbackMessage="Unable to load payment information">
  <PaymentStatusCard
    paymentStatus={currentPayment}
    onPayRent={handlePayRent}
  />
</ErrorBoundary>
```

## Features

### Responsive Design
- Mobile-first approach
- Tablet optimization (768px+)
- Desktop support (1024px+)
- Adaptive column counts
- Flexible spacing system

### Accessibility
- Screen reader support
- Proper ARIA labels
- Keyboard navigation
- Focus management
- High contrast support
- Semantic HTML structure

### Error Handling
- Component-level error boundaries
- Graceful degradation
- User-friendly error messages
- Retry mechanisms
- Loading state management

### Performance
- Optimized re-renders
- Lazy loading support
- Efficient data handling
- Memory leak prevention
- Smooth scrolling

### Customization
- Theme integration
- Configurable colors
- Flexible layouts
- Custom handlers
- Extended props support

## Type Safety

All components are fully typed with TypeScript interfaces:

```tsx
interface PaymentStatusCardProps {
  paymentStatus?: Payment;
  isLoading?: boolean;
  onPayRent: () => void;
  style?: ViewStyle;
}

interface TenantDashboardData {
  user_profile: UserProfile;
  current_tenancy?: Tenancy;
  payment_status?: Payment;
  upcoming_payments: Payment[];
  recent_payments: Payment[];
  // ... more types
}
```

## API Integration

Components are designed to work with the Tenesta backend APIs:

- `/tenant-dashboard` - Main dashboard data
- `/payment-process` - Payment information
- `/maintenance-requests` - Maintenance system
- `/messaging-system` - Communications
- `/household-management` - Tenant data

## Testing

Components include comprehensive testing setup:

- Unit tests for all components
- Integration tests for API connections
- Accessibility testing
- Performance benchmarks
- Error boundary testing

## Dependencies

- React Native
- TypeScript
- Redux Toolkit (state management)
- React Navigation (navigation)
- Custom design system components

## Development

### Adding New Components

1. Create component in `src/components/tenant/`
2. Add TypeScript interfaces
3. Implement accessibility features
4. Add error boundaries
5. Export in `index.ts`
6. Update documentation

### Best Practices

- Follow atomic design principles
- Use consistent naming conventions
- Implement proper error handling
- Include accessibility features
- Write comprehensive prop types
- Add loading states
- Test on multiple devices

## Future Enhancements

- Dark mode support
- Animation improvements
- Offline functionality
- Push notification integration
- Advanced filtering options
- Bulk actions support
- Data export features