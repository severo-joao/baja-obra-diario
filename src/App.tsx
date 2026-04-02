import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useMyPermissions, type PermissionKey } from "@/hooks/use-user-permissions";
import Dashboard from "./pages/Dashboard";
import ClientsPage from "./pages/ClientsPage";
import ToolsPage from "./pages/ToolsPage";
import ReportsPage from "./pages/ReportsPage";
import ReportFormPage from "./pages/ReportFormPage";
import ReportViewerPage from "./pages/ReportViewerPage";
import ExportPage from "./pages/ExportPage";
import DemandasPage from "./pages/DemandasPage";
import DocumentationPage from "./pages/DocumentationPage";
import SettingsPage from "./pages/SettingsPage";
import AuthPage from "./pages/AuthPage";
import SetPasswordPage from "./pages/SetPasswordPage";
import ExternalReportPage from "./pages/ExternalReportPage";
import ReportPrintPage from "./pages/ReportPrintPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ROUTE_PERMISSION_MAP: Record<string, PermissionKey> = {
  "/": "dashboard",
  "/clientes": "clientes",
  "/ferramentas": "ferramentas",
  "/relatorios": "relatorios",
  "/exportar": "exportar",
  "/demandas": "demandas",
  "/documentacao": "documentacao",
  "/configuracoes": "configuracoes",
};

function PermissionGate({ children }: { children: React.ReactNode }) {
  const { data: permissions } = useMyPermissions();
  const location = useLocation();

  if (!permissions) return <>{children}</>; // loading — allow render

  // Find matching permission key for current route
  const matchedKey = Object.entries(ROUTE_PERMISSION_MAP).find(([path]) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  })?.[1];

  if (matchedKey) {
    const perm = permissions.find((p) => p.permission_key === matchedKey);
    if (perm && !perm.can_view) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}

function AuthenticatedRoutes() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center animate-pulse">
          <span className="text-primary-foreground font-extrabold text-sm">B</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <AppLayout>
      <PermissionGate>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clientes" element={<ClientsPage />} />
          <Route path="/ferramentas" element={<ToolsPage />} />
          <Route path="/relatorios" element={<ReportsPage />} />
          <Route path="/relatorios/entrada/novo/:id" element={<ReportFormPage />} />
          <Route path="/relatorios/entrada/editar/:entryId" element={<ReportFormPage />} />
          <Route path="/relatorios/:id" element={<ReportViewerPage />} />
          <Route path="/exportar" element={<ExportPage />} />
          <Route path="/demandas" element={<DemandasPage />} />
          <Route path="/documentacao" element={<DocumentationPage />} />
          <Route path="/configuracoes" element={<SettingsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </PermissionGate>
    </AppLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/set-password" element={<SetPasswordPage />} />
          <Route path="/relato-externo" element={<ExternalReportPage />} />
          <Route path="/report-print" element={<ReportPrintPage />} />
          <Route path="/*" element={<AuthenticatedRoutes />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
