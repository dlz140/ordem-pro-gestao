import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Filter, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
<<<<<<< HEAD
import { OrdemServico } from "@/pages/OrdensServico"; // Reutilizamos a interface que já corrigimos
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
=======
import { OrdemServicoDB, Cliente, StatusOs } from "@/types";
import { Combobox } from "@/components/ui/Combobox";
import { DatePicker } from "@/components/ui/DatePicker";
import { PageHeader } from "@/components/ui/PageHeader";

type OrdemComJoins = Omit<OrdemServicoDB, 'status_os' | 'clientes'> & {
  clientes: { nome: string } | null;
  status_os: { status: string } | null;
};

const initialFiltersState = {
  clienteId: "",
  statusId: "",
  dataInicio: undefined as Date | undefined,
  dataFim: undefined as Date | undefined,
  apenasPendentes: false,
};

const fetchFilterData = async (): Promise<{ clientes: Cliente[], statusOptions: StatusOs[] }> => {
  const [clientesRes, statusRes] = await Promise.all([
    supabase.from('clientes').select('id, nome').eq('ativo', true).order('nome'),
    supabase.from('status_os').select('id, status').order('status')
  ]);
  if (clientesRes.error) throw new Error(clientesRes.error.message);
  if (statusRes.error) throw new Error(statusRes.error.message);
  return {
    clientes: clientesRes.data || [],
    statusOptions: statusRes.data || []
  };
};

const fetchRelatorio = async (filtros: typeof initialFiltersState): Promise<OrdemComJoins[]> => {
  let query = supabase.from('ordens_servico').select('*, clientes(nome), status_os(status)');

  if (filtros.clienteId) query = query.eq('cliente_id', filtros.clienteId);
  if (filtros.statusId) query = query.eq('status_id', filtros.statusId);
  if (filtros.dataInicio) query = query.gte('data_os', filtros.dataInicio.toISOString());
  if (filtros.dataFim) {
    const dataFim = new Date(filtros.dataFim);
    dataFim.setHours(23, 59, 59, 999);
    query = query.lte('data_os', dataFim.toISOString());
  }
  if (filtros.apenasPendentes) query = query.gt('valor_restante', 0);
  
  const { data, error } = await query.order('data_os', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as OrdemComJoins[];
};
>>>>>>> 544b8c8 (mensagem do commit)

export default function Relatorios() {
  const { toast } = useToast();
  const [filtros, setFiltros] = useState(initialFiltersState);
  const [canFetchReport, setCanFetchReport] = useState(false);

  const { data: filterData, isLoading: isLoadingFilters } = useQuery({
    queryKey: ['reportFilters'],
    queryFn: fetchFilterData,
  });

  const { data: resultados, isLoading: isLoadingReport, refetch } = useQuery({
    queryKey: ['relatorioGeral', filtros],
    queryFn: () => fetchRelatorio(filtros),
    enabled: canFetchReport,
    onSuccess: (data) => {
      toast({ title: "Sucesso!", description: `${data.length} registros encontrados.` });
      setCanFetchReport(false);
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      setCanFetchReport(false);
    }
  });
  
  const handleGerarRelatorio = () => {
    setCanFetchReport(true);
  };

  useEffect(() => {
    if (canFetchReport) {
      refetch();
    }
  }, [canFetchReport, refetch]);

  const handleLimparFiltros = () => {
    setFiltros(initialFiltersState);
  };
  
  const isLoading = isLoadingFilters || isLoadingReport;

  return (
    <div className="flex flex-col h-full gap-6">
      <PageHeader
        title="Relatórios"
        subtitle="Filtre e analise os dados do sistema"
        icon={BarChart3}
      />

      <Tabs defaultValue="geral_os" className="flex flex-col flex-grow">
        <TabsList>
          <TabsTrigger value="geral_os">Relatório Geral de OS</TabsTrigger>
          <TabsTrigger value="pagamentos" disabled>Formas de Pagamento</TabsTrigger>
          <TabsTrigger value="produtos" disabled>Produtos Mais Vendidos</TabsTrigger>
          <TabsTrigger value="servicos" disabled>Serviços Mais Realizados</TabsTrigger>
        </TabsList>

        <TabsContent value="geral_os" className="mt-4 flex flex-col flex-grow">
          <Card className="card-glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Filter className="h-5 w-5" />
                Filtros do Relatório
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <Label>Cliente</Label>
                  <Combobox
                    options={(filterData?.clientes || []).map(c => ({ value: c.id, label: c.nome }))}
                    value={filtros.clienteId}
                    onSelect={(value) => setFiltros(prev => ({ ...prev, clienteId: value }))}
                    placeholder="Todos os clientes..."
                    searchPlaceholder="Buscar cliente..."
                    emptyPlaceholder="Nenhum cliente."
                  />
                </div>
                <div>
                  <Label>Status OS</Label>
                  <Combobox
                    options={(filterData?.statusOptions || []).map(s => ({ value: s.id, label: s.status }))}
                    value={filtros.statusId}
                    onSelect={(value) => setFiltros(prev => ({ ...prev, statusId: value }))}
                    placeholder="Todos os status..."
                    searchPlaceholder="Buscar status..."
                    emptyPlaceholder="Nenhum status."
                  />
                </div>
                <div></div>
                <div>
                  <Label htmlFor="data-inicio">Data Início</Label>
                  <DatePicker date={filtros.dataInicio} onSelect={(date) => setFiltros(prev => ({...prev, dataInicio: date}))} />
                </div>
                <div>
                  <Label htmlFor="data-fim">Data Fim</Label>
                  <DatePicker date={filtros.dataFim} onSelect={(date) => setFiltros(prev => ({...prev, dataFim: date}))} />
                </div>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox id="apenas-pendentes" checked={filtros.apenasPendentes} onCheckedChange={checked => setFiltros(prev => ({...prev, apenasPendentes: !!checked}))} />
                <Label htmlFor="apenas-pendentes">Mostrar apenas com valor restante</Label>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleGerarRelatorio} disabled={isLoading} className="btn-gradient-cyber">
                  {isLoadingReport ? 'Gerando...' : 'Gerar Relatório'}
                </Button>
                <Button onClick={handleLimparFiltros} variant="outline">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Limpar Filtros
                </Button>
              </div>
            </CardContent>
          </Card>

          {resultados && (
            <Card className="card-glass mt-6 flex-grow flex flex-col">
              <CardHeader>
                <CardTitle className="text-foreground">Resultados ({resultados.length})</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="overflow-x-auto h-full">
                  <Table>
                    <TableHeader><TableRow><TableHead>OS</TableHead><TableHead>Data</TableHead><TableHead>Cliente</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {resultados.length > 0 ? (
                        resultados.map(os => (
                          <TableRow key={os.id}>
                            <TableCell className="font-medium">#{os.os_number}</TableCell>
                            <TableCell>{new Date(os.data_os).toLocaleDateString("pt-BR", {timeZone: 'UTC'})}</TableCell>
                            <TableCell>{os.clientes?.nome || 'N/A'}</TableCell>
                            <TableCell>{(os.valor_total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                            <TableCell>{os.status_os?.status || 'N/A'}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                         <TableRow><TableCell colSpan={5} className="p-8 text-center text-muted-foreground">Nenhum registro encontrado para os filtros aplicados.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}