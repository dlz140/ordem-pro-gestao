import { useState, useEffect } from "react";
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
  Faturamento: number;
  Gastos: number;
  Lucro: number;
}

const paraNumero = (valor: any): number => {
  const num = parseFloat(String(valor));
  return isNaN(num) ? 0 : num;
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

  const [estatisticas, setEstatisticas] = useState<Estatisticas>({
    ordensAbertas: 0,
    ordensEmAndamento: 0,
    ordensConcluidas: 0,
    faturamentoMensal: 0,
    valorPendente: 0,
    totalGastosMes: 0,
  });
  const [dadosGrafico, setDadosGrafico] = useState<GraficoData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEstatisticas();
  }, []);

  const fetchEstatisticas = async () => {
    setLoading(true);
    try {
      const [ordensRes, gastosRes] = await Promise.all([
        supabase.from('ordens_servico').select('valor_pago, valor_restante, data_os, status_os ( status )'),
        supabase.from('gastos').select('valor, data')
      ]);
      
      if (ordensRes.error) throw ordensRes.error;
      if (gastosRes.error) throw gastosRes.error;

      const ordensData = ordensRes.data || [];
      const gastosData = gastosRes.data || [];
      
      const umMesAtras = new Date();
      umMesAtras.setMonth(umMesAtras.getMonth() - 1);

      const faturamentoPorMes: Record<string, number> = {};

      const stats = ordensData.reduce((acc, o) => {
        const status = o.status_os?.status?.toLowerCase() || 'indefinido';
        const dataOS = new Date(o.data_os);
        
        if (status.includes('abert')) acc.ordensAbertas += 1;
        else if (status.includes('andamento') || status.includes('peça') || status.includes('aguardando')) acc.ordensEmAndamento += 1;
        else if (status.includes('concluíd') || status.includes('finalizad')) {
          acc.ordensConcluidas += 1;
          
          if (dataOS >= umMesAtras) {
            acc.faturamentoMensal += paraNumero(o.valor_pago);
          }
          
          const mesAno = `${(dataOS.getMonth() + 1).toString().padStart(2, '0')}/${dataOS.getFullYear().toString().slice(2)}`;
          faturamentoPorMes[mesAno] = (faturamentoPorMes[mesAno] || 0) + paraNumero(o.valor_pago);
        }
        
        acc.valorPendente += paraNumero(o.valor_restante);
        
        return acc;
      }, {
        ordensAbertas: 0,
        ordensEmAndamento: 0,
        ordensConcluidas: 0,
        faturamentoMensal: 0,
        valorPendente: 0,
      });

      const totalGastosMes = gastosData
        .filter(g => new Date(g.data) >= umMesAtras)
        .reduce((acc, g) => acc + paraNumero(g.valor), 0);
        
      setEstatisticas({ ...stats, totalGastosMes });

      const gastosAgrupados = gastosData.reduce((acc, g) => {
        const data = new Date(g.data);
        const mesAno = `${(data.getMonth() + 1).toString().padStart(2, '0')}/${data.getFullYear().toString().slice(2)}`;
        acc[mesAno] = (acc[mesAno] || 0) + paraNumero(g.valor);
        return acc;
      }, {} as Record<string, number>);

      const meses = new Set([...Object.keys(faturamentoPorMes), ...Object.keys(gastosAgrupados)]);
      const dadosCombinados = Array.from(meses).map(mes => {
        const faturamento = faturamentoPorMes[mes] || 0;
        const gastos = gastosAgrupados[mes] || 0;
        return {
          name: mes,
          Faturamento: faturamento,
          Gastos: gastos,
          Lucro: faturamento - gastos,
        }
      }).sort((a, b) => {
          const [aMonth, aYear] = a.name.split('/');
          const [bMonth, bYear] = b.name.split('/');
          return (Number(aYear) - Number(bYear)) || (Number(aMonth) - Number(bMonth));
      });
      
      setDadosGrafico(dadosCombinados);

    } catch (error) {
      console.error("Erro ao buscar dados das estatísticas:", error);
      toast({ title: "Erro", description: "Não foi possível carregar as estatísticas.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Carregando dashboard...</div>;
  }

  return (
    <div className="flex flex-col h-full gap-6">
      <Card className="card-glass rounded-b-none shadow-lg">
        <CardContent className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gradient-brand">Dashboard</h1>
              <p className="text-muted-foreground">Visão geral do sistema</p>
            </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="card-glass"><CardContent className="p-4"><div className="flex items-center justify-between"><div><div className="text-2xl font-bold text-blue-400">{estatisticas.ordensAbertas}</div><div className="text-sm text-muted-foreground">Abertas</div></div><ClipboardList className="h-8 w-8 text-blue-400/70" /></div></CardContent></Card>
        <Card className="card-glass"><CardContent className="p-4"><div className="flex items-center justify-between"><div><div className="text-2xl font-bold text-yellow-400">{estatisticas.ordensEmAndamento}</div><div className="text-sm text-muted-foreground">Em Andamento</div></div><Clock className="h-8 w-8 text-yellow-400/70" /></div></CardContent></Card>
        <Card className="card-glass"><CardContent className="p-4"><div className="flex items-center justify-between"><div><div className="text-2xl font-bold text-green-400">{estatisticas.ordensConcluidas}</div><div className="text-sm text-muted-foreground">Concluídas</div></div><CheckCircle className="h-8 w-8 text-green-400/70" /></div></CardContent></Card>
        <Card className="card-glass"><CardContent className="p-4"><div className="flex items-center justify-between"><div><div className="text-2xl font-bold text-cyan-400">{estatisticas.faturamentoMensal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div><div className="text-sm text-muted-foreground">Faturamento (Mês)</div></div><DollarSign className="h-8 w-8 text-cyan-400/70" /></div></CardContent></Card>
        <Card className="card-glass"><CardContent className="p-4"><div className="flex items-center justify-between"><div><div className="text-2xl font-bold text-orange-400">{estatisticas.totalGastosMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div><div className="text-sm text-muted-foreground">Gastos (Mês)</div></div><Landmark className="h-8 w-8 text-orange-400/70" /></div></CardContent></Card>
        <Card className="card-glass"><CardContent className="p-4"><div className="flex items-center justify-between"><div><div className="text-2xl font-bold text-red-400">{estatisticas.valorPendente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div><div className="text-sm text-muted-foreground">Pendente</div></div><TrendingUp className="h-8 w-8 text-red-400/70" /></div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow">
        <Card className="lg:col-span-2 card-glass flex flex-col">
            <CardHeader><CardTitle className="text-foreground">Análise Financeira Mensal</CardTitle></CardHeader>
            <CardContent className="flex-grow">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dadosGrafico} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => `R$${(value/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{fontSize: "12px"}} />
                  <Bar dataKey="Faturamento" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Gastos" fill="hsl(var(--destructive) / 0.7)" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="Lucro" stroke="#82ca9d" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
        </Card>
        <Card className="card-glass flex flex-col">
            <CardHeader><CardTitle className="text-foreground">Resumo Financeiro</CardTitle></CardHeader>
            <CardContent className="flex-grow overflow-y-auto">
              <div className="space-y-4">
                {dadosGrafico.length > 0 ? dadosGrafico.slice().reverse().map((mes) => (
                  <div key={mes.name} className="p-3 rounded-md bg-background/50 border-b border-border/50">
                    <div className="flex justify-between items-center text-sm font-bold">
                      <span>Mês: {mes.name}</span>
                      <span className={mes.Lucro >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {mes.Lucro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2 space-y-1">
                      <div className="flex justify-between"><span>Faturamento:</span> <span>{mes.Faturamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
                      <div className="flex justify-between"><span>Gastos:</span> <span>- {mes.Gastos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center text-muted-foreground pt-12">Nenhum dado financeiro para exibir.</div>
                )}
              </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}