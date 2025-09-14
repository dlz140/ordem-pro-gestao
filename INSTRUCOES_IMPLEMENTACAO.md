# Instruções para Aplicar as Melhorias no Sistema

## 🎯 O que foi implementado

Criei um sistema completo para gestão de itens em ordens de serviço com as seguintes funcionalidades:

### ✅ 1. Migration SQL Completa
- **Arquivo**: `supabase/migrations/20250912192000-create-ordem-itens.sql`
- **Funcionalidades**:
  - Tabela `ordem_itens` com relacionamentos
  - Triggers automáticos para recálculo de totais
  - Função RPC `salvar_os_com_itens` para operações transacionais
  - Função RPC `get_relatorio_clientes` otimizada
  - Políticas RLS para segurança

### ✅ 2. Service Layer
- **Arquivo**: `src/services/ordemServicoService.ts`
- **Funcionalidades**:
  - CRUD completo para ordens de serviço
  - Gestão de itens integrada
  - Busca por status, cliente, estatísticas
  - Integração com RPC functions

### ✅ 3. Hooks Personalizados
- **Arquivo**: `src/hooks/useOrdemServico.ts`
- **Funcionalidades**:
  - Cache inteligente com React Query
  - Mutações otimizadas
  - Error handling automático
  - Toast notifications

### ✅ 4. Componente de Gestão de Itens
- **Arquivo**: `src/components/ordem-servico/GestaoItens.tsx`
- **Funcionalidades**:
  - Interface para adicionar produtos/serviços
  - Cálculo automático de totais
  - Integração com catálogo existente
  - Modo readonly para visualização

### ✅ 5. Tipos TypeScript Atualizados
- **Arquivo**: `src/integrations/supabase/types.ts`
- Adicionada tabela `ordem_itens`
- RPC functions tipadas
- Relacionamentos definidos

---

## 🚀 Como aplicar no Supabase

### Passo 1: Aplicar a Migration
1. Acesse o **Dashboard do Supabase**: https://supabase.com/dashboard
2. Vá para seu projeto
3. Clique em **SQL Editor** no menu lateral
4. Cole o conteúdo do arquivo `supabase/migrations/20250912192000-create-ordem-itens.sql`
5. Execute o SQL (botão "Run")

### Passo 2: Verificar se foi aplicado
Execute este SQL para verificar:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'ordem_itens';
```

### Passo 3: Testar as Funções RPC
```sql
-- Testar função de relatório
SELECT * FROM get_relatorio_clientes();

-- Verificar se a função existe
SELECT proname FROM pg_proc WHERE proname = 'salvar_os_com_itens';
```

---

## 🛠️ Como integrar nos componentes existentes

### 1. Atualizar OrdemServicoDialog.tsx

Adicione o import do componente:
```typescript
import GestaoItens from './GestaoItens';
```

E use dentro do formulário:
```typescript
<GestaoItens
  itens={itens}
  onItensChange={setItens}
  readonly={readonly}
/>
```

### 2. Usar os novos hooks

Em qualquer componente:
```typescript
import { useOrdensServico, useSalvarOrdemComItens } from '@/hooks/useOrdemServico';

// Para listar ordens
const { data: ordens, isLoading } = useOrdensServico();

// Para salvar com itens
const { mutate: salvarOrdem } = useSalvarOrdemComItens();
```

### 3. Exemplo de uso completo
```typescript
const salvarComItens = () => {
  salvarOrdem({
    dadosOrdem: {
      nome_cliente: "João Silva",
      telefone: "(11) 99999-9999",
      equipamento: "Notebook",
      marca: "Dell",
      modelo: "Inspiron",
      defeito: "Não liga",
      status_os: "Aberta"
    },
    itens: [
      {
        tipo_item: 'PRODUTO',
        descricao: 'Fonte 90W',
        quantidade: 1,
        valor_unitario: 150.00,
        desconto: 0,
        produto_id: 'uuid-do-produto'
      }
    ]
  });
};
```

---

## 📋 Próximos passos recomendados

### 1. Migração dos dados existentes (opcional)
Se você tem ordens com produtos/serviços em texto:
```sql
-- Exemplo de migração de dados antigos
INSERT INTO ordem_itens (ordem_id, tipo_item, descricao, quantidade, valor_unitario, valor_total)
SELECT 
  id as ordem_id,
  'SERVICO' as tipo_item,
  servico as descricao,
  1 as quantidade,
  valor_total as valor_unitario,
  valor_total as valor_total
FROM ordens_servico 
WHERE servico IS NOT NULL AND servico != '';
```

### 2. Atualizar interface do usuário
- Integrar o componente `GestaoItens` no formulário principal
- Adicionar botões para ações rápidas (status, pagamento)
- Implementar filtros por tipo de item

### 3. Relatórios avançados
- Produtos mais vendidos
- Serviços mais utilizados
- Análise de lucratividade por item

---

## 🔧 Troubleshooting

### Erro de permissão no Supabase
Se der erro de permissão ao executar o SQL:
1. Verifique se está logado como proprietário do projeto
2. Use o **SQL Editor** (não o Table Editor)
3. Execute linha por linha se necessário

### Erro de tipos TypeScript
```bash
# Regenerar tipos do Supabase (se necessário)
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts
```

### Cache do React Query
Se os dados não atualizarem:
```typescript
// Forçar atualização
queryClient.invalidateQueries({ queryKey: ['ordens-servico'] });
```

---

## 🎉 Benefícios implementados

1. **Performance**: RPC functions fazem cálculos no servidor
2. **Consistência**: Triggers garantem dados sempre corretos
3. **Flexibilidade**: Sistema de itens separado permite expansão
4. **UX**: Interface intuitiva com feedback em tempo real
5. **Manutenibilidade**: Código bem estruturado e tipado
6. **Segurança**: RLS aplicado em todas as tabelas

---

**Está tudo pronto para uso! Basta aplicar a migration no Supabase e começar a usar os novos componentes.**