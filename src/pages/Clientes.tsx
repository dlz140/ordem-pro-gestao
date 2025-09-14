import { useState, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
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
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MaskedInput } from "@/components/ui/masked-input";
import { Cliente } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn } from "@/lib/utils";
import { fetchClientes, fetchClientesPendentesIds, saveCliente, deleteCliente } from "@/services/clienteService";
import { useDebounce } from "@/hooks/useDebounce";

type SearchField = 'nome' | 'telefone' | 'cpf';

export default function Clientes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [novoCliente, setNovoCliente] = useState<Partial<Cliente>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [searchBy, setSearchBy] = useState<SearchField>('nome');
  const [filtrarApenasPendentes, setFiltrarApenasPendentes] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [clienteParaExcluir, setClienteParaExcluir] = useState<Cliente | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const numeroInputRef = useRef<HTMLInputElement>(null);

  const isFormValid = useMemo(() => !!novoCliente.nome && novoCliente.nome.trim() !== '', [novoCliente.nome]);

  const { data: clientesFiltrados, isLoading: isLoadingClientes, isFetching: isFetchingClientes } = useQuery<Cliente[]>({
    queryKey: ['clientes', debouncedSearchTerm, filtrarApenasPendentes, searchBy],
    queryFn: () => fetchClientes(debouncedSearchTerm, filtrarApenasPendentes, searchBy),
    staleTime: 1000 * 60 * 5,
  });

  const { data: clientesComPendenciaSet } = useQuery<Set<string>>({
    queryKey: ['clientesPendentes'],
    queryFn: fetchClientesPendentesIds,
    staleTime: 1000 * 60 * 5,
  });

  const saveMutation = useMutation({
    mutationFn: saveCliente,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['clientesPendentes'] });
      toast({ title: "Sucesso!", description: `Cliente "${data.nome}" salvo com sucesso.` });
      resetDialog();
    },
    onError: (error) => toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCliente,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['clientesPendentes'] });
      toast({ title: "Sucesso!", description: "Cliente removido com sucesso." });
      setIsConfirmOpen(false);
    },
    onError: (error) => {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
      setIsConfirmOpen(false);
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
    if (!isFormValid) return;
    saveMutation.mutate(novoCliente);
  };

  const executarExclusao = () => {
    if (clienteParaExcluir) deleteMutation.mutate(clienteParaExcluir.id);
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

  const toggleFiltroPendentes = () => {
    setFiltrarApenasPendentes(prev => !prev);
    if (!filtrarApenasPendentes) setSearchTerm('');
  };

  if (isLoadingClientes && !clientesFiltrados) {
    return <div className="p-8">Carregando clientes...</div>;
  }
  
  const searchConfig = {
    nome: { placeholder: 'Buscar por nome...', mask: /.*/ },
    telefone: { placeholder: '(00) 00000-0000', mask: '(00) 00000-0000' },
    cpf: { placeholder: '000.000.000-00', mask: '000.000.000-00' },
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-6 space-y-6">
        <PageHeader title="Clientes" subtitle="Gerencie o cadastro de clientes" icon={Users}>
          <Button onClick={handleNovoCliente} className="btn-gradient-outline group" variant="outline">
            <Plus className="h-4 w-4 mr-2 transition-transform group-hover:rotate-90" />
            Novo Cliente
          </Button>
        </PageHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="card-glass"><CardContent className="p-4"><div className="text-2xl font-bold text-primary">{clientesFiltrados?.length || 0}</div><div className="text-sm text-muted-foreground">Clientes na lista</div></CardContent></Card>
          <Card className="card-glass cursor-pointer hover:border-destructive/50 transition-colors" onClick={toggleFiltroPendentes}><CardContent className="p-4"><div className="text-2xl font-bold text-destructive">{clientesComPendenciaSet?.size || 0}</div><div className="text-sm text-muted-foreground">Clientes com Pendências</div></CardContent></Card>
          <Card className="card-glass"><CardContent className="p-4"><div className="text-2xl font-bold text-green-400">0</div><div className="text-sm text-muted-foreground">Novos (últimos 30 dias)</div></CardContent></Card>
        </div>

        <Card className="card-glass">
          <CardContent className="p-4 flex flex-col gap-4">
            <RadioGroup defaultValue="nome" value={searchBy} onValueChange={(value: SearchField) => setSearchBy(value)} className="flex items-center gap-4">
              <div className="flex items-center space-x-2"><RadioGroupItem value="nome" id="r-nome" /><Label htmlFor="r-nome">Nome</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="telefone" id="r-telefone" /><Label htmlFor="r-telefone">Telefone</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="cpf" id="r-cpf" /><Label htmlFor="r-cpf">CPF</Label></div>
            </RadioGroup>
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="relative flex-grow w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <MaskedInput
                  mask={searchConfig[searchBy].mask}
                  value={searchTerm}
                  onAccept={(value: any) => setSearchTerm(value)}
                  placeholder={searchConfig[searchBy].placeholder}
                  className="pl-10"
                  disabled={filtrarApenasPendentes}
                  autocomplete="off"
                />
              </div>
              <Button variant={filtrarApenasPendentes ? "destructive" : "outline"} onClick={toggleFiltroPendentes} className="w-full md:w-auto">
                <Filter className="h-4 w-4 mr-2" />
                {filtrarApenasPendentes ? 'Limpar Filtro' : 'Apenas Pendentes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="card-glass flex-grow flex flex-col">
        <CardContent className="p-0 flex-grow">
          <div className="overflow-y-auto h-full">
            {clientesFiltrados && clientesFiltrados.length > 0 ? (
                <Table>
                <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm"><TableRow className="border-border/50"><TableHead>Nome</TableHead><TableHead className="w-48">Contato</TableHead><TableHead className="w-32">Cadastro</TableHead><TableHead className="w-40 text-center">Status</TableHead><TableHead className="w-32 text-center">Ações</TableHead></TableRow></TableHeader>
                <TableBody className={cn('transition-opacity duration-300', isFetchingClientes ? 'opacity-50' : 'opacity-100')}>
                    {clientesFiltrados.map((cliente) => (
                    <TableRow key={cliente.id} className="hover:bg-accent/50">
                        <TableCell><div className="font-medium text-foreground truncate" title={cliente.nome}>{cliente.nome}</div>{cliente.observacoes && (<div className="text-xs text-muted-foreground max-w-xs truncate">{cliente.observacoes}</div>)}</TableCell>
                        <TableCell><div className="space-y-1 text-sm">{cliente.telefone && (<a href={`https://wa.me/55${cliente.telefone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary transition-colors"><Phone className="h-3 w-3" />{cliente.telefone}</a>)}{cliente.email && (<div className="flex items-center gap-2"><Mail className="h-3 w-3" />{cliente.email}</div>)}</div></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{new Date(cliente.data_cadastro).toLocaleDateString("pt-BR", {timeZone: 'UTC'})}</TableCell>
                        <TableCell className="text-center">
                            <Badge variant="outline" className={cn("min-w-[10rem] justify-center", clientesComPendenciaSet?.has(cliente.id) ? "text-red-400 border-red-500/30" : "text-green-400 border-green-500/30")}>
                                {clientesComPendenciaSet?.has(cliente.id) ? "Pendente" : "OK"}
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
            ) : (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
                    <Users className="h-16 w-16 text-muted-foreground/50" />
                    <h3 className="text-xl font-semibold text-foreground">Nenhum Cliente Encontrado</h3>
                    <p className="text-sm text-muted-foreground">
                        {filtrarApenasPendentes 
                        ? "Nenhum cliente com pendências." 
                        : (searchTerm ? "Nenhum cliente encontrado para sua busca." : "Clique em 'Novo Cliente' para começar.")}
                    </p>
                    { !searchTerm && !filtrarApenasPendentes && (
                        <Button
                        onClick={handleNovoCliente}
                        className="bg-gradient-to-r from-purple-700 to-purple-900 text-white transform hover:-translate-y-1 transition-all duration-300 font-semibold rounded-lg flex items-center gap-2 px-4 py-2"
                        >
                        <Plus className="mr-2 h-4 w-4" />
                        Novo Cliente
                        </Button>
                    )}
                </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(isOpen) => !isOpen && resetDialog()}>
        <DialogContent className="dialog-glass max-w-3xl flex flex-col p-0">
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
            <div className="grid grid-cols-10 gap-4">
              <div className="col-span-8 flex flex-col gap-1.5">
                <Label htmlFor="nome">Nome Completo <span className="text-red-500">*</span></Label>
                <Input id="nome" placeholder="Ex: João da Silva" value={novoCliente.nome || ""} onChange={(e) => setNovoCliente({...novoCliente, nome: e.target.value})} autocomplete="off" />
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label htmlFor="cpf">CPF</Label>
                <MaskedInput 
                  id="cpf"
                  mask="000.000.000-00" 
                  value={novoCliente.cpf || ""} 
                  onAccept={(value: any) => setNovoCliente({ ...novoCliente, cpf: value })} 
                  placeholder="000.000.000-00" 
                  className="w-full"
                  disabled={!isFormValid}
                  autocomplete="off"
                />
              </div>
            </div>
            
            <fieldset disabled={!isFormValid} className="space-y-4 disabled:opacity-50">
              <div className="grid grid-cols-10 gap-4">
                <div className="col-span-2 flex flex-col gap-1.5">
                  <Label htmlFor="telefone">Telefone</Label>
                  <MaskedInput
                    id="telefone"
                    mask="(00) 00000-0000"
                    value={novoCliente.telefone || ""}
                    onAccept={(value: any) => setNovoCliente({ ...novoCliente, telefone: value })}
                    placeholder="(00) 00000-0000"
                    className="w-full"
                    autocomplete="off"
                  />
                </div>
                <div className="col-span-8 flex flex-col gap-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    type="email"
                    id="email"
                    value={novoCliente.email || ""} 
                    onChange={(e) => setNovoCliente({...novoCliente, email: e.target.value})}
                    autocomplete="off" 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-12 sm:col-span-3 flex flex-col gap-1.5">
                    <Label htmlFor="cep">CEP</Label>
                    <MaskedInput
                        id="cep"
                        mask="00000-000"
                        value={novoCliente.cep || ""}
                        onAccept={(value: string) => setNovoCliente({...novoCliente, cep: value })}
                        onBlur={(e: any) => handleCepBlur(e.target.value)}
                        placeholder="95000-000"
                        className="w-full"
                        autocomplete="off"
                    />
                  </div>
                  <div className="col-span-12 sm:col-span-7 flex flex-col gap-1.5">
                    <Label htmlFor="endereco">Endereço</Label>
                    <Input id="endereco" value={novoCliente.endereco || ""} onChange={(e) => setNovoCliente({...novoCliente, endereco: e.target.value})} autocomplete="off" />
                  </div>
                  <div className="col-span-12 sm:col-span-2 flex flex-col gap-1.5">
                    <Label htmlFor="numero">Nº</Label>
                    <Input id="numero" ref={numeroInputRef} value={novoCliente.numero || ""} onChange={(e) => setNovoCliente({...novoCliente, numero: e.target.value})} autocomplete="off" />
                  </div>
              </div>
              <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-12 sm:col-span-5 flex flex-col gap-1.5">
                    <Label htmlFor="bairro">Bairro</Label>
                    <Input id="bairro" value={novoCliente.bairro || ""} onChange={(e) => setNovoCliente({...novoCliente, bairro: e.target.value})} autocomplete="off" />
                  </div>
                  <div className="col-span-12 sm:col-span-5 flex flex-col gap-1.5">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input id="cidade" value={novoCliente.cidade || ""} onChange={(e) => setNovoCliente({...novoCliente, cidade: e.target.value})} autocomplete="off" />
                  </div>
                  <div className="col-span-12 sm:col-span-2 flex flex-col gap-1.5">
                    <Label htmlFor="uf">UF</Label>
                    <Input id="uf" value={novoCliente.uf || ""} onChange={(e) => setNovoCliente({...novoCliente, uf: e.target.value})} autocomplete="off" />
                  </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="complemento">Complemento</Label>
                <Input id="complemento" placeholder="Apto, Bloco, Casa..." value={novoCliente.complemento || ""} onChange={(e) => setNovoCliente({...novoCliente, complemento: e.target.value})} autocomplete="off" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea id="observacoes" placeholder="Informações adicionais sobre o cliente..." value={novoCliente.observacoes || ""} onChange={(e) => setNovoCliente({...novoCliente, observacoes: e.target.value})} autocomplete="off" />
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox id="ativo" checked={novoCliente.ativo ?? true} onCheckedChange={(checked) => setNovoCliente({...novoCliente, ativo: !!checked})} />
                <Label htmlFor="ativo">Cliente Ativo</Label>
              </div>
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