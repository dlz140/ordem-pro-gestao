import { useState, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Search, Edit, Trash2, Phone, Mail, Filter, Save } from "lucide-react";
import { IMaskInput } from "react-imask"; // <-- MUDANÇA 1: Novo import
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Cliente } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn } from "@/lib/utils";

// ... (todo o resto do seu código de fetch, save, delete, etc., continua igual) ...

const fetchClientes = async (): Promise<Cliente[]> => {
  const { data, error } = await supabase.from('clientes').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
};

const fetchClientesPendentesIds = async (): Promise<Set<string>> => {
  const { data, error } = await supabase.from('ordens_servico').select('cliente_id').gt('valor_restante', 0);
  if (error) throw new Error(error.message);
  const idsPendentes = new Set((data || []).map(os => os.cliente_id).filter(Boolean) as string[]);
  return idsPendentes;
};

const saveCliente = async (clienteData: Partial<Cliente>): Promise<Cliente> => {
  const { id, ...updateData } = clienteData;
  const dadosParaBanco = {
    nome: updateData.nome,
    email: updateData.email || null,
    telefone: updateData.telefone || null,
    endereco: updateData.endereco || null,
    numero: updateData.numero || null,
    complemento: updateData.complemento || null,
    bairro: updateData.bairro || null,
    cidade: updateData.cidade || null,
    uf: updateData.uf || null,
    cep: updateData.cep || null,
    observacoes: updateData.observacoes || null,
    ativo: updateData.ativo ?? true,
  };

  let response;
  if (id) {
    response = await supabase.from('clientes').update(dadosParaBanco).eq('id', id).select().single();
  } else {
    response = await supabase.from('clientes').insert([dadosParaBanco]).select().single();
  }
  if (response.error) throw new Error(response.error.message);
  return response.data;
};

const deleteCliente = async (id: string): Promise<void> => {
  const { error } = await supabase.from('clientes').delete().eq('id', id);
  if (error) {
    if (error.code === '23503') {
      throw new Error("Este cliente não pode ser excluído pois possui ordens de serviço associadas.");
    }
    throw new Error(error.message);
  }
};


export default function Clientes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [novoCliente, setNovoCliente] = useState<Partial<Cliente>>({});
  const [busca, setBusca] = useState("");
  const [filtrarApenasPendentes, setFiltrarApenasPendentes] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [clienteParaExcluir, setClienteParaExcluir] = useState<Cliente | null>(null);

  const numeroInputRef = useRef<HTMLInputElement>(null);

  const isFormValid = useMemo(() => {
    return !!novoCliente.nome && novoCliente.nome.trim() !== '';
  }, [novoCliente.nome]);

  const { data: clientes, isLoading: isLoadingClientes } = useQuery<Cliente[]>({
    queryKey: ['clientes'],
    queryFn: fetchClientes,
  });

  const { data: clientesComPendencia, isLoading: isLoadingPendencias } = useQuery<Set<string>>({
    queryKey: ['clientesPendentes'],
    queryFn: fetchClientesPendentesIds,
  });

  const clientesComPendenciaSet = useMemo(() => {
    if (clientesComPendencia instanceof Set) {
      return clientesComPendencia;
    }
    if (Array.isArray(clientesComPendencia)) {
      return new Set(clientesComPendencia as string[]);
    }
    return new Set<string>();
  }, [clientesComPendencia]);

  const saveMutation = useMutation({
    mutationFn: saveCliente,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['clientesPendentes'] });
      toast({ title: "Sucesso!", description: `Cliente "${data.nome}" salvo com sucesso.` });
      resetDialog();
    },
    onError: (error) => {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCliente,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['clientesPendentes'] });
      toast({ title: "Sucesso!", description: "Cliente removido com sucesso." });
    },
    onError: (error) => {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
    },
  });

  const handleCepBlur = async (cep: string) => {
    const cepLimpo = cep ? cep.replace(/\D/g, '') : '';
    if (cepLimpo.length !== 8) return;
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      if (!response.ok) throw new Error('CEP não encontrado');
      const data = await response.json();
      if (!data.erro) {
        setNovoCliente(prev => ({ ...prev, endereco: data.logradouro, bairro: data.bairro, cidade: data.localidade, uf: data.uf }));
        toast({ title: "Sucesso!", description: "Endereço preenchido automaticamente." });
        numeroInputRef.current?.focus();
      } else {
        toast({ title: "Aviso", description: "CEP não encontrado.", variant: "default" });
      }
    } catch (error) {
      toast({ title: "Erro de Rede", description: "Não foi possível buscar o CEP.", variant: "destructive" });
    }
  };
  
  const handleSalvarCliente = () => {
    if (!isFormValid) {
      toast({ title: "Campo obrigatório", description: "O nome do cliente é obrigatório.", variant: "destructive" });
      return;
    }
    saveMutation.mutate(novoCliente);
  };

  const executarExclusao = () => {
    if (!clienteParaExcluir) return;
    deleteMutation.mutate(clienteParaExcluir.id);
  };
  
  const resetDialog = () => {
    setNovoCliente({});
    setClienteSelecionado(null);
    setIsDialogOpen(false);
    setIsEditMode(false);
  };

  const handleEditarCliente = (cliente: Cliente) => {
    setClienteSelecionado(cliente);
    setNovoCliente(cliente);
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  const handleNovoCliente = () => {
    resetDialog();
    setNovoCliente({ ativo: true });
    setIsDialogOpen(true);
  };

  const handleAbrirConfirmacaoExclusao = (cliente: Cliente) => {
    setClienteParaExcluir(cliente);
    setIsConfirmOpen(true);
  };

  const clientesFiltrados = useMemo(() => {
    const listaClientes = clientes || [];
    const pendentes = clientesComPendenciaSet;
    
    return listaClientes.filter(cliente => {
      if (filtrarApenasPendentes) {
        return pendentes.has(cliente.id);
      }
      const buscaLower = busca.toLowerCase().trim();
      if (!buscaLower) return true;
      return (
        cliente.nome.toLowerCase().includes(buscaLower) ||
        (cliente.email && cliente.email.toLowerCase().includes(buscaLower)) ||
        (cliente.telefone && cliente.telefone.includes(buscaLower))
      );
    });
  }, [clientes, busca, filtrarApenasPendentes, clientesComPendenciaSet]);

  const toggleFiltroPendentes = () => {
    const novoEstado = !filtrarApenasPendentes;
    setFiltrarApenasPendentes(novoEstado);
    if (novoEstado) setBusca('');
  };
  
  const isLoading = isLoadingClientes || isLoadingPendencias;

  if (isLoading) return <div className="p-8">Carregando clientes...</div>;

  return (
    <div className="flex flex-col h-full gap-6">
      <PageHeader
        title="Clientes"
        subtitle="Gerencie o cadastro de clientes"
        icon={Users}
      >
        <Button 
          onClick={handleNovoCliente} 
          className="text-base border-primary/30 text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-purple-900/50 hover:to-slate-900/50 hover:border-purple-800/50 transform hover:-translate-y-1 transition-all duration-300 group"
          variant="outline"
        >
          <Plus className="h-4 w-4 mr-2 transition-transform group-hover:rotate-90" />
          Novo Cliente
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="card-glass"><CardContent className="p-4"><div className="text-2xl font-bold text-primary">{clientes?.length || 0}</div><div className="text-sm text-muted-foreground">Total de Clientes</div></CardContent></Card>
        <Card className="card-glass cursor-pointer hover:border-destructive/50 transition-colors" onClick={toggleFiltroPendentes}><CardContent className="p-4"><div className="text-2xl font-bold text-destructive">{clientesComPendenciaSet.size || 0}</div><div className="text-sm text-muted-foreground">Clientes com Pendências</div></CardContent></Card>
        <Card className="card-glass"><CardContent className="p-4"><div className="text-2xl font-bold text-green-400">{(clientes || []).filter(c => new Date(c.data_cadastro) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}</div><div className="text-sm text-muted-foreground">Novos (últimos 30 dias)</div></CardContent></Card>
      </div>

      <Card className="card-glass">
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-grow w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input placeholder="Buscar por nome, email ou telefone..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-10" disabled={filtrarApenasPendentes}/>
          </div>
          <Button variant={filtrarApenasPendentes ? "destructive" : "outline"} onClick={toggleFiltroPendentes} className="w-full md:w-auto">
            <Filter className="h-4 w-4 mr-2" />
            {filtrarApenasPendentes ? 'Limpar Filtro' : 'Apenas Pendentes'}
          </Button>
        </CardContent>
      </Card>

      <Card className="card-glass flex-grow flex flex-col">
        <CardContent className="p-0 flex-grow">
          <div className="overflow-y-auto h-full">
            <Table>
              <TableHeader><TableRow className="border-border/50 bg-muted/30"><TableHead>Nome</TableHead><TableHead className="w-48">Contato</TableHead><TableHead className="w-32">Cadastro</TableHead><TableHead className="w-40 text-center">Status</TableHead><TableHead className="w-32 text-center">Ações</TableHead></TableRow></TableHeader>
              <TableBody>
                {clientesFiltrados.map((cliente) => (
                  <TableRow key={cliente.id} className="hover:bg-accent/50">
                    <TableCell><div className="font-medium text-foreground truncate" title={cliente.nome}>{cliente.nome}</div>{cliente.observacoes && (<div className="text-xs text-muted-foreground max-w-xs truncate">{cliente.observacoes}</div>)}</TableCell>
                    <TableCell><div className="space-y-1 text-sm">{cliente.telefone && (<a href={`https://wa.me/55${cliente.telefone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary transition-colors"><Phone className="h-3 w-3" />{cliente.telefone}</a>)}{cliente.email && (<div className="flex items-center gap-2"><Mail className="h-3 w-3" />{cliente.email}</div>)}</div></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(cliente.data_cadastro).toLocaleDateString("pt-BR", {timeZone: 'UTC'})}</TableCell>
                    <TableCell className="text-center">
                        <Badge variant="outline" className={cn("min-w-[10rem] justify-center", clientesComPendenciaSet.has(cliente.id) ? "text-red-400 border-red-500/30" : "text-green-400 border-green-500/30")}>
                            {clientesComPendenciaSet.has(cliente.id) ? "Pendente" : "OK"}
                        </Badge>
                    </TableCell>
                    <TableCell>
                        <div className="flex gap-2 justify-center">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleEditarCliente(cliente)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleAbrirConfirmacaoExclusao(cliente)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(isOpen) => !isOpen && resetDialog()}>
        <DialogContent className="dialog-glass max-w-2xl flex flex-col p-0">
          <DialogHeader className="p-4 border-b border-border/50 bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gradient-brand text-left">
                  {isEditMode ? "Editar Cliente" : "Adicionar Novo Cliente"}
                </DialogTitle>
                <DialogDescription className="text-left">
                  {isEditMode ? "Altere as informações do cliente abaixo." : "Preencha os dados para cadastrar um novo cliente."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-grow space-y-4 px-6 pt-4 pb-6 max-h-[70vh] overflow-y-auto">
            <div className="space-y-2"><Label>Nome Completo <span className="text-red-500">*</span></Label><Input placeholder="Ex: João da Silva" value={novoCliente.nome || ""} onChange={(e) => setNovoCliente({...novoCliente, nome: e.target.value})} /></div>
            <fieldset disabled={!isFormValid} className="space-y-4 disabled:opacity-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  {/* MUDANÇA 2: Substituição do InputMask pelo IMaskInput */}
                  <IMaskInput
                    as={Input}
                    mask="(00) 00000-0000"
                    value={novoCliente.telefone || ""}
                    onAccept={(value: string) => {
                      setNovoCliente({ ...novoCliente, telefone: value });
                    }}
                    placeholder="(54) 99999-9999"
                  />
                </div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" placeholder="cliente@email.com" value={novoCliente.email || ""} onChange={(e) => setNovoCliente({...novoCliente, email: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-12 gap-4 items-end">
                  <div className="col-span-12 sm:col-span-4 space-y-2"><Label>CEP</Label>
                    <IMaskInput
                        as={Input}
                        mask="00000-000"
                        value={novoCliente.cep || ""}
                        onAccept={(value: string) => {
                            setNovoCliente({...novoCliente, cep: value });
                        }}
                        onBlur={(e: any) => handleCepBlur(e.target.value)}
                        placeholder="95000-000"
                    />
                  </div>
                  <div className="col-span-12 sm:col-span-6 space-y-2"><Label>Endereço</Label><Input value={novoCliente.endereco || ""} onChange={(e) => setNovoCliente({...novoCliente, endereco: e.target.value})} /></div>
                  <div className="col-span-12 sm:col-span-2 space-y-2"><Label>Nº</Label><Input ref={numeroInputRef} value={novoCliente.numero || ""} onChange={(e) => setNovoCliente({...novoCliente, numero: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-12 sm:col-span-5 space-y-2"><Label>Bairro</Label><Input value={novoCliente.bairro || ""} onChange={(e) => setNovoCliente({...novoCliente, bairro: e.target.value})} /></div>
                  <div className="col-span-12 sm:col-span-5 space-y-2"><Label>Cidade</Label><Input value={novoCliente.cidade || ""} onChange={(e) => setNovoCliente({...novoCliente, cidade: e.target.value})} /></div>
                  <div className="col-span-12 sm:col-span-2 space-y-2"><Label>UF</Label><Input value={novoCliente.uf || ""} onChange={(e) => setNovoCliente({...novoCliente, uf: e.target.value})} /></div>
              </div>
              <div className="space-y-2"><Label>Complemento</Label><Input placeholder="Apto, Bloco, Casa..." value={novoCliente.complemento || ""} onChange={(e) => setNovoCliente({...novoCliente, complemento: e.target.value})} /></div>
              <div className="space-y-2"><Label>Observações</Label><Textarea placeholder="Informações adicionais sobre o cliente..." value={novoCliente.observacoes || ""} onChange={(e) => setNovoCliente({...novoCliente, observacoes: e.target.value})} /></div>
              <div className="flex items-center space-x-2 pt-2"><Checkbox checked={novoCliente.ativo ?? true} onCheckedChange={(checked) => setNovoCliente({...novoCliente, ativo: !!checked})} /><Label>Cliente Ativo</Label></div>
            </fieldset>
          </div>
          <DialogFooter className="p-4 border-t border-border/50 bg-muted/50 flex justify-end gap-x-4">
            <Button variant="outline" onClick={resetDialog} className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-colors duration-300">
              Cancelar
            </Button>
            <Button onClick={handleSalvarCliente} disabled={!isFormValid || saveMutation.isPending} className="bg-gradient-to-r from-purple-700 to-purple-900 text-white transform hover:-translate-y-1 transition-all duration-300 font-semibold rounded-lg flex items-center gap-2 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed">
              <Save className="h-4 w-4 mr-2" />
              {isEditMode ? "Salvar Alterações" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={executarExclusao}
        title={`Excluir: ${clienteParaExcluir?.nome}?`}
        description="Esta ação não pode ser desfeita. O cliente será removido, mas suas ordens de serviço permanecerão no sistema."
        confirmText="Sim, excluir cliente"
      />
    </div>
  );
}