import { cn } from "@/lib/utils";
import { Button, ButtonProps } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { forwardRef } from "react";

// Tipos personalizados
type InputProps = React.ComponentProps<"input">;
type CardProps = React.HTMLAttributes<HTMLDivElement>;
type StandardButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "cyber" | "gradient";

interface StandardButtonProps extends Omit<ButtonProps, 'variant'> {
  variant?: StandardButtonVariant;
}

// Botões padronizados com variantes específicas
export const StandardButton = forwardRef<HTMLButtonElement, StandardButtonProps>(({ className, variant = "default", children, ...props }, ref) => {
  // Mapear variantes customizadas para classes CSS
  if (variant === "cyber") {
    return (
      <Button
        ref={ref}
        variant="default"
        className={cn("btn-gradient-cyber", className)}
        {...props}
      >
        {children}
      </Button>
    );
  }
  
  if (variant === "gradient") {
    return (
      <Button
        ref={ref}
        variant="default"
        className={cn(
          "bg-gradient-to-r from-primary to-purple-600 text-primary-foreground shadow-lg hover:shadow-xl hover:from-primary/90 hover:to-purple-600/90 transform hover:-translate-y-1 transition-all duration-300",
          className
        )}
        {...props}
      >
        {children}
      </Button>
    );
  }

  return (
    <Button
      ref={ref}
      variant={variant}
      className={className}
      {...props}
    >
      {children}
    </Button>
  );
});

StandardButton.displayName = "StandardButton";

// Input padronizado com estilos consistentes
export const StandardInput = forwardRef<HTMLInputElement, InputProps & {
  isError?: boolean;
}>(({ className, isError, ...props }, ref) => {
  return (
    <Input
      ref={ref}
      className={cn(
        "transition-all duration-200",
        "hover:border-primary/50 focus-visible:border-primary",
        "shadow-sm hover:shadow-md focus-visible:shadow-lg",
        isError && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive",
        className
      )}
      {...props}
    />
  );
});

StandardInput.displayName = "StandardInput";

// Card padronizado com glassmorphism
export const StandardCard = forwardRef<HTMLDivElement, CardProps & {
  glassEffect?: boolean;
  hover?: boolean;
}>(({ className, glassEffect = true, hover = false, ...props }, ref) => {
  return (
    <Card
      ref={ref}
      className={cn(
        glassEffect && "card-glass",
        hover && "hover:border-primary/50 transition-all duration-200 transform hover:-translate-y-1",
        className
      )}
      {...props}
    />
  );
});

StandardCard.displayName = "StandardCard";

// Container padrão para páginas
export function PageContainer({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <div className={cn("flex flex-col gap-6 h-full", className)}>
      {children}
    </div>
  );
}

// Container para filtros
export function FiltersContainer({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <StandardCard className={cn("flex-shrink-0", className)}>
      <div className="p-4">
        {children}
      </div>
    </StandardCard>
  );
}

// Grid responsivo para formulários
export function FormGrid({ 
  children, 
  cols = 2, 
  className 
}: { 
  children: React.ReactNode; 
  cols?: 1 | 2 | 3 | 4; 
  className?: string; 
}) {
  const gridClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-4", gridClasses[cols], className)}>
      {children}
    </div>
  );
}

// Loading state padronizado
export function StandardLoading({ 
  message = "Carregando...", 
  size = "default" 
}: { 
  message?: string; 
  size?: "sm" | "default" | "lg"; 
}) {
  const sizeClasses = {
    sm: "w-6 h-6",
    default: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center space-y-4">
        <div className={cn(
          "border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto",
          sizeClasses[size]
        )}></div>
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

// Empty state padronizado
export function StandardEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center space-y-4 max-w-md">
        {Icon && <Icon className="h-16 w-16 text-muted-foreground/50 mx-auto" />}
        <div>
          <h3 className="text-xl font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="text-muted-foreground mt-2">{description}</p>
          )}
        </div>
        {action && <div className="mt-4">{action}</div>}
      </div>
    </div>
  );
}

// Error state padronizado
export function StandardError({
  title = "Erro",
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex items-center justify-center h-64">
      <StandardCard className="max-w-md">
        <div className="p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <div className="w-6 h-6 text-destructive">⚠</div>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{message}</p>
            {onRetry && (
              <StandardButton onClick={onRetry} variant="gradient">
                Tentar Novamente
              </StandardButton>
            )}
          </div>
        </div>
      </StandardCard>
    </div>
  );
}

// Badge padronizado para status
export function StatusBadge({
  status,
  variant = "default",
}: {
  status: string;
  variant?: "default" | "success" | "warning" | "error" | "info";
}) {
  const variantClasses = {
    default: "bg-slate-500/20 text-slate-300 border-slate-500/30",
    success: "bg-green-500/20 text-green-300 border-green-500/30",
    warning: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30", 
    error: "bg-red-500/20 text-red-300 border-red-500/30",
    info: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  };

  return (
    <span className={cn(
      "inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium border",
      variantClasses[variant]
    )}>
      {status}
    </span>
  );
}