import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ClientePendente } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { useDebounce } from "@/hooks/useDebounce";
import { 
  StandardButton, 
  StandardInput, 
  StandardCard, 
  PageContainer, 
  FiltersContainer, 
  FormGrid, 
  StandardLoading, 
  StandardEmptyState, 
  StandardError 
} from "@/components/ui/StandardComponents";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const fetchClientesPendentes = async (): Promise<ClientePendente[]> => {
  // Buscar ordens com valor restante > 0 agrupadas por cliente
  const { data, error } = await supabase
    .from('ordens_servico')
    .select('nome_cliente, valor_restante')
    .gt('valor_restante', 0)
    .order('nome_cliente');
    
  if (error) {
    console.error('Erro ao buscar clientes pendentes:', error);
    throw new Error(`Erro ao carregar pendências: ${error.message}`);
  }
  
  if (!data || data.length === 0) {
    console.log('Nenhum dado encontrado para clientes pendentes');
    return [];
  }
  
  // Agrupar por cliente e calcular totais
  const clientesMap = new Map<string, ClientePendente>();
  
  data.forEach(ordem => {
    const nomeCliente = ordem.nome_cliente;
    if (clientesMap.has(nomeCliente)) {
      const cliente = clientesMap.get(nomeCliente)!;
      cliente.quantidade_os += 1;
      cliente.total_pendente += ordem.valor_restante;
    } else {
      clientesMap.set(nomeCliente, {
        cliente_id: `temp-${nomeCliente}`, // ID temporário
        nome_cliente: nomeCliente,
        quantidade_os: 1,
        total_pendente: ordem.valor_restante
      });
    }
  });
  
  // Converter Map para Array e ordenar por valor pendente (maior primeiro)
  const resultado = Array.from(clientesMap.values())
    .sort((a, b) => b.total_pendente - a.total_pendente);
    
  console.log(`Processados ${resultado.length} clientes com pendências`);
  return resultado;
};

export default function Pendentes() {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Debug: Log quando o componente for montado
  useEffect(() => {
    console.log('Componente Pendentes montado');
  }, []);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const { data: clientesPendentes, isLoading, isError, error, refetch } = useQuery<ClientePendente[]>({
    queryKey: ['clientesPendentes'],
    queryFn: fetchClientesPendentes,
    staleTime: 2 * 60 * 1000, // 2 minutos
    retry: 3, // Tentar 3 vezes em caso de erro
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Backoff exponencial
    refetchOnWindowFocus: true, // Recarregar quando voltar à página
    refetchOnMount: true, // Sempre recarregar ao montar
  });

  useEffect(() => {
    if (isError) {
      console.error('Erro na página Pendentes:', error);
      toast({ 
        title: "Erro", 
        description: "Não foi possível carregar as pendências.", 
        variant: "destructive" 
      });
    }
  }, [isError, error, toast]);

  const clientesFiltrados = useMemo(() =>
    (clientesPendentes || []).filter(c =>
      c.nome_cliente.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    ), [clientesPendentes, debouncedSearchTerm]);

  const handleCardClick = (clienteNome: string) => {
    navigate('/ordens-servico', { state: { filtroBusca: clienteNome } });
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader
          title="Clientes Pendentes"
          subtitle="Clientes com valores a receber"
          icon={AlertTriangle}
        />
        <StandardLoading message="Carregando clientes com pendências..." />
      </PageContainer>
    );
  }

  if (isError) {
    return (
      <PageContainer>
        <PageHeader
          title="Clientes Pendentes"
          subtitle="Clientes com valores a receber"
          icon={AlertTriangle}
        />
        <StandardError
          title="Erro ao Carregar Pendências"
          message={error instanceof Error ? error.message : 'Erro desconhecido'}
          onRetry={() => refetch()}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Clientes Pendentes"
        subtitle="Clientes com valores a receber"
        icon={AlertTriangle}
      >
        <StandardButton 
          onClick={() => refetch()} 
          variant="outline" 
          size="sm"
        >
          <Search className="h-4 w-4 mr-2" />
          Atualizar
        </StandardButton>
      </PageHeader>

      <FiltersContainer>
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <StandardInput 
            placeholder="Buscar por nome do cliente..." 
            className="pl-10"
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
      </FiltersContainer>

      <div className="flex-grow overflow-y-auto">
        {/* Debug info */}
        <div className="mb-4 text-xs text-muted-foreground">
          Debug: {clientesPendentes ? `${clientesPendentes.length} clientes carregados` : 'Nenhum dado carregado'}
        </div>
        
        <FormGrid cols={3}>
          {clientesFiltrados.length > 0 ? (
            clientesFiltrados.map((cliente) => (
              <StandardCard 
                key={cliente.cliente_id} 
                hover 
                className="cursor-pointer" 
                onClick={() => handleCardClick(cliente.nome_cliente)}
              >
                <CardHeader>
                  <CardTitle className="text-lg text-foreground">{cliente.nome_cliente}</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-between items-end">
                  <div className="text-sm text-muted-foreground">
                    {cliente.quantidade_os} {cliente.quantidade_os > 1 ? 'OSs com pendências' : 'OS com pendência'}
                  </div>
                  <div className="text-right">
                      <p className="text-xl font-bold text-red-500">
                          {cliente.total_pendente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                      <p className="text-xs text-muted-foreground">Valor total pendente</p>
                  </div>
                </CardContent>
              </StandardCard>
            ))
          ) : (
            <div className="col-span-full">
              <StandardEmptyState
                icon={AlertTriangle}
                title={searchTerm ? `Nenhum cliente encontrado para "${searchTerm}"` : "🎉 Nenhum cliente com pendências encontrado!"}
                description={searchTerm ? "Tente buscar por outro nome." : "Todos os clientes estão em dia!"}
              />
            </div>
          )}
        </FormGrid>
      </div>
    </PageContainer>
  );
}