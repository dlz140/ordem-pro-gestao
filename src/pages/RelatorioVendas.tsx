import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Calendar, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/ui/PageHeader";

interface VendasPorPeriodo {
  periodo: string;
  totalVendas: number;
  quantidadeOS: number;
  ticketMedio: number;
}

export default function RelatorioVendas() {
  const { toast } = useToast();
  const [periodo, setPeriodo] = useState<string>("mensal");
  const [ano, setAno] = useState<number>(new Date().getFullYear());

  const { data: vendas, isLoading, refetch } = useQuery({
    queryKey: ['vendasPorPeriodo', periodo, ano],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ordens_servico')
        .select('data_os, valor_total')
        .gte('data_os', `${ano}-01-01`)
        .lte('data_os', `${ano}-12-31`);

      if (error) throw error;

      // Processar dados por período
      const vendasPorPeriodo: VendasPorPeriodo[] = [];
      
      if (periodo === 'mensal') {
        for (let mes = 1; mes <= 12; mes++) {
          const mesStr = mes.toString().padStart(2, '0');
          const vendasMes = data.filter(v => v.data_os.startsWith(`${ano}-${mesStr}`));
          const totalVendas = vendasMes.reduce((sum, v) => sum + (v.valor_total || 0), 0);
          const quantidadeOS = vendasMes.length;
          const ticketMedio = quantidadeOS > 0 ? totalVendas / quantidadeOS : 0;

          vendasPorPeriodo.push({
            periodo: new Date(ano, mes - 1).toLocaleDateString('pt-BR', { month: 'long' }),
            totalVendas,
            quantidadeOS,
            ticketMedio
          });
        }
      } else if (periodo === 'trimestral') {
        const trimestres = [
          { nome: 'Q1', meses: [1, 2, 3] },
          { nome: 'Q2', meses: [4, 5, 6] },
          { nome: 'Q3', meses: [7, 8, 9] },
          { nome: 'Q4', meses: [10, 11, 12] }
        ];

        trimestres.forEach(trimestre => {
          const vendasTrimestre = data.filter(v => {
            const mes = parseInt(v.data_os.split('-')[1]);
            return trimestre.meses.includes(mes);
          });
          
          const totalVendas = vendasTrimestre.reduce((sum, v) => sum + (v.valor_total || 0), 0);
          const quantidadeOS = vendasTrimestre.length;
          const ticketMedio = quantidadeOS > 0 ? totalVendas / quantidadeOS : 0;

          vendasPorPeriodo.push({
            periodo: trimestre.nome,
            totalVendas,
            quantidadeOS,
            ticketMedio
          });
        });
      }

      return vendasPorPeriodo;
    },
  });

  const anos = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="flex flex-col h-full gap-6">
      <PageHeader
        title="Relatório de Vendas por Período"
        subtitle="Análise de vendas mensais e trimestrais"
        icon={TrendingUp}
      />

      <Card className="card-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Calendar className="h-5 w-5" />
            Filtros do Relatório
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="w-full sm:w-48 space-y-2">
            <Label htmlFor="periodo">Período</Label>
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mensal">Mensal</SelectItem>
                <SelectItem value="trimestral">Trimestral</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full sm:w-48 space-y-2">
            <Label htmlFor="ano">Ano</Label>
            <Select value={ano.toString()} onValueChange={(value) => setAno(Number(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o ano" />
              </SelectTrigger>
              <SelectContent>
                {anos.map((year) => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button onClick={() => refetch()} disabled={isLoading} className="btn-gradient-cyber">
            {isLoading ? 'Gerando...' : 'Gerar Relatório'}
          </Button>
        </CardContent>
      </Card>

      {vendas && (
        <Card className="card-glass flex-grow">
          <CardHeader>
            <CardTitle className="text-foreground">
              Vendas por {periodo === 'mensal' ? 'Mês' : 'Trimestre'} - {ano}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Período</TableHead>
                    <TableHead>Quantidade de OS</TableHead>
                    <TableHead>Total de Vendas</TableHead>
                    <TableHead>Ticket Médio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendas && vendas.map((venda, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium capitalize">{venda.periodo}</TableCell>
                      <TableCell>{venda.quantidadeOS}</TableCell>
                      <TableCell>
                        {venda.totalVendas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </TableCell>
                      <TableCell>
                        {venda.ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
