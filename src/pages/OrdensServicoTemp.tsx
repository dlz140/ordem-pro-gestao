import { useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ClipboardList, Plus, Search, Edit, Trash2, DollarSign } from "lucide-react";
import { 
  StandardButton, 
  StandardInput, 
  StandardCard, 
  PageContainer, 
  FiltersContainer, 
  FormGrid, 
  StandardLoading, 
  StandardEmptyState, 
  StatusBadge 
} from "@/components/ui/StandardComponents";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/ui/PageHeader";
import { useDebounce } from "@/hooks/useDebounce";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { CardContent } from "@/components/ui/card";

type OrdemSimplificada = {
  id: string;
  data_os: string;
  nome_cliente: string;
  telefone: string;
  equipamento: string;
  marca: string | null;
  modelo: string | null;
  defeito: string | null;
  valor_total: number;
  valor_pago: number;
  valor_restante: number;
  status_os: string;
  forma_pagamento: string | null;
  observacoes: string | null;
  data_entrega: string | null;
  servico: string | null;
  produtos: string | null;
  created_at: string;
  updated_at: string;
};

const fetchOrdens = async (): Promise<OrdemSimplificada[]> => {
  const { data, error } = await supabase
    .from('ordens_servico')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as OrdemSimplificada[];
};

const fetchStatus = async (): Promise<{ id: string; status: string }[]> => {
  const { data, error } = await supabase.from('status_sistema').select('id, status');
  if (error) throw new Error(error.message);
  return data || [];
};

const deleteOrdem = async (id: string): Promise<void> => {
  const { error } = await supabase.from('ordens_servico').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

// Componente de filtros simplificado
function FiltrosSimplificados({ 
  busca, setBusca, filtroStatus, setFiltroStatus, statusOptions 
}: {
  busca: string;
  setBusca: (value: string) => void;
  filtroStatus: string;
  setFiltroStatus: (value: string) => void;
  statusOptions: { id: string; status: string }[];
}) {
  return (
    <FiltersContainer>
      <FormGrid cols={2}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <StandardInput 
            placeholder="Buscar por cliente, equipamento..." 
            value={busca} 
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="input-standard">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Status</SelectItem>
            {statusOptions.map((status) => (
              <SelectItem key={status.id} value={status.status}>
                {status.status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormGrid>
    </FiltersContainer>
  );
}

// Componente de tabela simplificado
function TabelaSimplificada({ 
  ordens, onView, onDelete, onDarBaixa 
}: {
  ordens: OrdemSimplificada[];
  onView: (ordem: OrdemSimplificada) => void;
  onDelete: (ordem: OrdemSimplificada) => void;
  onDarBaixa: (ordem: OrdemSimplificada) => void;
}) {
  return (
    <Table className="table-standard">
      <TableHeader>
        <TableRow className="table-header-standard">
          <TableHead className="w-24 text-center">ID</TableHead>
          <TableHead className="text-left">Cliente</TableHead>
          <TableHead className="w-32 text-center">Equipamento</TableHead>
          <TableHead className="w-28 text-center">Data</TableHead>
          <TableHead className="w-32 text-center">Status</TableHead>
          <TableHead className="w-32 text-right">Valor Total</TableHead>
          <TableHead className="w-32 text-right">Valor Pago</TableHead>
          <TableHead className="w-32 text-right">Saldo</TableHead>
          <TableHead className="w-28 text-center">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ordens.map((ordem) => {
          const saldo = ordem.valor_restante || 0;
          return (
            <TableRow key={ordem.id} className="table-row-standard">
              <TableCell className="table-cell-standard font-semibold text-center text-xs">
                #{ordem.id.slice(-6)}
              </TableCell>
              <TableCell className="table-cell-standard truncate" title={ordem.nome_cliente}>
                {ordem.nome_cliente}
              </TableCell>
              <TableCell className="table-cell-standard text-center">{ordem.equipamento}</TableCell>
              <TableCell className="table-cell-standard text-center">
                {new Date(ordem.data_os).toLocaleDateString("pt-BR", { timeZone: 'UTC' })}
              </TableCell>
              <TableCell className="table-cell-standard text-center">
                <StatusBadge status={ordem.status_os || 'Sem Status'} variant="default" />
              </TableCell>
              <TableCell className="table-cell-standard font-medium text-blue-400 text-right">
                {(ordem.valor_total || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </TableCell>
              <TableCell className="table-cell-standard font-medium text-green-500 text-right">
                {(ordem.valor_pago || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </TableCell>
              <TableCell className={`table-cell-standard font-bold text-right ${saldo > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {saldo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </TableCell>
              <TableCell className="table-cell-standard text-center">
                <div className="flex gap-2 justify-center items-center">
                  {saldo > 0 && (
                    <StandardButton 
                      variant="outline" 
                      size="icon" 
                      onClick={() => onDarBaixa(ordem)} 
                      className="h-8 w-8 bg-green-500/10 border-green-500/20 text-green-500 hover:bg-green-500/20"
                    >
                      <DollarSign className="h-4 w-4" />
                    </StandardButton>
                  )}
                  <StandardButton 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-primary" 
                    onClick={() => onView(ordem)}
                  >
                    <Edit className="h-4 w-4" />
                  </StandardButton>
                  <StandardButton 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-destructive" 
                    onClick={() => onDelete(ordem)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </StandardButton>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export default function OrdensServicoTemp() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState(location.state?.filtroBusca || "");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [ordemParaExcluir, setOrdemParaExcluir] = useState<OrdemSimplificada | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const { data: ordens = [], isLoading: isLoadingOrdens } = useQuery({
    queryKey: ['ordensServico'],
    queryFn: fetchOrdens,
  });

  const { data: statusOptions = [], isLoading: isLoadingStatus } = useQuery({
    queryKey: ['statusOs'],
    queryFn: fetchStatus,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteOrdem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordensServico'] });
      toast({ title: "Sucesso!", description: "Ordem de Serviço excluída com sucesso." });
      setIsConfirmOpen(false);
    },
    onError: (error) => {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    },
  });

  const ordensFiltradas = useMemo(() => {
    return ordens.filter(ordem => {
      const buscaLower = debouncedSearchTerm.toLowerCase().trim();
      
      const matchBusca = buscaLower === "" ||
        (ordem.nome_cliente || '').toLowerCase().includes(buscaLower) ||
        (ordem.equipamento || '').toLowerCase().includes(buscaLower) ||
        (ordem.id || '').toString().includes(buscaLower);
      
      const matchStatus = filtroStatus === "todos" || ordem.status_os === filtroStatus;
      
      return matchBusca && matchStatus;
    });
  }, [ordens, debouncedSearchTerm, filtroStatus]);

  const handleNovaOrdem = () => {
    toast({ 
      title: "Funcionalidade em Desenvolvimento", 
      description: "A criação de novas ordens será implementada em breve." 
    });
  };

  const handleVerOuEditar = (ordem: OrdemSimplificada) => {
    toast({ 
      title: "Funcionalidade em Desenvolvimento", 
      description: "A edição de ordens será implementada em breve." 
    });
  };

  const handleDarBaixa = (ordem: OrdemSimplificada) => {
    toast({ 
      title: "Funcionalidade em Desenvolvimento", 
      description: "O sistema de baixas será implementado em breve." 
    });
  };

  const handleAbrirConfirmacaoExclusao = (ordem: OrdemSimplificada) => {
    setOrdemParaExcluir(ordem);
    setIsConfirmOpen(true);
  };

  const executarExclusao = () => {
    if (!ordemParaExcluir) return;
    deleteMutation.mutate(ordemParaExcluir.id);
  };

  const isLoading = isLoadingOrdens || isLoadingStatus;

  return (
    <PageContainer>
      <PageHeader
        title="Ordens de Serviço"
        subtitle="Gerencie todas as ordens de serviço"
        icon={ClipboardList}
      >
        <StandardButton
          onClick={handleNovaOrdem}
          variant="gradient"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova OS
        </StandardButton>
      </PageHeader>

      <FiltrosSimplificados
        busca={searchTerm}
        setBusca={setSearchTerm}
        filtroStatus={filtroStatus}
        setFiltroStatus={setFiltroStatus}
        statusOptions={statusOptions}
      />

      {!isLoading && ordens.length > 0 && (
        <FormGrid cols={3}>
          <StandardCard>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary">{ordens.length}</div>
              <div className="text-sm text-muted-foreground">Total de Ordens</div>
            </CardContent>
          </StandardCard>
          <StandardCard>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-500">
                {ordens.filter(o => o.valor_restante === 0).length}
              </div>
              <div className="text-sm text-muted-foreground">Ordens Quitadas</div>
            </CardContent>
          </StandardCard>
          <StandardCard>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-500">
                {ordens.filter(o => o.valor_restante > 0).length}
              </div>
              <div className="text-sm text-muted-foreground">Com Pendências</div>
            </CardContent>
          </StandardCard>
        </FormGrid>
      )}

      <StandardCard className="flex-grow flex flex-col">
        <CardContent className="p-0 flex-grow">
          {isLoading ? (
            <StandardLoading message="Carregando ordens..." />
          ) : ordensFiltradas.length > 0 ? (
            <div className="overflow-auto">
              <TabelaSimplificada
                ordens={ordensFiltradas}
                onView={handleVerOuEditar}
                onDelete={handleAbrirConfirmacaoExclusao}
                onDarBaixa={handleDarBaixa}
              />
            </div>
          ) : (
            <StandardEmptyState
              icon={ClipboardList}
              title="Nenhuma Ordem Encontrada"
              description={
                searchTerm || filtroStatus !== "todos" 
                  ? "Nenhuma ordem encontrada para os filtros aplicados." 
                  : "Clique em 'Nova OS' para começar."
              }
              action={
                !searchTerm && filtroStatus === "todos" && (
                  <StandardButton onClick={handleNovaOrdem} variant="gradient">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova OS
                  </StandardButton>
                )
              }
            />
          )}
        </CardContent>
      </StandardCard>

      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={executarExclusao}
        title={`Excluir ordem de ${ordemParaExcluir?.nome_cliente}?`}
        description="Esta ação não pode ser desfeita. A Ordem de Serviço será permanentemente removida do sistema."
        confirmText="Sim, excluir"
      />
    </PageContainer>
  );
}