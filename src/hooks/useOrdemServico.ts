import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordemServicoService, OrdemServico } from '@/services/ordemServicoService';
import { OrdemItem } from '@/types';
import { toast } from '@/hooks/use-toast';

// Chaves de cache para react-query
export const ORDEM_SERVICO_KEYS = {
  all: ['ordens-servico'] as const,
  lists: () => [...ORDEM_SERVICO_KEYS.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...ORDEM_SERVICO_KEYS.lists(), { filters }] as const,
  details: () => [...ORDEM_SERVICO_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...ORDEM_SERVICO_KEYS.details(), id] as const,
  stats: () => [...ORDEM_SERVICO_KEYS.all, 'stats'] as const,
  relatorioClientes: () => [...ORDEM_SERVICO_KEYS.all, 'relatorio-clientes'] as const,
};

/**
 * Hook para buscar todas as ordens de serviço
 */
export function useOrdensServico() {
  return useQuery({
    queryKey: ORDEM_SERVICO_KEYS.lists(),
    queryFn: () => ordemServicoService.buscarTodas(),
    staleTime: 5 * 60 * 1000, // 5 minutos
    meta: {
      errorMessage: 'Erro ao carregar ordens de serviço'
    }
  });
}

/**
 * Hook para buscar ordem de serviço por ID
 */
export function useOrdemServico(id: string) {
  return useQuery({
    queryKey: ORDEM_SERVICO_KEYS.detail(id),
    queryFn: () => ordemServicoService.buscarPorId(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutos
    meta: {
      errorMessage: 'Erro ao carregar ordem de serviço'
    }
  });
}

/**
 * Hook para buscar ordens por status
 */
export function useOrdensPorStatus(status: string) {
  return useQuery({
    queryKey: ORDEM_SERVICO_KEYS.list({ status }),
    queryFn: () => ordemServicoService.buscarPorStatus(status),
    enabled: !!status,
    staleTime: 3 * 60 * 1000, // 3 minutos
    meta: {
      errorMessage: 'Erro ao carregar ordens por status'
    }
  });
}

/**
 * Hook para buscar estatísticas do dashboard
 */
export function useEstatisticasOrdens() {
  return useQuery({
    queryKey: ORDEM_SERVICO_KEYS.stats(),
    queryFn: () => ordemServicoService.buscarEstatisticas(),
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchInterval: 5 * 60 * 1000, // Atualiza a cada 5 minutos
    meta: {
      errorMessage: 'Erro ao carregar estatísticas'
    }
  });
}

/**
 * Hook para buscar relatório de clientes
 */
export function useRelatorioClientes() {
  return useQuery({
    queryKey: ORDEM_SERVICO_KEYS.relatorioClientes(),
    queryFn: () => ordemServicoService.buscarRelatorioClientes(),
    staleTime: 10 * 60 * 1000, // 10 minutos
    meta: {
      errorMessage: 'Erro ao carregar relatório de clientes'
    }
  });
}

/**
 * Hook para criar/atualizar ordem de serviço com itens
 */
export function useSalvarOrdemComItens() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      dadosOrdem,
      itens
    }: {
      dadosOrdem: Parameters<typeof ordemServicoService.salvarComItens>[0];
      itens: OrdemItem[];
    }) => {
      return ordemServicoService.salvarComItens(dadosOrdem, itens);
    },
    onSuccess: (data) => {
      // Invalidar caches relacionados
      queryClient.invalidateQueries({ queryKey: ORDEM_SERVICO_KEYS.all });
      
      toast({
        title: 'Sucesso!',
        description: `Ordem de serviço salva com sucesso. Total: R$ ${data.valor_total.toFixed(2)}`,
      });
    },
    onError: (error: Error) => {
      console.error('Erro ao salvar ordem:', error);
      toast({
        variant: 'destructive',
        title: 'Erro!',
        description: error.message || 'Erro ao salvar ordem de serviço',
      });
    },
  });
}

/**
 * Hook para atualizar ordem de serviço
 */
export function useAtualizarOrdem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: Parameters<typeof ordemServicoService.atualizar>[1] }) => {
      return ordemServicoService.atualizar(id, dados);
    },
    onSuccess: (data) => {
      // Atualizar cache específico
      queryClient.setQueryData(ORDEM_SERVICO_KEYS.detail(data.id), data);
      
      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: ORDEM_SERVICO_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: ORDEM_SERVICO_KEYS.stats() });
      
      toast({
        title: 'Sucesso!',
        description: 'Ordem de serviço atualizada com sucesso',
      });
    },
    onError: (error: Error) => {
      console.error('Erro ao atualizar ordem:', error);
      toast({
        variant: 'destructive',
        title: 'Erro!',
        description: error.message || 'Erro ao atualizar ordem de serviço',
      });
    },
  });
}

/**
 * Hook para excluir ordem de serviço
 */
export function useExcluirOrdem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      return ordemServicoService.excluir(id);
    },
    onSuccess: (_, id) => {
      // Remover do cache
      queryClient.removeQueries({ queryKey: ORDEM_SERVICO_KEYS.detail(id) });
      
      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: ORDEM_SERVICO_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: ORDEM_SERVICO_KEYS.stats() });
      
      toast({
        title: 'Sucesso!',
        description: 'Ordem de serviço excluída com sucesso',
      });
    },
    onError: (error: Error) => {
      console.error('Erro ao excluir ordem:', error);
      toast({
        variant: 'destructive',
        title: 'Erro!',
        description: error.message || 'Erro ao excluir ordem de serviço',
      });
    },
  });
}

/**
 * Hook para atualizar status de uma ordem
 */
export function useAtualizarStatusOrdem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => {
      return ordemServicoService.atualizarStatus(id, status);
    },
    onSuccess: (data) => {
      // Atualizar cache específico
      queryClient.setQueryData(ORDEM_SERVICO_KEYS.detail(data.id), data);
      
      // Invalidar listas e estatísticas
      queryClient.invalidateQueries({ queryKey: ORDEM_SERVICO_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: ORDEM_SERVICO_KEYS.stats() });
      
      toast({
        title: 'Status atualizado!',
        description: `Status alterado para: ${data.status_os}`,
      });
    },
    onError: (error: Error) => {
      console.error('Erro ao atualizar status:', error);
      toast({
        variant: 'destructive',
        title: 'Erro!',
        description: error.message || 'Erro ao atualizar status da ordem',
      });
    },
  });
}

/**
 * Hook para atualizar pagamento de uma ordem
 */
export function useAtualizarPagamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      id, 
      valorPago, 
      formaPagamento 
    }: { 
      id: string; 
      valorPago: number; 
      formaPagamento?: string;
    }) => {
      return ordemServicoService.atualizarPagamento(id, valorPago, formaPagamento);
    },
    onSuccess: (data) => {
      // Atualizar cache específico
      queryClient.setQueryData(ORDEM_SERVICO_KEYS.detail(data.id), data);
      
      // Invalidar listas e estatísticas
      queryClient.invalidateQueries({ queryKey: ORDEM_SERVICO_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: ORDEM_SERVICO_KEYS.stats() });
      queryClient.invalidateQueries({ queryKey: ORDEM_SERVICO_KEYS.relatorioClientes() });
      
      toast({
        title: 'Pagamento atualizado!',
        description: `Valor pago: R$ ${data.valor_pago.toFixed(2)}`,
      });
    },
    onError: (error: Error) => {
      console.error('Erro ao atualizar pagamento:', error);
      toast({
        variant: 'destructive',
        title: 'Erro!',
        description: error.message || 'Erro ao atualizar pagamento da ordem',
      });
    },
  });
}