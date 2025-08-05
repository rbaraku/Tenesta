---
name: squad-sync
description: Coordinate work between multiple agent squads for complex features
arguments:
  - name: feature
    description: Feature requiring multi-squad coordination
---

# Squad Coordination System

Coordinate implementation of complex features requiring multiple teams.

## Feature: {{feature}}

## Squad Assignment Protocol:

### **Phase 1: Analysis & Planning**
1. **Product Director** (`/product-director`) - Feature prioritization and requirements
2. **Technical Director** (`/tech-director`) - Technical feasibility and architecture 
3. **UX Researcher** (`/ux-researcher`) - User research and validation

### **Phase 2: Design & Architecture**  
1. **UI Designer** (`/ui-designer`) - Visual design and component specs
2. **Interaction Designer** (`/interaction-designer`) - User flows and micro-interactions
3. **API Architect** (`/api-architect`) - Backend API design
4. **Database Engineer** (`/database-engineer`) - Data structure design

### **Phase 3: Parallel Implementation**
#### **Backend Squad** (can start immediately):
- **API Architect** (`/api-architect`) - Implement APIs
- **Database Engineer** (`/database-engineer`) - Database changes  
- **Security Engineer** (`/security-engineer`) - Security review

#### **Frontend Squad** (starts after design approval):
- **React Native Lead** (`/react-native-lead`) - Core implementation
- **Component Developer** (`/component-developer`) - UI components
- **iOS Specialist** (`/ios-specialist`) - iOS-specific features
- **Android Specialist** (`/android-specialist`) - Android-specific features

#### **AI Squad** (if needed):
- **AI Engineer** (`/ai-engineer`) - AI/ML implementation
- **Conversational AI** (`/conversational-ai`) - Chat/NLP features

### **Phase 4: Integration & Testing**
1. **Integration Specialist** (`/integration-specialist`) - Third-party integrations
2. **Test Automation** (`/test-automation`) - Automated testing
3. **QA Specialist** (`/qa-specialist`) - Manual testing and validation
4. **Performance Engineer** (`/performance-engineer`) - Performance optimization

### **Phase 5: Deployment & Analytics**
1. **DevOps Engineer** (`/devops-engineer`) - Deployment and infrastructure
2. **Analytics Engineer** (`/analytics-engineer`) - Tracking implementation
3. **Growth Hacker** (`/growth-hacker`) - Feature optimization for growth

## Communication Protocol:
- **Daily Sync**: Squad leads report progress and blockers
- **Blocking Issues**: Escalated immediately to Technical Director
- **Dependencies**: Cross-squad dependencies managed through this coordination
- **Documentation**: All squads update shared documentation continuously

## Parallel Work Streams:
✅ **Backend + Design**: Can work simultaneously
✅ **AI Features**: Can develop independently  
✅ **Platform Setup**: Can happen in parallel
⚠️ **Frontend**: Requires design approval first
⚠️ **Testing**: Requires implementation completion
⚠️ **Deployment**: Requires all components ready

## Feature Template Commands:
For common features, use these shortcuts:

### **Authentication Flow**:
```bash
/ux-researcher analyze authentication flow
/ui-designer create auth screens
/security-engineer implement auth security
/react-native-lead build auth components
```

### **Payment Feature**:
```bash  
/product-director analyze payment requirements
/api-architect implement payment APIs
/integration-specialist setup Stripe integration
/component-developer build payment UI
```

### **Dashboard Feature**:
```bash
/ux-researcher research dashboard needs
/ui-designer create dashboard layouts  
/api-architect implement dashboard APIs
/react-native-lead build dashboard screens
```

## Coordination Success Metrics:
- **No Blocking Dependencies**: Teams can work independently
- **Consistent Communication**: Daily updates from all squads
- **Quality Delivery**: All code reviewed and tested
- **On-Time Delivery**: Feature delivered within sprint timeline