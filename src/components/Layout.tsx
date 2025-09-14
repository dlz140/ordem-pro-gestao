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
      <div className="h-screen flex w-full bg-gradient-to-br from-background via-background to-muted/30">
        <AppSidebar />
        
        {/* A tag <main> agora é a área de conteúdo principal e o container de rolagem */}
        <main className="flex-1 flex flex-col overflow-y-auto">
          {/* O conteúdo interno agora tem um padding consistente */}
          <div className="flex-1 flex flex-col p-4">
            <div className="mb-2 flex items-center justify-between flex-shrink-0">
              <SidebarTrigger className="bg-card shadow-lg hover:bg-accent transition-all duration-300 border border-border/50 hover:shadow-cyber" />
              <ThemeToggle />
            </div>
            
            {/* O children (sua página) é renderizado diretamente aqui e se expandirá conforme necessário */}
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}