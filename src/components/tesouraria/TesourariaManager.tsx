import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Wallet, TrendingUp, TrendingDown, Calculator, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import BankAccountsManager from "./BankAccountsManager";
import CashFlowProjections from "./CashFlowProjections";
import BankReconciliation from "./BankReconciliation";
import PaymentExecution from "./PaymentExecution";
import CashPositionDashboard from "./CashPositionDashboard";

interface TreasuryStats {
  totalBalance: number;
  projectedInflows30d: number;
  projectedOutflows30d: number;
  netCashFlow30d: number;
  activeAccounts: number;
  loading: boolean;
}

interface ScenarioData {
  base: number;
  optimistic: number;
  conservative: number;
  loading: boolean;
}

export default function TesourariaManager() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState<TreasuryStats>({
    totalBalance: 0,
    projectedInflows30d: 0,
    projectedOutflows30d: 0,
    netCashFlow30d: 0,
    activeAccounts: 0,
    loading: true
  });
  const [scenarios, setScenarios] = useState<ScenarioData>({
    base: 0,
    optimistic: 0,
    conservative: 0,
    loading: true
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchTreasuryStats();
    fetchScenarios();
  }, []);

  const fetchTreasuryStats = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true }));

      // Buscar saldo total das contas ativas
      const { data: accounts, error: accountsError } = await supabase
        .from("bank_accounts")
        .select("current_balance")
        .eq("status", "active");

      if (accountsError) throw accountsError;

      const totalBalance = accounts?.reduce((sum, account) => sum + Number(account.current_balance || 0), 0) || 0;
      const activeAccounts = accounts?.length || 0;

      // Buscar projeções de cash flow para os próximos 30 dias
      const today = new Date();
      const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

      const { data: projections, error: projectionsError } = await supabase
        .from("cash_flow_projections")
        .select("amount, flow_type")
        .gte("projection_date", today.toISOString().split('T')[0])
        .lte("projection_date", thirtyDaysLater.toISOString().split('T')[0])
        .eq("scenario_type", "base");

      if (projectionsError) throw projectionsError;

      const projectedInflows30d = projections?.filter(p => p.flow_type === 'inflow')
        .reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
      
      const projectedOutflows30d = projections?.filter(p => p.flow_type === 'outflow')
        .reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;

      const netCashFlow30d = projectedInflows30d - projectedOutflows30d;

      setStats({
        totalBalance,
        projectedInflows30d,
        projectedOutflows30d,
        netCashFlow30d,
        activeAccounts,
        loading: false
      });

    } catch (error) {
      console.error("Error fetching treasury stats:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar estatísticas de tesouraria",
        variant: "destructive"
      });
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  const fetchScenarios = async () => {
    try {
      setScenarios(prev => ({ ...prev, loading: true }));

      const today = new Date();
      const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Buscar projeções para diferentes cenários
      const { data: baseProjections } = await supabase
        .from("cash_flow_projections")
        .select("amount, flow_type")
        .gte("projection_date", today.toISOString().split('T')[0])
        .lte("projection_date", thirtyDaysLater.toISOString().split('T')[0])
        .eq("scenario_type", "base");

      const baseBalance = stats.totalBalance + (baseProjections?.reduce((sum, p) => 
        sum + (p.flow_type === 'inflow' ? Number(p.amount || 0) : -Number(p.amount || 0)), 0) || 0);

      // Cenário otimista: +15% nos recebimentos
      const optimisticBalance = baseBalance * 1.15;

      // Cenário conservador: +20% atraso nos recebimentos
      const conservativeBalance = baseBalance * 0.8;

      setScenarios({
        base: baseBalance,
        optimistic: optimisticBalance,
        conservative: conservativeBalance,
        loading: false
      });

    } catch (error) {
      console.error("Error fetching scenarios:", error);
      setScenarios(prev => ({ ...prev, loading: false }));
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  const handleRefresh = () => {
    fetchTreasuryStats();
    fetchScenarios();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tesouraria & Posição de Caixa</h1>
          <p className="text-muted-foreground mt-2">
            Gestão de contas bancárias, conciliação e projeções de caixa
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={stats.loading || scenarios.loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${(stats.loading || scenarios.loading) ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button className="bg-gradient-primary">
            <Plus className="h-4 w-4 mr-2" />
            Nova Conta
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="accounts">Contas</TabsTrigger>
          <TabsTrigger value="projections">Projeções</TabsTrigger>
          <TabsTrigger value="reconciliation">Conciliação</TabsTrigger>
          <TabsTrigger value="payments">Pagamentos</TabsTrigger>
          <TabsTrigger value="scenarios">Cenários</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <CashPositionDashboard />
        </TabsContent>

        <TabsContent value="accounts">
          <BankAccountsManager />
        </TabsContent>

        <TabsContent value="projections">
          <CashFlowProjections />
        </TabsContent>

        <TabsContent value="reconciliation">
          <BankReconciliation />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentExecution />
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="h-5 w-5 mr-2" />
                Cenários & Projeções - 30 Dias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Cenário Base</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {scenarios.loading ? (
                      <div className="text-2xl font-bold">Carregando...</div>
                    ) : (
                      <>
                        <div className="text-2xl font-bold">{formatCurrency(scenarios.base)}</div>
                        <p className="text-xs text-muted-foreground">Projeção realista</p>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Cenário Otimista</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {scenarios.loading ? (
                      <div className="text-2xl font-bold">Carregando...</div>
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(scenarios.optimistic)}</div>
                        <p className="text-xs text-muted-foreground">+15% recebimentos</p>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Cenário Conservador</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {scenarios.loading ? (
                      <div className="text-2xl font-bold">Carregando...</div>
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-amber-600">{formatCurrency(scenarios.conservative)}</div>
                        <p className="text-xs text-muted-foreground">+20% atraso</p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Resumo Financeiro</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span>Saldo Atual:</span>
                        <span className="font-medium">{formatCurrency(stats.totalBalance)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Entradas (30d):</span>
                        <span className="font-medium text-green-600">
                          +{formatCurrency(stats.projectedInflows30d)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Saídas (30d):</span>
                        <span className="font-medium text-red-600">
                          -{formatCurrency(stats.projectedOutflows30d)}
                        </span>
                      </div>
                      <hr />
                      <div className="flex justify-between font-bold">
                        <span>Fluxo Líquido:</span>
                        <span className={stats.netCashFlow30d >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {stats.netCashFlow30d >= 0 ? '+' : ''}{formatCurrency(stats.netCashFlow30d)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Contas Bancárias</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span>Contas Ativas:</span>
                        <span className="font-medium">{stats.activeAccounts}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Saldo Total:</span>
                        <span className="font-medium">{formatCurrency(stats.totalBalance)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}