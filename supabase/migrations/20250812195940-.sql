-- Criar tabela de clientes
CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT NOT NULL,
  endereco TEXT,
  cidade TEXT,
  cep TEXT,
  observacoes TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  data_cadastro TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de serviços
CREATE TABLE public.servicos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  servico TEXT NOT NULL,
  descricao TEXT,
  valor DECIMAL(10,2) NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'Outros',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de produtos
CREATE TABLE public.produtos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  produto TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  novo BOOLEAN NOT NULL DEFAULT false,
  usado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de marcas
CREATE TABLE public.marcas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  marca TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de tipos de equipamentos
CREATE TABLE public.tipos_equipamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de status do sistema
CREATE TABLE public.status_sistema (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de ordens de serviço
CREATE TABLE public.ordens_servico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data_os DATE NOT NULL DEFAULT CURRENT_DATE,
  nome_cliente TEXT NOT NULL,
  telefone TEXT NOT NULL,
  equipamento TEXT NOT NULL,
  marca TEXT,
  modelo TEXT,
  defeito TEXT,
  servico TEXT,
  produtos TEXT,
  valor_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  valor_pago DECIMAL(10,2) NOT NULL DEFAULT 0,
  valor_restante DECIMAL(10,2) NOT NULL DEFAULT 0,
  status_os TEXT NOT NULL DEFAULT 'Aberta',
  forma_pagamento TEXT,
  observacoes TEXT,
  data_entrega DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at automaticamente
CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_servicos_updated_at
  BEFORE UPDATE ON public.servicos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_produtos_updated_at
  BEFORE UPDATE ON public.produtos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marcas_updated_at
  BEFORE UPDATE ON public.marcas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tipos_equipamentos_updated_at
  BEFORE UPDATE ON public.tipos_equipamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_status_sistema_updated_at
  BEFORE UPDATE ON public.status_sistema
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ordens_servico_updated_at
  BEFORE UPDATE ON public.ordens_servico
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir dados iniciais
INSERT INTO public.clientes (nome, email, telefone, endereco, cidade, cep, observacoes, data_cadastro) VALUES
('João Silva', 'joao.silva@email.com', '(11) 99999-9999', 'Rua das Flores, 123', 'São Paulo', '01234-567', 'Cliente preferencial', '2024-01-15'),
('Maria Santos', 'maria.santos@email.com', '(11) 88888-8888', 'Av. Principal, 456', 'São Paulo', '02345-678', '', '2024-01-10'),
('Pedro Costa', 'pedro.costa@email.com', '(11) 77777-7777', 'Rua do Comércio, 789', 'Guarulhos', '03456-789', 'Sempre liga antes de trazer equipamento', '2024-01-05');

INSERT INTO public.servicos (servico, descricao, valor, categoria) VALUES
('Manutenção Preventiva', 'Limpeza interna, aplicação de pasta térmica, verificação de componentes', 150.00, 'Manutenção'),
('Reparo de Sistema', 'Formatação, instalação do sistema operacional e drivers básicos', 250.00, 'Software'),
('Instalação de Software', 'Instalação e configuração de programas específicos', 80.00, 'Software'),
('Limpeza Interna', 'Limpeza completa dos componentes internos do equipamento', 50.00, 'Manutenção'),
('Troca de HD/SSD', 'Substituição de disco rígido ou SSD (peça não inclusa)', 120.00, 'Hardware');

INSERT INTO public.produtos (produto, valor, novo, usado) VALUES
('Placa-mãe', 300.00, true, false),
('Fonte de alimentação', 150.00, false, true);

INSERT INTO public.marcas (marca) VALUES
('Dell'), ('HP'), ('Lenovo'), ('Asus'), ('Acer');

INSERT INTO public.tipos_equipamentos (tipo) VALUES
('Notebook'), ('Desktop'), ('Tablet'), ('Smartphone'), ('All-in-One');

INSERT INTO public.status_sistema (status) VALUES
('Aberta'), ('Em Andamento'), ('Aguardando Peça'), ('Concluída'), ('Cancelada');

INSERT INTO public.ordens_servico (data_os, nome_cliente, telefone, equipamento, marca, modelo, defeito, servico, produtos, valor_total, valor_pago, valor_restante, status_os, forma_pagamento, observacoes, data_entrega) VALUES
('2024-01-15', 'João Silva', '(11) 99999-9999', 'Notebook', 'Dell', 'Inspiron 15 3000', 'Sistema lento, superaquecimento', 'Manutenção Preventiva', 'Pasta térmica, limpeza', 150.00, 100.00, 50.00, 'Em Andamento', 'Cartão', 'Cliente pediu para ligar quando ficar pronto', '2024-01-20'),
('2024-01-20', 'Maria Santos', '(11) 88888-8888', 'Desktop', 'HP', 'Pavilion', 'Não liga', 'Diagnóstico e Reparo', 'Fonte de alimentação', 280.00, 280.00, 0.00, 'Concluída', 'PIX', '', null);