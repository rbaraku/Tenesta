---
name: setup-frontend
description: Initialize complete frontend development environment and structure
---

# Frontend Setup Workflow

Initialize the Tenesta React Native frontend from scratch with proper architecture and tooling.

## Current Status:
- **Backend**: 95% complete and ready ✅
- **Frontend**: Not started (ddntii's work preserved in separate branch)
- **Design**: Available reference in `ddntii-frontend-work` branch

## Setup Process:

### **Phase 1: Project Initialization**
```bash
# Initialize React Native project structure
/react-native-lead initialize React Native project with TypeScript and navigation

# Set up development infrastructure  
/devops-engineer setup React Native CI/CD pipeline and build tools

# Establish design system
/ui-designer create design tokens and component specifications

# Plan component architecture
/component-developer design component library structure
```

### **Phase 2: Core Infrastructure**
```bash
# Authentication & Security
/security-engineer implement Supabase Auth integration
/react-native-lead create authentication flow and session management

# API Integration Layer
/api-architect create React Native service layer for Supabase APIs
/integration-specialist setup error handling and retry logic

# State Management
/react-native-lead implement Redux Toolkit with RTK Query
/react-native-lead create global state management patterns
```

### **Phase 3: Base Component Library**
```bash
# Core UI Components
/component-developer create base components (Button, Input, Card, etc.)
/ui-designer implement design system tokens in code
/component-developer setup component testing and Storybook

# Navigation Structure  
/interaction-designer design navigation flows
/react-native-lead implement navigation with React Navigation 6
```

### **Phase 4: Platform Configuration**
```bash
# iOS Setup
/ios-specialist configure iOS project settings and permissions
/ios-specialist setup App Store metadata and assets

# Android Setup  
/android-specialist configure Android project settings and permissions
/android-specialist setup Play Store metadata and assets

# Cross-Platform Testing
/test-automation setup testing framework (Jest + Detox)
/qa-specialist create device testing matrix
```

### **Phase 5: Core Features Implementation**
```bash
# Authentication Screens
/react-native-lead implement login, registration, and onboarding screens

# Dashboard Foundations
/react-native-lead create tenant dashboard structure
/react-native-lead create landlord dashboard structure

# API Integration
/react-native-lead connect dashboards to backend APIs
/integration-specialist implement offline capability and sync
```

## Project Structure:
```
TenestaApp/
├── frontend/                 # New React Native project
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── screens/         # Screen components
│   │   ├── navigation/      # Navigation config
│   │   ├── store/          # Redux store
│   │   ├── services/       # API services
│   │   ├── hooks/          # Custom hooks
│   │   ├── utils/          # Utilities
│   │   ├── types/          # TypeScript types
│   │   └── constants/      # Constants
│   ├── __tests__/          # Test files
│   ├── android/            # Android platform
│   ├── ios/               # iOS platform
│   └── package.json
├── backend/               # Existing backend (complete)
└── docs/                 # Documentation
```

## Technical Decisions:

### **Required Dependencies**:
```json
{
  "dependencies": {
    "react-native": "^0.73.x",
    "@react-navigation/native": "^6.x",
    "@react-navigation/bottom-tabs": "^6.x",
    "@react-navigation/stack": "^6.x",
    "@reduxjs/toolkit": "^2.x",
    "react-redux": "^9.x",
    "@supabase/supabase-js": "^2.x",
    "@stripe/stripe-react-native": "^0.x",
    "react-native-async-storage": "^1.x",
    "react-native-vector-icons": "^10.x"
  },
  "devDependencies": {
    "@types/react": "^18.x",
    "@typescript-eslint/parser": "^6.x",
    "jest": "^29.x",
    "detox": "^20.x",
    "@testing-library/react-native": "^12.x"
  }
}
```

### **Configuration Files Needed**:
- `tsconfig.json` - TypeScript configuration
- `metro.config.js` - Metro bundler configuration  
- `.eslintrc.js` - Code linting rules
- `jest.config.js` - Testing configuration
- `.detoxrc.js` - E2E testing configuration

## Implementation Timeline:
- **Week 1**: Project setup and core infrastructure
- **Week 2**: Component library and navigation
- **Week 3**: Authentication and API integration
- **Week 4**: Core dashboard features
- **Week 5**: Platform-specific features and testing

## Success Criteria:
✅ React Native project builds successfully on both platforms  
✅ Authentication flow works with Supabase  
✅ Navigation structure is complete  
✅ Component library is established  
✅ API integration layer is functional  
✅ Testing framework is operational  
✅ CI/CD pipeline is working  

## Next Steps After Setup:
```bash
# Implement core features
/squad-sync implement tenant dashboard
/squad-sync implement landlord dashboard  
/squad-sync implement payment system

# Add advanced features
/implement-ai-features
/integration-specialist setup push notifications
/analytics-engineer implement usage tracking
```

**Ready to start frontend development!**