export interface Cliente {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  cpf?: string | null;
  ativo: boolean;
  data_cadastro: string;
  endereco?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  cep?: string | null;
  complemento?: string | null;
  observacoes?: string | null;
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

export interface Equipamento {
  id: string;
  tipo: string;
}

export interface StatusOsInterface {
  id: string;
  status: string;
  cor?: string | null;
  eh_inicial?: boolean | null;
  eh_finalizado?: boolean | null;
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
  tipo?: 'PRODUTO' | 'SERVICO'; // Para compatibilidade com itemAtual
}

// Interface para formulário de Ordem de Serviço
export interface OrdemServico {
  id?: string;
  os_number?: number;
  cliente_id: string | null;
  modelo?: string;
  marca_id?: string | null;
  tipo_equipamento_id?: string | null;
  defeito?: string;
  observacoes?: string;
  status_id?: string | null;
  valor_pago?: number;
  data_entrega?: string | null;
}

export interface OrdemServicoDB {
  id: string;
  os_number: number;
  data_os: string;
  cliente_id: string | null;
  modelo?: string | null;
  marca_id: string | null;
  tipo_equipamento_id: string | null;
  defeito: string | null;
  valor_total: number;
  valor_pago: number;
  valor_restante: number;
  status_id: string | null;
  forma_pagamento: string | null;
  observacoes: string | null;
  data_entrega?: string | null;
  data_pagamento?: string | null;
  created_at?: string;
  clientes?: { nome: string } | null;
  status_os?: { status: string, cor: string } | null;
  equipamentos?: { tipo: string } | null;
}

export interface Gasto {
  id: string;
  descricao: string;
  valor: number;
  data: string;
}

export interface ClientePendente {
  cliente_id: string;
  nome_cliente: string;
  quantidade_os: number;
  total_pendente: number;
}