
-- 1. Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 2. Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, COALESCE(NEW.email, ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Create user_permissions table
CREATE TABLE public.user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_key text NOT NULL,
  can_view boolean NOT NULL DEFAULT true,
  can_edit boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, permission_key)
);

ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- 4. is_admin function (checks if user has configuracoes.can_edit)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_permissions
    WHERE user_id = _user_id
      AND permission_key = 'configuracoes'
      AND can_edit = true
  )
$$;

-- 5. RLS policies for user_permissions
CREATE POLICY "Authenticated users can read permissions"
  ON public.user_permissions FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can insert permissions"
  ON public.user_permissions FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update permissions"
  ON public.user_permissions FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete permissions"
  ON public.user_permissions FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- 6. Trigger to create default permissions for new users (all enabled)
CREATE OR REPLACE FUNCTION public.handle_new_user_permissions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  perm_key text;
  user_count int;
BEGIN
  SELECT count(*) INTO user_count FROM public.profiles;
  
  FOREACH perm_key IN ARRAY ARRAY['dashboard', 'clientes', 'ferramentas', 'relatorios', 'exportar', 'documentacao', 'configuracoes']
  LOOP
    INSERT INTO public.user_permissions (user_id, permission_key, can_view, can_edit)
    VALUES (NEW.id, perm_key, true, true);
  END LOOP;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_permissions
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_permissions();

-- 7. Backfill: create profiles and permissions for existing users
INSERT INTO public.profiles (id, email)
SELECT id, COALESCE(email, '') FROM auth.users
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_permissions (user_id, permission_key, can_view, can_edit)
SELECT p.id, k.key, true, true
FROM public.profiles p
CROSS JOIN (VALUES ('dashboard'), ('clientes'), ('ferramentas'), ('relatorios'), ('exportar'), ('documentacao'), ('configuracoes')) AS k(key)
ON CONFLICT (user_id, permission_key) DO NOTHING;
