# Tenesta - Product Requirements Document (PRD)

## Executive Summary

**Product Name:** Tenesta  
**Version:** 1.0 (Launch Version)  
**Document Version:** 1.1  
**Last Updated:** June 19, 2025  
**Project Type:** Dual-sided mobile platform for rental management  

### Vision Statement
Tenesta is a dual-sided mobile platform built to fix the broken rental system in America. Through smart UX, embedded AI tools, and clean design, Tenesta helps tenants feel protected and landlords feel empowered—all from one app.

### Brand Identity
- **"Ten"** = Tenant
- **"Nest"** = Home, safety, comfort  
- **"-a"** = A soft, app-like ending

**Core Values:**
- A home for tenants and landlords to feel secure
- A digital nest where everything about your rental lives safely
- A neutral-sounding brand (not too techy, not too corporate)
- Scalable: works for individuals, landlords, and firms alike

## Problem Statement

The current rental system in America is broken, characterized by:
- Poor communication between tenants and landlords
- Lack of transparency in rent payment and lease management
- Frequent disputes due to inadequate documentation
- No centralized platform for rental relationship management
- Chaotic rental situations with no structure or organization

## Target Users

### Primary Users
1. **Tenants** - Renters seeking protection, organization, and clear communication
2. **Small Landlords (2-5 units)** - Individual property owners needing management tools
3. **Larger Landlords (6-100+ units)** - Property owners requiring portfolio management
4. **Property Management Companies** - Professional firms managing 50+ units

### User Personas

**Tenant Persona - "Sarah"**
- Age: 25-35
- Needs: Payment tracking, lease organization, dispute documentation
- Pain Points: Unclear communication, security deposit concerns, roommate coordination

**Small Landlord Persona - "Robert"**
- Age: 35-55, owns 2-5 rental units
- Needs: Rent collection, tenant communication, property management
- Pain Points: Manual tracking, time-consuming administration

**Property Manager Persona - "Jane"**
- Age: 30-50, manages 50+ units professionally
- Needs: Portfolio oversight, bulk operations, reporting, staff management
- Pain Points: Multiple systems, inefficient workflows, compliance tracking

## Product Goals & Success Metrics

### Primary Goals
- Simplify rent payment and tracking processes
- Improve tenant-landlord communication
- Prevent disputes through better documentation
- Provide structure to chaotic rental situations

### Success Metrics
- **User Acquisition:** 10,000+ users by month 12
- **Revenue:** $10K-$25K+ monthly recurring revenue by month 12
- **Retention:** 80%+ monthly active user retention
- **Customer Satisfaction:** 4.5+ app store rating
- **B2B Growth:** 5-10 enterprise clients generating $5K-$15K MRR

## Core Features & Requirements

### 1. Tenant Features

#### 1.1 Rent Payment Status Dashboard
- **Purpose:** Central hub for all payment-related information
- **Requirements:**
  - Real-time payment status display
  - Payment history with receipts
  - Outstanding balance tracking
  - Integration with Stripe payment processing
  - Offline data caching for payment history

#### 1.2 Upcoming Due Dates View
- **Purpose:** Prevent late payments through clear visibility
- **Requirements:**
  - Calendar view of payment due dates
  - Push notifications for upcoming payments (7, 3, 1 day before)
  - Customizable reminder settings
  - Grace period tracking
  - Offline access to cached due dates

#### 1.3 Security Deposit Tracker
- **Purpose:** Monitor security deposit status and conditions
- **Requirements:**
  - Deposit amount and date tracking
  - Move-in condition documentation
  - Photo upload for condition evidence
  - Return timeline tracking
  - Legal compliance reminders

#### 1.4 Lease Document Management
- **Purpose:** Centralized lease document storage and access
- **Requirements:**
  - PDF and image upload capability
  - Document categorization and tagging
  - Search functionality within documents
  - Secure cloud storage with encryption
  - Offline document viewing (cached)
  - AI-powered lease language analyzer

#### 1.5 Lease Violation Logger
- **Purpose:** Document potential lease violations or disputes
- **Requirements:**
  - Incident logging with timestamps
  - Photo and video evidence upload
  - Category classification (maintenance, noise, etc.)
  - Status tracking (reported, pending, resolved)
  - Push notifications for violation updates

#### 1.6 Private Notes System
- **Purpose:** Personal documentation visible only to tenant
- **Requirements:**
  - Free-form text entry
  - Date/time stamps
  - Search and filter capabilities
  - Export functionality
  - Offline note creation and sync

#### 1.7 AI Message Templates & Communication Tools
- **Purpose:** Facilitate professional communication and avoid conflict
- **Requirements:**
  - Pre-written templates for common scenarios
  - AI-powered tone adjustment (polite vs assertive)
  - AI dispute message rephraser
  - Customization options
  - Multi-language support
  - Conflict de-escalation suggestions

#### 1.8 Roommate Nudge System
- **Purpose:** Coordinate with roommates on shared responsibilities
- **Requirements:**
  - Shared payment reminders
  - Task assignment and tracking
  - Group messaging
  - Split payment calculations

### 2. Landlord Features

#### 2.1 Dashboard of All Units
- **Purpose:** Portfolio overview and management center
- **Requirements:**
  - Property list with key metrics
  - Occupancy status indicators
  - Financial performance summary
  - Quick action buttons
  - Portfolio analytics integration

#### 2.2 Rent Collection Tracker
- **Purpose:** Monitor rent payments across all properties
- **Requirements:**
  - Payment status by unit and tenant
  - Late payment alerts via push notifications
  - Collection analytics and trends
  - Automated follow-up capabilities
  - Rent delinquency rate tracking

#### 2.3 Lease Upload & Issue Tracker
- **Purpose:** Centralized lease management and issue resolution
- **Requirements:**
  - Bulk lease upload capability
  - Issue categorization and prioritization
  - Assignment to maintenance staff
  - Resolution timeline tracking
  - Push notifications for lease expiring soon

#### 2.4 Exportable Monthly Reports
- **Purpose:** Financial and operational reporting
- **Requirements:**
  - PDF and CSV export formats
  - Customizable report parameters
  - Automated report generation
  - Email delivery scheduling
  - Unit turnover rate analytics

#### 2.5 Violation Tracker
- **Purpose:** Monitor and manage lease violations
- **Requirements:**
  - Violation logging and categorization
  - Escalation workflows
  - Legal compliance tracking
  - Documentation management
  - Fair Housing Act compliance reminders

#### 2.6 Notes & Documentation Log
- **Purpose:** Comprehensive record keeping
- **Requirements:**
  - Tenant interaction logs
  - Maintenance history tracking
  - Financial transaction records
  - Legal document storage

#### 2.7 Smart Reminders
- **Purpose:** Automated task and deadline management
- **Requirements:**
  - Customizable reminder schedules
  - Multi-channel notifications (app, email, SMS)
  - Priority-based alerts
  - Snooze and reschedule options

### 3. B2B Enterprise Features

#### 3.1 Custom Onboarding for Property Firms
- **Purpose:** Tailored setup process for enterprise clients
- **Requirements:**
  - Custom signup forms with company branding
  - Bulk property and tenant import tools
  - Dedicated onboarding specialist assignment
  - Custom data migration services
  - Integration with existing property management systems

#### 3.2 Staff Role Management System
- **Purpose:** Team collaboration with granular permissions
- **Requirements:**
  - **Role Types:**
    - Property Manager (full access)
    - Assistant Manager (limited unit access)
    - Maintenance Staff (work order access only)
    - Accounting (financial data access)
    - Leasing Agent (tenant onboarding access)
  - Custom permission creation
  - Activity logging and audit trails
  - Team performance metrics
  - Staff productivity analytics

#### 3.3 Advanced Portfolio Analytics
- **Purpose:** Data-driven insights for large portfolios
- **Requirements:**
  - **Key Metrics:**
    - Unit turnover rates by property
    - Rent delinquency rates and trends
    - Average time to lease units
    - Maintenance cost per unit
    - Tenant satisfaction scores
    - Revenue per square foot
  - Comparative analysis across properties
  - Predictive analytics for vacancy rates
  - Market rate comparison tools
  - Custom dashboard creation

#### 3.4 White-Label Options
- **Purpose:** Branded experience for enterprise clients
- **Requirements:**
  - Custom app icon and splash screen
  - Company logo integration throughout app
  - Custom color scheme and branding
  - Branded email templates and notifications
  - Custom domain for web portal
  - Private app store distribution option

#### 3.5 Bulk Operations & Advanced Tools
- **Purpose:** Efficient management of large portfolios
- **Requirements:**
  - Bulk messaging capabilities
  - Mass document uploads
  - Batch payment processing
  - Group policy updates
  - AI rent increase simulator with market data

#### 3.6 Lease Analyzer Bot (AI-Powered)
- **Purpose:** Intelligent lease analysis and optimization
- **Requirements:**
  - AI-powered lease review for compliance
  - Risk assessment and recommendations
  - Legal clause analysis and suggestions
  - Market rate comparisons
  - Automated lease renewal recommendations

## AI Features Breakdown

### 4.1 AI-Generated Lease Language Analyzer
- **Purpose:** Review and optimize lease documents
- **Features:**
  - Legal compliance checking
  - Risk assessment for problematic clauses
  - Suggestions for standard language improvements
  - State-specific regulation compliance
  - Plain language translation for complex terms

### 4.2 AI Dispute Message Rephraser
- **Purpose:** Improve communication tone and reduce conflicts
- **Features:**
  - Tone analysis (aggressive, neutral, polite)
  - Message rewriting for different styles
  - Conflict de-escalation suggestions
  - Legal language compliance checking
  - Template generation for common disputes

### 4.3 AI Rent Increase Simulator
- **Purpose:** Fair pricing tools and market analysis
- **Features:**
  - Market rate analysis by location
  - Rent increase impact modeling
  - Tenant retention probability calculation
  - Legal compliance checking for rent control areas
  - ROI optimization recommendations

### 4.4 AI Virtual Assistant for Billing
- **Purpose:** Automated customer service for subscription management
- **Features:**
  - Plan upgrade/downgrade assistance
  - Billing inquiry resolution
  - Proration calculation explanations
  - Payment failure handling
  - Cancellation retention attempts

## Billing & Subscription Management

### 5.1 Stripe Integration Details
- **Purpose:** Comprehensive payment processing solution
- **Requirements:**
  - **Payment Methods:** Credit/debit cards, ACH, Apple Pay, Google Pay
  - **Subscription Management:** Automated recurring billing
  - **Webhook Integration:** Real-time payment status updates
  - **Failed Payment Handling:** Automatic retry logic with email notifications
  - **Tax Calculation:** Automated tax calculation by location
  - **Invoice Generation:** Automatic PDF invoice creation
  - **Refund Processing:** Partial and full refund capabilities

### 5.2 In-App Plan Management
- **Purpose:** Seamless subscription experience
- **Requirements:**
  - One-click plan upgrades/downgrades
  - Real-time plan comparison tool
  - Usage-based upgrade recommendations
  - Feature preview for higher tiers
  - Downgrade protection (prevent data loss)

### 5.3 Free Trial Logic
- **Purpose:** Convert users to paid subscriptions
- **Requirements:**
  - **Trial Periods:**
    - Tenants: 14-day free trial
    - Landlords: 30-day free trial
    - Enterprise: 60-day free trial with demo
  - Progressive feature unlocking during trial
  - Trial expiration reminders (7, 3, 1 day)
  - Easy conversion to paid plans
  - Grace period for expired trials

### 5.4 Proration Handling
- **Purpose:** Fair billing for plan changes
- **Requirements:**
  - Automatic proration calculations
  - Credit application for downgrades
  - Immediate access to upgraded features
  - Clear billing explanations via AI assistant
  - Refund processing for overpayments

## Push Notification System

### 6.1 Notification Categories
- **Rent Due Alerts:** 7, 3, 1 day before due date
- **Payment Confirmations:** Immediate confirmation of successful payments
- **Lease Expiring Soon:** 90, 60, 30 day reminders
- **Violation Updates:** Real-time status changes on reported issues
- **System Announcements:** App updates, maintenance windows
- **B2B Communications:** Staff assignments, bulk operation completions
- **AI Insights:** Rent increase opportunities, market updates

### 6.2 Notification Preferences
- **User Control:** Granular on/off settings by category
- **Timing Options:** Custom quiet hours and preferred times
- **Channel Selection:** Push, email, SMS options
- **Frequency Limits:** Anti-spam controls
- **Emergency Override:** Critical notifications bypass user preferences

## Admin Panel & Backend Management

### 7.1 User Management Dashboard
- **Purpose:** Comprehensive user oversight and support
- **Features:**
  - User search and filtering capabilities
  - Account status monitoring (active, suspended, canceled)
  - Usage analytics per user
  - Support ticket integration
  - Manual account adjustments
  - Data export capabilities

### 7.2 Dispute Management System
- **Purpose:** Manual oversight of reported issues
- **Features:**
  - Dispute queue with priority sorting
  - Case file management with full history
  - Evidence review tools (photos, documents, messages)
  - Resolution tracking and outcomes
  - Legal escalation pathways
  - Automated case closure workflows

### 7.3 B2B Contract Approval Workflow
- **Purpose:** Custom enterprise deal management
- **Features:**
  - Contract review and approval queue
  - Custom pricing approval process
  - Feature customization requests
  - White-label branding approvals
  - Implementation timeline tracking
  - Legal review integration

### 7.4 Analytics & Reporting Dashboard
- **Purpose:** Business intelligence and decision making
- **Features:**
  - Revenue analytics and forecasting
  - User growth and retention metrics
  - Feature adoption rates
  - Performance monitoring (app crashes, load times)
  - A/B testing results tracking
  - Customer satisfaction surveys

## Offline Access & Data Management

### 8.1 Offline Functionality
- **Purpose:** Ensure app usability without internet connection
- **Critical Offline Features:**
  - View cached payment history
  - Access downloaded lease documents
  - Create notes and incident reports (sync when online)
  - View upcoming due dates
  - Browse contact information
  - Read cached AI suggestions

### 8.2 Data Sync Strategy
- **Purpose:** Seamless online/offline transition
- **Requirements:**
  - Automatic sync when connection restored
  - Conflict resolution for concurrent edits
  - Progressive data downloading
  - Smart caching of frequently accessed data
  - Offline indicator with sync status

## Technical Requirements

### 9.1 Platform Requirements
- **Primary Platform:** iOS (React Native)
- **Secondary Platforms:** Android, Web (future phases)
- **Backend:** Scalable cloud infrastructure (AWS/Azure)
- **Database:** PostgreSQL with Redis caching
- **API:** RESTful API design with GraphQL for complex queries

### 9.2 Performance Requirements
- **Load Time:** App screens load within 2 seconds
- **Uptime:** 99.9% availability
- **Scalability:** Support for 10,000+ concurrent users
- **Data Sync:** Real-time synchronization across devices
- **Offline Performance:** Core features accessible within 1 second

### 9.3 Security Requirements
- **Data Encryption:** AES-256 encryption for data at rest, TLS 1.3 for data in transit
- **Authentication:** Multi-factor authentication support, OAuth 2.0
- **Compliance:** SOC 2 Type II, GDPR, CCPA compliant
- **Backup:** Automated daily backups with 90-day retention
- **Access Control:** Role-based permissions with audit logging

### 9.4 Integration Requirements
- **Payment Processing:** Stripe Connect for multi-party payments
- **Cloud Storage:** AWS S3 for document storage with CDN
- **Analytics:** Windsor AI integration, Mixpanel for user analytics
- **Notifications:** Firebase Cloud Messaging, SendGrid for email
- **Communication:** Twilio for SMS, WebRTC for video calls

## Legal & Compliance Framework

### 10.1 Required Legal Documents
- **Terms of Service:** Comprehensive user agreement covering liability, usage rights, dispute resolution
- **Privacy Policy:** GDPR and CCPA compliant data handling procedures
- **Fair Housing Policy:** Anti-discrimination compliance and reporting tools
- **Acceptable Use Policy:** Guidelines for appropriate platform usage
- **Data Processing Agreement:** B2B client data handling terms

### 10.2 Compliance Features
- **Fair Housing Act Compliance:**
  - Built-in discrimination prevention alerts
  - Compliant language suggestions for listings
  - Required fair housing notices in communications
  - Bias detection in AI-generated content
- **State-Specific Regulations:**
  - Rent control compliance checking
  - Security deposit law adherence
  - Eviction process guidance
  - Required notice period calculations

### 10.3 Legal Risk Mitigation
- **Disclaimer Integration:** Clear liability limitations throughout app
- **Legal Resource Center:** State-specific landlord-tenant law summaries
- **Professional Legal Referrals:** Directory of qualified real estate attorneys
- **Compliance Monitoring:** Automated checking of legal requirement changes

## Business Model & Pricing

### Revenue Tiers

| Tier | Price | Target Audience | Key Features |
|------|-------|----------------|--------------|
| **Tenants** | $4.99-$7.99/mo | Renters seeking protection | All tenant features, AI templates, 14-day trial |
| **Landlords (2-5 units)** | $12.99/mo | Small property owners | Basic landlord tools, limited units, 30-day trial |
| **Landlord Pro** | $29-$99/mo | Larger landlords | Advanced features, 6-100+ units, analytics |
| **B2B Firms** | $250-$2,500/mo | Property management companies | Enterprise features, white-label, custom onboarding |

### Monetization Strategy
- **Freemium Model:** Basic features free, premium features paid
- **Subscription-Based:** Monthly recurring revenue model
- **Custom Enterprise:** Flexible pricing for large clients
- **Free Trials:** Tiered trial periods with feature progression

## Development Timeline & Milestones

### Phase 1: MVP Development (Month 1)
- **Deliverables:**
  - Core tenant and landlord features
  - Basic UI/UX implementation
  - Stripe integration
  - TestFlight beta release
- **Success Criteria:**
  - 100-300 beta users
  - Core functionality testing complete
  - Payment processing functional

### Phase 2: Public Launch (Months 2-3)
- **Deliverables:**
  - App Store submission and approval
  - Push notification system
  - AI message templates
  - Marketing campaign launch
- **Success Criteria:**
  - 500-2,000 users
  - $800-$1,500 monthly revenue
  - 4.0+ app store rating

### Phase 3: B2B Development (Months 4-6)
- **Deliverables:**
  - Landlord Pro features
  - Admin panel
  - Staff role management
  - B2B client acquisition
- **Success Criteria:**
  - 5,000+ users
  - $3K-$9K monthly revenue
  - 2-3 enterprise clients

### Phase 4: Scale & Expand (Months 6-12)
- **Deliverables:**
  - Android and web versions
  - White-label options
  - Advanced AI features
  - Portfolio analytics
- **Success Criteria:**
  - 10,000+ users
  - $10K-$25K+ monthly revenue
  - 5-10 enterprise clients

## Team Structure & Responsibilities

### Denat M - Founder & CEO
- Product direction and feature vision
- Social media and launch strategy
- B2B sales, pricing, and customer acquisition
- UX testing and user feedback
- Brand development and content strategy
- Legal compliance and policy development
- Future fundraising activities

### Rron B - Co-Founder & CTO
- Full application development (iOS + backend)
- AI systems, chatbots, and analyzers
- TestFlight builds and App Store submission
- Technical scaling and crash protection
- Admin panel and backend tools development
- Security implementation and monitoring
- Future Android and web development

## Risk Assessment & Mitigation

### Technical Risks
- **Risk:** Scalability issues with user growth
- **Mitigation:** Cloud-based architecture with auto-scaling and load balancing

### Market Risks
- **Risk:** Competition from established players
- **Mitigation:** Focus on superior UX, AI-powered features, and B2B customization

### Legal Risks
- **Risk:** Housing regulation compliance failures
- **Mitigation:** Built-in compliance tools, legal consultation, regular policy updates

### Business Risks
- **Risk:** Low user adoption rates
- **Mitigation:** Comprehensive marketing strategy, freemium model, referral programs

## Success Criteria & KPIs

### User Metrics
- Monthly Active Users (MAU)
- User Retention Rate (30, 60, 90 days)
- App Store Rating and Reviews
- Feature Adoption Rates
- Customer Support Satisfaction

### Business Metrics
- Monthly Recurring Revenue (MRR)
- Customer Acquisition Cost (CAC)
- Lifetime Value (LTV)
- Churn Rate by User Tier
- Free Trial Conversion Rate

### Product Metrics
- App Performance (load times, crash rates)
- Feature Usage Analytics
- Payment Success Rates
- Offline Usage Patterns
- AI Feature Effectiveness

## Appendix

### A. User Flow Diagrams
*[To be created during design phase]*

### B. API Documentation
*[To be developed during technical implementation]*

### C. Competitive Analysis
*[To be conducted before launch]*

### D. Legal Documentation Templates
*[To be reviewed with legal counsel before launch]*

### E. Compliance Checklist
*[Fair Housing Act, state regulations, data privacy laws]*

---

**Document Prepared By:** Tenesta Product Team  
**Review Cycle:** Monthly during development, quarterly post-launch  
**Next Review Date:** July 19, 2025  
**Legal Review Required:** Before App Store submission