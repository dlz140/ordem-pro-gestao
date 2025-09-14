import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false, // Evitar recarregamentos desnecessários
      refetchOnMount: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Componente de fallback para o Suspense
const PageLoader = () => (
  <div className="flex h-full w-full items-center justify-center">
    <div className="text-center space-y-4">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p className="text-muted-foreground">Carregando página...</p>
    </div>
  </div>
);

// Lazy loading de todas as páginas
const Capa = lazy(() => import("./pages/Capa"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Cadastros = lazy(() => import("./pages/Cadastros"));
const Gastos = lazy(() => import("./pages/Gastos"));
const Clientes = lazy(() => import("./pages/Clientes"));
const Servicos = lazy(() => import("./pages/Servicos"));
const Produtos = lazy(() => import("./pages/Produtos"));
const Equipamentos = lazy(() => import("./pages/Equipamentos"));
const Marcas = lazy(() => import("./pages/Marcas"));
const StatusOs = lazy(() => import("./pages/StatusOs"));
const OrdensServico = lazy(() => import("./pages/OrdensServicoTemp"));
const Pendentes = lazy(() => 
  import("./pages/Pendentes").then(module => {
    console.log('Página Pendentes carregada com sucesso');
    return module;
  }).catch(error => {
    console.error('Erro ao carregar página Pendentes:', error);
    throw error;
  })
);
const Relatorios = lazy(() => import("./pages/Relatorios"));
const RelatorioIR = lazy(() => import("./pages/RelatorioIR"));
const RelatorioVendas = lazy(() => import("./pages/RelatorioVendas"));
const RelatorioClientes = lazy(() => import("./pages/RelatorioClientes"));
const NotFound = lazy(() => import("./pages/NotFound"));

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Suspense fallback={<PageLoader />}>
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
              <Route path="/relatorio-vendas" element={<RelatorioVendas />} />
              <Route path="/relatorio-clientes" element={<RelatorioClientes />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;