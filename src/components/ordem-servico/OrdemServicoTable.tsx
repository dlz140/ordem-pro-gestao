import { Button } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

type OrdemComJoins = {
  id: string;
  data_os: string;
  nome_cliente: string;
  telefone: string;
  equipamento: string;
  marca: string | null;
  modelo: string | null;
  defeito: string | null;
  valor_total: number;
  valor_pago: number;
  valor_restante: number;
  status_os: string;
  forma_pagamento: string | null;
  observacoes: string | null;
  data_entrega: string | null;
  servico: string | null;
  produtos: string | null;
  created_at: string;
  updated_at: string;
};

interface OrdemServicoTableProps {
  ordens: OrdemComJoins[];
  onView: (ordem: OrdemComJoins) => void;
  onDelete: (ordem: OrdemComJoins) => void;
  onDarBaixa: (ordem: OrdemComJoins) => void;
}

const colorPalette = [
  { name: 'slate', textColor: 'text-slate-400', borderColor: 'border-slate-500/30' },
  { name: 'red', textColor: 'text-red-400', borderColor: 'border-red-500/30' },
  { name: 'orange', textColor: 'text-orange-400', borderColor: 'border-orange-500/30' },
  { name: 'amber', textColor: 'text-amber-400', borderColor: 'border-amber-500/30' },
  { name: 'yellow', textColor: 'text-yellow-400', borderColor: 'border-yellow-500/30' },
  { name: 'lime', textColor: 'text-lime-400', borderColor: 'border-lime-500/30' },
  { name: 'green', textColor: 'text-green-400', borderColor: 'border-green-500/30' },
  { name: 'emerald', textColor: 'text-emerald-400', borderColor: 'border-emerald-500/30' },
  { name: 'teal', textColor: 'text-teal-400', borderColor: 'border-teal-500/30' },
  { name: 'cyan', textColor: 'text-cyan-400', borderColor: 'border-cyan-500/30' },
  { name: 'sky', textColor: 'text-sky-400', borderColor: 'border-sky-500/30' },
  { name: 'blue', textColor: 'text-blue-400', borderColor: 'border-blue-500/30' },
  { name: 'indigo', textColor: 'text-indigo-400', borderColor: 'border-indigo-500/30' },
  { name: 'violet', textColor: 'text-violet-400', borderColor: 'border-violet-500/30' },
  { name: 'purple', textColor: 'text-purple-400', borderColor: 'border-purple-500/30' },
  { name: 'fuchsia', textColor: 'text-fuchsia-400', borderColor: 'border-fuchsia-500/30' },
  { name: 'pink', textColor: 'text-pink-400', borderColor: 'border-pink-500/30' },
  { name: 'rose', textColor: 'text-rose-400', borderColor: 'border-rose-500/30' },
];

const getColorClasses = (colorName?: string | null) => {
  const color = colorPalette.find(c => c.name === colorName);
  if (!color) {
    return `bg-transparent text-gray-400 border-gray-500/30`;
  }
  return `bg-transparent ${color.textColor} ${color.borderColor}`;
};

const TableHeaderCell = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <TableHead className={`border-r border-border/50 last:border-r-0 ${className}`}>{children}</TableHead>
);

export function OrdemServicoTable({ ordens, onView, onDelete, onDarBaixa }: OrdemServicoTableProps) {
  return (
    <Table className="table-fixed w-full">
      <TableHeader>
        <TableRow className="border-border/50 bg-muted/30">
          <TableHeaderCell className="w-16 text-center">OS</TableHeaderCell>
          <TableHeaderCell className="text-left">Cliente</TableHeaderCell>
          <TableHeaderCell className="w-32 text-center">Equipamento</TableHeaderCell>
          <TableHeaderCell className="w-28 text-center">Data</TableHeaderCell>
          <TableHeaderCell className="w-44 text-center">Status</TableHeaderCell>
          <TableHeaderCell className="w-32 text-right">Valor Total</TableHeaderCell>
          <TableHeaderCell className="w-32 text-right">Valor Pago</TableHeaderCell>
          <TableHeaderCell className="w-32 text-right">Saldo</TableHeaderCell>
          <TableHeaderCell className="w-28 text-center">Ações</TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ordens.map((ordem) => {
          const saldo = ordem.valor_restante || 0;
          return (
            <TableRow key={ordem.id} className="hover:bg-accent/50">
              <TableCell className="py-3 px-4 font-semibold text-center">#{ordem.id.slice(-6)}</TableCell>
              <TableCell 
                className="py-3 px-4 truncate" 
                title={ordem.nome_cliente || "Cliente não informado"}
              >
                {ordem.nome_cliente || "N/A"}
              </TableCell>
              <TableCell className="py-3 px-4 text-center">{ordem.equipamento || "N/A"}</TableCell>
              <TableCell className="py-3 px-4 text-center">{new Date(ordem.data_os).toLocaleDateString("pt-BR", { timeZone: 'UTC' })}</TableCell>
              <TableCell className="py-3 px-4 text-center">
                <Badge className={cn("justify-center min-w-[10rem]", getColorClasses('slate'))}>
                  {ordem.status_os || 'Indefinido'}
                </Badge>
              </TableCell>
              <TableCell className="py-3 px-4 font-medium text-blue-400 text-right">
                {(ordem.valor_total || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </TableCell>
              <TableCell className="py-3 px-4 font-medium text-green-500 text-right">
                {(ordem.valor_pago || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </TableCell>
              <TableCell className={`py-3 px-4 font-bold text-right ${saldo > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {saldo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </TableCell>
              <TableCell className="py-3 px-4 text-center">
                <div className="flex gap-2 justify-center items-center">
                  <Button variant="outline" size="icon" onClick={() => onDarBaixa(ordem)} className="h-8 w-8 bg-green-500/10 border-green-500/20 text-green-500 hover:bg-green-500/20 hover:text-green-400">
                    <DollarSign className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => onView(ordem)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDelete(ordem)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
