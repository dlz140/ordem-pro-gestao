// src/components/ui/PageHeader.tsx

import { Card, CardContent } from "@/components/ui/card";
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  children?: ReactNode; // Para colocar botões, como o "Nova OS"
}

export function PageHeader({ title, subtitle, icon: Icon, children }: PageHeaderProps) {
  return (
    <Card className="card-glass rounded-b-none shadow-lg flex-shrink-0">
      <CardContent className="p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gradient-brand">{title}</h1>
            <p className="text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <div>
          {children}
        </div>
      </CardContent>
    </Card>
  );
}