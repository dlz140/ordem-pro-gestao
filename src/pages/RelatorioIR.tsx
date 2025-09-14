import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/ui/PageHeader";

interface RelatorioIRData {
  totalAnual: number;
  detalhamentoMensal: { mes: string; total: number }[];
}

// A função que chama o Supabase agora é isolada e mais limpa
const gerarRelatorioIR = async (ano: number): Promise<RelatorioIRData> => {
  const { data, error } = await supabase.rpc('get_relatorio_ir', { ano_selecionado: ano });
  if (error) {
    throw new Error("Não foi possível gerar o relatório. Verifique o console para mais detalhes.");
  }
  return data;
};

export default function RelatorioIR() {
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
  
  const [anoSelecionado, setAnoSelecionado] = useState<number>(currentYear);

  // useMutation para gerenciar o estado da chamada da API
  const { mutate, data: relatorio, isPending: loading, reset } = useMutation({
    mutationFn: gerarRelatorioIR,
    onSuccess: () => {
      toast({ title: "Sucesso!", description: `Relatório para ${anoSelecionado} gerado com sucesso.` });
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const handleGerarRelatorio = () => {
    reset(); // Limpa dados de relatórios anteriores
    mutate(anoSelecionado);
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