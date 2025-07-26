# Supabase Database Tables & RLS Documentation

Generated on: 2025-07-26

## Summary

This document provides a comprehensive overview of all tables in the Supabase database with their Row Level Security (RLS) status.

### RLS Status Overview
- **Total Tables**: 45
- **Tables with RLS Enabled**: 45 (100%)
- **Tables with RLS Disabled**: 0 (0%)

✅ **All tables have RLS enabled**, which is excellent for security!

---

## Table Documentation

### 1. **organizations**
- **RLS Status**: ✅ Enabled
- **Size**: 80 kB
- **Description**: Stores organization/account information
- **Key Columns**: 
  - `id` (uuid)
  - `name` (text)
  - `type` (text) - individual/small_business/enterprise
  - `subscription_tier` (text) - free/landlord/landlord_pro/enterprise
  - `stripe_customer_id` (text)

### 2. **users**
- **RLS Status**: ✅ Enabled
- **Size**: 112 kB
- **Description**: User accounts and profiles
- **Key Columns**:
  - `id` (uuid)
  - `email` (text) - unique
  - `role` (text) - tenant/landlord/admin/staff/maintenance
  - `organization_id` (uuid)
  - `auth_user_id` (uuid)

### 3. **properties**
- **RLS Status**: ✅ Enabled
- **Size**: 112 kB
- **Description**: Property listings and details
- **Key Columns**:
  - `id` (uuid)
  - `address`, `city`, `state`, `zip_code` (text)
  - `landlord_id` (uuid)
  - `organization_id` (uuid)
  - `rent_amount` (numeric)
  - `status` (text) - available/occupied/maintenance/unavailable

### 4. **tenancies**
- **RLS Status**: ✅ Enabled
- **Size**: 56 kB
- **Description**: Lease agreements and tenant-property relationships
- **Key Columns**:
  - `id` (uuid)
  - `tenant_id` (uuid)
  - `property_id` (uuid)
  - `lease_start`, `lease_end` (date)
  - `status` (text) - active/pending/expired/terminated

### 5. **payments**
- **RLS Status**: ✅ Enabled
- **Size**: 56 kB
- **Description**: Rent payments and financial transactions
- **Key Columns**:
  - `id` (uuid)
  - `tenancy_id` (uuid)
  - `amount` (numeric)
  - `due_date` (date)
  - `status` (text) - pending/paid/partial/late/failed/refunded

### 6. **documents**
- **RLS Status**: ✅ Enabled
- **Size**: 64 kB
- **Description**: Document storage and management
- **Key Columns**:
  - `id` (uuid)
  - `document_type` (text) - lease/receipt/violation_evidence/maintenance_request/inspection_report/other
  - `file_name`, `file_path` (text)
  - `ai_analysis` (jsonb)

### 7. **disputes**
- **RLS Status**: ✅ Enabled
- **Size**: 64 kB
- **Description**: Tenant-landlord disputes and issues
- **Key Columns**:
  - `id` (uuid)
  - `category` (text) - maintenance/payment/lease_violation/noise/damage/safety/other
  - `priority` (text) - low/medium/high/urgent
  - `status` (text) - open/in_progress/resolved/closed/escalated

### 8. **messages**
- **RLS Status**: ✅ Enabled
- **Size**: 64 kB
- **Description**: Internal messaging system
- **Key Columns**:
  - `id` (uuid)
  - `sender_id`, `recipient_id` (uuid)
  - `message_type` (text) - rent_reminder/maintenance_request/general/dispute/system/ai_generated
  - `ai_suggestions`, `ai_tone_analysis` (jsonb)

### 9. **notifications**
- **RLS Status**: ✅ Enabled
- **Size**: 64 kB
- **Description**: System notifications and alerts
- **Key Columns**:
  - `id` (uuid)
  - `type` (text) - payment_due/payment_received/lease_expiring/dispute_update/maintenance_scheduled/system/ai_insight/marketing
  - `priority` (text) - low/medium/high
  - `delivery_status` (text)

### 10. **household_members**
- **RLS Status**: ✅ Enabled
- **Size**: 32 kB
- **Description**: Manages multiple tenants in a single tenancy
- **Key Columns**:
  - `id` (uuid)
  - `tenancy_id` (uuid)
  - `user_id` (uuid)
  - `is_primary_tenant` (boolean)

### 11. **shared_tasks**
- **RLS Status**: ✅ Enabled
- **Size**: 24 kB
- **Description**: Task management for household members
- **Key Columns**:
  - `id` (uuid)
  - `task_type` (text) - chore/payment/maintenance/other
  - `recurring_pattern` (jsonb)

### 12. **split_payments**
- **RLS Status**: ✅ Enabled
- **Size**: 24 kB
- **Description**: Payment splitting between household members
- **Key Columns**:
  - `id` (uuid)
  - `payment_id` (uuid)
  - `household_member_id` (uuid)
  - `amount` (numeric)

### 13. **maintenance_requests**
- **RLS Status**: ✅ Enabled
- **Size**: 48 kB
- **Description**: Maintenance and repair requests
- **Key Columns**:
  - `id` (uuid)
  - `category` (text) - plumbing/electrical/hvac/appliance/structural/pest/other
  - `priority` (text) - low/medium/high/urgent
  - `status` (text) - pending/in_progress/scheduled/completed/cancelled

### 14. **notes**
- **RLS Status**: ✅ Enabled
- **Size**: 48 kB
- **Description**: Internal notes and comments
- **Key Columns**:
  - `id` (uuid)
  - `related_to_type` (text) - tenant/property/payment/maintenance/general
  - `is_pinned` (boolean)

### 15. **user_preferences**
- **RLS Status**: ✅ Enabled
- **Size**: 24 kB
- **Description**: User settings and preferences
- **Key Columns**:
  - `id` (uuid)
  - `user_id` (uuid) - unique
  - `notification_settings` (jsonb)
  - `theme` (text) - light/dark/auto

### 16. **subscription_plans**
- **RLS Status**: ✅ Enabled
- **Size**: 48 kB
- **Description**: Available subscription tiers
- **Key Columns**:
  - `id` (uuid)
  - `name` (text)
  - `code` (text) - unique
  - `stripe_price_id` (text)

### 17. **subscriptions**
- **RLS Status**: ✅ Enabled
- **Size**: 48 kB
- **Description**: Active user/organization subscriptions
- **Key Columns**:
  - `id` (uuid)
  - `stripe_subscription_id` (text)
  - `status` (text) - trial/active/past_due/cancelled/cancelled_at_period_end

### 18. **analytics_events**
- **RLS Status**: ✅ Enabled
- **Size**: 48 kB
- **Description**: User activity tracking
- **Key Columns**:
  - `id` (uuid)
  - `event_name` (text)
  - `event_data` (jsonb)

### 19. **audit_logs**
- **RLS Status**: ✅ Enabled
- **Size**: 48 kB
- **Description**: System audit trail
- **Key Columns**:
  - `id` (uuid)
  - `action` (text)
  - `entity_type`, `entity_id` (text/uuid)

### 20. **report_templates**
- **RLS Status**: ✅ Enabled
- **Size**: 32 kB
- **Description**: Customizable report templates
- **Key Columns**:
  - `id` (uuid)
  - `template_type` (text)
  - `template_data` (jsonb)

### 21. **scheduled_reports**
- **RLS Status**: ✅ Enabled
- **Size**: 32 kB
- **Description**: Automated report scheduling
- **Key Columns**:
  - `id` (uuid)
  - `frequency` (text) - daily/weekly/monthly/quarterly/yearly
  - `is_active` (boolean)

### 22. **ai_insights**
- **RLS Status**: ✅ Enabled
- **Size**: 40 kB
- **Description**: AI-generated insights and analytics
- **Key Columns**:
  - `id` (uuid)
  - `insight_type` (text)
  - `insight_data` (jsonb)
  - `confidence_score` (numeric)

### 23. **support_tickets**
- **RLS Status**: ✅ Enabled
- **Size**: 40 kB
- **Description**: Customer support tickets
- **Key Columns**:
  - `id` (uuid)
  - `ticket_number` (text) - unique
  - `category` (text)
  - `priority` (text)

### 24. **support_messages**
- **RLS Status**: ✅ Enabled
- **Size**: 32 kB
- **Description**: Support ticket conversations
- **Key Columns**:
  - `id` (uuid)
  - `ticket_id` (uuid)
  - `sender_id` (uuid)
  - `is_internal` (boolean)

### 25. **whitelabel_configs**
- **RLS Status**: ✅ Enabled
- **Size**: 32 kB
- **Description**: White-label customization settings
- **Key Columns**:
  - `id` (uuid)
  - `organization_id` (uuid) - unique
  - `branding` (jsonb)
  - `custom_domain` (text)

### 26. **role_permissions**
- **RLS Status**: ✅ Enabled
- **Size**: 32 kB
- **Description**: Role-based access control
- **Key Columns**:
  - `id` (uuid)
  - `role` (text)
  - `permissions` (jsonb)

### 27. **api_keys**
- **RLS Status**: ✅ Enabled
- **Size**: 24 kB
- **Description**: API access management
- **Key Columns**:
  - `id` (uuid)
  - `key_hash` (text) - unique
  - `is_active` (boolean)
  - `expires_at` (timestamptz)

### 28. **integrations**
- **RLS Status**: ✅ Enabled
- **Size**: 24 kB
- **Description**: Third-party integrations
- **Key Columns**:
  - `id` (uuid)
  - `provider` (text) - stripe/twilio/sendgrid/zapier
  - `is_active` (boolean)

### 29. **integration_logs**
- **RLS Status**: ✅ Enabled
- **Size**: 32 kB
- **Description**: Integration activity logs
- **Key Columns**:
  - `id` (uuid)
  - `status` (text) - success/failed/pending
  - `error_message` (text)

### 30. **inspections**
- **RLS Status**: ✅ Enabled
- **Size**: 48 kB
- **Description**: Property inspection records
- **Key Columns**:
  - `id` (uuid)
  - `inspection_type` (text) - move_in/move_out/routine/emergency
  - `status` (text) - scheduled/in_progress/completed/cancelled

### 31. **inspection_items**
- **RLS Status**: ✅ Enabled
- **Size**: 40 kB
- **Description**: Individual inspection checklist items
- **Key Columns**:
  - `id` (uuid)
  - `category` (text)
  - `condition` (text) - excellent/good/fair/poor/damaged

### 32. **reminders**
- **RLS Status**: ✅ Enabled
- **Size**: 32 kB
- **Description**: User reminders and alerts
- **Key Columns**:
  - `id` (uuid)
  - `reminder_type` (text)
  - `frequency` (text) - once/daily/weekly/monthly/yearly

### 33. **marketing_campaigns**
- **RLS Status**: ✅ Enabled
- **Size**: 32 kB
- **Description**: Marketing campaign management
- **Key Columns**:
  - `id` (uuid)
  - `campaign_type` (text) - email/sms/push/in_app
  - `status` (text) - draft/scheduled/active/completed/cancelled

### 34. **marketing_segments**
- **RLS Status**: ✅ Enabled
- **Size**: 24 kB
- **Description**: Marketing audience segmentation
- **Key Columns**:
  - `id` (uuid)
  - `segment_name` (text)
  - `criteria` (jsonb)

### 35. **campaign_recipients**
- **RLS Status**: ✅ Enabled
- **Size**: 32 kB
- **Description**: Campaign recipient tracking
- **Key Columns**:
  - `id` (uuid)
  - `delivery_status` (text)
  - `engagement_data` (jsonb)

### 36. **onboarding_sessions**
- **RLS Status**: ✅ Enabled
- **Size**: 32 kB
- **Description**: User onboarding tracking
- **Key Columns**:
  - `id` (uuid)
  - `session_type` (text) - tenant/landlord/enterprise
  - `status` (text) - scheduled/in_progress/completed/cancelled

### 37. **onboarding_steps**
- **RLS Status**: ✅ Enabled
- **Size**: 24 kB
- **Description**: Onboarding progress tracking
- **Key Columns**:
  - `id` (uuid)
  - `step_name` (text)
  - `is_completed` (boolean)

### 38. **lease_analyzer_results**
- **RLS Status**: ✅ Enabled
- **Size**: 40 kB
- **Description**: AI lease analysis results
- **Key Columns**:
  - `id` (uuid)
  - `analysis_type` (text)
  - `extracted_data` (jsonb)
  - `confidence_scores` (jsonb)

### 39. **ai_chat_sessions**
- **RLS Status**: ✅ Enabled
- **Size**: 32 kB
- **Description**: AI assistant chat sessions
- **Key Columns**:
  - `id` (uuid)
  - `session_type` (text)
  - `is_active` (boolean)

### 40. **ai_chat_messages**
- **RLS Status**: ✅ Enabled
- **Size**: 40 kB
- **Description**: AI chat message history
- **Key Columns**:
  - `id` (uuid)
  - `role` (text) - user/assistant/system
  - `metadata` (jsonb)

### 41. **feature_flags**
- **RLS Status**: ✅ Enabled
- **Size**: 24 kB
- **Description**: Feature toggle management
- **Key Columns**:
  - `id` (uuid)
  - `flag_name` (text) - unique
  - `is_enabled` (boolean)

### 42. **feedback**
- **RLS Status**: ✅ Enabled
- **Size**: 32 kB
- **Description**: User feedback collection
- **Key Columns**:
  - `id` (uuid)
  - `feedback_type` (text) - bug/feature_request/complaint/praise/other
  - `rating` (integer)

### 43. **webhooks**
- **RLS Status**: ✅ Enabled
- **Size**: 32 kB
- **Description**: Webhook configuration
- **Key Columns**:
  - `id` (uuid)
  - `event_type` (text)
  - `is_active` (boolean)

### 44. **webhook_logs**
- **RLS Status**: ✅ Enabled
- **Size**: 40 kB
- **Description**: Webhook delivery logs
- **Key Columns**:
  - `id` (uuid)
  - `status_code` (integer)
  - `response_data` (jsonb)

### 45. **webhook_events**
- **RLS Status**: ✅ Enabled
- **Size**: 32 kB
- **Description**: Webhook event queue
- **Key Columns**:
  - `id` (uuid)
  - `status` (text) - pending/processing/completed/failed
  - `retry_count` (integer)

---

## Security Recommendations

While all tables have RLS enabled (excellent!), the security audit revealed some additional considerations:

### Function Security Warnings
Several functions have mutable search paths, which could pose security risks:
- `get_user_role`
- `is_property_landlord`
- `is_property_tenant`
- `generate_next_payment`
- `generate_ticket_number`
- `notify_payment_status_change`
- `notify_dispute_status_change`
- `is_valid_email`
- `is_strong_password`

**Recommendation**: Update these functions to set an immutable search path for enhanced security.

### Extension Security
- The `pg_trgm` extension is installed in the public schema
- **Recommendation**: Move it to a dedicated schema for better security isolation

---

## Summary Statistics

- **Total Database Size**: ~2 MB (estimated from table sizes)
- **Largest Tables**: 
  1. `users` (112 kB)
  2. `properties` (112 kB)
  3. `organizations` (80 kB)
- **Most Connected Tables** (by foreign key relationships):
  1. `users` - Referenced by 24 other tables
  2. `tenancies` - Referenced by 13 other tables
  3. `organizations` - Referenced by 13 other tables

All tables are properly secured with RLS enabled, providing row-level access control for your multi-tenant SaaS application.