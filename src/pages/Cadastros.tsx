import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import {
  Users,
  Settings,
  Package,
  Tag,
  Wrench,
  FileText,
  FolderOpen
} from "lucide-react";

const registrationItems = [
  { href: "/clientes", icon: Users, title: "Clientes", description: "Gerencie seus clientes" },
  { href: "/servicos", icon: Settings, title: "Serviços", description: "Cadastre tipos de serviços" },
  { href: "/produtos", icon: Package, title: "Produtos", description: "Controle seu estoque de peças" },
  { href: "/marcas", icon: Tag, title: "Marcas", description: "Gerencie as marcas de equipamentos" },
  { href: "/equipamentos", icon: Wrench, title: "Equipamentos", description: "Cadastre os tipos de aparelho" },
  { href: "/status-os", icon: FileText, title: "Status OS", description: "Defina os status das ordens" },
];

export default function Cadastros() {
  return (
    <div className="flex flex-col h-full gap-6">
      <Card className="card-glass rounded-b-none shadow-lg">
        <CardContent className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
              <FolderOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gradient-brand">Cadastros</h1>
              <p className="text-muted-foreground">Gerencie os dados mestres do sistema</p>
            </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {registrationItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link to={item.href} key={item.href} className="transform hover:-translate-y-1 transition-transform duration-300">
              <Card className="card-glass h-full hover:border-primary/50 transition-colors duration-300">
                <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mb-4 border border-primary/30">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-lg font-bold text-foreground">{item.title}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}