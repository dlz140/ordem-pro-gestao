import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { useRelatorioClientes } from "@/hooks/useOrdemServico";

interface ClienteRelatorio {
  id: string;
  nome: string;
  total_compras: number;
  quantidade_os: number;
  ticket_medio: number;
  ultima_compra: string;
  status: 'ativo' | 'inativo';
}

export default function RelatorioClientes() {
  const { toast } = useToast();

  const { data: clientes, isLoading, refetch } = useRelatorioClientes();

  // Calcular estatísticas otimizadas (já vem processado do servidor)
  const estatisticas = clientes ? {
    totalClientes: clientes.length,
    clientesAtivos: clientes.filter(c => c.status === 'ativo').length,
    clientesInativos: clientes.filter(c => c.status === 'inativo').length,
    totalFaturado: clientes.reduce((sum, c) => sum + (c.total_compras || 0), 0),
    ticketMedioGeral: clientes.length > 0 
      ? clientes.reduce((sum, c) => sum + (c.total_compras || 0), 0) / clientes.reduce((sum, c) => sum + (c.quantidade_os || 0), 0)
      : 0
  } : null;

  return (
    <div className="flex flex-col h-full gap-6">
      <PageHeader
        title="Relatório de Clientes"
        subtitle="Análise completa do perfil dos clientes"
        icon={Users}
      />

      <Card className="card-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <TrendingUp className="h-5 w-5" />
            Estatísticas Gerais
          </CardTitle>
        </CardHeader>
        <CardContent>
          {estatisticas && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{estatisticas.totalClientes}</p>
                <p className="text-sm text-muted-foreground">Total de Clientes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{estatisticas.clientesAtivos}</p>
                <p className="text-sm text-muted-foreground">Clientes Ativos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{estatisticas.clientesInativos}</p>
                <p className="text-sm text-muted-foreground">Clientes Inativos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {estatisticas.totalFaturado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
                <p className="text-sm text-muted-foreground">Total Faturado</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {estatisticas.ticketMedioGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
                <p className="text-sm text-muted-foreground">Ticket Médio</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="card-glass flex-grow">
        <CardHeader>
          <CardTitle className="text-foreground">Ranking de Clientes por Faturamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">
              {clientes ? `${clientes.length} clientes encontrados` : 'Carregando...'}
            </p>
            <Button onClick={() => refetch()} disabled={isLoading} className="btn-gradient-cyber">
              {isLoading ? 'Atualizando...' : 'Atualizar Dados'}
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Nome do Cliente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Quantidade de OS</TableHead>
                  <TableHead>Total Gasto</TableHead>
                  <TableHead>Ticket Médio</TableHead>
                  <TableHead>Última Compra</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientes ? (
                  clientes.map((cliente, index) => (
                    <TableRow key={cliente.id}>
                      <TableCell className="font-bold text-primary">#{index + 1}</TableCell>
                      <TableCell className="font-medium">{cliente.nome}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          cliente.status === 'ativo' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {cliente.status === 'ativo' ? 'Ativo' : 'Inativo'}
                        </span>
                      </TableCell>
                      <TableCell>{cliente.quantidade_os || 0}</TableCell>
                      <TableCell className="font-medium">
                        {(cliente.total_compras || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </TableCell>
                      <TableCell>
                        {(cliente.ticket_medio || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </TableCell>
                      <TableCell>
                        {cliente.ultima_compra === 'Nunca' || !cliente.ultima_compra
                          ? 'Nunca' 
                          : new Date(cliente.ultima_compra).toLocaleDateString('pt-BR')
                        }
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Carregando dados dos clientes...
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
