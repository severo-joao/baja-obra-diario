
-- Clients table
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_cliente text NOT NULL,
  cpf_cnpj text NOT NULL DEFAULT '',
  telefone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  endereco_obra text NOT NULL DEFAULT '',
  nome_empreitada text NOT NULL,
  data_inicio text NOT NULL DEFAULT '',
  data_prevista_conclusao text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'ativa',
  observacoes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);

-- Tools table
CREATE TABLE public.tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  codigo_patrimonio text NOT NULL DEFAULT '',
  categoria text NOT NULL DEFAULT 'manual',
  descricao text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'disponivel',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to tools" ON public.tools FOR ALL USING (true) WITH CHECK (true);

-- Reports table
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  data_relatorio text NOT NULL,
  equipe text NOT NULL DEFAULT '',
  condicoes_climaticas text NOT NULL DEFAULT 'ensolarado',
  ferramentas_ids text[] NOT NULL DEFAULT '{}',
  atividades_dia text NOT NULL DEFAULT '',
  observacoes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to reports" ON public.reports FOR ALL USING (true) WITH CHECK (true);

-- Report images table
CREATE TABLE public.report_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES public.reports(id) ON DELETE CASCADE NOT NULL,
  url text NOT NULL,
  filename text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.report_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to report_images" ON public.report_images FOR ALL USING (true) WITH CHECK (true);

-- Webhooks table
CREATE TABLE public.webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  url text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to webhooks" ON public.webhooks FOR ALL USING (true) WITH CHECK (true);

-- Webhook logs table
CREATE TABLE public.webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid REFERENCES public.webhooks(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL,
  status_code integer NOT NULL DEFAULT 200,
  payload text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to webhook_logs" ON public.webhook_logs FOR ALL USING (true) WITH CHECK (true);

-- Storage bucket for report images
INSERT INTO storage.buckets (id, name, public) VALUES ('report-images', 'report-images', true);

-- Storage RLS policies
CREATE POLICY "Allow public read report-images" ON storage.objects FOR SELECT USING (bucket_id = 'report-images');
CREATE POLICY "Allow public upload report-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'report-images');
CREATE POLICY "Allow public delete report-images" ON storage.objects FOR DELETE USING (bucket_id = 'report-images');
