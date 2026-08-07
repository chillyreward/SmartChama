-- Add group_code to chamas_v2
ALTER TABLE chamas_v2
  ADD COLUMN IF NOT EXISTS 
    group_code TEXT UNIQUE;

-- Generate codes for existing chamas
UPDATE chamas_v2
SET group_code = UPPER(
  SUBSTRING(
    MD5(id::TEXT || name), 1, 6
  )
)
WHERE group_code IS NULL;

-- Function to generate a unique 6-character group code
CREATE OR REPLACE FUNCTION 
  generate_group_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 6-char alphanumeric code
    v_code := UPPER(
      SUBSTRING(
        MD5(
          RANDOM()::TEXT || 
          NOW()::TEXT
        ), 1, 6
      )
    );
    
    -- Check it does not already exist
    SELECT EXISTS (
      SELECT 1 FROM chamas_v2 
      WHERE group_code = v_code
    ) INTO v_exists;
    
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  RETURN v_code;
END;
$$;

-- Trigger to auto-generate code when a new chama is created
CREATE OR REPLACE FUNCTION 
  set_group_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.group_code IS NULL THEN
    NEW.group_code := 
      generate_group_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS 
  auto_group_code ON chamas_v2;

CREATE TRIGGER auto_group_code
  BEFORE INSERT ON chamas_v2
  FOR EACH ROW
  EXECUTE FUNCTION set_group_code();

-- Fix the RPC function for dashboard
CREATE OR REPLACE FUNCTION 
  get_user_dashboard_data(
    p_user_id UUID
  )
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_membership RECORD;
  v_chama RECORD;
  v_metrics RECORD;
BEGIN
  SELECT 
    cm.id as membership_id,
    cm.role,
    cm.trust_score,
    cm.chama_id,
    cm.contribution_streak,
    p.full_name,
    p.email,
    p.phone_number
  INTO v_membership
  FROM chama_memberships cm
  JOIN profiles p 
    ON p.id = cm.profile_id
  WHERE cm.profile_id = p_user_id
    AND cm.status = 'active'
    AND cm.chama_id IS NOT NULL
  ORDER BY 
    cm.joined_at DESC NULLS LAST,
    cm.created_at DESC
  LIMIT 1;

  IF v_membership IS NULL THEN
    RETURN jsonb_build_object(
      'found', false,
      'error', 'no_membership'
    );
  END IF;

  SELECT 
    c.id,
    c.name,
    c.group_code,
    c.contribution_amount,
    c.contribution_frequency,
    c.status
  INTO v_chama
  FROM chamas_v2 c
  WHERE c.id = v_membership.chama_id;

  IF v_chama IS NULL THEN
    RETURN jsonb_build_object(
      'found', false,
      'error', 'no_chama'
    );
  END IF;

  SELECT
    COALESCE(SUM(cv.amount), 0) 
      as total_saved,
    COALESCE(
      (SELECT balance FROM wallets 
       WHERE chama_id = 
         v_membership.chama_id), 0
    ) as wallet_balance,
    COALESCE(
      (SELECT COUNT(*) FROM loans_v2
       WHERE membership_id = 
         v_membership.membership_id
       AND status IN (
         'active', 'overdue'
       )), 0
    ) as active_loans
  INTO v_metrics
  FROM contributions_v2 cv
  WHERE cv.membership_id = 
    v_membership.membership_id
    AND cv.status = 'confirmed';

  RETURN jsonb_build_object(
    'found', true,
    'membership', jsonb_build_object(
      'membership_id', 
        v_membership.membership_id,
      'role', v_membership.role,
      'trust_score', 
        v_membership.trust_score,
      'chama_id', v_membership.chama_id,
      'full_name', v_membership.full_name,
      'email', v_membership.email,
      'phone', v_membership.phone_number
    ),
    'chama', jsonb_build_object(
      'id', v_chama.id,
      'name', v_chama.name,
      'group_code', v_chama.group_code,
      'contribution_amount', 
        v_chama.contribution_amount,
      'contribution_frequency',
        v_chama.contribution_frequency,
      'status', v_chama.status
    ),
    'metrics', jsonb_build_object(
      'total_saved', 
        v_metrics.total_saved,
      'wallet_balance', 
        v_metrics.wallet_balance,
      'active_loans', 
        v_metrics.active_loans,
      'trust_score', 
        v_membership.trust_score
    )
  );
END;
$$;

-- Make sure RLS is not blocking the RPC call
GRANT EXECUTE ON FUNCTION 
  get_user_dashboard_data(UUID) 
  TO authenticated;

GRANT EXECUTE ON FUNCTION
  get_user_dashboard_data(UUID)
  TO anon;
