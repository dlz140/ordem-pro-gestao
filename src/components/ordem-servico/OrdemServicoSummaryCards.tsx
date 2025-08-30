import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { OrdemServicoDB } from "@/types";
import { ClipboardList, PackageCheck, CheckCircle, DollarSign } from "lucide-react";

type OrdemComJoins = Omit<OrdemServicoDB, 'status_os' | 'clientes'> & {
  status_os: { status: string } | null;
  clientes: { nome: string } | null;
};

interface OrdemServicoSummaryCardsProps {
  ordens: OrdemComJoins[];
}

export function OrdemServicoSummaryCards({ ordens }: OrdemServicoSummaryCardsProps) {
  const summary = useMemo(() => {
    // Lógica de contagem direta para os status desejados
    const stats = ordens.reduce((acc, ordem) => {
      acc.aReceber += (ordem.valor_restante || 0);
      const status = ordem.status_os?.status?.toLowerCase() || 'indefinido';

      if (status.includes("abert")) {
        acc.abertas += 1;
      } else if (status.includes("retirada")) {
        acc.aguardandoRetirada += 1;
      } else if (status.includes("concluíd") || status.includes("finalizad")) {
        acc.concluidas += 1;
      }
      
      return acc;
    }, {
      abertas: 0,
      aguardandoRetirada: 0,
      concluidas: 0,
      aReceber: 0,
    });
    return stats;
  }, [ordens]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card Fixo: Abertas */}
      <Card className="card-glass">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-blue-400">{summary.abertas}</div>
            <div className="text-sm text-muted-foreground">Abertas</div>
          </div>
          <ClipboardList className="h-8 w-8 text-blue-400/70" />
        </CardContent>
      </Card>
      
      {/* Card Fixo: Aguardando Retirada */}
      <Card className="card-glass">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-orange-400">{summary.aguardandoRetirada}</div>
            <div className="text-sm text-muted-foreground">Aguardando Retirada</div>
          </div>
          <PackageCheck className="h-8 w-8 text-orange-400/70" />
        </CardContent>
      </Card>

      {/* Card Fixo: Concluídas */}
      <Card className="card-glass">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-green-400">{summary.concluidas}</div>
            <div className="text-sm text-muted-foreground">Concluídas</div>
          </div>
          <CheckCircle className="h-8 w-8 text-green-400/70" />
        </CardContent>
      </Card>

      {/* Card Fixo: A Receber */}
      <Card className="card-glass">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-red-400">
              {summary.aReceber.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <div className="text-sm text-muted-foreground">A Receber</div>
          </div>
          <DollarSign className="h-8 w-8 text-red-400/70" />
        </CardContent>
      </Card>
    </div>
  );
}