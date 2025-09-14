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
import { OrdemServicoDB, Cliente, StatusOs } from "@/types";
import { Combobox } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { PageHeader } from "@/components/ui/PageHeader";

type OrdemComJoins = {
  id: string;
  os_number: number;
  data_os: string;
  cliente_id: string;
  nome_cliente: string;
  equipamento: string;
  valor_total: number;
  clientes: { nome: string } | null;
  status_sistema: { status: string } | null;
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
    supabase.from('status_sistema').select('id, status').order('status')
  ]);
  if (clientesRes.error) throw new Error(clientesRes.error.message);
  if (statusRes.error) throw new Error(statusRes.error.message);
  return {
    clientes: (clientesRes.data || []) as Cliente[],
    statusOptions: statusRes.data || []
  };
};

const fetchRelatorio = async (filtros: typeof initialFiltersState): Promise<OrdemComJoins[]> => {
  let query = supabase.from('ordens_servico').select('*, clientes(nome), status_sistema(status)');

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
          <TabsTrigger value="pagamentos">Formas de Pagamento</TabsTrigger>
          <TabsTrigger value="produtos">Produtos Mais Vendidos</TabsTrigger>
          <TabsTrigger value="servicos">Serviços Mais Realizados</TabsTrigger>
          <TabsTrigger value="financeiro">Relatório Financeiro</TabsTrigger>
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
                <CardTitle className="text-foreground">Resultados ({resultados?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="overflow-x-auto h-full">
                  <Table>
                    <TableHeader><TableRow><TableHead>OS</TableHead><TableHead>Data</TableHead><TableHead>Cliente</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {resultados && resultados.length > 0 ? (
                        resultados.map(os => (
                          <TableRow key={os.id}>
                            <TableCell className="font-medium">#{os.os_number}</TableCell>
                            <TableCell>{new Date(os.data_os).toLocaleDateString("pt-BR", {timeZone: 'UTC'})}</TableCell>
                            <TableCell>{os.clientes?.nome || 'N/A'}</TableCell>
                            <TableCell>{(os.valor_total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                            <TableCell>{os.status_sistema?.status || 'N/A'}</TableCell>
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

        <TabsContent value="pagamentos" className="mt-4 flex flex-col flex-grow">
          <Card className="card-glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Filter className="h-5 w-5" />
                Relatório de Formas de Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RelatorioPagamentos />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="produtos" className="mt-4 flex flex-col flex-grow">
          <Card className="card-glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Filter className="h-5 w-5" />
                Relatório de Produtos Mais Vendidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RelatorioProdutos />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="servicos" className="mt-4 flex flex-col flex-grow">
          <Card className="card-glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Filter className="h-5 w-5" />
                Relatório de Serviços Mais Realizados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RelatorioServicos />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financeiro" className="mt-4 flex flex-col flex-grow">
          <Card className="card-glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Filter className="h-5 w-5" />
                Relatório Financeiro Completo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RelatorioFinanceiro />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Componente de Relatório de Pagamentos
function RelatorioPagamentos() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPagamentos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ordens_servico')
        .select('forma_pagamento, valor_pago')
        .not('forma_pagamento', 'is', null)
        .not('valor_pago', 'is', null);

      if (error) throw error;

      // Agrupar por forma de pagamento
      const grouped = data.reduce((acc: any, item) => {
        const forma = item.forma_pagamento || 'Não informado';
        if (!acc[forma]) {
          acc[forma] = { forma, total: 0, quantidade: 0 };
        }
        acc[forma].total += item.valor_pago || 0;
        acc[forma].quantidade += 1;
        return acc;
      }, {});

      setData(Object.values(grouped));
    } catch (error) {
      console.error('Erro ao buscar pagamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPagamentos();
  }, []);

  return (
    <div className="space-y-4">
      <Button onClick={fetchPagamentos} disabled={loading} className="btn-gradient-cyber">
        {loading ? 'Carregando...' : 'Atualizar Dados'}
      </Button>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Forma de Pagamento</TableHead>
              <TableHead>Quantidade</TableHead>
              <TableHead>Valor Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{item.forma}</TableCell>
                <TableCell>{item.quantidade}</TableCell>
                <TableCell>
                  {item.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Componente de Relatório de Produtos
function RelatorioProdutos() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProdutos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('produto, valor')
        .order('valor', { ascending: false });

      if (error) throw error;
      setData(data || []);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProdutos();
  }, []);

  return (
    <div className="space-y-4">
      <Button onClick={fetchProdutos} disabled={loading} className="btn-gradient-cyber">
        {loading ? 'Carregando...' : 'Atualizar Dados'}
      </Button>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead>Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((produto) => (
              <TableRow key={produto.id}>
                <TableCell className="font-medium">{produto.produto}</TableCell>
                <TableCell>
                  {produto.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Componente de Relatório de Serviços
function RelatorioServicos() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchServicos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('servicos')
        .select('servico, valor')
        .order('valor', { ascending: false });

      if (error) throw error;
      setData(data || []);
    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServicos();
  }, []);

  return (
    <div className="space-y-4">
      <Button onClick={fetchServicos} disabled={loading} className="btn-gradient-cyber">
        {loading ? 'Carregando...' : 'Atualizar Dados'}
      </Button>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Serviço</TableHead>
              <TableHead>Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((servico) => (
              <TableRow key={servico.id}>
                <TableCell className="font-medium">{servico.servico}</TableCell>
                <TableCell>
                  {servico.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Componente de Relatório Financeiro
function RelatorioFinanceiro() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchFinanceiro = async () => {
    setLoading(true);
    try {
      const { data: ordens, error } = await supabase
        .from('ordens_servico')
        .select('valor_total, valor_pago, valor_restante');

      if (error) throw error;

      const resumo = ordens.reduce((acc, ordem) => {
        acc.totalFaturado += ordem.valor_total || 0;
        acc.totalPago += ordem.valor_pago || 0;
        acc.totalRestante += ordem.valor_restante || 0;
        return acc;
      }, { totalFaturado: 0, totalPago: 0, totalRestante: 0 });

      setData(resumo);
    } catch (error) {
      console.error('Erro ao buscar dados financeiros:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceiro();
  }, []);

  return (
    <div className="space-y-4">
      <Button onClick={fetchFinanceiro} disabled={loading} className="btn-gradient-cyber">
        {loading ? 'Carregando...' : 'Atualizar Dados'}
      </Button>
      
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="card-glass">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Total Faturado</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {data.totalFaturado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </CardContent>
          </Card>
          
          <Card className="card-glass">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Total Pago</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">
                {data.totalPago.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </CardContent>
          </Card>
          
          <Card className="card-glass">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Total Restante</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600">
                {data.totalRestante.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}