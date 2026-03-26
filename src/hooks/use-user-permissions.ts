import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const PERMISSION_KEYS = [
  "dashboard",
  "clientes",
  "ferramentas",
  "relatorios",
  "exportar",
  "documentacao",
  "demandas",
  "configuracoes",
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  dashboard: "Dashboard",
  clientes: "Clientes & Empreitadas",
  ferramentas: "Ferramentas",
  relatorios: "Relatórios de Obras",
  exportar: "Exportar Relatório",
  documentacao: "Documentação & Webhooks",
  demandas: "Demandas",
  configuracoes: "Configurações",
};

export interface UserPermission {
  permission_key: string;
  can_view: boolean;
  can_edit: boolean;
}

export interface UserWithPermissions {
  id: string;
  email: string;
  created_at: string;
  permissions: UserPermission[];
}

export function useUsersWithPermissions() {
  return useQuery({
    queryKey: ["users-with-permissions"],
    queryFn: async () => {
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: true });
      if (pErr) throw pErr;

      const { data: perms, error: permErr } = await supabase
        .from("user_permissions")
        .select("*");
      if (permErr) throw permErr;

      return (profiles || []).map((p) => ({
        id: p.id,
        email: p.email,
        created_at: p.created_at,
        permissions: (perms || []).filter((perm) => perm.user_id === p.id),
      })) as UserWithPermissions[];
    },
  });
}

export function useMyPermissions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-permissions", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_permissions")
        .select("*")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data as UserPermission[];
    },
  });
}

export function useCanView(key: PermissionKey): boolean | undefined {
  const { data } = useMyPermissions();
  if (!data) return undefined; // loading
  const perm = data.find((p) => p.permission_key === key);
  return perm ? perm.can_view : true; // default allow if no record
}

export function useUpdateUserPermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      permissions,
    }: {
      userId: string;
      permissions: UserPermission[];
    }) => {
      // Upsert each permission
      for (const perm of permissions) {
        const { error } = await supabase
          .from("user_permissions")
          .upsert(
            {
              user_id: userId,
              permission_key: perm.permission_key,
              can_view: perm.can_view,
              can_edit: perm.can_edit,
            },
            { onConflict: "user_id,permission_key" }
          );
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users-with-permissions"] });
      qc.invalidateQueries({ queryKey: ["my-permissions"] });
    },
  });
}
