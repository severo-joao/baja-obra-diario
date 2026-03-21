import {
  LayoutDashboard,
  Users,
  Wrench,
  FileText,
  Download,
  BookOpen,
  Settings,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Clientes & Empreitadas", url: "/clientes", icon: Users },
  { title: "Ferramentas", url: "/ferramentas", icon: Wrench },
  { title: "Relatórios de Obras", url: "/relatorios", icon: FileText },
  { title: "Exportar Relatório", url: "/exportar", icon: Download },
  { title: "Documentação & Webhooks", url: "/documentacao", icon: BookOpen },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-baja-orange flex items-center justify-center flex-shrink-0">
            <span className="text-accent-foreground font-extrabold text-sm">B</span>
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="font-bold text-base text-sidebar-accent-foreground leading-tight tracking-tight">BAJA</h1>
              <p className="text-[10px] text-sidebar-foreground/60 leading-tight">Engenharia & Construções</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="pt-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = item.url === "/" 
                  ? location.pathname === "/" 
                  : location.pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <NavLink
                        to={item.url}
                        end={item.url === "/"}
                        className="transition-colors duration-150"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        {!collapsed && <span className="truncate">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        {!collapsed && (
          <p className="text-[10px] text-sidebar-foreground/40 text-center">
            Diário de Obras v1.0
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
