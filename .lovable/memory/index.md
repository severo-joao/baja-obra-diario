BAJA Diário de Obras — construction diary management system for BAJA Engenharia & Construções

## Brand
- Primary: navy #1A2B4A (HSL 216 47% 20%)
- Accent: orange #E87722 (HSL 27 81% 53%)
- Background: #F5F5F5, Surface: white, Text: #1A1A1A
- Font: Inter
- Language: Portuguese (Brazil) throughout

## Architecture
- React Query hooks for all data (use-clients, use-tools, use-reports, use-webhooks)
- Sidebar layout with SidebarProvider
- Pages: Dashboard, Clients, Tools, Reports, ReportForm, ReportViewer, Export, Documentation, Settings
- Lovable Cloud (Supabase) for persistence

## Database Tables
- clients, tools, reports, report_images, webhooks, webhook_logs
- Storage bucket: report-images (public)
- RLS: open access (no auth yet) — all policies use USING(true)

## Pending
- Authentication (RLS policies need user-scoped access)
- Real webhook HTTP calls (currently just logs test events)
