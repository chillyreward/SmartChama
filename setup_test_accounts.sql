-- Create profile rows for both test accounts
INSERT INTO profiles (id, full_name, phone_number, email)
VALUES
  ('76feea72-250f-4feb-850d-374d47f07ff8', 'Test Admin', '+254700000001', 'admin@smartchama.test'),
  ('PASTE_MEMBER_UUID_HERE', 'Test Member', '+254700000002', 'member@smartchama.test')
ON CONFLICT (id) DO NOTHING;

-- Create a test chama
INSERT INTO chamas_v2 (id, name, contribution_amount, contribution_frequency, status, created_by)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Test Chama', 5000, 'monthly', 'active', 'PASTE_ADMIN_UUID_HERE')
ON CONFLICT (id) DO NOTHING;

-- Make the wallet for it
INSERT INTO wallets (chama_id, balance)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 50000) 
ON CONFLICT (chama_id) DO NOTHING;

-- Link admin as chairlady
INSERT INTO chama_memberships (profile_id, chama_id, role, trust_score, status)
VALUES
  ('PASTE_ADMIN_UUID_HERE', '00000000-0000-0000-0000-000000000001', 'chairlady', 100, 'active')
ON CONFLICT (profile_id, chama_id) DO NOTHING;

-- Link member as regular member, with a realistic trust score 
INSERT INTO chama_memberships (profile_id, chama_id, role, trust_score, contribution_streak, status)
VALUES
  ('PASTE_MEMBER_UUID_HERE', '00000000-0000-0000-0000-000000000001', 'member', 72, 4, 'active')
ON CONFLICT (profile_id, chama_id) DO NOTHING;

-- Add a few real contribution rows so charts and totals aren't empty
INSERT INTO contributions_v2 (membership_id, chama_id, amount, payment_method, status, created_at)
SELECT 
  cm.id, 
  '00000000-0000-0000-0000-000000000001',
  5000, 'mpesa', 'confirmed',
  now() - (interval '1 month' * n)
FROM chama_memberships cm
CROSS JOIN generate_series(1, 4) n
WHERE cm.profile_id = 'PASTE_MEMBER_UUID_HERE';
