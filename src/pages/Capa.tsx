import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardList, AlertCircle, Calendar as CalendarIcon, CheckCircle, Plus, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { OrdemServicoDB, StatusOsInterface } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { DigitalClock } from "@/components/ui/DigitalClock";
import { cn } from "@/lib/utils";

type OrdemRecente = Pick<OrdemServicoDB, 'id' | 'valor_total' | 'data_os'> & {
  clientes: { nome: string } | null;
  status_os: StatusOsInterface | null;
  equipamentos: { tipo: string } | null;
};

interface KpisDoDia {
  abertasHoje: number;
  finalizadasHoje: number;
}

interface CapaData {
  kpis: KpisDoDia;
  ordensRecentes: OrdemRecente[];
}

const colorPalette = [
  { name: 'slate', textColor: 'text-slate-400', borderColor: 'border-slate-500/30' },
  { name: 'red', textColor: 'text-red-400', borderColor: 'border-red-500/30' },
  { name: 'orange', textColor: 'text-orange-400', borderColor: 'border-orange-500/30' },
  { name: 'amber', textColor: 'text-amber-400', borderColor: 'border-amber-500/30' },
  { name: 'yellow', textColor: 'text-yellow-400', borderColor: 'border-yellow-500/30' },
  { name: 'lime', textColor: 'text-lime-400', borderColor: 'border-lime-500/30' },
  { name: 'green', textColor: 'text-green-400', borderColor: 'border-green-500/30' },
  { name: 'emerald', textColor: 'text-emerald-400', borderColor: 'border-emerald-500/30' },
  { name: 'teal', textColor: 'text-teal-400', borderColor: 'border-teal-500/30' },
  { name: 'cyan', textColor: 'text-cyan-400', borderColor: 'border-cyan-500/30' },
  { name: 'sky', textColor: 'text-sky-400', borderColor: 'border-sky-500/30' },
  { name: 'blue', textColor: 'text-blue-400', borderColor: 'border-blue-500/30' },
  { name: 'indigo', textColor: 'text-indigo-400', borderColor: 'border-indigo-500/30' },
  { name: 'violet', textColor: 'text-violet-400', borderColor: 'border-violet-500/30' },
  { name: 'purple', textColor: 'text-purple-400', borderColor: 'border-purple-500/30' },
  { name: 'fuchsia', textColor: 'text-fuchsia-400', borderColor: 'border-fuchsia-500/30' },
  { name: 'pink', textColor: 'text-pink-400', borderColor: 'border-pink-500/30' },
  { name: 'rose', textColor: 'text-rose-400', borderColor: 'border-rose-500/30' },
];

const getColorClasses = (colorName?: string | null) => {
    const color = colorPalette.find(c => c.name === colorName);
    if (!color) {
      return `bg-transparent text-gray-400 border-gray-500/30`;
    }
    return `bg-transparent ${color.textColor} ${color.borderColor}`;
};

const fetchCapaData = async (): Promise<CapaData> => {
  const { data, error } = await supabase.rpc('get_capa_data');
  if (error) {
    throw new Error('Não foi possível carregar os dados da página inicial.');
  }
  return data;
};

export default function Capa() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: capaData, isLoading, isError, error } = useQuery<CapaData, Error>({
    queryKey: ['capaData'],
    queryFn: fetchCapaData,
    staleTime: 1000 * 60 * 5, // 5 minutos
    onError: (err) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  });

  const tarefasUrgentes = [
    { id: 1, tarefa: "Contatar cliente sobre peça chegada", prioridade: "Alta" },
    { id: 2, tarefa: "Finalizar diagnóstico do notebook", prioridade: "Média" },
    { id: 3, tarefa: "Agendar entrega para cliente", prioridade: "Alta" }
  ];

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case "Alta": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "Média": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  if (isLoading) {
    return <div className="p-8">Carregando...</div>;
  }

  if (isError) {
    return <div className="p-8 text-destructive">Erro ao carregar dados: {error?.message}</div>;
  }
  
  const kpis = capaData?.kpis;
  const ordensRecentes = capaData?.ordensRecentes || [];

  return (
    <div className="flex flex-col h-full gap-4">
      <Card className="card-glass rounded-b-none shadow-lg">
        <CardContent className="p-4 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Bem-vindo!</h1>
            <p className="text-muted-foreground">Este é o seu centro de comando para o dia.</p>
          </div>
          <DigitalClock />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="card-glass">
          <CardContent className="p-4 flex items-center gap-4">
            <ClipboardList className="h-8 w-8 text-blue-400" />
            <div>
              <div className="text-2xl font-bold">{kpis?.abertasHoje ?? 0}</div>
              <div className="text-xs text-muted-foreground">OS Abertas Hoje</div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-glass">
          <CardContent className="p-4 flex items-center gap-4">
            <CheckCircle className="h-8 w-8 text-green-400" />
            <div>
              <div className="text-2xl font-bold">{kpis?.finalizadasHoje ?? 0}</div>
              <div className="text-xs text-muted-foreground">OS Finalizadas Hoje</div>
            </div>
          </CardContent>
        </Card>
        
        <Button 
          variant="outline"
          className="h-full text-base border-primary/30 text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-purple-900/50 hover:to-slate-900/50 hover:border-purple-800/50 transform hover:-translate-y-1 transition-all duration-300 group" 
          onClick={() => navigate('/ordens-servico', { state: { novaOS: true } })}
        >
          <Plus className="h-6 w-6 mr-3 transition-transform group-hover:rotate-90" />
          Nova OS
        </Button>
        <Button 
          variant="outline"
          className="h-full text-base border-primary/30 text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-purple-900/50 hover:to-slate-900/50 hover:border-purple-800/50 transform hover:-translate-y-1 transition-all duration-300 group" 
          onClick={() => navigate('/clientes', { state: { novoCliente: true } })}
        >
          <UserPlus className="h-6 w-6 mr-3 transition-transform group-hover:scale-110" />
          Novo Cliente
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-grow">
        <Card className="card-glass flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <AlertCircle className="h-5 w-5 text-orange-400" />
              Tarefas Urgentes
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-grow">
            <div className="space-y-3">
              {tarefasUrgentes.map((tarefa) => (
                <div key={tarefa.id} className="p-3 bg-background/50 rounded-lg border border-border/50">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 text-sm font-medium text-foreground">{tarefa.tarefa}</div>
                    <Badge className={`${getPrioridadeColor(tarefa.prioridade)} text-xs min-w-[5rem] justify-center pointer-events-none`}>
                      {tarefa.prioridade}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <div className="w-4/5 mx-auto">
              <Button 
                variant="outline" 
                className="w-full border-primary/30 text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-purple-900/50 hover:to-slate-900/50 hover:border-purple-800/50 transform hover:-translate-y-1 transition-all duration-300 group"
              >
                <Plus className="h-4 w-4 mr-2 transition-transform group-hover:rotate-90" />
                Nova Tarefa
              </Button>
            </div>
          </CardFooter>
        </Card>

        <Card className="card-glass flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <ClipboardList className="h-5 w-5 text-primary" />
              Últimas Ordens de Serviço
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-grow">
            <div className="space-y-3">
              {ordensRecentes.length > 0 ? (
                ordensRecentes.map((ordem) => (
                  <div key={ordem.id} className="flex items-center justify-between gap-4 p-3 bg-background/50 rounded-lg border border-border/50">
                    <div className="flex-1 space-y-1">
                      <div className="font-medium text-foreground truncate">{ordem.clientes?.nome || 'Cliente não encontrado'}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <CalendarIcon className="h-3 w-3" />
                        <span>{new Date(ordem.data_os).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                        <span className="mx-1">•</span>
                        <span className="truncate">{ordem.equipamentos?.tipo || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={cn("font-medium text-xs justify-center min-w-[120px] pointer-events-none", getColorClasses(ordem.status_os?.cor))}>
                        {ordem.status_os?.status || 'N/A'}
                      </Badge>
                      <div className="font-semibold text-primary text-sm w-[90px] text-right">
                        {(ordem.valor_total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Nenhuma ordem de serviço recente.
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
             <div className="w-4/5 mx-auto">
               <Button 
                 variant="outline" 
                 className="w-full border-primary/30 text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-purple-900/50 hover:to-slate-900/50 hover:border-purple-800/50 transform hover:-translate-y-1 transition-all duration-300 group" 
                 onClick={() => navigate('/ordens-servico')}
               >
                 Ver Todas as Ordens
               </Button>
             </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}