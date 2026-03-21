-- Create report_entries table
CREATE TABLE public.report_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  data_relato text NOT NULL,
  equipe text NOT NULL DEFAULT '',
  condicoes_climaticas text NOT NULL DEFAULT 'ensolarado',
  ferramentas_ids text[] NOT NULL DEFAULT '{}',
  atividades_dia text NOT NULL DEFAULT '',
  observacoes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.report_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to report_entries"
  ON public.report_entries FOR ALL TO public
  USING (true) WITH CHECK (true);

-- Add entry_id to report_images
ALTER TABLE public.report_images ADD COLUMN entry_id uuid REFERENCES public.report_entries(id) ON DELETE CASCADE;

-- Migrate existing reports data into report_entries
INSERT INTO public.report_entries (report_id, data_relato, equipe, condicoes_climaticas, ferramentas_ids, atividades_dia, observacoes, created_at)
SELECT id, data_relatorio, equipe, condicoes_climaticas, ferramentas_ids, atividades_dia, observacoes, created_at
FROM public.reports
WHERE atividades_dia != '';

-- Link existing report_images to their entries
UPDATE public.report_images ri
SET entry_id = re.id
FROM public.report_entries re
WHERE re.report_id = ri.report_id;

-- Remove daily fields from reports table (now just a container per obra)
ALTER TABLE public.reports DROP COLUMN data_relatorio;
ALTER TABLE public.reports DROP COLUMN equipe;
ALTER TABLE public.reports DROP COLUMN condicoes_climaticas;
ALTER TABLE public.reports DROP COLUMN ferramentas_ids;
ALTER TABLE public.reports DROP COLUMN atividades_dia;
ALTER TABLE public.reports DROP COLUMN observacoes;