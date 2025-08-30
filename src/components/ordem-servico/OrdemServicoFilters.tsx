import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter } from "lucide-react";
import { StatusOs } from "@/types"; // Importando o tipo de Status

// Interface de props atualizada para receber a lista de status
interface OrdemServicoFiltersProps {
  busca: string;
  setBusca: (busca: string) => void;
  filtroStatus: string;
  setFiltroStatus: (status: string) => void;
  statusOptions: StatusOs[]; // <-- NOVO: Prop para as opções de status
}

export function OrdemServicoFilters({
  busca,
  setBusca,
  filtroStatus,
  setFiltroStatus,
  statusOptions // <-- NOVO: Recebendo a prop
}: OrdemServicoFiltersProps) {
  return (
    <Card className="card-glass">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por cliente, equipamento ou OS..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="w-full md:w-56">
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                {/* As opções de status agora são geradas dinamicamente */}
                <SelectItem value="todos">Todos os status</SelectItem>
                {statusOptions.map(status => (
                  <SelectItem key={status.id} value={status.status}>{status.status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}