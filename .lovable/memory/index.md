# Memory: index.md
BAJA Diário de Obras — construction diary management system for BAJA Engenharia & Construções

## Brand
- Primary: navy #1A2B4A (HSL 216 47% 20%)
- Accent: orange #E87722 (HSL 27 81% 53%)
- Background: #F5F5F5, Surface: white, Text: #1A1A1A
- Font: Inter
- Language: Portuguese (Brazil) throughout

## Architecture
- Data model: Client → 1 Report → N ReportEntries → N ReportImages
- report_entries table holds daily logs (equipe, clima, atividades, etc.)
- report_images linked to entries via entry_id
- reports table is a simple container (client_id only)
- React Query hooks for all CRUD
- Sidebar layout with SidebarProvider
- Pages: Dashboard, Clients, Tools, Reports, ReportForm, ReportViewer, Export, Documentation, Settings
- Routes: /relatorios/entrada/novo/:id (new entry), /relatorios/entrada/editar/:entryId (edit entry)
- Lovable Cloud enabled (Supabase) — fully wired to DB
