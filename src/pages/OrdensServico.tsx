import { useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList, Plus } from "lucide-react";
import { OrdemServicoSummaryCards } from "@/components/ordem-servico/OrdemServicoSummaryCards";
import { OrdemServicoFilters } from "@/components/ordem-servico/OrdemServicoFilters";
import { OrdemServicoTable } from "@/components/ordem-servico/OrdemServicoTable";
import { OrdemServicoDialog } from "@/components/ordem-servico/OrdemServicoDialog";
import { DarBaixaDialog } from "@/components/ordem-servico/DarBaixaDialog";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { OrdemServicoDB, StatusOs } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";

// O tipo de Ordem recebido agora reflete a estrutura com o status aninhado
type OrdemComJoins = Omit<OrdemServicoDB, 'status_os' | 'clientes' | 'equipamentos'> & {
  clientes: { nome: string } | null;
  status_os: StatusOs | null; // Alterado para receber o objeto completo, incluindo a cor
  equipamentos: { tipo: string } | null;
};

const fetchOrdens = async (): Promise<OrdemComJoins[]> => {
  const { data, error } = await supabase
    .from('ordens_servico')
    .select(`*, clientes ( nome ), status_os ( id, status, cor ), equipamentos ( tipo )`) // Consulta atualizada para buscar a cor
    .order('os_number', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as OrdemComJoins[];
};

const fetchStatusOptions = async (): Promise<StatusOs[]> => {
  const { data, error } = await supabase.from('status_os').select('id, status');
  if (error) throw new Error(error.message);
  return data || [];
};

const deleteOrdem = async (id: string): Promise<void> => {
  const { error } = await supabase.from('ordens_servico').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

export default function OrdensServico() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const location = useLocation();

  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [busca, setBusca] = useState(location.state?.filtroBusca || "");
  
  const [isOsDialogOpen, setIsOsDialogOpen] = useState(false);
  const [ordemSelecionada, setOrdemSelecionada] = useState<OrdemComJoins | null>(null);
  
  const [isDarBaixaDialogOpen, setIsDarBaixaDialogOpen] = useState(false);
  const [ordemParaBaixa, setOrdemParaBaixa] = useState<OrdemComJoins | null>(null);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [ordemParaExcluir, setOrdemParaExcluir] = useState<OrdemComJoins | null>(null);

  const { data: ordens, isLoading: isLoadingOrdens } = useQuery<OrdemComJoins[]>({
    queryKey: ['ordensServico'],
    queryFn: fetchOrdens,
  });

  const { data: statusOptions, isLoading: isLoadingStatus } = useQuery<StatusOs[]>({
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
    const listaOrdens = ordens || [];
    return listaOrdens.filter(ordem => {
      const buscaLower = busca.toLowerCase().trim();
      
      const matchBusca = buscaLower === "" ||
        (ordem.clientes?.nome || '').toLowerCase().includes(buscaLower) ||
        (ordem.equipamentos?.tipo || '').toLowerCase().includes(buscaLower) ||
        (ordem.os_number || '').toString().includes(buscaLower);
      
      const matchStatus = filtroStatus === "todos" || ordem.status_os?.status === filtroStatus;
      
      return matchBusca && matchStatus;
    });
  }, [ordens, busca, filtroStatus]);

  const isLoading = isLoadingOrdens || isLoadingStatus;
  
  // A lógica de layout da página principal também foi aplicada aqui
  return (
    <div className="flex flex-col h-full gap-6">
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

      <OrdemServicoFilters
        busca={busca}
        setBusca={setBusca}
        filtroStatus={filtroStatus}
        setFiltroStatus={setFiltroStatus}
        statusOptions={statusOptions || []}
      />
      
      {isLoading ? (
        <div className="p-8 text-center">Carregando ordens de serviço...</div>
      ) : (
        <>
          {(ordens || []).length > 0 ? (
            <div className="flex flex-col flex-grow gap-6">
              <OrdemServicoSummaryCards ordens={ordens} />
              <Card className="card-glass flex-grow flex flex-col">
                <CardContent className="p-0 flex-grow">
                  <div className="overflow-y-auto h-full">
                    {ordensFiltradas.length > 0 ? (
                      <OrdemServicoTable
                        ordens={ordensFiltradas}
                        onView={handleVerOuEditar}
                        onDelete={handleAbrirConfirmacaoExclusao}
                        onDarBaixa={handleDarBaixa}
                      />
                    ) : (
                        <div className="p-8 text-center text-muted-foreground">
                          Nenhum resultado encontrado para os filtros aplicados.
                        </div>
                      )}
                  </div>
                </CardContent>
              </Card>
            </div>
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
        title={`Excluir OS Nº ${ordemParaExcluir?.os_number}?`}
        description="Esta ação não pode ser desfeita. A Ordem de Serviço será permanentemente removida do sistema."
        confirmText="Sim, excluir OS"
      />
    </div>
  );
}