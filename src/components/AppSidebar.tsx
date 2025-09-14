// src/components/layout/AppSidebar.tsx

import {
  Home,
  LayoutDashboard,
  Users,
  Package,
  FileText,
  ClipboardList,
  LogOut,
  ChevronDown,
  Tag,
  Wrench,
  FolderOpen,
  BarChart3,
  Settings,
  Wallet,
  Landmark,
  TrendingUp,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [relatoriosOpen, setRelatoriosOpen] = useState(false);

  const handleLogout = () => {
  };

  const isActiveRoute = (path: string) => location.pathname === path;

  return (
    <Sidebar className="border-r border-sidebar-border bg-gradient-to-b from-sidebar-background to-sidebar-background/95 backdrop-blur-xl">
      <SidebarContent className="bg-transparent">
        <SidebarGroup>
          <div className="px-6 py-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
                <ClipboardList className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-sidebar-foreground text-lg font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                  OS Pro
                </h2>
                <p className="text-sidebar-foreground/60 text-xs">Futuristic Edition</p>
              </div>
            </div>
          </div>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2 px-4">
              <SidebarMenuItem>
                <SidebarMenuButton asChild className={`text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-300 rounded-xl border border-transparent hover:border-primary/20 hover:shadow-lg group ${isActiveRoute('/') ? 'bg-gradient-to-r from-primary/20 to-purple-500/20 border-primary/30 shadow-cyber' : ''}`}>
                  <button onClick={() => navigate('/')} className="flex items-center gap-3 w-full text-left h-12">
                    <Home size={20} className="group-hover:text-primary transition-colors" />
                    <span className="font-medium">Início</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild className={`text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-300 rounded-xl border border-transparent hover:border-primary/20 hover:shadow-lg group ${isActiveRoute('/dashboard') ? 'bg-gradient-to-r from-primary/20 to-purple-500/20 border-primary/30 shadow-cyber' : ''}`}>
                  <button onClick={() => navigate('/dashboard')} className="flex items-center gap-3 w-full text-left h-12">
                    <LayoutDashboard size={20} className="group-hover:text-primary transition-colors" />
                    <span className="font-medium">Dashboard</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild className={`text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-300 rounded-xl border border-transparent hover:border-primary/20 hover:shadow-lg group ${isActiveRoute('/ordens-servico') ? 'bg-gradient-to-r from-primary/20 to-purple-500/20 border-primary/30 shadow-cyber' : ''}`}>
                  <button onClick={() => navigate('/ordens-servico')} className="flex items-center gap-3 w-full text-left h-12">
                    <ClipboardList size={20} className="group-hover:text-primary transition-colors" />
                    <span className="font-medium">Ordens de Serviço</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild className={`text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-300 rounded-xl border border-transparent hover:border-primary/20 hover:shadow-lg group ${isActiveRoute('/cadastros') ? 'bg-gradient-to-r from-primary/20 to-purple-500/20 border-primary/30 shadow-cyber' : ''}`}>
                  <button onClick={() => navigate('/cadastros')} className="flex items-center gap-3 w-full text-left h-12">
                    <FolderOpen size={20} className="group-hover:text-primary transition-colors" />
                    <span className="font-medium">Cadastros</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild className={`text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-300 rounded-xl border border-transparent hover:border-primary/20 hover:shadow-lg group ${isActiveRoute('/gastos') ? 'bg-gradient-to-r from-primary/20 to-purple-500/20 border-primary/30 shadow-cyber' : ''}`}>
                  <button onClick={() => navigate('/gastos')} className="flex items-center gap-3 w-full text-left h-12">
                    <Landmark size={20} className="group-hover:text-primary transition-colors" />
                    <span className="font-medium">Controle de Gastos</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild className={`text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-300 rounded-xl border border-transparent hover:border-primary/20 hover:shadow-lg group ${isActiveRoute('/pendentes') ? 'bg-gradient-to-r from-primary/20 to-purple-500/20 border-primary/30 shadow-cyber' : ''}`}>
                  <button onClick={() => navigate('/pendentes')} className="flex items-center gap-3 w-full text-left h-12">
                    <FileText size={20} className="group-hover:text-primary transition-colors" />
                    <span className="font-medium">Pendentes</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <Collapsible open={relatoriosOpen} onOpenChange={setRelatoriosOpen}>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-300 rounded-xl border border-transparent hover:border-primary/20 hover:shadow-lg group h-12">
                      <BarChart3 size={20} className="group-hover:text-primary transition-colors" />
                      <span className="font-medium">Relatórios</span>
                      <ChevronDown className={`ml-auto transition-transform duration-300 ${relatoriosOpen ? 'rotate-180' : ''}`} size={16} />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <div className="ml-6 space-y-1">
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild className={`text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-300 rounded-lg border border-transparent hover:border-primary/20 hover:shadow-lg group h-10 ${isActiveRoute('/relatorios') ? 'bg-gradient-to-r from-primary/20 to-purple-500/20 border-primary/30 shadow-cyber' : ''}`}>
                          <button onClick={() => navigate('/relatorios')} className="flex items-center gap-3 w-full text-left">
                            <BarChart3 size={16} className="group-hover:text-primary transition-colors" />
                            <span className="text-sm font-medium">Relatórios Gerais</span>
                          </button>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild className={`text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-300 rounded-lg border border-transparent hover:border-primary/20 hover:shadow-lg group h-10 ${isActiveRoute('/relatorio-ir') ? 'bg-gradient-to-r from-primary/20 to-purple-500/20 border-primary/30 shadow-cyber' : ''}`}>
                          <button onClick={() => navigate('/relatorio-ir')} className="flex items-center gap-3 w-full text-left">
                            <FileText size={16} className="group-hover:text-primary transition-colors" />
                            <span className="text-sm font-medium">Relatório IR</span>
                          </button>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild className={`text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-300 rounded-lg border border-transparent hover:border-primary/20 hover:shadow-lg group h-10 ${isActiveRoute('/relatorio-vendas') ? 'bg-gradient-to-r from-primary/20 to-purple-500/20 border-primary/30 shadow-cyber' : ''}`}>
                          <button onClick={() => navigate('/relatorio-vendas')} className="flex items-center gap-3 w-full text-left">
                            <TrendingUp size={16} className="group-hover:text-primary transition-colors" />
                            <span className="text-sm font-medium">Vendas por Período</span>
                          </button>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild className={`text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-300 rounded-lg border border-transparent hover:border-primary/20 hover:shadow-lg group h-10 ${isActiveRoute('/relatorio-clientes') ? 'bg-gradient-to-r from-primary/20 to-purple-500/20 border-primary/30 shadow-cyber' : ''}`}>
                          <button onClick={() => navigate('/relatorio-clientes')} className="flex items-center gap-3 w-full text-left">
                            <Users size={16} className="group-hover:text-primary transition-colors" />
                            <span className="text-sm font-medium">Relatório Clientes</span>
                          </button>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="bg-transparent border-t border-sidebar-border/50 p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="text-sidebar-foreground hover:bg-destructive/20 hover:text-destructive transition-all duration-300 rounded-xl border border-transparent hover:border-destructive/20 hover:shadow-lg group h-12">
              <LogOut size={20} className="group-hover:text-destructive transition-colors" />
              <span className="font-medium">Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}