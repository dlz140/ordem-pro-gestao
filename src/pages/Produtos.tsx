import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Plus, Search, Edit, Trash2, Save } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Produto, Marca } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn } from "@/lib/utils";
import { fetchProdutos, saveProduto, deleteProduto } from "@/services/produtoService";
import { fetchMarcas } from "@/services/marcaService";

export default function Produtos() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [novoProduto, setNovoProduto] = useState<Partial<Produto>>({});
  const [busca, setBusca] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [produtoParaExcluir, setProdutoParaExcluir] = useState<Produto | null>(null);

  const isFormValid = useMemo(() => {
    return (
      novoProduto.produto &&
      novoProduto.produto.trim() !== '' &&
      novoProduto.marca_id &&
      novoProduto.valor !== undefined &&
      novoProduto.valor > 0 &&
      (novoProduto.novo || novoProduto.usado)
    );
  }, [novoProduto]);

  const { data: produtos, isLoading: isLoadingProdutos } = useQuery<Produto[]>({
    queryKey: ['produtos'],
    queryFn: fetchProdutos,
    staleTime: 1000 * 60 * 5,
  });

  const { data: marcas, isLoading: isLoadingMarcas } = useQuery<Marca[]>({
    queryKey: ['marcas'],
    queryFn: fetchMarcas,
    staleTime: 1000 * 60 * 5,
  });

  const saveMutation = useMutation({
    mutationFn: saveProduto,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast({ title: "Sucesso!", description: `Produto "${data.produto}" salvo com sucesso.` });
      resetDialog();
    },
    onError: (error) => {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast({ title: "Sucesso!", description: "Produto removido com sucesso." });
    },
    onError: (error) => {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
    },
  });

  const handleSalvarProduto = () => {
    if (!isFormValid) {
      toast({ title: "Campos obrigatórios", description: "Todos os campos marcados com * devem ser preenchidos.", variant: "destructive" });
      return;
    }
    saveMutation.mutate(novoProduto);
  };

  const executarExclusao = () => {
    if (!produtoParaExcluir) return;
    deleteMutation.mutate(produtoParaExcluir.id);
  };

  const resetDialog = () => {
    setNovoProduto({ produto: '', valor: undefined, novo: false, usado: false, marca_id: null });
    setProdutoSelecionado(null);
    setIsDialogOpen(false);
    setIsEditMode(false);
  };

  const handleEditarProduto = (produto: Produto) => {
    setProdutoSelecionado(produto);
    setNovoProduto(produto);
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  const handleNovoProduto = () => {
    resetDialog();
    setIsDialogOpen(true);
  };

  const handleAbrirConfirmacaoExclusao = (produto: Produto) => {
    setProdutoParaExcluir(produto);
    setIsConfirmOpen(true);
  };

  const produtosFiltrados = useMemo(() =>
    (produtos || []).filter(produto =>
      busca.trim() === "" || produto.produto.toLowerCase().includes(busca.toLowerCase())
    ), [produtos, busca]);

  const getCondicaoProps = (produto: Produto) => {
    if (produto.novo) return { text: "Novo", className: "bg-transparent text-green-400 border-green-500/30" };
    if (produto.usado) return { text: "Usado", className: "bg-transparent text-yellow-400 border-yellow-500/30" };
    return { text: "N/D", className: "bg-transparent text-gray-400 border-gray-500/30" };
  };
  
  const valorTotal = useMemo(() => (produtos || []).reduce((acc, p) => acc + (p.valor || 0), 0), [produtos]);
  
  const isLoading = isLoadingProdutos || isLoadingMarcas;

  if (isLoading) {
    return <div className="p-8">Carregando produtos...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-6 space-y-6">
        <PageHeader
          title="Produtos"
          subtitle="Gerencie o catálogo de produtos"
          icon={Package}
        >
          <Button
            onClick={handleNovoProduto}
            className="text-base border-primary/30 text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-purple-900/50 hover:to-slate-900/50 hover:border-purple-800/50 transform hover:-translate-y-1 transition-all duration-300 group"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2 transition-transform group-hover:rotate-90" />
            Novo Produto
          </Button>
        </PageHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="card-glass"><CardContent className="p-4"><div className="text-2xl font-bold text-primary">{produtos?.length || 0}</div><div className="text-sm text-muted-foreground">Total de Produtos</div></CardContent></Card>
          <Card className="card-glass"><CardContent className="p-4"><div className="text-2xl font-bold text-green-400">{valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div><div className="text-sm text-muted-foreground">Valor Total em Estoque</div></CardContent></Card>
        </div>
      </div>
      
      <Card className="card-glass flex-grow flex flex-col">
        <CardContent className="p-0 flex-grow">
          <div className="overflow-y-auto h-full">
            {produtosFiltrados.length > 0 ? (
              <Table className="table-fixed w-full">
                <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
                  <TableRow className="border-border/50 bg-muted/30">
                    <TableHead>Produto</TableHead>
                    <TableHead className="w-48">Marca</TableHead>
                    <TableHead className="w-40 text-right">Valor</TableHead>
                    <TableHead className="w-40 text-center">Condição</TableHead>
                    <TableHead className="w-32 text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {produtosFiltrados.map((produto) => {
                    const condicao = getCondicaoProps(produto);
                    return (
                      <TableRow key={produto.id} className="hover:bg-accent/50">
                        <TableCell className="font-medium truncate" title={produto.produto}>{produto.produto}</TableCell>
                        <TableCell className="text-muted-foreground">{produto.marcas?.marca || 'N/A'}</TableCell>
                        <TableCell className="text-primary font-semibold text-right">{(produto.valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={cn("font-medium min-w-[10rem] justify-center", condicao.className)}>{condicao.text}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 justify-center">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleEditarProduto(produto)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleAbrirConfirmacaoExclusao(produto)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
                <Package className="h-16 w-16 text-muted-foreground/50" />
                <h3 className="text-xl font-semibold">Nenhum Produto Cadastrado</h3>
                <p className="text-muted-foreground">Clique em "Novo Produto" para começar.</p>
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
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gradient-brand">
                  {isEditMode ? "Editar Produto" : "Adicionar Novo Produto"}
                </h1>
              </div>
            </CardContent>
          </Card>
          <div className="flex-grow space-y-4 px-6 pt-4 pb-6 max-h-[70vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Nome do Produto <span className="text-red-500">*</span></Label>
              <Input placeholder="Ex: Placa-mãe B450M" value={novoProduto.produto || ""} onChange={(e) => setNovoProduto({...novoProduto, produto: e.target.value})} />
            </div>
            <fieldset disabled={!novoProduto.produto || novoProduto.produto.trim() === ''} className="space-y-4 disabled:opacity-50">
              <div className="space-y-2">
                <Label>Marca <span className="text-red-500">*</span></Label>
                <Select value={novoProduto.marca_id ?? ''} onValueChange={(value) => setNovoProduto({...novoProduto, marca_id: value})}>
                  <SelectTrigger><SelectValue placeholder="Selecione uma marca..." /></SelectTrigger>
                  <SelectContent>
                    {(marcas || []).map(marca => (<SelectItem key={marca.id} value={marca.id}>{marca.marca}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valor do Produto <span className="text-red-500">*</span></Label>
                <CurrencyInput value={novoProduto.valor} onValueChange={(value) => setNovoProduto(np => ({ ...np, valor: value }))} />
              </div>
              <div className="space-y-4">
                <Label>Condição do Produto <span className="text-red-500">*</span></Label>
                <div className="flex items-center gap-6">
                  <div className="flex items-center space-x-2"><Checkbox checked={novoProduto.novo || false} onCheckedChange={(checked) => setNovoProduto({...novoProduto, novo: !!checked, usado: checked ? false : novoProduto.usado})} /><Label>Produto Novo</Label></div>
                  <div className="flex items-center space-x-2"><Checkbox checked={novoProduto.usado || false} onCheckedChange={(checked) => setNovoProduto({...novoProduto, usado: !!checked, novo: checked ? false : novoProduto.novo})} /><Label>Produto Usado</Label></div>
                </div>
              </div>
            </fieldset>
          </div>
          <DialogFooter className="p-4 border-t border-border/50 bg-muted/50 flex justify-end gap-x-4">
            <Button variant="outline" onClick={resetDialog} className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-colors duration-300">
              Cancelar
            </Button>
            <Button onClick={handleSalvarProduto} disabled={!isFormValid || saveMutation.isPending} className="bg-gradient-to-r from-purple-700 to-purple-900 text-white transform hover:-translate-y-1 transition-all duration-300 font-semibold rounded-lg flex items-center gap-2 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed">
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
        title={`Excluir: ${produtoParaExcluir?.produto}?`}
        description="Esta ação não pode ser desfeita. O produto será permanentemente removido."
        confirmText="Sim, excluir"
      />
    </div>
  );
}