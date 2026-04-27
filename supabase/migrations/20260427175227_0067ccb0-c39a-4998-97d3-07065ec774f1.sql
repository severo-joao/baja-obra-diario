ALTER TABLE public.user_permissions
  ADD COLUMN IF NOT EXISTS scope text NOT NULL DEFAULT 'all';