import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { OrdemServicoDB, StatusOs } from "@/types";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { DatePicker } from "@/components/ui/DatePicker";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Save } from "lucide-react";

interface DarBaixaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ordem: OrdemServicoDB | null;
}

export function DarBaixaDialog({ isOpen, onClose, onSuccess, ordem }: DarBaixaDialogProps) {
  const { toast } = useToast();
  const [valorPago, setValorPago] = useState<number | undefined>(undefined);
  const [formaPagamento, setFormaPagamento] = useState("");
  const [dataPagamento, setDataPagamento] = useState<Date | undefined>(new Date());
  const [statusDisponiveis, setStatusDisponiveis] = useState<StatusOs[]>([]);
  const [statusFinalId, setStatusFinalId] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  const isFormValid = useMemo(() => {
    return valorPago !== undefined && valorPago > 0 && dataPagamento;
  }, [valorPago, dataPagamento]);

  const fetchStatus = useCallback(async () => {
    const { data } = await supabase.from('status_os').select('id, status');
    if (data) setStatusDisponiveis(data);
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (statusDisponiveis.length === 0) {
        fetchStatus();
      }
      if (ordem) {
        setValorPago(ordem.valor_restante);
        setFormaPagamento(ordem.forma_pagamento || "");
        setDataPagamento(new Date());
        setStatusFinalId(undefined); 
      }
    }
  }, [isOpen, ordem, statusDisponiveis.length, fetchStatus]);

  const handleSalvarPagamento = async () => {
    if (!ordem || !isFormValid) {
        toast({ title: "Campos Inválidos", description: "Por favor, preencha o valor e a data do pagamento.", variant: "destructive" });
        return;
    }
    setSaving(true);
    
    try {
        const novoValorPagoTotal = (ordem.valor_pago || 0) + (valorPago || 0);
        const novoValorRestante = (ordem.valor_total || 0) - novoValorPagoTotal;

        let statusFinalParaSalvar = statusFinalId;

        if (!statusFinalParaSalvar) {
            if (novoValorRestante <= 0) {
                const statusFinalizado = statusDisponiveis.find(s => s.status.toLowerCase().includes('finalizad') || s.status.toLowerCase().includes('concluíd'));
                if(statusFinalizado) statusFinalParaSalvar = statusFinalizado.id;
            } else {
                const statusParcial = statusDisponiveis.find(s => s.status.toLowerCase().includes('parcial'));
                if (statusParcial) statusFinalParaSalvar = statusParcial.id;
            }
        }
        
        const dadosParaAtualizar: Partial<OrdemServicoDB> = {
            valor_pago: novoValorPagoTotal,
            valor_restante: novoValorRestante < 0 ? 0 : novoValorRestante,
            forma_pagamento: formaPagamento,
            data_entrega: dataPagamento?.toISOString(),
        };

        if (statusFinalParaSalvar) {
            dadosParaAtualizar.status_id = statusFinalParaSalvar;
        }

        const { error } = await supabase
            .from('ordens_servico')
            .update(dadosParaAtualizar)
            .eq('id', ordem.id);

        if (error) throw error;
        
        toast({ title: "Sucesso!", description: "Pagamento registrado com sucesso." });
        onSuccess();

    } catch(error: any) {
        console.error("Erro ao dar baixa na OS:", error);
        toast({ title: "Erro", description: error.message || "Não foi possível registrar o pagamento.", variant: "destructive"});
    } finally {
        setSaving(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="dialog-glass max-w-md flex flex-col p-0">
        {ordem ? (
          <>
            <Card className="bg-muted/50 rounded-b-none border-b border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                    <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gradient-brand">
                      Dar Baixa na OS Nº {ordem.os_number}
                    </h1>
                    <p className="text-xs text-muted-foreground -mt-1">Cliente: {ordem.clientes?.nome || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex-grow space-y-4 px-6 pt-4 pb-6 max-h-[70vh] overflow-y-auto">
                <div className="text-center p-4 rounded-lg bg-background/50 border">
                    <p className="text-sm text-muted-foreground">Valor Pendente</p>
                    <p className="text-3xl font-bold text-red-500">
                        {(ordem.valor_restante || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Valor a Pagar <span className="text-red-500">*</span></Label>
                        <CurrencyInput value={valorPago} onValueChange={setValorPago} placeholder="R$ 0,00" />
                    </div>
                    <div className="space-y-2">
                        <Label>Data do Pagamento <span className="text-red-500">*</span></Label>
                        <DatePicker date={dataPagamento} onSelect={setDataPagamento} />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Forma de Pagamento</Label>
                    <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                            <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                            <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                            <SelectItem value="PIX">PIX</SelectItem>
                            <SelectItem value="Transferência">Transferência</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Forçar Status Final (Opcional)</Label>
                    <Select value={statusFinalId} onValueChange={(value) => setStatusFinalId(value === "automático" ? undefined : value)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Automático (Recomendado)" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="automático">Automático (Recomendado)</SelectItem>
                            {statusDisponiveis.map(status => (
                                <SelectItem key={status.id} value={status.id}>{status.status}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <DialogFooter className="p-4 border-t border-border/50 bg-muted/50 flex justify-end gap-x-4">
              <Button variant="outline" onClick={onClose} className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-colors duration-300">
                Cancelar
              </Button>
              <Button onClick={handleSalvarPagamento} disabled={!isFormValid || saving} className="bg-gradient-to-r from-purple-700 to-purple-900 text-white transform hover:-translate-y-1 transition-all duration-300 font-semibold rounded-lg flex items-center gap-2 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed">
                <Save className="h-4 w-4 mr-2" />
                Confirmar Pagamento
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="p-8 text-center">Carregando informações da OS...</div>
        )}
      </DialogContent>
    </Dialog>
  );
}