
-- Create demandas table
CREATE TABLE public.demandas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descricao text NOT NULL DEFAULT '',
  prioridade text NOT NULL DEFAULT 'media',
  sazonal boolean NOT NULL DEFAULT false,
  intervalo_dias integer,
  data_notificacao date NOT NULL,
  webhook_url text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.demandas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated" ON public.demandas
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Update the handle_new_user_permissions trigger to include 'demandas'
CREATE OR REPLACE FUNCTION public.handle_new_user_permissions()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  perm_key text;
  user_count int;
BEGIN
  SELECT count(*) INTO user_count FROM public.profiles;
  
  FOREACH perm_key IN ARRAY ARRAY['dashboard', 'clientes', 'ferramentas', 'relatorios', 'exportar', 'documentacao', 'configuracoes', 'demandas']
  LOOP
    INSERT INTO public.user_permissions (user_id, permission_key, can_view, can_edit)
    VALUES (NEW.id, perm_key, true, true);
  END LOOP;
  
  RETURN NEW;
END;
$function$;

-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
