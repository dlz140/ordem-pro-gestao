import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LayoutDashboard,
  ClipboardList,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  Landmark,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Line, ComposedChart } from 'recharts';

interface Estatisticas {
  ordensAbertas: number;
  ordensEmAndamento: number;
  ordensConcluidas: number;
  faturamentoMensal: number;
  valorPendente: number;
  totalGastosMes: number;
}

interface GraficoData {
  name: string;
  nomeCompleto?: string;
  Faturamento: number;
  Gastos: number;
  Lucro: number;
}

interface DashboardData {
  estatisticas: Estatisticas;
  dadosGrafico: GraficoData[];
}

const fetchDashboardData = async (): Promise<DashboardData> => {
  const { data, error } = await supabase.rpc('get_dashboard_data');
  if (error) {
    throw new Error('Não foi possível carregar os dados do dashboard.');
  }
  return data;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-background/80 backdrop-blur-sm border border-border rounded-lg shadow-lg">
        <p className="label font-bold text-foreground">{`${label}`}</p>
        {payload.map((pld: any, index: number) => (
          <p key={index} style={{ color: pld.color }}>
            {`${pld.name}: ${pld.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { toast } = useToast();

  const { data: dashboardData, isLoading, isError, error } = useQuery<DashboardData, Error>({
    queryKey: ['dashboardData'],
    queryFn: fetchDashboardData,
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
    refetchInterval: 1000 * 60 * 10, // Atualiza automaticamente a cada 10 minutos
  });

  const [dadosResumoAnual, setDadosResumoAnual] = useState<GraficoData[]>([]);
  const currentYear = new Date().getFullYear();

  // Processar dados para o gráfico anual com otimização
  useEffect(() => {
    if (dashboardData?.dadosGrafico) {
      const anoResumo = currentYear;
      const anoCurto = anoResumo.toString().slice(2);
      const dadosAnuais: GraficoData[] = [];
      const dadosCombinados = dashboardData.dadosGrafico;

      for (let i = 0; i < 12; i++) {
        const nomeMes = new Date(anoResumo, i).toLocaleString('pt-BR', { month: 'long' });
        const chaveMes = `${(i + 1).toString().padStart(2, '0')}/${anoCurto}`;
        const dadosDoMes = dadosCombinados.find(d => d.name === chaveMes);

        dadosAnuais.push(dadosDoMes 
          ? { ...dadosDoMes, nomeCompleto: nomeMes }
          : { name: chaveMes, nomeCompleto: nomeMes, Faturamento: 0, Gastos: 0, Lucro: 0 }
        );
      }
      setDadosResumoAnual(dadosAnuais);
    }
  }, [dashboardData?.dadosGrafico, currentYear]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="card-glass max-w-md">
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <TrendingUp className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">Erro no Dashboard</h3>
              <p className="text-sm text-muted-foreground mb-4">{error?.message}</p>
              <Button onClick={() => window.location.reload()} className="btn-gradient-cyber">
                Tentar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const estatisticas = dashboardData?.estatisticas;
  const dadosGrafico = dashboardData?.dadosGrafico || [];

  return (
    <div className="flex flex-col h-full gap-4 md:gap-6 p-4 md:p-0">
      <Card className="card-glass flex-shrink-0">
        <CardContent className="p-3 md:p-4 flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
              <LayoutDashboard className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gradient-brand">Dashboard</h1>
              <p className="text-sm text-muted-foreground">Visão geral do sistema</p>
            </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 flex-shrink-0">
        <Card className="card-glass"><CardContent className="p-4"><div className="flex items-center justify-between"><div><div className="text-2xl font-bold text-blue-400">{estatisticas?.ordensAbertas ?? 0}</div><div className="text-sm text-muted-foreground">Abertas</div></div><ClipboardList className="h-8 w-8 text-blue-400/70" /></div></CardContent></Card>
        <Card className="card-glass"><CardContent className="p-4"><div className="flex items-center justify-between"><div><div className="text-2xl font-bold text-yellow-400">{estatisticas?.ordensEmAndamento ?? 0}</div><div className="text-sm text-muted-foreground">Em Andamento</div></div><Clock className="h-8 w-8 text-yellow-400/70" /></div></CardContent></Card>
        <Card className="card-glass"><CardContent className="p-4"><div className="flex items-center justify-between"><div><div className="text-2xl font-bold text-green-400">{estatisticas?.ordensConcluidas ?? 0}</div><div className="text-sm text-muted-foreground">Concluídas</div></div><CheckCircle className="h-8 w-8 text-green-400/70" /></div></CardContent></Card>
        <Card className="card-glass"><CardContent className="p-4"><div className="flex items-center justify-between"><div><div className="text-2xl font-bold text-cyan-400">{(estatisticas?.faturamentoMensal ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div><div className="text-sm text-muted-foreground">Faturamento (Mês)</div></div><DollarSign className="h-8 w-8 text-cyan-400/70" /></div></CardContent></Card>
        <Card className="card-glass"><CardContent className="p-4"><div className="flex items-center justify-between"><div><div className="text-2xl font-bold text-orange-400">{(estatisticas?.totalGastosMes ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div><div className="text-sm text-muted-foreground">Gastos (Mês)</div></div><Landmark className="h-8 w-8 text-orange-400/70" /></div></CardContent></Card>
        <Card className="card-glass"><CardContent className="p-4"><div className="flex items-center justify-between"><div><div className="text-2xl font-bold text-red-400">{(estatisticas?.valorPendente ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div><div className="text-sm text-muted-foreground">Pendente</div></div><TrendingUp className="h-8 w-8 text-red-400/70" /></div></CardContent></Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6 min-h-0">
        <Card className="lg:col-span-3 card-glass flex flex-col h-[300px] md:h-[360px]">
          <CardHeader className="pb-2"><CardTitle className="text-sm md:text-base text-foreground">Análise Financeira (Últimos 12 Meses)</CardTitle></CardHeader>
          <CardContent className="flex-grow p-2 md:p-6 pt-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={dadosGrafico.slice(-12)} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(value) => `R$${(value/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{fontSize: "10px"}} />
                <Bar dataKey="Faturamento" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Gastos" fill="hsl(var(--destructive) / 0.7)" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="Lucro" stroke="#82ca9d" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2 card-glass flex flex-col h-[360px]">
          <CardHeader>
            <CardTitle className="flex items-center">
              <span className="flex-1 text-left">Resumo por Mês</span>
              <span className="text-muted-foreground px-4">|</span>
              <span className="flex-1 text-right text-primary font-semibold">{currentYear}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-grow overflow-y-auto">
            <div className="space-y-1">
              {dadosResumoAnual.length > 0 ? (
                <>
                  <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/50 bg-card px-4 py-2 text-xs font-semibold text-muted-foreground">
                    <span className="w-[25%]">Mês</span>
                    <div className="flex flex-1 justify-end gap-2 text-right">
                      <span className="w-[30%] text-center">Faturamento</span>
                      <span className="w-[30%] text-center">Gastos</span>
                      <span className="w-[30%] text-center">Saldo</span>
                    </div>
                  </div>
                  <div className="text-sm px-2">
                    {dadosResumoAnual.slice().reverse().map((mes) => (
                      <div key={mes.name} className="flex justify-between items-center px-2 py-2 rounded-md hover:bg-muted/50">
                        <span className="w-[25%] font-semibold text-foreground capitalize">{mes.nomeCompleto}</span>
                        <div className="flex flex-1 justify-end gap-2 font-mono text-right">
                          <span className="w-[30%] text-center text-primary">
                            {mes.Faturamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                          <span className="w-[30%] text-center text-orange-400">
                            {mes.Gastos > 0 ? `- ${mes.Gastos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : 'R$ 0,00'}
                          </span>
                          <span className={`w-[30%] text-center font-bold ${mes.Lucro >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {mes.Lucro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center text-muted-foreground pt-12">Nenhum dado financeiro para exibir.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}