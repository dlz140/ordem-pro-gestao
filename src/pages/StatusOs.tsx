import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Search, Edit, Trash2, Save, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { StatusOs } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn } from "@/lib/utils";

const fetchStatus = async (): Promise<StatusOs[]> => {
  const { data, error } = await supabase
    .from('status_os')
    .select('id, status, cor')
    .order('status', { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
};

const saveStatus = async (statusData: Partial<StatusOs>): Promise<StatusOs> => {
  const { id, ...updateData } = statusData;
  const dadosParaBanco = { 
    status: updateData.status,
    cor: updateData.cor 
  };

  let response;
  if (id) {
    response = await supabase.from('status_os').update(dadosParaBanco).eq('id', id).select().single();
  } else {
    response = await supabase.from('status_os').insert(dadosParaBanco).select().single();
  }
  if (response.error) throw new Error(response.error.message);
  return response.data;
};

const deleteStatus = async (id: string): Promise<void> => {
  const { error } = await supabase.from('status_os').delete().eq('id', id);
  if (error) {
    if (error.code === '23503') {
      throw new Error("Ação Bloqueada: Este status está sendo utilizado em Ordens de Serviço.");
    }
    throw new Error(error.message);
  }
};

const colorPalette = [
  { name: 'slate', className: 'bg-slate-500',textColor: 'text-slate-400', borderColor: 'border-slate-500/30' },
  { name: 'red', className: 'bg-red-500', textColor: 'text-red-400', borderColor: 'border-red-500/30' },
  { name: 'orange', className: 'bg-orange-500', textColor: 'text-orange-400', borderColor: 'border-orange-500/30' },
  { name: 'amber', className: 'bg-amber-500', textColor: 'text-amber-400', borderColor: 'border-amber-500/30' },
  { name: 'yellow', className: 'bg-yellow-500', textColor: 'text-yellow-400', borderColor: 'border-yellow-500/30' },
  { name: 'lime', className: 'bg-lime-500', textColor: 'text-lime-400', borderColor: 'border-lime-500/30' },
  { name: 'green', className: 'bg-green-500', textColor: 'text-green-400', borderColor: 'border-green-500/30' },
  { name: 'emerald', className: 'bg-emerald-500', textColor: 'text-emerald-400', borderColor: 'border-emerald-500/30' },
  { name: 'teal', className: 'bg-teal-500', textColor: 'text-teal-400', borderColor: 'border-teal-500/30' },
];

const getColorClasses = (colorName?: string | null) => {
    const color = colorPalette.find(c => c.name === colorName);
    if (!color) {
      return `bg-transparent text-gray-400 border-gray-500/30`;
    }
    return `bg-transparent ${color.textColor} ${color.borderColor}`;
};

export default function StatusOs() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [statusSelecionado, setStatusSelecionado] = useState<StatusOs | null>(null);
  const [novoStatus, setNovoStatus] = useState<Partial<StatusOs>>({});
  const [busca, setBusca] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [statusParaExcluir, setStatusParaExcluir] = useState<StatusOs | null>(null);

  const isFormValid = useMemo(() => {
    return (
      novoStatus.status && novoStatus.status.trim() !== '' &&
      novoStatus.cor
    );
  }, [novoStatus]);
  
  const { data: statusList, isLoading, isError, error } = useQuery<StatusOs[]>({
    queryKey: ['statusOs'],
    queryFn: fetchStatus,
  });

  const saveMutation = useMutation({
    mutationFn: saveStatus,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['statusOs'] });
      toast({ title: "Sucesso!", description: `Status "${data.status}" salvo com sucesso.` });
      resetDialog();
    },
    onError: (error) => {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statusOs'] });
      toast({ title: "Sucesso!", description: "Status removido com sucesso." });
    },
    onError: (error) => {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
    },
  });

  const handleSalvarStatus = () => {
    if (!isFormValid) {
      toast({ title: "Campos obrigatórios", description: "O nome e a cor do status são obrigatórios.", variant: "destructive" });
      return;
    }

    const isDuplicate = (statusList || []).some(
      s => s.status.trim().toLowerCase() === novoStatus.status!.trim().toLowerCase() && s.id !== novoStatus.id
    );

    if (isDuplicate) {
      toast({ title: "Erro", description: "Já existe um status com este nome.", variant: "destructive" });
      return;
    }

    saveMutation.mutate(novoStatus);
  };

  const executarExclusao = () => {
    if (!statusParaExcluir) return;
    deleteMutation.mutate(statusParaExcluir.id);
  };

  const resetDialog = () => {
    setNovoStatus({ cor: 'slate' });
    setStatusSelecionado(null);
    setIsDialogOpen(false);
    setIsEditMode(false);
  };

  const handleEditarStatus = (status: StatusOs) => {
    setStatusSelecionado(status);
    setNovoStatus(status);
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  const handleNovoStatus = () => {
    resetDialog();
    setIsDialogOpen(true);
  };

  const handleAbrirConfirmacaoExclusao = (status: StatusOs) => {
    setStatusParaExcluir(status);
    setIsConfirmOpen(true);
  };

  const statusFiltrados = useMemo(() =>
    (statusList || []).filter(s =>
      busca.trim() === "" || s.status.toLowerCase().includes(busca.toLowerCase())
    ), [statusList, busca]);

  const usedColors = useMemo(() => {
    return (statusList || [])
      .filter(s => s.id !== statusSelecionado?.id)
      .map(s => s.cor)
      .filter((c): c is string => !!c);
  }, [statusList, statusSelecionado]);

  if (isLoading) return <div className="p-8">Carregando status...</div>;
  if (isError) return <div className="p-8 text-red-500">Erro ao carregar dados: {error.message}</div>;

  return (
    <div className="flex flex-col h-full gap-6">
      <PageHeader
        title="Status da OS"
        subtitle="Gerencie os status e suas cores"
        icon={FileText}
      >
        <Button
          onClick={handleNovoStatus}
          className="text-base border-primary/30 text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-purple-900/50 hover:to-slate-900/50 hover:border-purple-800/50 transform hover:-translate-y-1 transition-all duration-300 group"
          variant="outline"
        >
          <Plus className="h-4 w-4 mr-2 transition-transform group-hover:rotate-90" />
          Novo Status
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="card-glass">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{statusList?.length || 0}</div>
            <div className="text-sm text-muted-foreground">Status Disponíveis</div>
          </CardContent>
        </Card>
        <Card className="card-glass">
          <CardContent className="p-4 flex items-center">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder="Buscar status..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-10" />
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
                  <TableHead>Nome do Status</TableHead>
                  <TableHead className="w-48 text-center">Visualização</TableHead>
                  <TableHead className="w-32 text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statusFiltrados.map((statusItem) => (
                  <TableRow key={statusItem.id} className="hover:bg-accent/50">
                    <TableCell className="font-medium">{statusItem.status}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={cn("font-medium min-w-[10rem] justify-center", getColorClasses(statusItem.cor))}>
                        {statusItem.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-center">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleEditarStatus(statusItem)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleAbrirConfirmacaoExclusao(statusItem)}><Trash2 className="h-4 w-4" /></Button>
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
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gradient-brand">
                  {isEditMode ? "Editar Status" : "Adicionar Novo Status"}
                </h1>
              </div>
            </CardContent>
          </Card>
          <div className="flex-grow space-y-4 px-6 pt-4 pb-6 max-h-[70vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="status">Nome do Status <span className="text-red-500">*</span></Label>
              <Input
                id="status"
                placeholder="Ex: Em Análise, Aguardando Cliente..."
                value={novoStatus.status || ""}
                onChange={(e) => setNovoStatus({ ...novoStatus, status: e.target.value })}
              />
            </div>
            <fieldset className="space-y-2 disabled:opacity-50" disabled={!novoStatus.status || novoStatus.status.trim() === ''}>
              <Label>Cor <span className="text-red-500">*</span></Label>
              <div className="flex flex-wrap gap-2">
                {colorPalette.map(color => {
                  const isDisabled = usedColors.includes(color.name);
                  return (
                    <Button 
                      key={color.name}
                      variant="outline"
                      size="icon"
                      title={color.name}
                      className={cn(
                        "h-8 w-8 rounded-full border-2 transition-all",
                        isDisabled 
                          ? 'bg-slate-800 border-slate-700 cursor-not-allowed' 
                          : color.className,
                        novoStatus.cor === color.name ? 'border-foreground' : 'border-transparent'
                      )}
                      onClick={() => setNovoStatus({ ...novoStatus, cor: color.name })}
                      disabled={isDisabled}
                    >
                      {novoStatus.cor === color.name && <Check className="h-4 w-4 text-white" />}
                    </Button>
                  )}
                )}
              </div>
            </fieldset>
          </div>
          <DialogFooter className="p-4 border-t border-border/50 bg-muted/50 flex justify-end gap-x-4">
            <Button variant="outline" onClick={resetDialog} className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-colors duration-300">
              Cancelar
            </Button>
            <Button onClick={handleSalvarStatus} disabled={!isFormValid || saveMutation.isPending} className="bg-gradient-to-r from-purple-700 to-purple-900 text-white transform hover:-translate-y-1 transition-all duration-300 font-semibold rounded-lg flex items-center gap-2 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed">
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
        title={`Excluir: ${statusParaExcluir?.status}?`}
        description="Esta ação não pode ser desfeita. O status será removido permanentemente."
        confirmText="Sim, excluir"
      />
    </div>
  );
}