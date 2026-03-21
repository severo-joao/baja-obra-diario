import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Client, Tool, Report, ReportImage, Webhook, WebhookLog } from './types';

interface AppStore {
  clients: Client[];
  tools: Tool[];
  reports: Report[];
  reportImages: ReportImage[];
  webhooks: Webhook[];
  webhookLogs: WebhookLog[];

  addClient: (client: Client) => void;
  updateClient: (id: string, data: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  addTool: (tool: Tool) => void;
  updateTool: (id: string, data: Partial<Tool>) => void;
  deleteTool: (id: string) => void;

  addReport: (report: Report) => void;
  updateReport: (id: string, data: Partial<Report>) => void;
  deleteReport: (id: string) => void;

  addReportImage: (image: ReportImage) => void;
  deleteReportImage: (id: string) => void;

  addWebhook: (webhook: Webhook) => void;
  updateWebhook: (id: string, data: Partial<Webhook>) => void;
  deleteWebhook: (id: string) => void;

  addWebhookLog: (log: WebhookLog) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      clients: [],
      tools: [],
      reports: [],
      reportImages: [],
      webhooks: [],
      webhookLogs: [],

      addClient: (client) => set((s) => ({ clients: [...s.clients, client] })),
      updateClient: (id, data) => set((s) => ({
        clients: s.clients.map((c) => c.id === id ? { ...c, ...data, updated_at: new Date().toISOString() } : c),
      })),
      deleteClient: (id) => set((s) => ({ clients: s.clients.filter((c) => c.id !== id) })),

      addTool: (tool) => set((s) => ({ tools: [...s.tools, tool] })),
      updateTool: (id, data) => set((s) => ({
        tools: s.tools.map((t) => t.id === id ? { ...t, ...data } : t),
      })),
      deleteTool: (id) => set((s) => ({ tools: s.tools.filter((t) => t.id !== id) })),

      addReport: (report) => set((s) => ({ reports: [...s.reports, report] })),
      updateReport: (id, data) => set((s) => ({
        reports: s.reports.map((r) => r.id === id ? { ...r, ...data, updated_at: new Date().toISOString() } : r),
      })),
      deleteReport: (id) => set((s) => ({ reports: s.reports.filter((r) => r.id !== id) })),

      addReportImage: (image) => set((s) => ({ reportImages: [...s.reportImages, image] })),
      deleteReportImage: (id) => set((s) => ({ reportImages: s.reportImages.filter((i) => i.id !== id) })),

      addWebhook: (webhook) => set((s) => ({ webhooks: [...s.webhooks, webhook] })),
      updateWebhook: (id, data) => set((s) => ({
        webhooks: s.webhooks.map((w) => w.id === id ? { ...w, ...data } : w),
      })),
      deleteWebhook: (id) => set((s) => ({ webhooks: s.webhooks.filter((w) => w.id !== id) })),

      addWebhookLog: (log) => set((s) => ({ webhookLogs: [log, ...s.webhookLogs].slice(0, 50) })),
    }),
    { name: 'baja-store' }
  )
);
