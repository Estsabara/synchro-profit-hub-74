import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AnalyticsChart } from "./AnalyticsChart";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Camera, RefreshCw, TrendingUp, Calendar } from "lucide-react";

interface KPISnapshot {
  snapshot_date: string;
  kpi_name: string;
  kpi_value: number;
  kpi_unit: string;
}

interface ChartData {
  name: string;
  value: number;
}

export function KPIHistoryManager() {
  const [snapshots, setSnapshots] = useState<KPISnapshot[]>([]);
  const [selectedKPI, setSelectedKPI] = useState("totalRevenue");
  const [loading, setLoading] = useState(false);
  const [creatingSnapshot, setCreatingSnapshot] = useState(false);

  const KPI_OPTIONS = [
    { value: "activeProjects", label: "Projetos Ativos" },
    { value: "totalBacklog", label: "Backlog Total" },
    { value: "averageMargin", label: "Margem Média" },
    { value: "approvedHours", label: "Horas Aprovadas" },
    { value: "agingTotal", label: "Aging de Recebíveis" },
    { value: "undercoverage", label: "Undercoverage" },
    { value: "totalRevenue", label: "Receitas Totais" },
    { value: "totalCosts", label: "Custos Totais" },
    { value: "cashPosition", label: "Posição de Caixa" }
  ];

  useEffect(() => {
    fetchKPIHistory();
  }, [selectedKPI]);

  const fetchKPIHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("analytics_kpi_snapshots")
        .select("*")
        .eq("kpi_name", selectedKPI)
        .order("snapshot_date", { ascending: true })
        .limit(30);

      if (error) throw error;
      setSnapshots(data || []);
    } catch (error) {
      console.error("Error fetching KPI history:", error);
      toast.error("Erro ao carregar histórico de KPIs");
    } finally {
      setLoading(false);
    }
  };

  const createKPISnapshot = async () => {
    setCreatingSnapshot(true);
    try {
      const { data, error } = await supabase.rpc('create_kpi_snapshot', {
        p_snapshot_date: new Date().toISOString().split('T')[0],
        p_filters: {}
      });

      if (error) throw error;
      
      toast.success(`Snapshot criado com ${data} KPIs registrados`);
      fetchKPIHistory();
    } catch (error) {
      console.error("Error creating KPI snapshot:", error);
      toast.error("Erro ao criar snapshot de KPIs");
    } finally {
      setCreatingSnapshot(false);
    }
  };

  const getChartData = (): ChartData[] => {
    return snapshots.map(snapshot => ({
      name: new Date(snapshot.snapshot_date).toLocaleDateString("pt-BR"),
      value: snapshot.kpi_value
    }));
  };

  const getSelectedKPILabel = () => {
    return KPI_OPTIONS.find(option => option.value === selectedKPI)?.label || selectedKPI;
  };

  const getLatestValue = () => {
    const latest = snapshots[snapshots.length - 1];
    return latest ? latest.kpi_value : 0;
  };

  const getTrend = () => {
    if (snapshots.length < 2) return null;
    
    const latest = snapshots[snapshots.length - 1];
    const previous = snapshots[snapshots.length - 2];
    const change = ((latest.kpi_value - previous.kpi_value) / previous.kpi_value) * 100;
    
    return {
      value: Math.abs(change),
      direction: change >= 0 ? "up" : "down"
    };
  };

  const formatValue = (value: number, unit: string) => {
    switch (unit) {
      case "currency":
        return new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL"
        }).format(value);
      case "percentage":
        return `${value.toFixed(1)}%`;
      case "hours":
        return `${value.toFixed(1)}h`;
      default:
        return value.toLocaleString("pt-BR");
    }
  };

  const trend = getTrend();
  const latestSnapshot = snapshots[snapshots.length - 1];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Histórico de KPIs</h2>
          <p className="text-muted-foreground">Acompanhe a evolução dos indicadores ao longo do tempo</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={fetchKPIHistory}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button
            onClick={createKPISnapshot}
            disabled={creatingSnapshot}
            className="bg-gradient-primary"
          >
            <Camera className="h-4 w-4 mr-2" />
            {creatingSnapshot ? "Criando..." : "Criar Snapshot"}
          </Button>
        </div>
      </div>

      {/* Current KPI Value */}
      <Card className="bg-gradient-subtle border-primary/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">KPI Atual</p>
              <p className="text-3xl font-bold text-foreground">
                {latestSnapshot ? formatValue(getLatestValue(), latestSnapshot.kpi_unit) : "N/A"}
              </p>
              <p className="text-sm text-muted-foreground">{getSelectedKPILabel()}</p>
            </div>
            <div className="text-right">
              {trend && (
                <div className={`flex items-center space-x-1 ${
                  trend.direction === "up" ? "text-green-600" : "text-red-600"
                }`}>
                  <TrendingUp className={`h-5 w-5 ${
                    trend.direction === "down" ? "rotate-180" : ""
                  }`} />
                  <span className="font-medium">{trend.value.toFixed(1)}%</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                vs período anterior
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Selection */}
      <Card className="bg-gradient-subtle border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Selecionar KPI para Análise</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Select value={selectedKPI} onValueChange={setSelectedKPI}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KPI_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              {snapshots.length} registros disponíveis
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historical Chart */}
      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            Carregando histórico...
          </CardContent>
        </Card>
      ) : snapshots.length > 0 ? (
        <AnalyticsChart
          title={`Evolução: ${getSelectedKPILabel()}`}
          type="line"
          data={getChartData()}
          height={400}
        />
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Nenhum histórico encontrado para este KPI
            </p>
            <Button
              variant="outline"
              onClick={createKPISnapshot}
              className="mt-4"
            >
              Criar Primeiro Snapshot
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}