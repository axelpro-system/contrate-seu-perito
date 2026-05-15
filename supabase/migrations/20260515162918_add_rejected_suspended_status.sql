-- Add REJECTED and SUSPENDED to account_status enum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'REJECTED' AND enumtypid = 'account_status'::regtype) THEN
    ALTER TYPE account_status ADD VALUE 'REJECTED';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'SUSPENDED' AND enumtypid = 'account_status'::regtype) THEN
    ALTER TYPE account_status ADD VALUE 'SUSPENDED';
  END IF;
END $$;
