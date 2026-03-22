CREATE TABLE public.invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  invited_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read invites"
ON public.invites FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert invites"
ON public.invites FOR INSERT TO authenticated
WITH CHECK (true);