import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Settings, Plus, Search, Edit, Trash2, Save } from "lucide-react";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Servico } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { fetchServicos, saveServico, deleteServico } from "@/services/servicoService";
import { useDebounce } from "@/hooks/useDebounce";

export default function Servicos() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [servicoSelecionado, setServicoSelecionado] = useState<Servico | null>(null);
  const [novoServico, setNovoServico] = useState<Partial<Servico>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [servicoParaExcluir, setServicoParaExcluir] = useState<Servico | null>(null);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const isFormValid = useMemo(() => {
    return !!novoServico.servico && novoServico.servico.trim() !== '';
  }, [novoServico.servico]);

  const { data: servicos, isLoading, isError, error } = useQuery<Servico[]>({
    queryKey: ['servicos'],
    queryFn: fetchServicos,
    staleTime: 1000 * 60 * 5,
  });

  const saveMutation = useMutation({
    mutationFn: saveServico,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['servicos'] });
      toast({ title: "Sucesso!", description: `Serviço "${data.servico}" salvo com sucesso.` });
      resetDialog();
    },
    onError: (error) => {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteServico,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos'] });
      toast({ title: "Sucesso!", description: "Serviço removido com sucesso." });
      setIsConfirmOpen(false);
    },
    onError: (error) => {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
      setIsConfirmOpen(false);
    },
  });

  const handleSalvarServico = () => {
    if (!isFormValid) {
      toast({ title: "Campo obrigatório", description: "O nome do serviço não pode estar em branco.", variant: "destructive" });
      return;
    }
    saveMutation.mutate(novoServico);
  };

  const executarExclusao = () => {
    if (!servicoParaExcluir) return;
    deleteMutation.mutate(servicoParaExcluir.id);
  };

  const resetDialog = () => {
    setNovoServico({});
    setServicoSelecionado(null);
    setIsDialogOpen(false);
    setIsEditMode(false);
  };

  const handleEditarServico = (servico: Servico) => {
    setServicoSelecionado(servico);
    setNovoServico(servico);
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  const handleNovoServico = () => {
    resetDialog();
    setIsDialogOpen(true);
  };

  const handleAbrirConfirmacaoExclusao = (servico: Servico) => {
    setServicoParaExcluir(servico);
    setIsConfirmOpen(true);
  };

  const servicosFiltrados = useMemo(() =>
    (servicos || []).filter(servico =>
      debouncedSearchTerm.trim().toLowerCase() === "" || servico.servico.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    ), [servicos, debouncedSearchTerm]);

  if (isLoading) return <div className="p-8">Carregando serviços...</div>;
  if (isError) return <div className="p-8 text-red-500">Erro ao carregar dados: {error.message}</div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-6 space-y-6">
        <PageHeader
          title="Serviços"
          subtitle="Gerencie o catálogo de serviços"
          icon={Settings}
        >
          <Button 
            onClick={handleNovoServico}
            className="text-base border-primary/30 text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-purple-900/50 hover:to-slate-900/50 hover:border-purple-800/50 transform hover:-translate-y-1 transition-all duration-300 group"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2 transition-transform group-hover:rotate-90" />
            Novo Serviço
          </Button>
        </PageHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="md:col-span-1 card-glass">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-primary">{servicos?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Total de Serviços</div>
              </div>
            </CardContent>
          </Card>
          <Card className="md:col-span-2 card-glass">
            <CardContent className="p-4 flex items-center">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar serviços..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="card-glass flex-grow flex flex-col">
        <CardContent className="p-0 flex-grow">
          <div className="overflow-y-auto h-full">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
                <TableRow className="border-border/50">
                  <TableHead>Serviço</TableHead>
                  <TableHead className="w-40 text-right">Valor</TableHead>
                  <TableHead className="w-32 text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {servicosFiltrados.length > 0 ? (
                  servicosFiltrados.map((servico) => (
                    <TableRow key={servico.id} className="hover:bg-accent/50">
                      <TableCell className="font-medium">{servico.servico}</TableCell>
                      <TableCell className="text-primary text-right">
                        {(servico.valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-center">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleEditarServico(servico)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleAbrirConfirmacaoExclusao(servico)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="py-24 text-center">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <Settings className="h-16 w-16 text-muted-foreground/50" />
                        <h3 className="text-xl font-semibold">Nenhum Serviço Encontrado</h3>
                        <p className="text-muted-foreground">
                          {searchTerm ? "Nenhum serviço encontrado para sua busca." : "Clique em 'Novo Serviço' para começar."}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={(isOpen) => !isOpen && resetDialog()}>
        <DialogContent className="dialog-glass max-w-lg flex flex-col p-0">
          <Card className="bg-muted/50 rounded-b-none border-b border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gradient-brand">
                  {isEditMode ? "Editar Serviço" : "Adicionar Novo Serviço"}
                </h1>
              </div>
            </CardContent>
          </Card>
          <div className="flex-grow space-y-4 px-6 pt-4 pb-6 max-h-[70vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="servico">Nome do Serviço <span className="text-red-500">*</span></Label>
              <Input
                id="servico"
                placeholder="Ex: Formatação, Limpeza Interna..."
                value={novoServico.servico || ""}
                onChange={(e) => setNovoServico({...novoServico, servico: e.target.value})}
              />
            </div>
            <fieldset disabled={!isFormValid} className="space-y-2 disabled:opacity-50">
              <Label htmlFor="valor">Valor do Serviço</Label>
              <CurrencyInput
                id="valor"
                value={novoServico.valor}
                onValueChange={(value) => {
                  setNovoServico(ns => ({ ...ns, valor: value }));
                }}
              />
            </fieldset>
          </div>
          <DialogFooter className="p-4 border-t border-border/50 bg-muted/50 flex justify-end gap-x-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-colors duration-300">
              Cancelar
            </Button>
            <Button onClick={handleSalvarServico} disabled={!isFormValid || saveMutation.isPending} className="bg-gradient-to-r from-purple-700 to-purple-900 text-white transform hover:-translate-y-1 transition-all duration-300 font-semibold rounded-lg flex items-center gap-2 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed">
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
        title={`Excluir: ${servicoParaExcluir?.servico}?`}
        description="Esta ação não pode ser desfeita. O serviço será permanentemente removido."
        confirmText="Sim, excluir"
      />
    </div>
  );
}