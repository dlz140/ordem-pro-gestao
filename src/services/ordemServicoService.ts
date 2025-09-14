import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { OrdemItem } from '@/types';

export type OrdemServico = Tables<'ordens_servico'>;
export type OrdemServicoInsert = TablesInsert<'ordens_servico'>;
export type OrdemServicoUpdate = TablesUpdate<'ordens_servico'>;
export type OrdemItemDB = Tables<'ordem_itens'>;
export type OrdemItemInsert = TablesInsert<'ordem_itens'>;

// Interface para o payload da função RPC
interface SalvarOsComItensPayload {
  p_ordem: {
    nome_cliente: string;
    telefone: string;
    equipamento: string;
    marca?: string;
    modelo?: string;
    defeito?: string;
    observacoes?: string;
    status_os?: string;
    forma_pagamento?: string;
    data_entrega?: string;
  };
  p_itens: {
    tipo_item: 'PRODUTO' | 'SERVICO';
    descricao: string;
    quantidade: number;
    valor_unitario: number;
    desconto?: number;
    produto_id?: string;
    servico_id?: string;
  }[];
}

class OrdemServicoService {
  /**
   * Buscar todas as ordens de serviço
   */
  async buscarTodas(): Promise<OrdemServico[]> {
    const { data, error } = await supabase
      .from('ordens_servico')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar ordens de serviço:', error);
      throw new Error(`Erro ao buscar ordens de serviço: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Buscar ordem de serviço por ID com itens
   */
  async buscarPorId(id: string): Promise<OrdemServico & { itens: OrdemItemDB[] } | null> {
    const { data: ordem, error: ordemError } = await supabase
      .from('ordens_servico')
      .select('*')
      .eq('id', id)
      .single();

    if (ordemError) {
      console.error('Erro ao buscar ordem de serviço:', ordemError);
      throw new Error(`Erro ao buscar ordem de serviço: ${ordemError.message}`);
    }

    if (!ordem) return null;

    const { data: itens, error: itensError } = await supabase
      .from('ordem_itens')
      .select('*')
      .eq('ordem_id', id)
      .order('created_at', { ascending: true });

    if (itensError) {
      console.error('Erro ao buscar itens da ordem:', itensError);
      throw new Error(`Erro ao buscar itens da ordem: ${itensError.message}`);
    }

    return {
      ...ordem,
      itens: itens || []
    };
  }

  /**
   * Salvar ordem de serviço com itens usando RPC
   */
  async salvarComItens(
    dadosOrdem: SalvarOsComItensPayload['p_ordem'],
    itens: OrdemItem[]
  ): Promise<{ id: string; valor_total: number }> {
    const itensFormatados = itens.map(item => ({
      tipo_item: item.tipo_item,
      descricao: item.descricao,
      quantidade: item.quantidade,
      valor_unitario: item.valor_unitario,
      desconto: item.desconto || 0,
      produto_id: item.produto_id || null,
      servico_id: item.servico_id || null
    }));

    const { data, error } = await supabase.rpc('salvar_os_com_itens', {
      p_ordem: dadosOrdem,
      p_itens: itensFormatados
    });

    if (error) {
      console.error('Erro ao salvar ordem com itens:', error);
      throw new Error(`Erro ao salvar ordem com itens: ${error.message}`);
    }

    return data;
  }

  /**
   * Atualizar ordem de serviço
   */
  async atualizar(id: string, dados: OrdemServicoUpdate): Promise<OrdemServico> {
    const { data, error } = await supabase
      .from('ordens_servico')
      .update(dados)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar ordem de serviço:', error);
      throw new Error(`Erro ao atualizar ordem de serviço: ${error.message}`);
    }

    return data;
  }

  /**
   * Excluir ordem de serviço
   */
  async excluir(id: string): Promise<void> {
    // Os itens serão excluídos automaticamente pelo cascade
    const { error } = await supabase
      .from('ordens_servico')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir ordem de serviço:', error);
      throw new Error(`Erro ao excluir ordem de serviço: ${error.message}`);
    }
  }

  /**
   * Buscar ordens por status
   */
  async buscarPorStatus(status: string): Promise<OrdemServico[]> {
    const { data, error } = await supabase
      .from('ordens_servico')
      .select('*')
      .eq('status_os', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar ordens por status:', error);
      throw new Error(`Erro ao buscar ordens por status: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Buscar ordens por cliente
   */
  async buscarPorCliente(nomeCliente: string): Promise<OrdemServico[]> {
    const { data, error } = await supabase
      .from('ordens_servico')
      .select('*')
      .ilike('nome_cliente', `%${nomeCliente}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar ordens por cliente:', error);
      throw new Error(`Erro ao buscar ordens por cliente: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Atualizar status de uma ordem
   */
  async atualizarStatus(id: string, novoStatus: string): Promise<OrdemServico> {
    return this.atualizar(id, { status_os: novoStatus });
  }

  /**
   * Atualizar valores pagos
   */
  async atualizarPagamento(
    id: string, 
    valorPago: number, 
    formaPagamento?: string
  ): Promise<OrdemServico> {
    const updateData: OrdemServicoUpdate = { valor_pago: valorPago };
    if (formaPagamento) {
      updateData.forma_pagamento = formaPagamento;
    }

    return this.atualizar(id, updateData);
  }

  /**
   * Buscar estatísticas do dashboard
   */
  async buscarEstatisticas(): Promise<{
    total_ordens: number;
    ordens_abertas: number;
    ordens_concluidas: number;
    valor_total_mes: number;
    valor_recebido_mes: number;
  }> {
    const { data, error } = await supabase
      .from('ordens_servico')
      .select('status_os, valor_total, valor_pago, created_at');

    if (error) {
      console.error('Erro ao buscar estatísticas:', error);
      throw new Error(`Erro ao buscar estatísticas: ${error.message}`);
    }

    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    
    const ordens = data || [];
    const ordensDoMes = ordens.filter(ordem => 
      new Date(ordem.created_at) >= inicioMes
    );

    return {
      total_ordens: ordens.length,
      ordens_abertas: ordens.filter(o => o.status_os === 'Aberta').length,
      ordens_concluidas: ordens.filter(o => o.status_os === 'Concluída').length,
      valor_total_mes: ordensDoMes.reduce((acc, o) => acc + (o.valor_total || 0), 0),
      valor_recebido_mes: ordensDoMes.reduce((acc, o) => acc + (o.valor_pago || 0), 0)
    };
  }

  /**
   * Buscar relatório de clientes usando RPC otimizada
   */
  async buscarRelatorioClientes(): Promise<any[]> {
    const { data, error } = await supabase.rpc('get_relatorio_clientes');

    if (error) {
      console.error('Erro ao buscar relatório de clientes:', error);
      throw new Error(`Erro ao buscar relatório de clientes: ${error.message}`);
    }

    return data || [];
  }
}

export const ordemServicoService = new OrdemServicoService();