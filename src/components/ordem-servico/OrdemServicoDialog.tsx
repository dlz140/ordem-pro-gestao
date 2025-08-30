<<<<<<< HEAD
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { OrdemServicoFormLayout } from "./OrdemServicoFormLayout";
import { Button } from "@/components/ui/button";

export interface OrdemServico {
  id: string;
  dataOS: string;
  nomeCliente: string;
  telefone: string;
  equipamento: string;
  marca: string;
  modelo: string;
  defeito: string;
  servico: string;
  produtos: string;
  valorTotal: number;
  valorPago: number;
  valorRestante: number;
  statusOS: string;
  formaPagamento: string;
  observacoes: string;
  dataEntrega?: string;
}
=======
import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Trash2, Save, Lock, Unlock, ClipboardList } from "lucide-react";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { Combobox } from "@/components/ui/Combobox";
import { OrdemServicoDB, Cliente, Produto, Servico, Marca, Equipamento, OrdemItem, StatusOs } from "@/types";
>>>>>>> 544b8c8 (mensagem do commit)

interface OrdemServicoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  ordemParaEditar?: OrdemServicoDB | null;
}

const initialState: Partial<OrdemServicoDB> = {
  cliente_id: '',
  modelo: '',
  marca_id: null,
  tipo_equipamento_id: null,
  defeito: '',
  observacoes: '',
  valor_pago: 0,
  status_id: undefined,
};

export function OrdemServicoDialog({ isOpen, onClose, onSaveSuccess, ordemParaEditar }: OrdemServicoDialogProps) {
  const { toast } = useToast();
  
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [statusList, setStatusList] = useState<StatusOs[]>([]);
  
  const [dadosOS, setDadosOS] = useState<Partial<OrdemServicoDB>>(initialState);
  const [itens, setItens] = useState<OrdemItem[]>([]);
  const [itemAtual, setItemAtual] = useState<{ id?: string, tipo?: 'PRODUTO' | 'SERVICO' }>({});
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isLocked, setIsLocked] = useState(true);

  const isEditMode = useMemo(() => !!ordemParaEditar, [ordemParaEditar]);

  const isFormValid = useMemo(() => {
    return !!dadosOS.cliente_id;
  }, [dadosOS.cliente_id]);

  const canAddItem = useMemo(() => {
    return !!itemAtual.id && !!itemAtual.tipo;
  }, [itemAtual]);

  useEffect(() => {
    if (isOpen) {
      fetchDropdownData();
      if (ordemParaEditar) {
        setDadosOS({ ...ordemParaEditar });
        fetchItensDaOS(ordemParaEditar.id);
        setIsLocked(true);
      } else {
        resetForm();
        setIsLocked(false);
      }
    }
  }, [isOpen, ordemParaEditar]);

  useEffect(() => {
    if (!ordemParaEditar && dadosOS.status_id === undefined && statusList.length > 0) {
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
        supabase.from('equipamentos').select('id, tipo').order('tipo'),
        supabase.from('status_os').select('id, status').order('status'),
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
    const { data, error } = await supabase.from('ordem_itens').select('*').eq('ordem_id', ordemId);
    if (error) {
      toast({ title: "Erro", description: "Não foi possível carregar os itens desta OS.", variant: "destructive" });
      return;
    }
    setItens(data.map(item => ({ ...item, id: item.id.toString(), valor_total: (item.valor_unitario * item.quantidade) - item.desconto })) || []);
  };
  
  const resetForm = () => {
    setDadosOS(initialState);
    setItens([]);
    setItemAtual({});
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
    const itemExistente = itemAtual.tipo === 'PRODUTO' ? produtos.find(p => p.id === itemAtual.id) : servicos.find(s => s.id === itemAtual.id);
    if (!itemExistente) return;
    const novoItem: OrdemItem = {
      id: crypto.randomUUID(),
      tipo_item: itemAtual.tipo!,
      descricao: itemAtual.tipo === 'PRODUTO' ? (itemExistente as Produto).produto : (itemExistente as Servico).servico,
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
      toast({ title: "Erro de Validação", description: "O campo Cliente é obrigatório.", variant: "destructive" });
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
      itens: itens.map(({ id, valor_total, ...rest }) => rest),
    };
    
    try {
      const { data, error } = await supabase.rpc('salvar_os_com_itens', payload);
      if (error) throw new Error(error.message);
      const osNumber = data[0]?.os_number || ordemParaEditar?.os_number;
      toast({ title: "Sucesso!", description: `Ordem de Serviço Nº ${osNumber} foi salva.` });
      onSaveSuccess();
      onClose();
    } catch (error: any) {
      toast({ title: "Erro no Banco de Dados", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent><div className="p-8 text-center">Carregando dados...</div></DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
<<<<<<< HEAD
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>
            {isViewMode ? 'Visualizar' : isEditMode ? 'Editar' : 'Nova'} Ordem de Serviço
          </DialogTitle>
        </DialogHeader>
        
        <OrdemServicoFormLayout
          ordem={novaOrdem}
          setOrdem={setNovaOrdem}
          onSave={onSave}
          isViewMode={isViewMode}
          isEditMode={isEditMode}
        />
        
        {!isViewMode && (
          <div className="flex justify-end gap-2 p-6 pt-0">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={onSave} className="bg-primary hover:bg-primary/90">
              {isEditMode ? 'Atualizar' : 'Salvar'} Ordem
            </Button>
=======
      <DialogContent className="dialog-glass max-w-6xl max-h-[90vh] flex flex-col p-0">
        <Card className="bg-muted/50 rounded-b-none border-b border-border/50 flex-shrink-0">
            <CardContent className="p-4 flex justify-between items-center">
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
                    <Button variant="outline" onClick={() => setIsLocked(!isLocked)}>
                        {isLocked ? <Unlock className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                        {isLocked ? "Desbloquear" : "Bloquear"}
                    </Button>
                )}
            </CardContent>
        </Card>
        
        <div className="flex-grow overflow-y-auto px-6 space-y-6">
            <fieldset disabled={isLocked} className="space-y-6 disabled:opacity-70 transition-opacity pt-6">
                <div className="grid grid-cols-10 gap-4">
                  <div className="col-span-10 md:col-span-7 space-y-2">
                    <Label>Cliente <span className="text-red-500">*</span></Label>
                    <Combobox options={clientes.map(c => ({ value: c.id, label: c.nome }))} value={dadosOS.cliente_id} onSelect={(value) => setDadosOS(prev => ({...prev, cliente_id: value}))} placeholder="Selecione um cliente..." searchPlaceholder="Buscar cliente..." emptyPlaceholder="Nenhum cliente encontrado." />
                  </div>
                  <div className="col-span-10 md:col-span-3 space-y-2">
                    <Label>Status da OS</Label>
                    <Select value={dadosOS.status_id || ''} onValueChange={(value) => setDadosOS(prev => ({...prev, status_id: value}))} disabled={!isFormValid}>
                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>{statusList.map(s => <SelectItem key={s.id} value={s.id}>{s.status}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                
                <fieldset disabled={!isFormValid} className="space-y-6 disabled:opacity-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <Label>Tipo de Equipamento</Label>
                          <Combobox options={equipamentos.map(e => ({ value: e.id, label: e.tipo }))} value={dadosOS.tipo_equipamento_id || ''} onSelect={(value) => setDadosOS(prev => ({...prev, tipo_equipamento_id: value || null}))} placeholder="Selecione um tipo..." searchPlaceholder="Buscar tipo..." emptyPlaceholder="Nenhum tipo encontrado."/>
                      </div>
                      <div className="space-y-2">
                        <Label>Marca</Label>
                        <Combobox options={marcas.map(m => ({ value: m.id, label: m.marca }))} value={dadosOS.marca_id || ''} onSelect={(value) => setDadosOS(prev => ({...prev, marca_id: value || null}))} placeholder="Selecione uma marca..." searchPlaceholder="Buscar marca..." emptyPlaceholder="Nenhuma marca encontrada." disabled={!dadosOS.tipo_equipamento_id} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Modelo</Label>
                      <Input value={dadosOS.modelo || ""} placeholder="Ex: Inspiron 15 5500, SN: 1234ABCD" onChange={(e) => setDadosOS(prev => ({...prev, modelo: e.target.value}))} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Problema Relatado</Label>
                            <Textarea value={dadosOS.defeito || ""} placeholder="Descrição do cliente..." onChange={(e) => setDadosOS(prev => ({...prev, defeito: e.target.value}))} rows={3}/>
                        </div>
                        <div className="space-y-2">
                            <Label>Observações Técnicas</Label>
                            <Textarea value={dadosOS.observacoes || ""} placeholder="Condição do aparelho, avarias..." onChange={(e) => setDadosOS(prev => ({...prev, observacoes: e.target.value}))} rows={3}/>
                        </div>
                    </div>
                    
                    <div className="border-t border-b border-border/50 py-4 grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-12 md:col-span-5 space-y-2">
                            <Label>Adicionar Serviço</Label>
                            <Combobox options={servicos.map(s => ({ value: s.id, label: s.servico }))} value={itemAtual.tipo === 'SERVICO' ? itemAtual.id : ""} onSelect={(value) => setItemAtual({id: value, tipo: 'SERVICO'})} placeholder="Selecione um serviço..." searchPlaceholder="Buscar serviço..." emptyPlaceholder="Nenhum serviço encontrado." />
                        </div>
                        <div className="col-span-12 md:col-span-5 space-y-2">
                            <Label>Adicionar Produto</Label>
                            <Combobox options={produtos.map(p => ({ value: p.id, label: p.produto }))} value={itemAtual.tipo === 'PRODUTO' ? itemAtual.id : ""} onSelect={(value) => setItemAtual({id: value, tipo: 'PRODUTO'})} placeholder="Selecione um produto..." searchPlaceholder="Buscar produto..." emptyPlaceholder="Nenhum produto encontrado." />
                        </div>
                        <div className="col-span-12 md:col-span-2 flex items-center justify-center pt-5">
                            <Button onClick={handleInserirItem} className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg flex items-center justify-center gap-2 py-2 px-4" disabled={!canAddItem}>
                                <PlusCircle className="h-4 w-4"/>
                                Adicionar
                            </Button>
                        </div>
                    </div>

                    <div className="border rounded-md">
                        <Table>
                            <TableHeader><TableRow><TableHead>Descrição</TableHead><TableHead className="w-24 text-center">Qtd.</TableHead><TableHead className="w-36 text-right">Vlr. Unit.</TableHead><TableHead className="w-36 text-right">Desconto</TableHead><TableHead className="w-36 text-right">Total</TableHead><TableHead className="w-20 text-center">Ações</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {itens.length > 0 ? itens.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium truncate" title={item.descricao}>{item.descricao}</TableCell>
                                        <TableCell><Input type="number" value={item.quantidade} onChange={(e) => handleItemChange(item.id, 'quantidade', parseInt(e.target.value) || 1)} className="h-8 text-center" min={1} /></TableCell>
                                        <TableCell><CurrencyInput value={item.valor_unitario} onValueChange={(v) => handleItemChange(item.id, 'valor_unitario', v || 0)} className="h-8 text-right" /></TableCell>
                                        <TableCell><CurrencyInput value={item.desconto} onValueChange={(v) => handleItemChange(item.id, 'desconto', v || 0)} className="h-8 text-right" /></TableCell>
                                        <TableCell className="text-right font-semibold">{(item.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                                        <TableCell className="text-center">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleRemoverItem(item.id)}>
                                                <Trash2 className="h-4 w-4"/>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground h-24">Nenhum item adicionado</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </fieldset>
            </fieldset>
        </div>

        <DialogFooter className="bg-muted/50 p-4 rounded-b-lg mt-auto flex-shrink-0 border-t border-border/50">
          <div className="grid grid-cols-5 gap-4 items-center w-full">
              <div className="space-y-1 text-center">
                <Label className="text-muted-foreground text-xs">Total Bruto</Label>
                <div className="font-bold text-base text-purple-400">{totais.totalBruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
              </div>
              <div className="space-y-1 text-center">
                <Label className="text-muted-foreground text-xs">Descontos</Label>
                <div className="font-bold text-base text-orange-400">{totais.descontoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
              </div>
              <div className="space-y-1 text-center">
                <Label className="text-muted-foreground text-xs">Total Líquido</Label>
                <div className="font-bold text-base text-blue-400">{totais.totalLiquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
              </div>
              <div className="space-y-1 text-center">
                  <Label htmlFor="entrada" className="text-muted-foreground text-xs">Entrada (Pago)</Label>
                  <CurrencyInput 
                    id="entrada" 
                    value={dadosOS.valor_pago} 
                    onValueChange={(v) => setDadosOS(prev => ({...prev, valor_pago: v || 0}))} 
                    disabled={isLocked || !isFormValid} 
                    className="font-bold h-9 text-base text-green-400 text-center bg-background/50 border border-slate-700 rounded-md w-full disabled:opacity-50"
                  />
              </div>
              <div className="space-y-1 text-center">
                  <Label className="text-muted-foreground text-xs">Valor Pendente</Label>
                  <div className="font-bold text-base text-red-400 flex items-center justify-center h-9 w-full">
                    {totais.pendente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
              </div>
>>>>>>> 544b8c8 (mensagem do commit)
          </div>
          <div className="flex-shrink-0">
            {!isLocked && (
                <Button 
                  onClick={handleSalvarOS} 
                  disabled={!isFormValid || saving}
                  className="bg-gradient-to-r from-purple-700 to-purple-900 text-white transform hover:-translate-y-1 transition-all duration-300 font-semibold rounded-lg flex items-center gap-2 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Save className="h-4 w-4 mr-2"/>
                    {isEditMode ? "Salvar Alterações" : "Salvar"}
                </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}