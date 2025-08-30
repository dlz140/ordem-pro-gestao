import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { ThemeToggle } from "./ThemeToggle";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      {/* Container principal agora tem altura fixa de tela e esconde o overflow */}
      <div className="h-screen flex w-full overflow-hidden bg-gradient-to-br from-background via-background to-muted/30">
        <AppSidebar />
        {/* Main agora é uma coluna flex para controlar a altura dos filhos */}
        <main className="flex-1 flex flex-col">
          {/* Este container interno agora cresce e controla o scroll */}
          <div className="flex-1 flex flex-col p-6 overflow-y-auto">
            <div className="mb-6 flex items-center justify-between flex-shrink-0">
              <SidebarTrigger className="bg-card shadow-lg hover:bg-accent transition-all duration-300 border border-border/50 hover:shadow-cyber" />
              <ThemeToggle />
            </div>
            {/* O conteúdo da página (children) agora tem um container flex para se expandir */}
            <div className="flex-1 flex flex-col">
              {children}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}