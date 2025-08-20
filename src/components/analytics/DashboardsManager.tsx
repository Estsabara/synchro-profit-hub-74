import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { KPICard } from "./KPICard";
import { AnalyticsChart } from "./AnalyticsChart";
import { GlobalFilters } from "./GlobalFilters";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Clock, AlertTriangle, PieChart, Activity } from "lucide-react";

interface DashboardData {
  activeProjects: number;
  totalBacklog: number;
  averageMargin: number;
  approvedHours: number;
  agingTotal: number;
  undercoverage: number;
  totalRevenue: number;
  totalCosts: number;
  cashPosition: number;
}

interface Filters {
  startDate: string;
  endDate: string;
  projectId?: string;
  clientId?: string;
  costCenterId?: string;
}

export function DashboardsManager() {
  const [dashboardType, setDashboardType] = useState("general");
  const [data, setData] = useState<DashboardData | null>(null);
  const [filters, setFilters] = useState<Filters>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.rpc('generate_dashboard_data', {
        p_dashboard_type: dashboardType,
        p_filters: filters as any
      });

      if (error) throw error;
      setData(result as unknown as DashboardData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error("Erro ao carregar dados do dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [dashboardType, filters]);

  const handleFiltersChange = (newFilters: Filters) => {
    setFilters(newFilters);
  };

  return (
    <div className="space-y-6">
      <GlobalFilters filters={filters} onFiltersChange={handleFiltersChange} />

      <Tabs value={dashboardType} onValueChange={setDashboardType} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">Dashboard Geral</TabsTrigger>
          <TabsTrigger value="projects">Dashboard de Projetos</TabsTrigger>
          <TabsTrigger value="financial">Dashboard Financeiro</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          {loading ? (
            <div className="text-center py-8">Carregando dados...</div>
          ) : data ? (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <KPICard
                  title="Projetos Ativos"
                  value={data.activeProjects}
                  icon={Activity}
                  color="primary"
                  format="number"
                />
                <KPICard
                  title="Backlog Total"
                  value={data.totalBacklog}
                  icon={BarChart3}
                  color="secondary"
                  format="currency"
                />
                <KPICard
                  title="Margem Média"
                  value={data.averageMargin}
                  icon={TrendingUp}
                  color="accent"
                  format="percentage"
                />
                <KPICard
                  title="Horas Aprovadas"
                  value={data.approvedHours}
                  icon={Clock}
                  color="primary"
                  format="hours"
                />
                <KPICard
                  title="Receitas do Período"
                  value={data.totalRevenue}
                  icon={DollarSign}
                  color="secondary"
                  format="currency"
                />
                <KPICard
                  title="Custos do Período"
                  value={data.totalCosts}
                  icon={TrendingDown}
                  color="destructive"
                  format="currency"
                />
                <KPICard
                  title="Aging de Recebíveis"
                  value={data.agingTotal}
                  icon={AlertTriangle}
                  color="warning"
                  format="currency"
                />
                <KPICard
                  title="Undercoverage"
                  value={data.undercoverage}
                  icon={PieChart}
                  color="destructive"
                  format="currency"
                />
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AnalyticsChart
                  title="Receitas vs Custos"
                  type="bar"
                  data={[
                    { name: 'Receitas', value: data.totalRevenue },
                    { name: 'Custos', value: data.totalCosts }
                  ]}
                />
                <AnalyticsChart
                  title="Distribuição de Valores"
                  type="pie"
                  data={[
                    { name: 'Backlog', value: data.totalBacklog },
                    { name: 'Receitas', value: data.totalRevenue },
                    { name: 'Custos', value: data.totalCosts }
                  ]}
                />
              </div>
            </>
          ) : (
            <div className="text-center py-8">Nenhum dado disponível</div>
          )}
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard de Projetos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Indicadores específicos de projetos em desenvolvimento...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard Financeiro</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Indicadores financeiros e tesouraria em desenvolvimento...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}