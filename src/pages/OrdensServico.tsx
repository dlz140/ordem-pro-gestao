import { useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { OrdemServicoSummaryCards } from "@/components/ordem-servico/OrdemServicoSummaryCards";
import { OrdemServicoFilters } from "@/components/ordem-servico/OrdemServicoFilters";
import { OrdemServicoTable } from "@/components/ordem-servico/OrdemServicoTable";
import { OrdemServicoDialog } from "@/components/ordem-servico/OrdemServicoDialog";
import { DarBaixaDialog } from "@/components/ordem-servico/DarBaixaDialog";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { OrdemServicoDB, StatusOsInterface } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { useDebounce } from "@/hooks/useDebounce";

const ITEMS_PER_PAGE = 15;

type OrdemComJoins = {
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

const fetchOrdens = async (page: number): Promise<{ data: OrdemComJoins[], count: number }> => {
  const from = (page - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  const { data, error, count } = await supabase
    .from('ordens_servico')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);
  return { data: (data || []) as OrdemComJoins[], count: count || 0 };
};

const fetchStatusOptions = async (): Promise<StatusOsInterface[]> => {
  const { data, error } = await supabase.from('status_sistema').select('id, status');
  if (error) throw new Error(error.message);
  return data || [];
};

const deleteOrdem = async (id: string): Promise<void> => {
  const { error } = await supabase.from('ordens_servico').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function PaginationControls({ currentPage, totalPages, onPageChange }: PaginationControlsProps) {
  return (
    <div className="flex items-center justify-end space-x-4 p-4">
      <span className="text-sm text-muted-foreground">
        Página {currentPage} de {totalPages}
      </span>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Próxima
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function OrdensServico() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const location = useLocation();

  const [page, setPage] = useState(1);
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [searchTerm, setSearchTerm] = useState(location.state?.filtroBusca || "");
  
  const [isOsDialogOpen, setIsOsDialogOpen] = useState(false);
  const [ordemSelecionada, setOrdemSelecionada] = useState<OrdemComJoins | null>(null);
  
  const [isDarBaixaDialogOpen, setIsDarBaixaDialogOpen] = useState(false);
  const [ordemParaBaixa, setOrdemParaBaixa] = useState<OrdemComJoins | null>(null);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [ordemParaExcluir, setOrdemParaExcluir] = useState<OrdemComJoins | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const { data, isLoading: isLoadingOrdens } = useQuery({
    queryKey: ['ordensServico', page],
    queryFn: () => fetchOrdens(page),
    placeholderData: keepPreviousData,
  });
  
  const ordens = data?.data || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const { data: statusOptions, isLoading: isLoadingStatus } = useQuery<StatusOsInterface[]>({
    queryKey: ['statusOs'],
    queryFn: fetchStatusOptions,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteOrdem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordensServico'] });
      toast({ title: "Sucesso!", description: `Ordem de Serviço excluída com sucesso.` });
    },
    onError: (error) => {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    },
  });
  
  const handleNovaOrdem = () => {
    setOrdemSelecionada(null); 
    setIsOsDialogOpen(true);
  };

  const handleVerOuEditar = (ordem: OrdemComJoins) => {
    setOrdemSelecionada(ordem); 
    setIsOsDialogOpen(true);
  };
  
  const handleAbrirConfirmacaoExclusao = (ordem: OrdemComJoins) => {
    setOrdemParaExcluir(ordem);
    setIsConfirmOpen(true);
  };

  const executarExclusao = () => {
    if (!ordemParaExcluir) return;
    deleteMutation.mutate(ordemParaExcluir.id);
  };

  const handleDarBaixa = (ordem: OrdemComJoins) => {
    setOrdemParaBaixa(ordem);
    setIsDarBaixaDialogOpen(true);
  };

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
  
  const isLoading = isLoadingOrdens || isLoadingStatus;
  
  return (
    <div className="flex flex-col gap-6">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-6">
        <PageHeader
          title="Ordens de Serviço"
          subtitle="Gerencie todas as ordens de serviço"
          icon={ClipboardList}
        >
          <Button
              onClick={handleNovaOrdem}
              className="text-base border-primary/30 text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-purple-900/50 hover:to-slate-900/50 hover:border-purple-800/50 transform hover:-translate-y-1 transition-all duration-300 group"
              variant="outline"
          >
              <Plus className="h-6 w-6 mr-3 transition-transform group-hover:rotate-90" />
              Nova OS
          </Button>
        </PageHeader>
        
        <div className="mt-6">
          <OrdemServicoFilters
            busca={searchTerm}
            setBusca={setSearchTerm}
            filtroStatus={filtroStatus}
            setFiltroStatus={setFiltroStatus}
            statusOptions={statusOptions || []}
          />
        </div>
        
        {!isLoading && ordens.length > 0 && (
          <div className="mt-6">
            <OrdemServicoSummaryCards ordens={ordens} />
          </div>
        )}
      </div>
      
      {isLoading ? (
        <div className="p-8 text-center">Carregando ordens de serviço...</div>
      ) : (
        <>
          {totalCount > 0 ? (
            <Card className="card-glass flex-grow flex flex-col">
              <CardContent className="p-0 flex-grow">
                {ordensFiltradas.length > 0 ? (
                  <OrdemServicoTable
                    ordens={ordensFiltradas}
                    onView={handleVerOuEditar}
                    onDelete={handleAbrirConfirmacaoExclusao}
                    onDarBaixa={handleDarBaixa}
                  />
                ) : (
                    <div className="p-6 text-center text-muted-foreground h-full flex items-center justify-center">
                      Nenhum resultado encontrado para os filtros aplicados nesta página.
                    </div>
                  )}
              </CardContent>
              {totalPages > 1 && (
                <PaginationControls
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              )}
            </Card>
          ) : (
            <Card className="card-glass flex-grow">
              <CardContent className="p-8 text-center text-muted-foreground flex items-center justify-center h-full">
                <div>Nenhuma ordem de serviço cadastrada. Clique em "Nova OS" para começar.</div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <OrdemServicoDialog
        isOpen={isOsDialogOpen}
        onClose={() => setIsOsDialogOpen(false)}
        onSaveSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['ordensServico'] });
            setIsOsDialogOpen(false);
        }}
        ordemParaEditar={ordemSelecionada}
      />

      <DarBaixaDialog
        isOpen={isDarBaixaDialogOpen}
        onClose={() => setIsDarBaixaDialogOpen(false)}
        onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['ordensServico'] });
            setIsDarBaixaDialogOpen(false);
        }}
        ordem={ordemParaBaixa}
      />

      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={executarExclusao}
        title={`Excluir OS: ${ordemParaExcluir?.nome_cliente}?`}
        description="Esta ação não pode ser desfeita. A Ordem de Serviço será permanentemente removida do sistema."
        confirmText="Sim, excluir OS"
      />
    </div>
  );
}