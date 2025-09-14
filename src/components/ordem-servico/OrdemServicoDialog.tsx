import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Combobox } from "@/components/ui/Combobox";
import { CurrencyInput } from "@/components/ui/currency-input";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { DatePicker } from "@/components/ui/date-picker"; // NOVO
import { Save, Trash2, PlusCircle, ClipboardList, Lock, Unlock, Printer } from "lucide-react";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Cliente, Produto, Servico, Marca, Equipamento, StatusOs, OrdemItem, OrdemServico } from "@/types";

// Função utilitária para comparação profunda (substitui lodash.isEqual)
const deepEqual = (a: any, b: any): boolean => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return false;
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (let key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  
  return true;
};

interface OrdemServicoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  ordemParaEditar?: OrdemServico | null;
  onSaveSuccess: () => void;
  isViewMode?: boolean;
}

export function OrdemServicoDialog({
  isOpen,
  onClose,
  ordemParaEditar,
  onSaveSuccess,
  isViewMode = false,
}: OrdemServicoDialogProps) {
  const { toast } = useToast();
  const initialState: OrdemServico = {
    cliente_id: null,
    modelo: '',
    marca_id: null,
    tipo_equipamento_id: null,
    defeito: '',
    observacoes: '',
    status_id: null,
    valor_pago: 0,
    data_entrega: null, // NOVO
  };

  const [dadosOS, setDadosOS] = useState<OrdemServico>(initialState);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [statusList, setStatusList] = useState<StatusOs[]>([]);
  const [itens, setItens] = useState<OrdemItem[]>([]);
  const [itemAtual, setItemAtual] = useState<Partial<OrdemItem & { tipo: 'PRODUTO' | 'SERVICO' }>>({});
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false);

  const initialFormState = useRef<{ dados: OrdemServico, itens: OrdemItem[] } | null>(null);

  const isEditMode = !!ordemParaEditar && !isViewMode;
  const isFormValid = !!dadosOS.cliente_id;
  const canAddItem = itemAtual.id && itemAtual.tipo;

  const handlePrint = () => {
    window.print();
  };

  const isFormDirty = useCallback(() => {
    if (!initialFormState.current) return false;
    const { dados: initialDados, itens: initialItens } = initialFormState.current;
    
    const dadosChanged = !deepEqual(initialDados, dadosOS);
    const itensChanged = !deepEqual(initialItens, itens);

    return dadosChanged || itensChanged;
  }, [dadosOS, itens]);
  
  const handleCloseRequest = () => {
    if (isFormDirty()) {
      setIsCloseConfirmOpen(true);
    } else {
      onClose();
    }
  };
  
  const resetAndClose = () => {
    setIsCloseConfirmOpen(false);
    onClose(); 
  };
  
  useEffect(() => {
    if (isOpen) {
      const currentData = ordemParaEditar ? { ...initialState, ...ordemParaEditar } : initialState;
      setDadosOS(currentData);
      setIsLocked(!!ordemParaEditar && isViewMode);
      fetchDropdownData();
      if (ordemParaEditar) {
        fetchItensDaOS(ordemParaEditar.id);
      } else {
        setItens([]);
        initialFormState.current = { dados: initialState, itens: [] };
      }
    }
  }, [isOpen, ordemParaEditar, isViewMode]);
  
  useEffect(() => {
    if (!ordemParaEditar && dadosOS.status_id === null && statusList.length > 0) {
      const statusAberto = statusList.find(s => s.status.toLowerCase().includes('aberta'));
      if (statusAberto) {
        setDadosOS(prev => ({ ...prev, status_id: statusAberto.id }));
      }
    }
  }, [statusList, ordemParaEditar, dadosOS.status_id]);

  const fetchDropdownData = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.all([
        supabase.from('clientes').select('id, nome').eq('ativo', true).order('nome'),
        supabase.from('produtos').select('id, produto, valor'),
        supabase.from('servicos').select('id, servico, valor'),
        supabase.from('marcas').select('id, marca').order('marca'),
        supabase.from('tipos_equipamentos').select('id, tipo').order('tipo'),
        supabase.from('status_sistema').select('id, status').order('status'),
      ]);
      const errors = results.map(r => r.error).filter(Boolean);
      if (errors.length > 0) throw errors[0];

      setClientes((results[0].data as Cliente[]) || []);
      setProdutos((results[1].data as Produto[]) || []);
      setServicos((results[2].data as Servico[]) || []);
      setMarcas((results[3].data as Marca[]) || []);
      setEquipamentos((results[4].data as Equipamento[]) || []);
      setStatusList((results[5].data as StatusOs[]) || []);
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível carregar os dados para os seletores.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  const fetchItensDaOS = async (ordemId: string) => {
    // TEMPORÁRIO: Funcionalidade desabilitada até configurar tabela ordem_itens no Supabase
    console.warn('Funcionalidade de itens da OS temporáriamente desabilitada');
    const fetchedItens: OrdemItem[] = [];
    setItens(fetchedItens);
    const dadosParaRef = { ...initialState, ...ordemParaEditar! };
    initialFormState.current = { dados: dadosParaRef, itens: fetchedItens };
  };

  const totais = useMemo(() => {
    const totalItens = itens.reduce((acc, item) => acc + (item.valor_unitario * item.quantidade), 0);
    const descontoTotal = itens.reduce((acc, item) => acc + item.desconto, 0);
    const totalLiquido = totalItens - descontoTotal;
    const entrada = dadosOS.valor_pago || 0;
    const pendente = totalLiquido - entrada;
    return { totalBruto: totalItens, descontoTotal, totalLiquido, entrada, pendente };
  }, [itens, dadosOS.valor_pago]);

  const handleInserirItem = () => {
    if (!canAddItem) return;
    const itemExistente = itemAtual.tipo === 'PRODUTO'
      ? produtos.find(p => p.id === itemAtual.id)
      : servicos.find(s => s.id === itemAtual.id);
    if (!itemExistente) return;

    const novoItem: OrdemItem = {
      id: crypto.randomUUID(),
      tipo_item: itemAtual.tipo!,
      descricao: itemAtual.tipo === 'PRODUTO'
        ? (itemExistente as Produto).produto
        : (itemExistente as Servico).servico,
      quantidade: 1,
      valor_unitario: itemExistente.valor,
      desconto: 0,
      valor_total: itemExistente.valor,
      produto_id: itemAtual.tipo === 'PRODUTO' ? itemExistente.id : null,
      servico_id: itemAtual.tipo === 'SERVICO' ? itemExistente.id : null,
    };

    setItens(prev => [...prev, novoItem]);
    setItemAtual({});
  };

  const handleItemChange = (itemId: string, field: keyof OrdemItem, value: any) => {
    setItens(prev => prev.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value };
        updatedItem.valor_total = (updatedItem.valor_unitario * updatedItem.quantidade) - updatedItem.desconto;
        return updatedItem;
      }
      return item;
    }));
  };

  const handleRemoverItem = (itemId: string) => {
    setItens(prev => prev.filter(item => item.id !== itemId));
  };
  
  const handleSalvarOS = async () => {
    if (!isFormValid) {
      toast({
        title: "Erro de Validação",
        description: "O campo Cliente é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    const payload = {
      os_id: ordemParaEditar?.id || null,
      in_cliente_id: dadosOS.cliente_id,
      in_modelo: dadosOS.modelo || '',
      in_marca_id: dadosOS.marca_id || null,
      in_tipo_equipamento_id: dadosOS.tipo_equipamento_id || null,
      in_defeito: dadosOS.defeito || '',
      in_observacoes: dadosOS.observacoes || '',
      in_status_id: dadosOS.status_id || null,
      in_valor_total: totais.totalLiquido,
      in_valor_pago: totais.entrada,
      in_valor_restante: totais.pendente,
      in_data_entrega: dadosOS.data_entrega || null, // NOVO
      itens: itens.map(({ id, ...rest }) => {
        const isNew = id.includes('-'); 
        return isNew ? rest : { id, ...rest };
      }),
    };

    try {
      const { data, error } = await supabase.rpc('salvar_os_com_itens', payload);
      if (error) throw new Error(error.message);
      const osNumber = data[0]?.os_number || ordemParaEditar?.os_number;
      toast({
        title: "Sucesso!",
        description: `Ordem de Serviço Nº ${osNumber} foi salva.`,
      });
      onSaveSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: "Erro no Banco de Dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleCloseRequest()}>
        <DialogContent>
          <div className="p-8 text-center">Carregando dados...</div>
        </DialogContent>
      </Dialog>
    );
  }
  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleCloseRequest()}>
        <DialogContent className="dialog-glass max-w-7xl w-[95vw] h-[95vh] flex flex-col p-0 overflow-hidden">
          <div className="bg-muted/50 rounded-b-none border-b border-border/50 flex-shrink-0">
            <div className="p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
                  <ClipboardList className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gradient-brand">
                    {ordemParaEditar ? `Ordem de Serviço Nº ${ordemParaEditar.os_number}` : "Nova Ordem de Serviço"}
                  </h1>
                </div>
              </div>
              {ordemParaEditar && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={handlePrint}>
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimir
                  </Button>
                  <Button variant="outline" onClick={() => setIsLocked(!isLocked)}>
                    {isLocked ? <Unlock className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                    {isLocked ? "Desbloquear" : "Bloquear"}
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-grow overflow-y-auto px-4 md:px-6 space-y-4 md:space-y-6 min-h-0">
            <fieldset disabled={isLocked} className="space-y-4 md:space-y-6 disabled:opacity-70 transition-opacity pt-4 md:pt-6" id="printable-area">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-6 space-y-2">
                  <Label>Cliente <span className="text-red-500">*</span></Label>
                  <Combobox
                    options={clientes.map(c => ({ value: c.id, label: c.nome }))}
                    value={dadosOS.cliente_id}
                    onSelect={value => {
                      const statusAberto = statusList.find(s => s.status.toLowerCase().includes('aberta'));
                      setDadosOS(prev => ({ 
                        ...prev, 
                        cliente_id: value, 
                        status_id: prev.status_id || statusAberto?.id || null 
                      }));
                      setTimeout(() => {
                        document.getElementById('tipo-equipamento-combobox')?.focus();
                      }, 0);
                    }}
                    placeholder="Selecione um cliente..."
                    searchPlaceholder="Buscar cliente..."
                    emptyPlaceholder="Nenhum cliente encontrado."
                  />
                </div>
                <div className="lg:col-span-3 space-y-2">
                  <Label>Status da OS</Label>
                  <Select
                    value={dadosOS.status_id || ''}
                    onValueChange={value => setDadosOS(prev => ({ ...prev, status_id: value }))}
                    disabled={!isFormValid}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {statusList.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="lg:col-span-3 space-y-2">
                  <Label>Data de Entrega</Label>
                  <DatePicker 
                    date={dadosOS.data_entrega ? new Date(dadosOS.data_entrega) : undefined}
                    setDate={(date) => setDadosOS(prev => ({ ...prev, data_entrega: date ? date.toISOString() : null }))}
                    disabled={!isFormValid}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Equipamento</Label>
                  <Combobox
                    id="tipo-equipamento-combobox"
                    options={equipamentos.map(e => ({ value: e.id, label: e.tipo }))}
                    value={dadosOS.tipo_equipamento_id || ''}
                    onSelect={value => setDadosOS(prev => ({ ...prev, tipo_equipamento_id: value || null }))}
                    placeholder="Selecione um tipo..."
                    searchPlaceholder="Buscar tipo..."
                    emptyPlaceholder="Nenhum tipo encontrado."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Marca</Label>
                  <Combobox
                    options={marcas.map(m => ({ value: m.id, label: m.marca }))}
                    value={dadosOS.marca_id || ''}
                    onSelect={value => setDadosOS(prev => ({ ...prev, marca_id: value || null }))}
                    placeholder="Selecione uma marca..."
                    searchPlaceholder="Buscar marca..."
                    emptyPlaceholder="Nenhuma marca encontrada."
                    disabled={!dadosOS.tipo_equipamento_id}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Modelo</Label>
                <Input
                  value={dadosOS.modelo || ""}
                  placeholder="Ex: Inspiron 15 5500, SN: 1234ABCD"
                  onChange={e => setDadosOS(prev => ({ ...prev, modelo: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Problema Relatado</Label>
                  <Textarea
                    value={dadosOS.defeito || ""}
                    placeholder="Descrição do cliente..."
                    onChange={e => setDadosOS(prev => ({ ...prev, defeito: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Observações Técnicas</Label>
                  <Textarea
                    value={dadosOS.observacoes || ""}
                    placeholder="Condição do aparelho, avarias..."
                    onChange={e => setDadosOS(prev => ({ ...prev, observacoes: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>

              <div className="border-t border-b border-border/50 py-4 grid grid-cols-12 gap-4 items-center">
                <div className="col-span-12 md:col-span-5 space-y-2">
                  <Label>Adicionar Serviço</Label>
                  <Combobox
                    options={servicos.map(s => ({ value: s.id, label: s.servico }))}
                    value={itemAtual.tipo === 'SERVICO' ? itemAtual.id : ""}
                    onSelect={value => setItemAtual({ id: value, tipo: 'SERVICO' })}
                    placeholder="Selecione um serviço..."
                    searchPlaceholder="Buscar serviço..."
                    emptyPlaceholder="Nenhum serviço encontrado."
                  />
                </div>
                <div className="col-span-12 md:col-span-5 space-y-2">
                  <Label>Adicionar Produto</Label>
                  <Combobox
                    options={produtos.map(p => ({ value: p.id, label: p.produto }))}
                    value={itemAtual.tipo === 'PRODUTO' ? itemAtual.id : ""}
                    onSelect={value => setItemAtual({ id: value, tipo: 'PRODUTO' })}
                    placeholder="Selecione um produto..."
                    searchPlaceholder="Buscar produto..."
                    emptyPlaceholder="Nenhum produto encontrado."
                  />
                </div>
                <div className="col-span-12 md:col-span-2 flex items-center justify-center pt-5">
                  <Button
                    onClick={handleInserirItem}
                    className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg flex items-center justify-center gap-2 py-2 px-4"
                    disabled={!canAddItem}
                  >
                    <PlusCircle className="h-4 w-4" />
                    Adicionar
                  </Button>
                </div>
              </div>

              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="w-24 text-center">Qtd.</TableHead>
                      <TableHead className="w-36 text-right">Vlr. Unit.</TableHead>
                      <TableHead className="w-36 text-right">Desconto</TableHead>
                      <TableHead className="w-36 text-right">Total</TableHead>
                      <TableHead className="w-20 text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itens.length > 0 ? itens.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium truncate" title={item.descricao}>{item.descricao}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.quantidade}
                            onChange={e => handleItemChange(item.id, 'quantidade', parseInt(e.target.value) || 1)}
                            className="h-8 text-center"
                            min={1}
                          />
                        </TableCell>
                        <TableCell>
                          <CurrencyInput
                            value={item.valor_unitario}
                            onValueChange={v => handleItemChange(item.id, 'valor_unitario', v || 0)}
                            className="h-8 text-right"
                            onFocus={(e) => e.target.select()}
                          />
                        </TableCell>
                        <TableCell>
                          <CurrencyInput
                            value={item.desconto}
                            onValueChange={v => handleItemChange(item.id, 'desconto', v || 0)}
                            className="h-8 text-right"
                            onFocus={(e) => e.target.select()}
                          />
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {item.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemoverItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                          Nenhum item adicionado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </fieldset>
          </div>

          <DialogFooter className="bg-muted/50 p-3 md:p-4 rounded-b-lg mt-auto flex-shrink-0 border-t border-border/50">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 md:gap-4 items-center w-full">
              <div className="space-y-1 text-center">
                <Label className="text-muted-foreground text-xs">Total Bruto</Label>
                <div className="font-bold text-sm md:text-base text-purple-400">
                  {totais.totalBruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>
              <div className="space-y-1 text-center">
                <Label className="text-muted-foreground text-xs">Descontos</Label>
                <div className="font-bold text-sm md:text-base text-orange-400">
                  {totais.descontoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>
              <div className="space-y-1 text-center">
                <Label className="text-muted-foreground text-xs">Total Líquido</Label>
                <div className="font-bold text-sm md:text-base text-blue-400">
                  {totais.totalLiquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>
              <div className="space-y-1 text-center">
                <Label htmlFor="entrada" className="text-muted-foreground text-xs">Entrada (Pago)</Label>
                <CurrencyInput
                  id="entrada"
                  value={dadosOS.valor_pago}
                  onValueChange={v => setDadosOS(prev => ({ ...prev, valor_pago: v || 0 }))}
                  disabled={isLocked || !isFormValid}
                  className="font-bold h-8 md:h-9 text-sm md:text-base text-green-400 text-center bg-background/50 border border-slate-700 rounded-md w-full disabled:opacity-50"
                  onFocus={(e) => e.target.select()}
                />
              </div>
              <div className="space-y-1 text-center">
                <Label className="text-muted-foreground text-xs">Valor Pendente</Label>
                <div className="font-bold text-sm md:text-base text-red-400 flex items-center justify-center h-8 md:h-9 w-full">
                  {totais.pendente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 mt-2 md:mt-0">
              {!isLocked && (
                <Button
                  onClick={handleSalvarOS}
                  disabled={!isFormValid || saving}
                  className="w-full md:w-auto bg-gradient-to-r from-purple-700 to-purple-900 text-white transform hover:-translate-y-1 transition-all duration-300 font-semibold rounded-lg flex items-center gap-2 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isEditMode ? "Salvar Alterações" : "Salvar"}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmationDialog
        isOpen={isCloseConfirmOpen}
        onClose={() => setIsCloseConfirmOpen(false)}
        onConfirm={resetAndClose}
        title="Descartar Alterações?"
        description="Você tem certeza que quer fechar? Todas as alterações não salvas serão perdidas."
        confirmText="Sim, descartar"
      />
    </>
  );
}