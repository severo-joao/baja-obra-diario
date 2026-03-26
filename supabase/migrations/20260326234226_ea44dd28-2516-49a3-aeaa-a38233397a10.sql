CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  key text NOT NULL DEFAULT ('baja_' || replace(gen_random_uuid()::text, '-', '')),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  active boolean NOT NULL DEFAULT true
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own keys" ON public.api_keys
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());