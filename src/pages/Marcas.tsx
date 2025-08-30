import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Tag, Plus, Search, Edit, Trash2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { Marca } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";

const fetchMarcas = async (): Promise<Marca[]> => {
  const { data, error } = await supabase
    .from('marcas')
    .select('id, marca')
    .order('marca', { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
};

const saveMarca = async (marcaData: Partial<Marca>): Promise<Marca> => {
  const { id, ...updateData } = marcaData;
  let response;
  if (id) {
    response = await supabase.from('marcas').update(updateData).eq('id', id).select().single();
  } else {
    response = await supabase.from('marcas').insert(updateData).select().single();
  }
  if (response.error) throw new Error(response.error.message);
  return response.data;
};

const deleteMarca = async (id: string): Promise<void> => {
  const { error } = await supabase.from('marcas').delete().eq('id', id);
  if (error) {
    if (error.code === '23503') {
      throw new Error("Ação Bloqueada: Esta marca está sendo utilizada em produtos ou OS.");
    }
    throw new Error(error.message);
  }
};

export default function Marcas() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [marcaSelecionada, setMarcaSelecionada] = useState<Marca | null>(null);
  const [novaMarca, setNovaMarca] = useState<Partial<Marca>>({});
  const [busca, setBusca] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [marcaParaExcluir, setMarcaParaExcluir] = useState<Marca | null>(null);

  const isFormValid = useMemo(() => {
    return !!novaMarca.marca && novaMarca.marca.trim() !== '';
  }, [novaMarca.marca]);

  const { data: marcas, isLoading, isError, error } = useQuery<Marca[]>({
    queryKey: ['marcas'],
    queryFn: fetchMarcas,
  });

  const saveMutation = useMutation({
    mutationFn: saveMarca,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['marcas'] });
      toast({ title: "Sucesso!", description: `Marca "${data.marca}" salva com sucesso.` });
      resetDialog();
    },
    onError: (error) => {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMarca,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marcas'] });
      toast({ title: "Sucesso!", description: "Marca removida com sucesso." });
    },
    onError: (error) => {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
    },
  });

  const handleSalvarMarca = () => {
    if (!isFormValid) {
      toast({ title: "Campo obrigatório", description: "O nome da marca não pode estar em branco.", variant: "destructive" });
      return;
    }
    saveMutation.mutate(novaMarca);
  };

  const executarExclusao = () => {
    if (!marcaParaExcluir) return;
    deleteMutation.mutate(marcaParaExcluir.id);
  };

  const resetDialog = () => {
    setNovaMarca({});
    setMarcaSelecionada(null);
    setIsDialogOpen(false);
    setIsEditMode(false);
  };

  const handleEditarMarca = (marca: Marca) => {
    setMarcaSelecionada(marca);
    setNovaMarca(marca);
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  const handleNovaMarca = () => {
    resetDialog();
    setIsDialogOpen(true);
  };

<<<<<<< HEAD
  // CORREÇÃO 3: Parâmetro 'id' corrigido para number.
  const handleRemoverMarca = async (id: number) => {
    if (!confirm("Deseja realmente remover esta marca?")) return;

    try {
      const { error } = await supabase
        .from('marcas')
        .delete()
        .eq('id', id.toString());

      if (error) throw error;

      await fetchMarcas();
      toast({ title: "Sucesso", description: "Marca removida com sucesso!" });
    } catch (error) {
      console.error('Erro ao remover marca:', error);
      toast({ title: "Erro", description: "Não foi possível remover a marca.", variant: "destructive" });
    }
=======
  const handleAbrirConfirmacaoExclusao = (marca: Marca) => {
    setMarcaParaExcluir(marca);
    setIsConfirmOpen(true);
>>>>>>> 544b8c8 (mensagem do commit)
  };

  const marcasFiltradas = useMemo(() =>
    (marcas || []).filter(marca =>
      busca.trim() === "" || marca.marca.toLowerCase().includes(busca.toLowerCase())
    ), [marcas, busca]);

  if (isLoading) return <div className="p-8">Carregando marcas...</div>;
  if (isError) return <div className="p-8 text-red-500">Erro ao carregar dados: {error.message}</div>;

  return (
    <div className="flex flex-col h-full gap-6">
      <PageHeader
        title="Marcas"
        subtitle="Gerencie as marcas de equipamentos"
        icon={Tag}
      >
        <Button
          onClick={handleNovaMarca}
          className="text-base border-primary/30 text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-purple-900/50 hover:to-slate-900/50 hover:border-purple-800/50 transform hover:-translate-y-1 transition-all duration-300 group"
          variant="outline"
        >
          <Plus className="h-4 w-4 mr-2 transition-transform group-hover:rotate-90" />
          Nova Marca
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="card-glass">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{marcas?.length || 0}</div>
            <div className="text-sm text-muted-foreground">Total de Marcas</div>
          </CardContent>
        </Card>
        <Card className="card-glass">
          <CardContent className="p-4 flex items-center">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder="Buscar marcas..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-10" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="card-glass flex-grow flex flex-col">
        <CardContent className="p-0 flex-grow">
          <div className="overflow-y-auto h-full">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 bg-muted/30">
                  <TableHead>Nome da Marca</TableHead>
                  <TableHead className="w-32 text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {marcasFiltradas.map((marca) => (
                  <TableRow key={marca.id} className="hover:bg-accent/50">
                    <TableCell className="font-medium">{marca.marca}</TableCell>
                    <TableCell>
<<<<<<< HEAD
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditarMarca(marca)}
                          className="hover:bg-primary/20"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoverMarca(Number(marca.id))}
                          className="hover:bg-red-500/20 text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
=======
                      <div className="flex gap-2 justify-center">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleEditarMarca(marca)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleAbrirConfirmacaoExclusao(marca)}><Trash2 className="h-4 w-4" /></Button>
>>>>>>> 544b8c8 (mensagem do commit)
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
        <DialogContent className="dialog-glass max-w-lg flex flex-col p-0">
            <Card className="bg-muted/50 rounded-b-none border-b border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
                  <Tag className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gradient-brand">
                    {isEditMode ? "Editar Marca" : "Adicionar Nova Marca"}
                  </h1>
                </div>
              </CardContent>
            </Card>
          <div className="flex-grow space-y-4 px-6 pt-4 pb-6 max-h-[70vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="marca">Nome da Marca *</Label>
              <Input
                id="marca"
                placeholder="Ex: Dell, HP, Lenovo..."
                value={novaMarca.marca || ""}
                onChange={(e) => setNovaMarca({...novaMarca, marca: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter className="p-4 border-t border-border/50 bg-muted/50 flex justify-end gap-x-4">
            <Button variant="outline" onClick={resetDialog} className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-colors duration-300">
              Cancelar
            </Button>
            <Button onClick={handleSalvarMarca} disabled={!isFormValid || saveMutation.isPending} className="bg-gradient-to-r from-purple-700 to-purple-900 text-white transform hover:-translate-y-1 transition-all duration-300 font-semibold rounded-lg flex items-center gap-2 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed">
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
        title={`Excluir: ${marcaParaExcluir?.marca}?`}
        description="Esta ação não pode ser desfeita. A marca será removida permanentemente."
        confirmText="Sim, excluir"
      />
    </div>
  );
}