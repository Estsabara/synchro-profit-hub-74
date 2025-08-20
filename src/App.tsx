import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";

// Import páginas diretamente
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Import componentes de módulos
import { AnalyticsManager } from "./components/analytics/AnalyticsManager";
import { EntitiesManager } from "./components/cadastros/EntitiesManager";
import OrdersManager from "./components/vendas/OrdersManager";
import HorasManager from "./components/horas/HorasManager";
import FaturacaoManager from "./components/faturacao/FaturacaoManager";
import CompromissosManager from "./components/compromissos/CompromissosManager";
import CustosManager from "./components/custos/CustosManager";
import TesourariaManager from "./components/tesouraria/TesourariaManager";
import Contabilidade from "./pages/modules/Contabilidade";
import { GovernancaManager } from "./components/governanca/GovernancaManager";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Componentes de página wrapper para módulos
const Analytics = () => <AnalyticsManager />;
const Cadastros = () => <EntitiesManager />;
const Vendas = () => <OrdersManager />;
const Horas = () => <HorasManager />;
const Faturacao = () => <FaturacaoManager />;
const Compromissos = () => <CompromissosManager />;
const Custos = () => <CustosManager />;
const Tesouraria = () => <TesourariaManager />;
const Governanca = () => <GovernancaManager />;

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider delayDuration={300} skipDelayDuration={100}>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/cadastros" element={<Cadastros />} />
              <Route path="/vendas" element={<Vendas />} />
              <Route path="/horas" element={<Horas />} />
              <Route path="/faturacao" element={<Faturacao />} />
              <Route path="/compromissos" element={<Compromissos />} />
              <Route path="/custos" element={<Custos />} />
              <Route path="/tesouraria" element={<Tesouraria />} />
              <Route path="/contabilidade" element={<Contabilidade />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/governanca" element={<Governanca />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;