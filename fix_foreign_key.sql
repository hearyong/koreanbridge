-- Fix Foreign Key Constraint for User Deletion
-- Step 1: Remove existing foreign key constraint
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Step 2: Add foreign key constraint with CASCADE delete
ALTER TABLE profiles 
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Verify the constraint was created properly
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    confdeltype AS on_delete_action
FROM pg_constraint 
WHERE conname = 'profiles_id_fkey';