-- Tabela de colunas customizáveis do Kanban
CREATE TABLE public.kanban_columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  ordem int NOT NULL DEFAULT 0,
  cor text NOT NULL DEFAULT '#94a3b8',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.kanban_columns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated kanban_columns"
ON public.kanban_columns FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Anexos de imagens em demandas
CREATE TABLE public.demanda_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  demanda_id uuid NOT NULL REFERENCES public.demandas(id) ON DELETE CASCADE,
  url text NOT NULL,
  filename text NOT NULL DEFAULT '',
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.demanda_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated demanda_attachments"
ON public.demanda_attachments FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE INDEX idx_demanda_attachments_demanda_id ON public.demanda_attachments(demanda_id);

-- Comentários em demandas
CREATE TABLE public.demanda_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  demanda_id uuid NOT NULL REFERENCES public.demandas(id) ON DELETE CASCADE,
  autor_id uuid,
  autor_email text NOT NULL DEFAULT '',
  texto text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.demanda_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated demanda_comments"
ON public.demanda_comments FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE INDEX idx_demanda_comments_demanda_id ON public.demanda_comments(demanda_id);

-- Adiciona campos do Kanban à tabela demandas
ALTER TABLE public.demandas
  ADD COLUMN coluna_id uuid REFERENCES public.kanban_columns(id) ON DELETE SET NULL,
  ADD COLUMN prazo date,
  ADD COLUMN responsavel text NOT NULL DEFAULT '',
  ADD COLUMN ordem int NOT NULL DEFAULT 0;

CREATE INDEX idx_demandas_coluna_id ON public.demandas(coluna_id);

-- Colunas padrão
INSERT INTO public.kanban_columns (titulo, ordem, cor) VALUES
  ('A Fazer', 0, '#94a3b8'),
  ('Em Progresso', 1, '#3b82f6'),
  ('Em Revisão', 2, '#f59e0b'),
  ('Concluído', 3, '#10b981');

-- Migra demandas existentes para "A Fazer" e copia data_notificacao para prazo
UPDATE public.demandas
SET coluna_id = (SELECT id FROM public.kanban_columns WHERE titulo = 'A Fazer' LIMIT 1),
    prazo = data_notificacao;

-- Bucket de anexos
INSERT INTO storage.buckets (id, name, public)
VALUES ('demanda-attachments', 'demanda-attachments', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read demanda-attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'demanda-attachments');

CREATE POLICY "Authenticated upload demanda-attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'demanda-attachments');

CREATE POLICY "Authenticated update demanda-attachments"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'demanda-attachments');

CREATE POLICY "Authenticated delete demanda-attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'demanda-attachments');