-- Check payment status constraint values
SELECT 
    conname as constraint_name,
    consrc as constraint_definition
FROM pg_constraint 
WHERE conname LIKE '%payments_status%' OR conname LIKE '%status_check%';

-- Also check what values are actually allowed
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'payments' AND column_name = 'status';