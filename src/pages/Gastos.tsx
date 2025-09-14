import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Landmark, Plus, Search, Edit, Trash2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { DatePicker } from "@/components/ui/date-picker";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Gasto } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";

type GastoComTipo = Gasto & { tipo: 'ESSENCIAL' | 'INVESTIMENTO' | 'NAO_ESSENCIAL' };

const fetchGastos = async (): Promise<GastoComTipo[]> => {
  const { data, error } = await supabase
    .from('gastos')
    .select('id, data, descricao, valor, categoria_nome, tipo')
    .order('data', { ascending: false });
  if (error) throw new Error(error.message);
  return data as GastoComTipo[] || [];
};

const saveGasto = async (gastoData: Partial<GastoComTipo>): Promise<GastoComTipo> => {
    const { id, ...rest } = gastoData;
    const { data, valor, descricao, categoria_nome, tipo } = rest;
    const dadosParaBanco = { data, valor, descricao, categoria_nome, tipo };
  
    let response;
    if (id) {
      response = await supabase.from('gastos').update(dadosParaBanco).eq('id', id).select().single();
    } else {
      response = await supabase.from('gastos').insert(dadosParaBanco).select().single();
    }
    if (response.error) throw new Error(response.error.message);
    return response.data;
};

const deleteGasto = async (id: string): Promise<void> => {
    const { error } = await supabase.from('gastos').delete().eq('id', id);
    if (error) throw new Error(error.message);
};

export default function Gastos() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [gastoSelecionado, setGastoSelecionado] = useState<GastoComTipo | null>(null);
  const [novoGasto, setNovoGasto] = useState<Partial<GastoComTipo>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [gastoParaExcluir, setGastoParaExcluir] = useState<GastoComTipo | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const isFormValid = useMemo(() => {
    return (
      novoGasto.descricao && novoGasto.descricao.trim() !== '' &&
      novoGasto.valor !== undefined && novoGasto.valor > 0 &&
      novoGasto.data &&
      novoGasto.categoria_nome && novoGasto.categoria_nome.trim() !== '' &&
      novoGasto.tipo
    );
  }, [novoGasto]);

  const { data: gastos, isLoading: isLoadingGastos } = useQuery<GastoComTipo[]>({
    queryKey: ['gastos'],
    queryFn: fetchGastos,
  });

  const saveMutation = useMutation({
    mutationFn: saveGasto,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['gastos'] });
      toast({ title: "Sucesso!", description: `Gasto "${data.descricao}" salvo com sucesso.` });
      resetDialog();
    },
    onError: (error) => {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGasto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gastos'] });
      toast({ title: "Sucesso!", description: "Gasto removido com sucesso." });
      setIsConfirmOpen(false);
    },
    onError: (error) => {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
      setIsConfirmOpen(false);
    },
  });

  const handleSalvarGasto = () => {
    if (!isFormValid) {
      toast({ title: "Campos obrigatórios", description: "Todos os campos marcados com * devem ser preenchidos.", variant: "destructive" });
      return;
    }
    saveMutation.mutate(novoGasto);
  };

  const executarExclusao = () => {
    if (!gastoParaExcluir) return;
    deleteMutation.mutate(gastoParaExcluir.id);
  };
  
  const resetDialog = () => {
    setNovoGasto({ data: new Date().toISOString().split('T')[0], tipo: 'ESSENCIAL' });
    setGastoSelecionado(null);
    setIsDialogOpen(false);
    setIsEditMode(false);
  };

  const handleEditarGasto = (gasto: GastoComTipo) => {
    setGastoSelecionado(gasto);
    setNovoGasto({ ...gasto });
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  const handleNovoGasto = () => {
    resetDialog();
    setIsDialogOpen(true);
  };

  const handleAbrirConfirmacaoExclusao = (gasto: GastoComTipo) => {
    setGastoParaExcluir(gasto);
    setIsConfirmOpen(true);
  };

  const gastosFiltrados = useMemo(() =>
    (gastos || []).filter(g => {
      const buscaLower = debouncedSearchTerm.toLowerCase().trim();
      if (buscaLower === "") return true;
      return g.descricao.toLowerCase().includes(buscaLower) || (g.categoria_nome && g.categoria_nome.toLowerCase().includes(buscaLower));
    }), [gastos, debouncedSearchTerm]);
    
  const totalGastos = useMemo(() => gastosFiltrados.reduce((acc, g) => acc + g.valor, 0), [gastosFiltrados]);

  const getTipoBadgeColor = (tipo: string | undefined) => {
    if(!tipo) return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    switch (tipo) {
      case 'ESSENCIAL': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'INVESTIMENTO': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'NAO_ESSENCIAL': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (isLoadingGastos) {
    return <div className="p-8">Carregando lançamentos de gastos...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-6 space-y-6">
        <PageHeader
          title="Controle de Gastos"
          subtitle="Gerencie suas despesas"
          icon={Landmark}
        >
          <Button
            onClick={handleNovoGasto}
            className="text-base border-primary/30 text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-purple-900/50 hover:to-slate-900/50 hover:border-purple-800/50 transform hover:-translate-y-1 transition-all duration-300 group"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2 transition-transform group-hover:rotate-90" />
            Novo Gasto
          </Button>
        </PageHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="card-glass">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-400">{totalGastos.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</div>
              <div className="text-sm text-muted-foreground">Total de Gastos (Filtrado)</div>
            </CardContent>
          </Card>
          <Card className="card-glass">
            <CardContent className="p-4 flex items-center">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input placeholder="Buscar por descrição ou categoria..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="card-glass flex-grow flex flex-col">
        <CardContent className="p-0 flex-grow">
          <div className="overflow-y-auto h-full">
            {gastosFiltrados.length > 0 ? (
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
                  <TableRow className="border-border/50">
                    <TableHead className="w-32">Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="w-48">Categoria</TableHead>
                    <TableHead className="w-48 text-center">Tipo</TableHead>
                    <TableHead className="w-40 text-right">Valor</TableHead>
                    <TableHead className="w-32 text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gastosFiltrados.map((gasto) => (
                    <TableRow key={gasto.id} className="hover:bg-accent/50">
                      <TableCell>{new Date(gasto.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</TableCell>
                      <TableCell className="font-medium truncate" title={gasto.descricao}>{gasto.descricao}</TableCell>
                      <TableCell className="text-muted-foreground">{gasto.categoria_nome}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={cn("min-w-[10rem] justify-center", getTipoBadgeColor(gasto.tipo))}>{gasto.tipo.replace('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-red-400">{gasto.valor.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-center">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleEditarGasto(gasto)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleAbrirConfirmacaoExclusao(gasto)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
                <Landmark className="h-16 w-16 text-muted-foreground/50" />
                <h3 className="text-xl font-semibold text-foreground">
                  Nenhum Gasto Registrado
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm ? "Nenhum resultado encontrado para sua busca." : "Clique em 'Novo Gasto' para adicionar sua primeira despesa."}
                </p>
                <Button
                  onClick={handleNovoGasto}
                  className="bg-gradient-to-r from-purple-700 to-purple-900 text-white transform hover:-translate-y-1 transition-all duration-300 font-semibold rounded-lg flex items-center gap-2 px-4 py-2"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Gasto
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(isOpen) => !isOpen && resetDialog()}>
        <DialogContent className="dialog-glass max-w-lg flex flex-col p-0">
          <Card className="bg-muted/50 rounded-b-none border-b border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
                    <Landmark className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gradient-brand">
                      {isEditMode ? "Editar Gasto" : "Adicionar Novo Gasto"}
                    </h1>
                </div>
              </CardContent>
          </Card>
          <div className="flex-grow space-y-3 px-6 pt-4 pb-6 overflow-y-auto">
            <div className="space-y-2">
              <Label>Descrição <span className="text-red-500">*</span></Label>
              <Input placeholder="Ex: Compra de SSD 1TB" value={novoGasto.descricao || ""} onChange={(e) => setNovoGasto({...novoGasto, descricao: e.target.value})} />
            </div>
            <fieldset disabled={!novoGasto.descricao || novoGasto.descricao.trim() === ''} className="space-y-3 disabled:opacity-50">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor <span className="text-red-500">*</span></Label>
                  <CurrencyInput value={novoGasto.valor} onValueChange={(v) => setNovoGasto({...novoGasto, valor: v})} placeholder="R$ 0,00" />
                </div>
                <div className="space-y-2">
                  <Label>Data <span className="text-red-500">*</span></Label>
                  <DatePicker date={novoGasto.data ? new Date(novoGasto.data) : new Date()} onSelect={(date) => setNovoGasto({...novoGasto, data: date?.toISOString().split('T')[0]})} />
                </div>
              </div>
              <div className="space-y-2">
                  <Label>Categoria <span className="text-red-500">*</span></Label>
                  <Input placeholder="Ex: Ferramentas, Contas, Alimentação" value={novoGasto.categoria_nome || ""} onChange={(e) => setNovoGasto({...novoGasto, categoria_nome: e.target.value})} />
              </div>
               <div className="space-y-2">
                <Label>Tipo <span className="text-red-500">*</span></Label>
                <Select value={novoGasto.tipo || 'ESSENCIAL'} onValueChange={(value: GastoComTipo['tipo']) => setNovoGasto({...novoGasto, tipo: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ESSENCIAL">Essencial</SelectItem>
                    <SelectItem value="INVESTIMENTO">Investimento</SelectItem>
                    <SelectItem value="NAO_ESSENCIAL">Não Essencial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </fieldset>
          </div>
          <DialogFooter className="p-4 border-t border-border/50 bg-muted/50 flex justify-end gap-x-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-colors duration-300">
              Cancelar
            </Button>
            <Button onClick={handleSalvarGasto} disabled={!isFormValid || saveMutation.isPending} className="bg-gradient-to-r from-purple-700 to-purple-900 text-white transform hover:-translate-y-1 transition-all duration-300 font-semibold rounded-lg flex items-center gap-2 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed">
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
        title={`Excluir Gasto: ${gastoParaExcluir?.descricao}?`}
        description="Esta ação não pode ser desfeita. O lançamento será removido permanentemente."
        confirmText="Sim, excluir"
      />
    </div>
  );
}