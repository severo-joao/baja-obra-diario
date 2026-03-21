

## Plan: Migrate from Zustand/localStorage to Lovable Cloud Database

### Overview
Create database tables for all entities (clients, tools, reports, report_images, webhooks, webhook_logs), add a storage bucket for report images, create React Query hooks for data fetching/mutation, and update all pages to use the database instead of the Zustand store.

### Step 1: Database Migration
Create all tables with appropriate columns and RLS policies (public access since no auth yet):

- **clients** — all fields from the Client type, with `id uuid` primary key, timestamps with defaults
- **tools** — all fields from Tool type
- **reports** — all fields from Report type, `ferramentas_ids text[]`, foreign key to clients
- **report_images** — foreign key to reports, url, filename
- **webhooks** — event_type, url, active boolean
- **webhook_logs** — foreign key to webhooks, event_type, status_code, payload, timestamp

RLS policies: Allow all operations (SELECT, INSERT, UPDATE, DELETE) for anon role since there is no authentication yet. This keeps the app functional; auth can be added later to restrict access.

### Step 2: Storage Bucket
Create a public `report-images` storage bucket with RLS policies allowing uploads and reads for anon users.

### Step 3: React Query Hooks
Create `src/hooks/use-clients.ts`, `use-tools.ts`, `use-reports.ts`, `use-webhooks.ts` with:
- `useQuery` for fetching data from each table
- `useMutation` for create, update, delete operations with cache invalidation
- Reports hook will join client data and report_images

### Step 4: Update All Pages
Replace `useAppStore()` calls with the new React Query hooks in:
- **Dashboard** — use query hooks for clients, tools, reports counts
- **ClientsPage** — CRUD via mutations
- **ToolsPage** — CRUD via mutations
- **ReportsPage** — fetch reports with client joins
- **ReportFormPage** — save report + upload images to storage bucket
- **ReportViewerPage** — fetch single report with images
- **ExportPage** — fetch filtered reports
- **DocumentationPage** — webhooks CRUD

### Step 5: Cleanup
- Remove or simplify `src/lib/store.ts` (no longer needed for core data)
- Add loading skeletons to pages while data loads

### Technical Details
- Tables use `uuid` primary keys with `gen_random_uuid()` defaults
- Timestamps use `timestamptz` with `now()` defaults
- `ferramentas_ids` stored as `text[]` on reports table
- Images uploaded to `report-images` bucket, public URLs stored in `report_images` table
- All queries use the existing `@/integrations/supabase/client` import

