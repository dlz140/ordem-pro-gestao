-- Migration: Criar tabela ordem_itens e relacionamentos
-- Data: 2025-09-12 19:20:00

-- Criar tabela de itens das ordens de serviço
CREATE TABLE public.ordem_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ordem_id UUID NOT NULL,
  tipo_item TEXT NOT NULL CHECK (tipo_item IN ('PRODUTO', 'SERVICO')),
  produto_id UUID,
  servico_id UUID,
  descricao TEXT NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1 CHECK (quantidade > 0),
  valor_unitario DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (valor_unitario >= 0),
  desconto DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (desconto >= 0),
  valor_total DECIMAL(10,2) GENERATED ALWAYS AS ((quantidade * valor_unitario) - desconto) STORED,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Foreign keys
  CONSTRAINT fk_ordem_itens_ordem FOREIGN KEY (ordem_id) REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  CONSTRAINT fk_ordem_itens_produto FOREIGN KEY (produto_id) REFERENCES public.produtos(id) ON DELETE SET NULL,
  CONSTRAINT fk_ordem_itens_servico FOREIGN KEY (servico_id) REFERENCES public.servicos(id) ON DELETE SET NULL,
  
  -- Constraints de validação
  CONSTRAINT check_produto_ou_servico CHECK (
    (tipo_item = 'PRODUTO' AND produto_id IS NOT NULL AND servico_id IS NULL) OR
    (tipo_item = 'SERVICO' AND servico_id IS NOT NULL AND produto_id IS NULL)
  )
);

-- Índices para otimização
CREATE INDEX idx_ordem_itens_ordem_id ON public.ordem_itens(ordem_id);
CREATE INDEX idx_ordem_itens_produto_id ON public.ordem_itens(produto_id);
CREATE INDEX idx_ordem_itens_servico_id ON public.ordem_itens(servico_id);
CREATE INDEX idx_ordem_itens_tipo_item ON public.ordem_itens(tipo_item);

-- Trigger para updated_at
CREATE TRIGGER update_ordem_itens_updated_at
  BEFORE UPDATE ON public.ordem_itens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para recalcular totais da ordem de serviço automaticamente
CREATE OR REPLACE FUNCTION public.recalcular_totais_ordem()
RETURNS TRIGGER AS $$
DECLARE
  ordem_id_var UUID;
  novo_total DECIMAL(10,2);
BEGIN
  -- Determinar o ordem_id baseado na operação
  IF TG_OP = 'DELETE' THEN
    ordem_id_var := OLD.ordem_id;
  ELSE
    ordem_id_var := NEW.ordem_id;
  END IF;
  
  -- Calcular novo total
  SELECT COALESCE(SUM(valor_total), 0)
  INTO novo_total
  FROM public.ordem_itens
  WHERE ordem_id = ordem_id_var;
  
  -- Atualizar tabela ordens_servico
  UPDATE public.ordens_servico
  SET 
    valor_total = novo_total,
    valor_restante = novo_total - COALESCE(valor_pago, 0),
    updated_at = now()
  WHERE id = ordem_id_var;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers para recalcular totais automaticamente
CREATE TRIGGER trigger_recalcular_totais_insert
  AFTER INSERT ON public.ordem_itens
  FOR EACH ROW
  EXECUTE FUNCTION public.recalcular_totais_ordem();

CREATE TRIGGER trigger_recalcular_totais_update
  AFTER UPDATE ON public.ordem_itens
  FOR EACH ROW
  EXECUTE FUNCTION public.recalcular_totais_ordem();

CREATE TRIGGER trigger_recalcular_totais_delete
  AFTER DELETE ON public.ordem_itens
  FOR EACH ROW
  EXECUTE FUNCTION public.recalcular_totais_ordem();

-- Atualizar estrutura da tabela ordens_servico para relações adequadas
ALTER TABLE public.ordens_servico 
ADD COLUMN IF NOT EXISTS cliente_id UUID,
ADD COLUMN IF NOT EXISTS marca_id UUID,
ADD COLUMN IF NOT EXISTS tipo_equipamento_id UUID,
ADD COLUMN IF NOT EXISTS status_id UUID,
ADD COLUMN IF NOT EXISTS os_number SERIAL UNIQUE;

-- Adicionar foreign keys na ordens_servico
DO $$
BEGIN
  -- Verificar se a constraint já existe antes de tentar adicioná-la
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_ordens_servico_cliente'
  ) THEN
    ALTER TABLE public.ordens_servico 
    ADD CONSTRAINT fk_ordens_servico_cliente 
      FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_ordens_servico_marca'
  ) THEN
    ALTER TABLE public.ordens_servico 
    ADD CONSTRAINT fk_ordens_servico_marca 
      FOREIGN KEY (marca_id) REFERENCES public.marcas(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_ordens_servico_tipo_equipamento'
  ) THEN
    ALTER TABLE public.ordens_servico 
    ADD CONSTRAINT fk_ordens_servico_tipo_equipamento 
      FOREIGN KEY (tipo_equipamento_id) REFERENCES public.tipos_equipamentos(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_ordens_servico_status'
  ) THEN
    ALTER TABLE public.ordens_servico 
    ADD CONSTRAINT fk_ordens_servico_status 
      FOREIGN KEY (status_id) REFERENCES public.status_sistema(id) ON DELETE SET NULL;
  END IF;
END
$$;

-- Função RPC otimizada para salvar OS com itens
CREATE OR REPLACE FUNCTION public.salvar_os_com_itens(
  os_id UUID DEFAULT NULL,
  in_cliente_id UUID DEFAULT NULL,
  in_modelo TEXT DEFAULT NULL,
  in_marca_id UUID DEFAULT NULL,
  in_tipo_equipamento_id UUID DEFAULT NULL,
  in_defeito TEXT DEFAULT NULL,
  in_observacoes TEXT DEFAULT NULL,
  in_status_id UUID DEFAULT NULL,
  in_valor_total DECIMAL(10,2) DEFAULT 0,
  in_valor_pago DECIMAL(10,2) DEFAULT 0,
  in_valor_restante DECIMAL(10,2) DEFAULT 0,
  in_data_entrega DATE DEFAULT NULL,
  itens JSONB DEFAULT '[]'::JSONB
)
RETURNS TABLE(os_number INTEGER, id UUID) AS $$
DECLARE
  nova_os_id UUID;
  novo_os_number INTEGER;
  item JSONB;
BEGIN
  -- Inserir ou atualizar ordem de serviço
  IF os_id IS NULL THEN
    INSERT INTO public.ordens_servico (
      cliente_id, modelo, marca_id, tipo_equipamento_id, defeito, 
      observacoes, status_id, valor_total, valor_pago, valor_restante, data_entrega
    ) VALUES (
      in_cliente_id, in_modelo, in_marca_id, in_tipo_equipamento_id, in_defeito,
      in_observacoes, in_status_id, in_valor_total, in_valor_pago, in_valor_restante, in_data_entrega
    ) RETURNING ordens_servico.id, ordens_servico.os_number INTO nova_os_id, novo_os_number;
  ELSE
    UPDATE public.ordens_servico SET
      cliente_id = in_cliente_id,
      modelo = in_modelo,
      marca_id = in_marca_id,
      tipo_equipamento_id = in_tipo_equipamento_id,
      defeito = in_defeito,
      observacoes = in_observacoes,
      status_id = in_status_id,
      valor_pago = in_valor_pago,
      data_entrega = in_data_entrega,
      updated_at = now()
    WHERE ordens_servico.id = os_id
    RETURNING ordens_servico.id, ordens_servico.os_number INTO nova_os_id, novo_os_number;
  END IF;

  -- Remover itens existentes se for edição
  IF os_id IS NOT NULL THEN
    DELETE FROM public.ordem_itens WHERE ordem_id = nova_os_id;
  END IF;

  -- Inserir novos itens
  FOR item IN SELECT * FROM jsonb_array_elements(itens)
  LOOP
    INSERT INTO public.ordem_itens (
      ordem_id, tipo_item, produto_id, servico_id, descricao,
      quantidade, valor_unitario, desconto
    ) VALUES (
      nova_os_id,
      item->>'tipo_item',
      CASE WHEN item->>'produto_id' = '' OR item->>'produto_id' IS NULL THEN NULL ELSE (item->>'produto_id')::UUID END,
      CASE WHEN item->>'servico_id' = '' OR item->>'servico_id' IS NULL THEN NULL ELSE (item->>'servico_id')::UUID END,
      item->>'descricao',
      (item->>'quantidade')::INTEGER,
      (item->>'valor_unitario')::DECIMAL(10,2),
      (item->>'desconto')::DECIMAL(10,2)
    );
  END LOOP;

  RETURN QUERY SELECT novo_os_number, nova_os_id;
END;
$$ LANGUAGE plpgsql;

-- Função RPC para relatório de clientes otimizada
CREATE OR REPLACE FUNCTION public.get_relatorio_clientes()
RETURNS TABLE(
  id UUID,
  nome TEXT,
  total_compras DECIMAL(10,2),
  quantidade_os BIGINT,
  ticket_medio DECIMAL(10,2),
  ultima_compra DATE,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.nome,
    COALESCE(SUM(os.valor_total), 0) as total_compras,
    COUNT(os.id) as quantidade_os,
    CASE 
      WHEN COUNT(os.id) > 0 THEN COALESCE(SUM(os.valor_total), 0) / COUNT(os.id)
      ELSE 0
    END as ticket_medio,
    MAX(os.data_os) as ultima_compra,
    CASE WHEN c.ativo THEN 'ativo' ELSE 'inativo' END as status
  FROM public.clientes c
  LEFT JOIN public.ordens_servico os ON c.id = os.cliente_id
  GROUP BY c.id, c.nome, c.ativo
  ORDER BY total_compras DESC;
END;
$$ LANGUAGE plpgsql;

-- Políticas RLS (Row Level Security)
ALTER TABLE public.ordem_itens ENABLE ROW LEVEL SECURITY;

-- Política para permitir operações autenticadas
CREATE POLICY "Permitir operações autenticadas em ordem_itens" ON public.ordem_itens
  FOR ALL USING (auth.role() = 'authenticated');

-- Comentários para documentação
COMMENT ON TABLE public.ordem_itens IS 'Itens individuais (produtos/serviços) de cada ordem de serviço';
COMMENT ON COLUMN public.ordem_itens.tipo_item IS 'Tipo do item: PRODUTO ou SERVICO';
COMMENT ON COLUMN public.ordem_itens.valor_total IS 'Valor calculado automaticamente: (quantidade * valor_unitario) - desconto';
COMMENT ON FUNCTION public.salvar_os_com_itens IS 'Função otimizada para salvar ordem de serviço com seus itens de forma transacional';
COMMENT ON FUNCTION public.get_relatorio_clientes IS 'Função otimizada para gerar relatório de clientes com cálculos no servidor';