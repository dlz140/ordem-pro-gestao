import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";

import Capa from "./pages/Capa";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Servicos from "./pages/Servicos";
import Produtos from "./pages/Produtos";
import Equipamentos from "./pages/Equipamentos";
import Marcas from "./pages/Marcas";
import StatusOs from "./pages/StatusOs";
import OrdensServico from "./pages/OrdensServico";
import Pendentes from "./pages/Pendentes";
import Relatorios from "./pages/Relatorios";
import RelatorioIR from "./pages/RelatorioIR";
import Cadastros from "./pages/Cadastros";
import Gastos from "./pages/Gastos";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Capa />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/cadastros" element={<Cadastros />} />
            <Route path="/gastos" element={<Gastos />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/servicos" element={<Servicos />} />
            <Route path="/produtos" element={<Produtos />} />
            <Route path="/equipamentos" element={<Equipamentos />} />
            <Route path="/marcas" element={<Marcas />} />
            <Route path="/status-os" element={<StatusOs />} />
            <Route path="/ordens-servico" element={<OrdensServico />} />
            <Route path="/pendentes" element={<Pendentes />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/relatorio-ir" element={<RelatorioIR />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;