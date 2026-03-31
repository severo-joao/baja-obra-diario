CREATE TABLE public.export_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'processing',
  client_id uuid REFERENCES public.clients(id),
  file_path text,
  error text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.export_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to export_jobs" ON public.export_jobs FOR ALL TO public USING (true) WITH CHECK (true);

INSERT INTO storage.buckets (id, name, public) VALUES ('export-pdfs', 'export-pdfs', true);

CREATE POLICY "Allow public read export-pdfs" ON storage.objects FOR SELECT TO public USING (bucket_id = 'export-pdfs');

CREATE POLICY "Allow service insert export-pdfs" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'export-pdfs');

CREATE POLICY "Allow service delete export-pdfs" ON storage.objects FOR DELETE TO public USING (bucket_id = 'export-pdfs');