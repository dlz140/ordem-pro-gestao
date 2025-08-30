import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, DollarSign, Trash2 } from "lucide-react";

interface OrdemServico {
  id: string;
  dataOS: string;
  nomeCliente: string;
  equipamento: string;
  marca: string;
  defeito: string;
  observacoes: string;
  dataEntrega?: string;
  dataSaida?: string;
  dataPagamento?: string;
  statusOS: string;
  servico: string;
  produtos: string;
  valorTotal: number;
  valorPago: number;
  valorRestante: number;
  formaPagamento: string;
}

interface ProdutoServico {
  id: string;
  data: string;
  descricao: string;
  equipamento: string;
  marca: string;
  quantidade: number;
  valor: number;
  desconto: number;
  total: number;
}

interface OrdemServicoFormLayoutProps {
  ordem: Partial<OrdemServico>;
  setOrdem: (ordem: Partial<OrdemServico>) => void;
  onSave: () => void;
  isViewMode: boolean;
  isEditMode: boolean;
}

export function OrdemServicoFormLayout({ 
  ordem, 
  setOrdem, 
  onSave, 
  isViewMode, 
  isEditMode 
}: OrdemServicoFormLayoutProps) {
  const [produtoServico, setProdutoServico] = useState({
    data: "",
    descricao: "",
    equipamento: "",
    marca: "",
    quantidade: 1,
    valor: 0,
    desconto: 0
  });
  
  const [produtosServicos, setProdutosServicos] = useState<ProdutoServico[]>([]);
  const [showBaixaDialog, setShowBaixaDialog] = useState(false);
  const [valorPago, setValorPago] = useState(0);
  const [formaPagamentoBaixa, setFormaPagamentoBaixa] = useState("");

  const handleInputChange = (field: keyof OrdemServico, value: any) => {
    setOrdem({ ...ordem, [field]: value });
  };

  const calcularTotal = () => {
    return produtosServicos.reduce((total, item) => total + item.total, 0);
  };

  const adicionarProdutoServico = () => {
    if (!produtoServico.descricao) return;
    
    const total = (produtoServico.quantidade * produtoServico.valor) - produtoServico.desconto;
    const novoItem: ProdutoServico = {
      id: Date.now().toString(),
      ...produtoServico,
      total
    };
    
    setProdutosServicos([...produtosServicos, novoItem]);
    setProdutoServico({
      data: "",
      descricao: "",
      equipamento: "",
      marca: "",
      quantidade: 1,
      valor: 0,
      desconto: 0
    });
    
    const novoTotal = calcularTotal() + total;
    setOrdem({ ...ordem, valorTotal: novoTotal });
  };

  const removerProdutoServico = (id: string) => {
    const novaLista = produtosServicos.filter(item => item.id !== id);
    setProdutosServicos(novaLista);
    const novoTotal = novaLista.reduce((total, item) => total + item.total, 0);
    setOrdem({ ...ordem, valorTotal: novoTotal });
  };

  const darBaixa = () => {
    const valorRestante = (ordem.valorTotal || 0) - valorPago;
    setOrdem({ 
      ...ordem, 
      valorPago: (ordem.valorPago || 0) + valorPago,
      valorRestante,
      formaPagamento: formaPagamentoBaixa,
      dataPagamento: new Date().toISOString().split('T')[0]
    });
    setShowBaixaDialog(false);
    setValorPago(0);
    setFormaPagamentoBaixa("");
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header com botões */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Ordem de Serviço</h1>
        <div className="flex gap-2">
          <Button onClick={onSave} disabled={isViewMode}>
            Salvar
          </Button>
          <Dialog open={showBaixaDialog} onOpenChange={setShowBaixaDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={isViewMode}>
                <DollarSign className="h-4 w-4 mr-2" />
                Dar Baixa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dar Baixa na Ordem de Serviço</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="valor-pago">Valor Pago</Label>
                  <Input
                    id="valor-pago"
                    type="number"
                    step="0.01"
                    value={valorPago}
                    onChange={(e) => setValorPago(Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="forma-pagamento-baixa">Forma de Pagamento</Label>
                  <Select value={formaPagamentoBaixa} onValueChange={setFormaPagamentoBaixa}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="PIX">PIX</SelectItem>
                      <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                      <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={darBaixa} className="w-full">
                  Confirmar Baixa
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Formulário Principal */}
      <Card>
        <CardContent className="p-6">
          {/* Primeira linha */}
          <div className="grid grid-cols-12 gap-4 mb-6">
            <div className="col-span-1">
              <Label htmlFor="numero">Nº OS</Label>
              <Input
                id="numero"
                value={ordem.id || ""}
                disabled
                className="bg-muted font-bold text-center"
              />
            </div>
            
            <div className="col-span-4">
              <Label htmlFor="cliente">Cliente:</Label>
              <Input
                id="cliente"
                placeholder="Nome do cliente"
                value={ordem.nomeCliente || ""}
                onChange={(e) => handleInputChange('nomeCliente', e.target.value)}
                disabled={isViewMode}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="equipamento">Equipamento:</Label>
              <Select
                value={ordem.equipamento || ""}
                onValueChange={(value) => handleInputChange('equipamento', value)}
                disabled={isViewMode}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Notebook">Notebook</SelectItem>
                  <SelectItem value="Celular">Celular</SelectItem>
                  <SelectItem value="Tablet">Tablet</SelectItem>
                  <SelectItem value="Diversos">Diversos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label htmlFor="marca">Marca:</Label>
              <Select
                value={ordem.marca || ""}
                onValueChange={(value) => handleInputChange('marca', value)}
                disabled={isViewMode}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Samsung">Samsung</SelectItem>
                  <SelectItem value="Apple">Apple</SelectItem>
                  <SelectItem value="Lenovo">Lenovo</SelectItem>
                  <SelectItem value="HP">HP</SelectItem>
                  <SelectItem value="Dell">Dell</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-1">
              <Label htmlFor="data-entrega">Data Entrega:</Label>
              <Input
                id="data-entrega"
                type="date"
                value={ordem.dataEntrega || ""}
                onChange={(e) => handleInputChange('dataEntrega', e.target.value)}
                disabled={isViewMode}
              />
            </div>

            <div className="col-span-1">
              <Label htmlFor="data-saida">Data Saída:</Label>
              <Input
                id="data-saida"
                type="date"
                value={ordem.dataSaida || ""}
                onChange={(e) => handleInputChange('dataSaida', e.target.value)}
                disabled={isViewMode}
              />
            </div>

            <div className="col-span-1">
              <Label htmlFor="data-pagamento">Data Pagamento:</Label>
              <Input
                id="data-pagamento"
                type="date"
                value={ordem.dataPagamento || ""}
                onChange={(e) => handleInputChange('dataPagamento', e.target.value)}
                disabled={isViewMode}
              />
            </div>
          </div>

          {/* Segunda linha - Descrições e Status */}
          <div className="grid grid-cols-12 gap-4 mb-6">
            <div className="col-span-4">
              <Label htmlFor="problema">Descrição do problema:</Label>
              <Textarea
                id="problema"
                className="h-32 resize-none"
                value={ordem.defeito || ""}
                onChange={(e) => handleInputChange('defeito', e.target.value)}
                disabled={isViewMode}
              />
            </div>
            
            <div className="col-span-4">
              <Label htmlFor="observacoes">Observações:</Label>
              <Textarea
                id="observacoes"
                className="h-32 resize-none"
                value={ordem.observacoes || ""}
                onChange={(e) => handleInputChange('observacoes', e.target.value)}
                disabled={isViewMode}
              />
            </div>

            <div className="col-span-4 space-y-4">
              <div>
                <Label htmlFor="status">Estatus:</Label>
                <Select
                  value={ordem.statusOS || "Aberta"}
                  onValueChange={(value) => handleInputChange('statusOS', value)}
                  disabled={isViewMode}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aberta">Aberta</SelectItem>
                    <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                    <SelectItem value="Concluída">Concluída</SelectItem>
                    <SelectItem value="Cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="servico">Serviço:</Label>
                  <Select
                    value={ordem.servico || ""}
                    onValueChange={(value) => handleInputChange('servico', value)}
                    disabled={isViewMode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Formatação">Formatação</SelectItem>
                      <SelectItem value="Reparo">Reparo</SelectItem>
                      <SelectItem value="Limpeza">Limpeza</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="produto">Produto:</Label>
                  <Select
                    value={ordem.produtos || ""}
                    onValueChange={(value) => handleInputChange('produtos', value)}
                    disabled={isViewMode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tela">Tela</SelectItem>
                      <SelectItem value="Bateria">Bateria</SelectItem>
                      <SelectItem value="Memória">Memória</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Valores */}
              <div className="space-y-2">
                <div className="text-sm font-medium">
                  Valor Total: R$ {(ordem.valorTotal || 0).toFixed(2)}
                </div>
                <div className="text-sm">
                  Valor Pago: R$ {(ordem.valorPago || 0).toFixed(2)}
                </div>
                <div className={`text-sm font-medium ${
                  (ordem.valorRestante || 0) > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {(ordem.valorRestante || 0) > 0 
                    ? `Débito: R$ ${(ordem.valorRestante || 0).toFixed(2)}`
                    : 'Quitado'
                  }
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Produtos e serviços */}
      <Card className="border-red-500 border-2">
        <CardHeader className="bg-red-50">
          <CardTitle className="text-red-700">Produtos e serviços:</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {/* Formulário para adicionar produtos/serviços */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            <div>
              <Label htmlFor="data" className="text-xs">Data:</Label>
              <Input
                id="data"
                type="date"
                value={produtoServico.data}
                onChange={(e) => setProdutoServico({...produtoServico, data: e.target.value})}
                disabled={isViewMode}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label htmlFor="descricao" className="text-xs">Descrição:</Label>
              <Input
                id="descricao"
                value={produtoServico.descricao}
                onChange={(e) => setProdutoServico({...produtoServico, descricao: e.target.value})}
                disabled={isViewMode}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label htmlFor="equipamento-ps" className="text-xs">Equipamento:</Label>
              <Input
                id="equipamento-ps"
                value={produtoServico.equipamento}
                onChange={(e) => setProdutoServico({...produtoServico, equipamento: e.target.value})}
                disabled={isViewMode}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label htmlFor="marca-ps" className="text-xs">Marca:</Label>
              <Input
                id="marca-ps"
                value={produtoServico.marca}
                onChange={(e) => setProdutoServico({...produtoServico, marca: e.target.value})}
                disabled={isViewMode}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label htmlFor="qtd" className="text-xs">Qtd:</Label>
              <Input
                id="qtd"
                type="number"
                value={produtoServico.quantidade}
                onChange={(e) => setProdutoServico({...produtoServico, quantidade: Number(e.target.value)})}
                disabled={isViewMode}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label htmlFor="valor" className="text-xs">Valor:</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                value={produtoServico.valor}
                onChange={(e) => setProdutoServico({...produtoServico, valor: Number(e.target.value)})}
                disabled={isViewMode}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label htmlFor="desconto" className="text-xs">Desconto:</Label>
              <Input
                id="desconto"
                type="number"
                step="0.01"
                value={produtoServico.desconto}
                onChange={(e) => setProdutoServico({...produtoServico, desconto: Number(e.target.value)})}
                disabled={isViewMode}
                className="h-8 text-xs"
              />
            </div>
          </div>
          
          <div className="flex gap-2 mb-4">
            <div className="flex-1">
              <Label htmlFor="total-item" className="text-xs">Total:</Label>
              <Input
                id="total-item"
                value={`R$ ${((produtoServico.quantidade * produtoServico.valor) - produtoServico.desconto).toFixed(2)}`}
                disabled
                className="h-8 text-xs bg-muted"
              />
            </div>
            <Button 
              onClick={adicionarProdutoServico} 
              disabled={isViewMode || !produtoServico.descricao}
              className="mt-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>

          {/* Lista de produtos/serviços adicionados */}
          {produtosServicos.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Data</TableHead>
                  <TableHead className="text-xs">Descrição</TableHead>
                  <TableHead className="text-xs">Equipamento</TableHead>
                  <TableHead className="text-xs">Marca</TableHead>
                  <TableHead className="text-xs">Qtd</TableHead>
                  <TableHead className="text-xs">Valor</TableHead>
                  <TableHead className="text-xs">Desconto</TableHead>
                  <TableHead className="text-xs">Total</TableHead>
                  <TableHead className="text-xs">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {produtosServicos.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-xs">{item.data}</TableCell>
                    <TableCell className="text-xs">{item.descricao}</TableCell>
                    <TableCell className="text-xs">{item.equipamento}</TableCell>
                    <TableCell className="text-xs">{item.marca}</TableCell>
                    <TableCell className="text-xs">{item.quantidade}</TableCell>
                    <TableCell className="text-xs">R$ {item.valor.toFixed(2)}</TableCell>
                    <TableCell className="text-xs">R$ {item.desconto.toFixed(2)}</TableCell>
                    <TableCell className="text-xs font-medium">R$ {item.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removerProdutoServico(item.id)}
                        disabled={isViewMode}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}