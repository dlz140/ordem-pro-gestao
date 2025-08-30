-- Habilitar RLS em todas as tabelas
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marcas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipos_equipamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;

-- Criar políticas públicas para todas as operações (sistema interno)
-- Políticas para clientes
CREATE POLICY "Permitir acesso total aos clientes" ON public.clientes FOR ALL USING (true) WITH CHECK (true);

-- Políticas para serviços
CREATE POLICY "Permitir acesso total aos serviços" ON public.servicos FOR ALL USING (true) WITH CHECK (true);

-- Políticas para produtos
CREATE POLICY "Permitir acesso total aos produtos" ON public.produtos FOR ALL USING (true) WITH CHECK (true);

-- Políticas para marcas
CREATE POLICY "Permitir acesso total às marcas" ON public.marcas FOR ALL USING (true) WITH CHECK (true);

-- Políticas para tipos de equipamentos
CREATE POLICY "Permitir acesso total aos tipos de equipamentos" ON public.tipos_equipamentos FOR ALL USING (true) WITH CHECK (true);

-- Políticas para status do sistema
CREATE POLICY "Permitir acesso total aos status do sistema" ON public.status_sistema FOR ALL USING (true) WITH CHECK (true);

-- Políticas para ordens de serviço
CREATE POLICY "Permitir acesso total às ordens de serviço" ON public.ordens_servico FOR ALL USING (true) WITH CHECK (true);