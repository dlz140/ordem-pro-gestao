// src/types/index.ts

export interface Cliente {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  ativo: boolean;
  // Adicione todos os outros campos da sua tabela 'clientes' aqui para ter uma tipagem completa
}

export interface Produto {
  id: string;
  produto: string;
  valor: number;
  novo: boolean;
  usado: boolean;
  marca_id?: string | null;
}

export interface Servico {
  id:string;
  servico: string;
  valor: number;
}

export interface Marca {
  id: string;
  marca: string;
}

// CORRIGIDO: Renomeado de TipoEquipamento para Equipamento
export interface Equipamento {
  id: string;
  tipo: string;
}

// ADICIONADO: Interface para StatusOs
export interface StatusOs {
  id: string;
  status: string;
}

export interface OrdemItem {
  id: string; 
  tipo_item: 'PRODUTO' | 'SERVICO';
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  desconto: number;
  valor_total: number;
  produto_id?: string | null;
  servico_id?: string | null;
}

// CORRIGIDO: Interface principal de Ordem de Serviço, alinhada com o banco de dados
export interface OrdemServicoDB {
  id: string;
  os_number: number;
  data_os: string;
  cliente_id: string;
  equipamento: string;
  marca_id: string | null;
  tipo_equipamento_id: string | null;
  defeito: string;
  valor_total: number;
  valor_pago: number;
  valor_restante: number;
  status_id: string | null; // <-- CORRETO
  forma_pagamento: string;
  observacoes: string;
  data_entrega?: string;
  // Propriedades que vêm dos "joins" (relações)
  clientes?: { nome: string } | null;
  status_os?: { status: string } | null; // <-- CORRETO
}

// ADICIONADO: Interface para a futura funcionalidade de Gastos
export interface Gasto {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  // Pode adicionar 'categoria_id', etc. no futuro
}