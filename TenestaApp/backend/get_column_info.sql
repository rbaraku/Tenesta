-- Get column information for key tables
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('organizations', 'users', 'properties', 'tenancies', 'payments')
ORDER BY table_name, ordinal_position;