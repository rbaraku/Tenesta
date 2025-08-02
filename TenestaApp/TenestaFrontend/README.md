# Tenesta Frontend

React Native mobile application for the Tenesta property management platform.

## 🚀 Features

- **Multi-role Authentication**: Separate dashboards for tenants and landlords
- **Tenant Features**: Rent payments, lease documents, maintenance requests, messaging
- **Landlord Features**: Property management, tenant management, rent collection, analytics
- **Real-time Messaging**: Chat between tenants and landlords
- **Payment Processing**: Stripe integration for secure payments
- **Document Management**: Upload and view lease documents
- **Responsive Design**: Optimized for mobile devices

## 🛠 Tech Stack

- **React Native** with Expo SDK 51+
- **Redux Toolkit** for state management
- **React Navigation** for routing
- **Supabase** for backend integration
- **Stripe** for payment processing
- **TypeScript** for type safety

## 📱 Setup Instructions

### Prerequisites

- Node.js 18+
- Expo CLI
- iOS Simulator or Android Emulator (for testing)

### Installation

1. **Clone and navigate to the project**:
   ```bash
   cd TenestaFrontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   - Copy `.env.example` to `.env`
   - Update the values with your actual Supabase and Stripe credentials:
   ```bash
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-key-here
   ```

4. **Start the development server**:
   ```bash
   npm start
   ```

5. **Run on device/simulator**:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on physical device

## 🏗 Project Structure

```
src/
├── components/          # Reusable UI components
│   └── common/         # Common components (Button, Input, Card)
├── constants/          # App constants and configuration
├── navigation/         # Navigation configuration
├── screens/           # Screen components
│   ├── auth/         # Authentication screens
│   ├── tenant/       # Tenant-specific screens
│   └── landlord/     # Landlord-specific screens
├── services/          # API and external service integrations
├── store/            # Redux store and slices
├── types/            # TypeScript type definitions
└── utils/            # Utility functions
```

## 🎨 Design System

The app follows a consistent design system based on the provided mockups:

- **Primary Color**: Maroon/Brown (#8B4513)
- **Typography**: Clear, readable fonts with proper hierarchy
- **Components**: Consistent button styles, input fields, and cards
- **Layout**: Clean, mobile-first design with proper spacing

## 🔐 Authentication Flow

1. **Sign In**: Email/password + OAuth (Google, Apple)
2. **Role Detection**: Automatically routes to appropriate dashboard
3. **Session Management**: Persistent sessions with automatic refresh
4. **Security**: Secure token handling with Supabase Auth

## 📊 Dashboard Features

### Tenant Dashboard
- Rent balance and payment status
- Quick actions (pay rent, view documents, maintenance requests)
- Recent activity feed
- Direct messaging with landlord

### Landlord Dashboard
- Portfolio overview with key metrics
- Property and tenant management
- Rent collection tracking
- Analytics and reporting
- Multi-tenant messaging

## 🔌 Backend Integration

The frontend integrates with 11 Supabase Edge Functions:

1. **auth-handler** - Authentication and user management
2. **tenant-dashboard** - Tenant dashboard data
3. **landlord-dashboard** - Landlord dashboard data
4. **user-profile** - User profile management
5. **property-management** - Property CRUD operations
6. **tenancy-management** - Tenancy lifecycle management
7. **payment-processing** - Stripe payment integration
8. **messaging** - Real-time messaging system
9. **lease-documents** - Document upload/download
10. **notifications** - Push notification handling
11. **ai-features** - AI-powered features

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Type checking
npx tsc --noEmit

# Linting
npx eslint src/
```

## 📱 Building for Production

```bash
# Build for production
expo build:android
expo build:ios

# Or using EAS Build
eas build --platform all
```

## 🚀 Deployment

The app can be deployed using:
- **Expo Application Services (EAS)**
- **App Store Connect** (iOS)
- **Google Play Console** (Android)

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | Yes |

## 📚 Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [Supabase React Native Guide](https://supabase.com/docs/guides/getting-started/quickstarts/react-native)
- [Stripe React Native](https://github.com/stripe/stripe-react-native)

## 🤝 Contributing

1. Follow the existing code style and conventions
2. Add TypeScript types for all new code
3. Test on both iOS and Android platforms
4. Update documentation for new features

## 📄 License

Private - Tenesta Property Management Platform