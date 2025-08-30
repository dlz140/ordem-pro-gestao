import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ClientePendente } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";

const fetchClientesPendentes = async (): Promise<ClientePendente[]> => {
  const { data, error } = await supabase
    .from('clientes_pendentes_view')
    .select('*');
  if (error) throw new Error(error.message);
  return data || [];
};

export default function Pendentes() {
  const [busca, setBusca] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: clientesPendentes, isLoading, isError, error } = useQuery<ClientePendente[]>({
    queryKey: ['clientesPendentes'],
    queryFn: fetchClientesPendentes,
  });

  useEffect(() => {
<<<<<<< HEAD
    fetchPendencias();
  }, []);

  const fetchPendencias = async () => {
    setLoading(true);
    try {
      // Por enquanto, vamos simular dados para não dar erro
      // A tabela 'pendencias' será criada em uma futura migração
      const simulatedData = [
        {
          id: '1',
          tipo: 'pagamento',
          cliente: 'Cliente Exemplo',
          descricao: 'Pagamento pendente da OS #1001',
          valor: 500.00,
          vencimento: '2024-01-15',
          prioridade: 'alta',
          concluida: false
        }
      ];
      
      const data = simulatedData;
      const error = null;

      if (error) throw error;
      
      if (data) {
        // Mapeamento/Tradução
        const pendenciasFormatadas = data.map((item: any) => ({
          id: item.id,
          tipo: item.tipo,
          cliente: item.cliente,
          descricao: item.descricao,
          valor: item.valor,
          vencimento: item.vencimento,
          prioridade: item.prioridade,
          concluida: item.concluida,
        }));
        setPendencias(pendenciasFormatadas);
      }
    } catch (error) {
      console.error('Erro ao buscar pendências:', error);
=======
    if (isError) {
>>>>>>> 544b8c8 (mensagem do commit)
      toast({ title: "Erro", description: "Não foi possível carregar as pendências.", variant: "destructive" });
      console.error('Erro ao buscar pendências:', error);
    }
  }, [isError, error, toast]);

  const clientesFiltrados = useMemo(() =>
    (clientesPendentes || []).filter(c =>
      c.nome_cliente.toLowerCase().includes(busca.toLowerCase())
    ), [clientesPendentes, busca]);

  const handleCardClick = (clienteNome: string) => {
    navigate('/ordens-servico', { state: { filtroBusca: clienteNome } });
  };

  if (isLoading) {
    return <div className="p-8">Carregando clientes com pendências...</div>;
  }

  return (
    <div className="flex flex-col h-full gap-6">
      <PageHeader
        title="Clientes Pendentes"
        subtitle="Clientes com valores a receber"
        icon={AlertTriangle}
      />

      <Card className="card-glass flex-shrink-0">
        <CardContent className="p-4 flex items-center">
          <div className="relative w-full md:w-1/3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="Buscar por nome do cliente..." 
              className="pl-10"
              value={busca} 
              onChange={(e) => setBusca(e.target.value)} 
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex-grow overflow-y-auto">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clientesFiltrados.length > 0 ? (
            clientesFiltrados.map((cliente) => (
              <Card key={cliente.cliente_id} className="card-glass hover:border-primary/50 transition-all cursor-pointer transform hover:-translate-y-1" onClick={() => handleCardClick(cliente.nome_cliente)}>
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
              </Card>
            ))
          ) : (
            <div className="col-span-full">
              <Card className="card-glass">
                  <CardContent>
                   <p className="text-center text-muted-foreground py-8">🎉 Nenhum cliente com pendências encontrado!</p>
                  </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}