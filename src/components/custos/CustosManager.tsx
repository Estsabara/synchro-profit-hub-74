import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, TrendingDown, TrendingUp, AlertTriangle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import BudgetManager from "./BudgetManager";
import ActualVsBudgetAnalysis from "./ActualVsBudgetAnalysis";
import UndercoverageAnalysis from "./UndercoverageAnalysis";

interface CostStats {
  totalBudget: number;
  totalActual: number;
  budgetVariance: number;
  undercoverage: number;
  loading: boolean;
}

export default function CustosManager() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState<CostStats>({
    totalBudget: 0,
    totalActual: 0,
    budgetVariance: 0,
    undercoverage: 0,
    loading: true
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCostStats();
  }, []);

  const fetchCostStats = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true }));

      const currentYear = new Date().getFullYear();
      
      // Buscar orçamentos do ano
      const { data: budgets, error: budgetError } = await supabase
        .from("budgets")
        .select("amount, category")
        .eq("fiscal_year", currentYear)
        .eq("status", "active");

      if (budgetError) throw budgetError;

      // Buscar custos reais
      const { data: actuals, error: actualError } = await supabase
        .from("actuals")
        .select("amount, category")
        .gte("actual_date", `${currentYear}-01-01`)
        .lte("actual_date", `${currentYear}-12-31`);

      if (actualError) throw actualError;

      // Calcular totais
      const totalBudget = budgets?.reduce((sum, budget) => sum + Number(budget.amount || 0), 0) || 0;
      const totalActual = actuals?.reduce((sum, actual) => sum + Number(actual.amount || 0), 0) || 0;
      const budgetVariance = totalBudget > 0 ? ((totalActual - totalBudget) / totalBudget) * 100 : 0;
      
      // Calcular undercoverage - custos fixos não cobertos por receita
      const { data: fixedCosts } = await supabase
        .from("actuals")
        .select("amount")
        .in("category", ["Labor Costs", "Fixed Infrastructure", "Administrative Costs"])
        .gte("actual_date", `${currentYear}-01-01`)
        .lte("actual_date", `${currentYear}-12-31`);

      const { data: revenue } = await supabase
        .from("invoices")
        .select("net_amount")
        .eq("invoice_status", "sent")
        .gte("issue_date", `${currentYear}-01-01`)
        .lte("issue_date", `${currentYear}-12-31`);

      const totalFixedCosts = fixedCosts?.reduce((sum, cost) => sum + Number(cost.amount || 0), 0) || 0;
      const totalRevenue = revenue?.reduce((sum, inv) => sum + Number(inv.net_amount || 0), 0) || 0;
      const undercoverage = Math.max(0, totalFixedCosts - totalRevenue);

      setStats({
        totalBudget,
        totalActual,
        budgetVariance,
        undercoverage,
        loading: false
      });

    } catch (error) {
      console.error("Error fetching cost stats:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar estatísticas de custos",
        variant: "destructive"
      });
      setStats(prev => ({ ...prev, loading: false }));
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Custos, ACT vs BGT & Undercoverage</h1>
          <p className="text-muted-foreground mt-2">
            Comparação entre orçamento e realizado, análise de cobertura
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={fetchCostStats}
            disabled={stats.loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${stats.loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button className="bg-gradient-primary">
            <Plus className="h-4 w-4 mr-2" />
            Nova Análise
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="budget">Orçamentos</TabsTrigger>
          <TabsTrigger value="analysis">ACT vs BGT</TabsTrigger>
          <TabsTrigger value="undercoverage">Undercoverage</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Orçamento Total</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {stats.loading ? (
                  <div className="text-2xl font-bold">Carregando...</div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{formatCurrency(stats.totalBudget)}</div>
                    <p className="text-xs text-muted-foreground">
                      Orçamento anual aprovado
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Realizado</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {stats.loading ? (
                  <div className="text-2xl font-bold">Carregando...</div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{formatCurrency(stats.totalActual)}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.totalBudget > 0 ? 
                        `${((stats.totalActual / stats.totalBudget) * 100).toFixed(1)}% do orçamento executado` :
                        'Custos executados'
                      }
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Undercoverage</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                {stats.loading ? (
                  <div className="text-2xl font-bold">Carregando...</div>
                ) : (
                  <>
                    <div className={`text-2xl font-bold ${stats.undercoverage > 0 ? 'text-destructive' : 'text-green-600'}`}>
                      {formatCurrency(stats.undercoverage)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {stats.undercoverage > 0 ? 'Descoberto em custos fixos' : 'Custos fixos cobertos'}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Variação ACT vs BGT</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.loading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Carregando dados...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Variação:</span>
                      <span className={`font-bold ${stats.budgetVariance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {stats.budgetVariance > 0 ? '+' : ''}{stats.budgetVariance.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${stats.budgetVariance > 0 ? 'bg-red-600' : 'bg-green-600'}`}
                        style={{ width: `${Math.min(Math.abs(stats.budgetVariance), 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cobertura de Custos Fixos</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.loading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Carregando dados...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Status:</span>
                      <span className={`font-bold ${stats.undercoverage > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {stats.undercoverage > 0 ? 'Descoberto' : 'Coberto'}
                      </span>
                    </div>
                    {stats.undercoverage > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Ação necessária para equilibrar receitas e custos fixos
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="budget">
          <BudgetManager />
        </TabsContent>

        <TabsContent value="analysis">
          <ActualVsBudgetAnalysis />
        </TabsContent>

        <TabsContent value="undercoverage">
          <UndercoverageAnalysis />
        </TabsContent>
      </Tabs>
    </div>
  );
}