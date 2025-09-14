import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Wrench, Plus, Search, Edit, Trash2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { Equipamento } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { fetchEquipamentos, saveEquipamento, deleteEquipamento } from "@/services/equipamentoService";
import { useDebounce } from "@/hooks/useDebounce";

export default function Equipamentos() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [equipamentoSelecionado, setEquipamentoSelecionado] = useState<Equipamento | null>(null);
  const [novoEquipamento, setNovoEquipamento] = useState<Partial<Equipamento>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [equipamentoParaExcluir, setEquipamentoParaExcluir] = useState<Equipamento | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const isFormValid = useMemo(() => {
    return !!novoEquipamento.tipo && novoEquipamento.tipo.trim() !== '';
  }, [novoEquipamento.tipo]);

  const { data: equipamentos, isLoading, isError, error } = useQuery<Equipamento[]>({
    queryKey: ['equipamentos'],
    queryFn: fetchEquipamentos,
    staleTime: 1000 * 60 * 5,
  });

  const saveMutation = useMutation({
    mutationFn: saveEquipamento,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['equipamentos'] });
      toast({ title: "Sucesso!", description: `Equipamento "${data.tipo}" salvo com sucesso.` });
      resetDialog();
    },
    onError: (error) => {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEquipamento,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipamentos'] });
      toast({ title: "Sucesso!", description: "Equipamento removido com sucesso." });
      setIsConfirmOpen(false);
    },
    onError: (error) => {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
      setIsConfirmOpen(false);
    },
  });

  const handleSalvarEquipamento = () => {
    if (!isFormValid) {
      toast({ title: "Campo obrigatório", description: "O nome do tipo de equipamento é obrigatório.", variant: "destructive" });
      return;
    }
    saveMutation.mutate(novoEquipamento);
  };

  const executarExclusao = () => {
    if (!equipamentoParaExcluir) return;
    deleteMutation.mutate(equipamentoParaExcluir.id);
  };

  const resetDialog = () => {
    setNovoEquipamento({});
    setEquipamentoSelecionado(null);
    setIsDialogOpen(false);
    setIsEditMode(false);
  };

  const handleEditarEquipamento = (equipamento: Equipamento) => {
    setEquipamentoSelecionado(equipamento);
    setNovoEquipamento(equipamento);
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  const handleNovoEquipamento = () => {
    resetDialog();
    setIsDialogOpen(true);
  };

  const handleAbrirConfirmacaoExclusao = (equipamento: Equipamento) => {
    setEquipamentoParaExcluir(equipamento);
    setIsConfirmOpen(true);
  };

  const equipamentosFiltrados = useMemo(() =>
    (equipamentos || []).filter(equipamento =>
      debouncedSearchTerm.trim().toLowerCase() === "" || equipamento.tipo.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    ), [equipamentos, debouncedSearchTerm]);

  if (isLoading) return <div className="p-8">Carregando equipamentos...</div>;
  if (isError) return <div className="p-8 text-red-500">Erro ao carregar dados: {error.message}</div>;

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-6 space-y-6">
        <PageHeader
          title="Equipamentos"
          subtitle="Gerencie os tipos de equipamentos"
          icon={Wrench}
        >
          <Button
            onClick={handleNovoEquipamento}
            className="text-base border-primary/30 text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-purple-900/50 hover:to-slate-900/50 hover:border-purple-800/50 transform hover:-translate-y-1 transition-all duration-300 group"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2 transition-transform group-hover:rotate-90" />
            Novo Tipo
          </Button>
        </PageHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="card-glass">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary">{equipamentos?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Tipos Cadastrados</div>
            </CardContent>
          </Card>
          <Card className="card-glass">
            <CardContent className="p-4 flex items-center">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar tipos..."
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
            {equipamentosFiltrados.length > 0 ? (
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
                  <TableRow className="border-border/50">
                    <TableHead>Nome do Tipo de Equipamento</TableHead>
                    <TableHead className="w-32 text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {equipamentosFiltrados.map((equipamento) => (
                    <TableRow key={equipamento.id} className="hover:bg-accent/50">
                      <TableCell className="font-medium">{equipamento.tipo}</TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-center">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleEditarEquipamento(equipamento)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleAbrirConfirmacaoExclusao(equipamento)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
                <Wrench className="h-16 w-16 text-muted-foreground/50" />
                <h3 className="text-xl font-semibold">Nenhum Tipo de Equipamento Encontrado</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? "Nenhum tipo encontrado para sua busca." : "Clique em 'Novo Tipo' para começar."}
                </p>
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
                <Wrench className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gradient-brand">
                  {isEditMode ? "Editar Tipo de Equipamento" : "Adicionar Novo Tipo"}
                </h1>
              </div>
            </CardContent>
          </Card>
          <div className="flex-grow space-y-4 px-6 pt-4 pb-6 max-h-[70vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="tipo">Nome do Tipo <span className="text-red-500">*</span></Label>
              <Input
                id="tipo"
                placeholder="Ex: Notebook, Desktop, Impressora..."
                value={novoEquipamento.tipo || ""}
                onChange={(e) => setNovoEquipamento({ ...novoEquipamento, tipo: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="p-4 border-t border-border/50 bg-muted/50 flex justify-end gap-x-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-colors duration-300">
              Cancelar
            </Button>
            <Button onClick={handleSalvarEquipamento} disabled={!isFormValid || saveMutation.isPending} className="bg-gradient-to-r from-purple-700 to-purple-900 text-white transform hover:-translate-y-1 transition-all duration-300 font-semibold rounded-lg flex items-center gap-2 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed">
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
        title={`Excluir: ${equipamentoParaExcluir?.tipo}?`}
        description="Esta ação não pode ser desfeita. O tipo de equipamento será removido permanentemente."
        confirmText="Sim, excluir"
      />
    </div>
  );
}