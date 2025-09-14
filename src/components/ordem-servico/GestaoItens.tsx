import React, { useState } from 'react';
import { Plus, Trash2, Package, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OrdemItem } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface GestaoItensProps {
  itens: OrdemItem[];
  onItensChange: (itens: OrdemItem[]) => void;
  readonly?: boolean;
}

const GestaoItens: React.FC<GestaoItensProps> = ({ 
  itens, 
  onItensChange, 
  readonly = false 
}) => {
  const [itemAtual, setItemAtual] = useState<Partial<OrdemItem>>({
    tipo_item: 'PRODUTO',
    descricao: '',
    quantidade: 1,
    valor_unitario: 0,
    desconto: 0,
    valor_total: 0
  });

  // Buscar produtos ativos
  const { data: produtos } = useQuery({
    queryKey: ['produtos-ativos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('produto');
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000
  });

  // Buscar serviços ativos
  const { data: servicos } = useQuery({
    queryKey: ['servicos-ativos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .eq('ativo', true)
        .order('servico');
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000
  });

  const calcularValorTotal = (quantidade: number, valorUnitario: number, desconto: number) => {
    const subtotal = quantidade * valorUnitario;
    return subtotal - desconto;
  };

  const atualizarItemAtual = (campo: string, valor: any) => {
    const novoItem = { ...itemAtual, [campo]: valor };
    
    // Recalcular valor total automaticamente
    if (['quantidade', 'valor_unitario', 'desconto'].includes(campo)) {
      novoItem.valor_total = calcularValorTotal(
        novoItem.quantidade || 0,
        novoItem.valor_unitario || 0,
        novoItem.desconto || 0
      );
    }
    
    setItemAtual(novoItem);
  };

  const selecionarProdutoServico = (tipo: 'PRODUTO' | 'SERVICO', id: string) => {
    const lista = tipo === 'PRODUTO' ? produtos : servicos;
    const item = lista?.find(i => i.id === id);
    
    if (item) {
      const novoItem = {
        ...itemAtual,
        tipo_item: tipo,
        descricao: tipo === 'PRODUTO' ? item.produto : item.servico,
        valor_unitario: item.valor,
        produto_id: tipo === 'PRODUTO' ? id : null,
        servico_id: tipo === 'SERVICO' ? id : null
      };
      
      novoItem.valor_total = calcularValorTotal(
        novoItem.quantidade || 1,
        novoItem.valor_unitario || 0,
        novoItem.desconto || 0
      );
      
      setItemAtual(novoItem);
    }
  };

  const adicionarItem = () => {
    if (!itemAtual.descricao || !itemAtual.valor_unitario) {
      return;
    }

    const novoItem: OrdemItem = {
      id: `temp-${Date.now()}`,
      tipo_item: itemAtual.tipo_item || 'PRODUTO',
      descricao: itemAtual.descricao,
      quantidade: itemAtual.quantidade || 1,
      valor_unitario: itemAtual.valor_unitario,
      desconto: itemAtual.desconto || 0,
      valor_total: itemAtual.valor_total || 0,
      produto_id: itemAtual.produto_id || null,
      servico_id: itemAtual.servico_id || null
    };

    onItensChange([...itens, novoItem]);
    
    // Limpar formulário
    setItemAtual({
      tipo_item: 'PRODUTO',
      descricao: '',
      quantidade: 1,
      valor_unitario: 0,
      desconto: 0,
      valor_total: 0
    });
  };

  const removerItem = (index: number) => {
    const novosItens = itens.filter((_, i) => i !== index);
    onItensChange(novosItens);
  };

  const valorTotalGeral = itens.reduce((acc, item) => acc + item.valor_total, 0);

  return (
    <Card className=\"card-glass\">
      <CardHeader>
        <CardTitle className=\"flex items-center gap-2\">
          <Package className=\"w-5 h-5\" />
          Itens da Ordem de Serviço
        </CardTitle>
      </CardHeader>
      <CardContent className=\"space-y-6\">
        
        {/* Formulário para adicionar itens */}
        {!readonly && (
          <div className=\"space-y-4 p-4 border border-border rounded-lg bg-background/50\">
            <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4\">
              {/* Tipo de Item */}
              <div className=\"space-y-2\">
                <Label htmlFor=\"tipo_item\">Tipo</Label>
                <Select
                  value={itemAtual.tipo_item}
                  onValueChange={(value: 'PRODUTO' | 'SERVICO') => atualizarItemAtual('tipo_item', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=\"PRODUTO\">
                      <div className=\"flex items-center gap-2\">
                        <Package className=\"w-4 h-4\" />
                        Produto
                      </div>
                    </SelectItem>
                    <SelectItem value=\"SERVICO\">
                      <div className=\"flex items-center gap-2\">
                        <Wrench className=\"w-4 h-4\" />
                        Serviço
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Seleção de Produto/Serviço */}
              <div className=\"space-y-2\">
                <Label>{itemAtual.tipo_item === 'PRODUTO' ? 'Produto' : 'Serviço'}</Label>
                <Select
                  value={itemAtual.tipo_item === 'PRODUTO' ? itemAtual.produto_id : itemAtual.servico_id}
                  onValueChange={(value) => selecionarProdutoServico(itemAtual.tipo_item || 'PRODUTO', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder=\"Selecionar...\" />
                  </SelectTrigger>
                  <SelectContent>
                    {(itemAtual.tipo_item === 'PRODUTO' ? produtos : servicos)?.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        <div className=\"flex justify-between items-center w-full\">
                          <span>{itemAtual.tipo_item === 'PRODUTO' ? item.produto : item.servico}</span>
                          <span className=\"text-muted-foreground ml-2\">
                            R$ {item.valor.toFixed(2)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Descrição personalizada */}
              <div className=\"space-y-2\">
                <Label htmlFor=\"descricao\">Descrição</Label>
                <Input
                  id=\"descricao\"
                  value={itemAtual.descricao}
                  onChange={(e) => atualizarItemAtual('descricao', e.target.value)}
                  placeholder=\"Descrição do item...\"
                />
              </div>

              {/* Quantidade */}
              <div className=\"space-y-2\">
                <Label htmlFor=\"quantidade\">Quantidade</Label>
                <Input
                  id=\"quantidade\"
                  type=\"number\"
                  min=\"1\"
                  step=\"1\"
                  value={itemAtual.quantidade}
                  onChange={(e) => atualizarItemAtual('quantidade', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className=\"grid grid-cols-1 md:grid-cols-4 gap-4\">
              {/* Valor Unitário */}
              <div className=\"space-y-2\">
                <Label htmlFor=\"valor_unitario\">Valor Unitário</Label>
                <Input
                  id=\"valor_unitario\"
                  type=\"number\"
                  min=\"0\"
                  step=\"0.01\"
                  value={itemAtual.valor_unitario}
                  onChange={(e) => atualizarItemAtual('valor_unitario', parseFloat(e.target.value) || 0)}
                />
              </div>

              {/* Desconto */}
              <div className=\"space-y-2\">
                <Label htmlFor=\"desconto\">Desconto (R$)</Label>
                <Input
                  id=\"desconto\"
                  type=\"number\"
                  min=\"0\"
                  step=\"0.01\"
                  value={itemAtual.desconto}
                  onChange={(e) => atualizarItemAtual('desconto', parseFloat(e.target.value) || 0)}
                />
              </div>

              {/* Valor Total */}
              <div className=\"space-y-2\">
                <Label>Valor Total</Label>
                <Input
                  value={`R$ ${(itemAtual.valor_total || 0).toFixed(2)}`}
                  readOnly
                  className=\"bg-muted\"
                />
              </div>

              {/* Botão Adicionar */}
              <div className=\"flex items-end\">
                <Button
                  type=\"button\"
                  onClick={adicionarItem}
                  className=\"w-full\"
                  disabled={!itemAtual.descricao || !itemAtual.valor_unitario}
                >
                  <Plus className=\"w-4 h-4 mr-2\" />
                  Adicionar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Lista de itens adicionados */}
        {itens.length > 0 && (
          <div className=\"space-y-4\">
            <h4 className=\"font-semibold text-lg\">Itens Adicionados</h4>
            
            <div className=\"space-y-2\">
              {itens.map((item, index) => (
                <div
                  key={item.id || index}
                  className=\"flex items-center justify-between p-3 border border-border rounded-lg bg-background/50\"
                >
                  <div className=\"flex items-center gap-3 flex-1\">
                    <Badge variant={item.tipo_item === 'PRODUTO' ? 'default' : 'secondary'}>
                      {item.tipo_item === 'PRODUTO' ? (
                        <Package className=\"w-3 h-3 mr-1\" />
                      ) : (
                        <Wrench className=\"w-3 h-3 mr-1\" />
                      )}
                      {item.tipo_item}
                    </Badge>
                    
                    <div className=\"flex-1\">
                      <p className=\"font-medium\">{item.descricao}</p>
                      <p className=\"text-sm text-muted-foreground\">
                        {item.quantidade}x R$ {item.valor_unitario.toFixed(2)}
                        {item.desconto > 0 && ` - R$ ${item.desconto.toFixed(2)} desconto`}
                      </p>
                    </div>
                    
                    <div className=\"text-right\">
                      <p className=\"font-semibold\">R$ {item.valor_total.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  {!readonly && (
                    <Button
                      variant=\"ghost\"
                      size=\"sm\"
                      onClick={() => removerItem(index)}
                      className=\"text-destructive hover:text-destructive ml-2\"
                    >
                      <Trash2 className=\"w-4 h-4\" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            
            {/* Total Geral */}
            <div className=\"flex justify-end pt-4 border-t border-border\">
              <div className=\"text-right\">
                <p className=\"text-lg font-semibold\">
                  Total Geral: R$ {valorTotalGeral.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {itens.length === 0 && (
          <div className=\"text-center py-8 text-muted-foreground\">
            <Package className=\"w-12 h-12 mx-auto mb-2 opacity-50\" />
            <p>Nenhum item adicionado</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GestaoItens;