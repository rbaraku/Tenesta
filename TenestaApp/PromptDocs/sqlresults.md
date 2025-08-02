| table_name             | column_name              | references_table   | references_column |
| ---------------------- | ------------------------ | ------------------ | ----------------- |
| ai_insights            | organization_id          | organizations      | id                |
| ai_insights            | user_id                  | users              | id                |
| analytics_events       | organization_id          | organizations      | id                |
| analytics_events       | user_id                  | users              | id                |
| audit_logs             | user_id                  | users              | id                |
| audit_logs             | organization_id          | organizations      | id                |
| auth_sessions          | user_id                  | users              | id                |
| billing_history        | subscription_id          | subscriptions      | id                |
| disputes               | resolved_by              | users              | id                |
| disputes               | reporter_id              | users              | id                |
| documents              | uploader_id              | users              | id                |
| household_members      | user_id                  | users              | id                |
| inspections            | inspector_id             | users              | id                |
| inspections            | property_id              | properties         | id                |
| lease_analyzer_results | document_id              | documents          | id                |
| maintenance_requests   | assigned_to              | users              | id                |
| maintenance_requests   | property_id              | properties         | id                |
| maintenance_requests   | requester_id             | users              | id                |
| messages               | recipient_id             | users              | id                |
| messages               | sender_id                | users              | id                |
| messages               | replied_to               | messages           | id                |
| notes                  | user_id                  | users              | id                |
| notes                  | property_id              | properties         | id                |
| notifications          | user_id                  | users              | id                |
| oauth_connections      | user_id                  | users              | id                |
| onboarding_sessions    | organization_id          | organizations      | id                |
| onboarding_sessions    | onboarding_specialist_id | users              | id                |
| properties             | organization_id          | organizations      | id                |
| properties             | landlord_id              | users              | id                |
| reminders              | organization_id          | organizations      | id                |
| reminders              | user_id                  | users              | id                |
| report_templates       | organization_id          | organizations      | id                |
| report_templates       | created_by               | users              | id                |
| role_permissions       | permission_id            | permissions        | id                |
| role_permissions       | organization_id          | organizations      | id                |
| scheduled_reports      | created_by               | users              | id                |
| scheduled_reports      | organization_id          | organizations      | id                |
| scheduled_reports      | template_id              | report_templates   | id                |
| shared_tasks           | assigned_to              | household_members  | id                |
| shared_tasks           | created_by               | users              | id                |
| split_payments         | payment_id               | payments           | id                |
| split_payments         | household_member_id      | household_members  | id                |
| subscriptions          | user_id                  | users              | id                |
| subscriptions          | organization_id          | organizations      | id                |
| subscriptions          | plan_id                  | subscription_plans | id                |
| support_messages       | ticket_id                | support_tickets    | id                |
| support_messages       | sender_id                | users              | id                |
| support_tickets        | user_id                  | users              | id                |
| support_tickets        | organization_id          | organizations      | id                |
| tenancies              | tenant_id                | users              | id                |
| tenancies              | property_id              | properties         | id                |
| user_preferences       | user_id                  | users              | id                |
| users                  | organization_id          | organizations      | id                |
| whitelabel_configs     | organization_id          | organizations      | id                |


| info        | tablename         | rowsecurity |
| ----------- | ----------------- | ----------- |
| RLS_STATUS: | household_members | true        |
| RLS_STATUS: | organizations     | true        |
| RLS_STATUS: | properties        | true        |
| RLS_STATUS: | tenancies         | true        |
| RLS_STATUS: | users             | true        |