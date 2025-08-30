import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Filter, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
<<<<<<< HEAD
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
=======
import { PageHeader } from "@/components/ui/PageHeader";
>>>>>>> 544b8c8 (mensagem do commit)

interface RelatorioIRData {
  totalAnual: number;
  detalhamentoMensal: { mes: string; total: number }[];
}

export default function RelatorioIR() {
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
  
  const [anoSelecionado, setAnoSelecionado] = useState<number>(currentYear);
  const [loading, setLoading] = useState(false);
  const [relatorio, setRelatorio] = useState<RelatorioIRData | null>(null);

  const handleGerarRelatorio = async () => {
    setLoading(true);
    setRelatorio(null);
    try {
      const { data, error } = await supabase
        .from('ordens_servico')
        .select('data_os, valor_total, status_os!inner(status)')
        .gte('data_os', `${anoSelecionado}-01-01T00:00:00`)
        .lte('data_os', `${anoSelecionado}-12-31T23:59:59`);

      if (error) throw error;

      if (data) {
        const osFinalizadas = data.filter(os => 
            os.status_os?.status.toLowerCase().includes('finalizad') || 
            os.status_os?.status.toLowerCase().includes('concluíd')
        );

        const meses = Array.from({ length: 12 }, () => ({ total: 0 }));

        for (const os of osFinalizadas) {
          const mesIndex = new Date(os.data_os).getMonth();
          meses[mesIndex].total += (os.valor_total || 0);
        }

        const totalAnual = meses.reduce((acc, mes) => acc + mes.total, 0);

        setRelatorio({
          totalAnual,
          detalhamentoMensal: meses.map((dados, index) => ({
            mes: new Date(anoSelecionado, index).toLocaleString('pt-BR', { month: 'long' }),
            ...dados,
          })),
        });

        toast({ title: "Sucesso!", description: `Relatório para ${anoSelecionado} gerado com sucesso.` });
      }
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({ title: "Erro", description: "Não foi possível gerar o relatório.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <PageHeader
        title="Relatório para IR"
        subtitle="Faturamento bruto anual para declaração"
        icon={FileText}
      />

      <Card className="card-glass flex-shrink-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Filter className="h-5 w-5" />
            Filtros do Relatório
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="w-full sm:w-48 space-y-2">
            <Label htmlFor="ano">Ano</Label>
            <Select 
              value={anoSelecionado.toString()} 
              onValueChange={(value) => setAnoSelecionado(Number(value))}
            >
              <SelectTrigger><SelectValue placeholder="Selecione o ano" /></SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleGerarRelatorio} disabled={loading} className="btn-gradient-cyber">
            {loading ? 'Gerando...' : 'Gerar Relatório'}
          </Button>
        </CardContent>
      </Card>
      
      <div className="flex-grow overflow-y-auto space-y-6">
        {loading && <div className="p-8 text-center">Gerando relatório...</div>}

        {relatorio && (
          <div className="space-y-6">
            <Card className="card-glass text-center">
              <CardHeader>
                  <CardTitle className="text-muted-foreground font-medium">Faturamento Bruto Anual ({anoSelecionado})</CardTitle>
              </CardHeader>
              <CardContent>
                  <p className="text-5xl font-bold text-primary">
                      {relatorio.totalAnual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {relatorio.detalhamentoMensal.map((item) => (
                <Card key={item.mes} className="card-glass">
                  <CardHeader className="p-4">
                    <CardTitle className="text-sm font-medium text-center text-muted-foreground capitalize">{item.mes}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 text-center">
                    <p className="text-2xl font-semibold text-foreground">
                      {item.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}