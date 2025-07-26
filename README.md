# Tenesta - Dual-Sided Rental Management Platform

**A comprehensive rental management platform built to fix the broken rental system in America.**

![Status](https://img.shields.io/badge/Status-Development-yellow)
![Backend](https://img.shields.io/badge/Backend-Ready-green)
![Database](https://img.shields.io/badge/Database-45%20Tables-blue)
![APIs](https://img.shields.io/badge/APIs-8%20Endpoints-success)

## 🏠 Overview

Tenesta is a dual-sided mobile platform that connects tenants and landlords through smart UX, embedded AI tools, and clean design. The platform helps tenants feel protected and landlords feel empowered—all from one app.

### Brand Identity
- **"Ten"** = Tenant
- **"Nest"** = Home, safety, comfort  
- **"-a"** = A soft, app-like ending

## 🚀 Current Status

### ✅ Backend Complete (95%)
- **Database Schema:** 45 tables with comprehensive RLS policies
- **API Endpoints:** 8 fully-featured APIs covering core functionality
- **Security:** Enterprise-level security with function hardening
- **Testing:** Comprehensive validation suite
- **Documentation:** Complete deployment and API guides

### 🔄 In Progress
- Frontend web application
- Mobile app development
- Production deployment

### 📋 Upcoming
- AI-powered features (lease analysis, message templates)
- Stripe payment integration
- Advanced analytics and reporting
- B2B enterprise features

## 🏗️ Architecture

### Technology Stack
- **Database:** PostgreSQL with Supabase
- **Backend:** Supabase Edge Functions (Deno/TypeScript)
- **Frontend:** React/Next.js (planned)
- **Mobile:** React Native (planned)
- **Authentication:** Supabase Auth with JWT
- **Payments:** Stripe Connect
- **Storage:** Supabase Storage

### Database Schema
**45 Tables covering:**
- Core entities (users, properties, tenancies, payments)
- Communication (messages, notifications, disputes)
- Maintenance and operations
- Household management (multi-tenant support)
- Support system
- AI insights and analytics
- Marketing and onboarding
- Audit and compliance

## 🔌 API Endpoints

### 1. Tenant Dashboard (`/tenant-dashboard`)
Complete tenant experience with payments, disputes, notifications, and property details.

### 2. Landlord Dashboard (`/landlord-dashboard`)
Portfolio management with analytics, rent collection tracking, and property oversight.

### 3. Property Management (`/property-management`)
**Actions:**
- Properties: `create_property`, `update_property`, `delete_property`, `get_property`, `list_properties`
- Tenancies: `create_tenancy`, `update_tenancy`, `terminate_tenancy`, `get_tenancy`, `list_tenancies`

### 4. Maintenance Requests (`/maintenance-requests`)
**Actions:** `create`, `update`, `get`, `list`, `assign`, `complete`
**Categories:** plumbing, electrical, hvac, appliance, structural, pest, other

### 5. Household Management (`/household-management`)
Multi-tenant support with shared tasks and split payments:
- **Members:** `add_member`, `remove_member`, `update_member`, `list_members`
- **Tasks:** `create_task`, `update_task`, `complete_task`, `list_tasks`
- **Split Payments:** `create_split_payment`, `update_split_payment`, `list_split_payments`

### 6. Support Tickets (`/support-tickets`)
Customer service system:
- **Tickets:** `create_ticket`, `update_ticket`, `get_ticket`, `list_tickets`
- **Messages:** `add_message`, `get_messages`
- **Management:** `close_ticket`, `reopen_ticket`

### 7. Dispute Management (`/dispute-management`)
Tenant-landlord issue resolution:
- **Actions:** `create`, `update`, `resolve`, `get`, `list`
- **Categories:** maintenance, payment, lease_violation, noise, damage, other

### 8. Payment Processing (`/payment-process`)
Stripe integration for rent payments:
- **Actions:** `create_intent`, `confirm_payment`, `get_status`, `mark_paid`, `schedule_payment`

## 🔒 Security Features

- **Row Level Security (RLS):** All 45 tables protected with granular access control
- **Role-Based Access:** tenant/landlord/admin/staff/maintenance roles
- **Data Isolation:** Complete separation between organizations
- **Function Security:** All database functions use secure search paths
- **Input Validation:** Comprehensive validation on all API endpoints
- **Audit Logging:** All critical operations logged for compliance

## 📁 Project Structure

```
Tenesta/
├── TenestaApp/
│   ├── backend/
│   │   ├── supabase/
│   │   │   └── functions/          # 8 API endpoints
│   │   ├── database_schema.sql     # Complete DB schema
│   │   ├── fix_function_security.sql # Security patches
│   │   ├── create_test_data.sql    # Sample data
│   │   ├── validate_apis_with_database.js # Testing suite
│   │   └── DEPLOYMENT_GUIDE.md     # Deployment instructions
│   ├── frontend/                   # Web app (planned)
│   ├── docs/                      # Additional documentation
│   └── PromptDocs/                # Development documentation
└── README.md                      # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- Git

### Database Setup
1. Create a new Supabase project
2. Run `database_schema.sql` in SQL Editor
3. Run `fix_function_security.sql` for security patches
4. Run `create_test_data.sql` for sample data

### API Deployment
1. Install Supabase CLI
2. Run deployment script:
   ```bash
   # Windows
   ./backend/deploy_functions.bat
   
   # Mac/Linux
   ./backend/deploy_functions.sh
   ```

### Testing
```bash
cd backend
node run_basic_tests.js
node validate_apis_with_database.js
```

## 📊 Development Progress

### Backend Development: 95% Complete
- [x] Database schema design and implementation
- [x] RLS policies and security hardening
- [x] Core API endpoints development
- [x] Authentication and authorization
- [x] Testing infrastructure
- [x] Documentation and deployment guides
- [ ] Production deployment
- [ ] Performance optimization

### Frontend Development: 0% (Next Phase)
- [ ] Web application setup
- [ ] Component library
- [ ] Dashboard implementations
- [ ] Authentication flows
- [ ] API integration

### Mobile Development: 0% (Future Phase)
- [ ] React Native setup
- [ ] Mobile-optimized UI
- [ ] Push notifications
- [ ] Offline functionality

## 🎯 Roadmap

### Phase 1: MVP Launch (Current)
- Complete backend API development ✅
- Deploy core APIs
- Basic web application
- User authentication
- Core tenant/landlord features

### Phase 2: Enhanced Features
- AI-powered lease analysis
- Advanced payment processing
- Real-time notifications
- Mobile application

### Phase 3: Enterprise Features
- B2B property management tools
- White-label solutions
- Advanced analytics
- Integration APIs

### Phase 4: Scale & Expansion
- Multi-market support
- Advanced AI features
- Partner integrations
- Revenue optimization

## 🤝 Contributing

This is a private repository for the Tenesta development team.

### Development Team
- **Denat M** - Founder & CEO (Product, UX, Business)
- **Rron B** - Co-Founder & CTO (Technical Development)

### Development Workflow
1. Create feature branch from `main`
2. Develop and test locally
3. Submit pull request with detailed description
4. Code review and testing
5. Merge to `main` and deploy

## 📄 License

Private - All rights reserved to Tenesta team.

## 📞 Support

For development questions or issues:
- Create an issue in this repository
- Contact the development team directly

---

**Built with ❤️ by the Tenesta team**