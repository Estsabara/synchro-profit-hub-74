import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calculator, AlertTriangle, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UndercoverageData {
  id: string;
  calculation_date: string;
  project_name?: string;
  cost_center_name?: string;
  period_start: string;
  period_end: string;
  total_fixed_costs: number;
  productive_hours: number;
  billable_amount: number;
  coverage_percentage: number;
  undercovered_amount: number;
}

export default function UndercoverageAnalysis() {
  const [calculations, setCalculations] = useState<UndercoverageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [filterProject, setFilterProject] = useState<string>("");
  const [filterPeriod, setFilterPeriod] = useState<string>("current-month");
  const [projects, setProjects] = useState<any[]>([]);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch projects for filter
      const { data: projectsData } = await supabase
        .from("projects")
        .select("id, name")
        .eq("status", "active");

      setProjects(projectsData || []);

      // Fetch undercoverage calculations
      let query = supabase
        .from("undercoverage_calculations")
        .select(`
          *,
          projects(name),
          cost_centers(name)
        `)
        .order("calculation_date", { ascending: false });

      if (filterProject) {
        query = query.eq("project_id", filterProject);
      }

      const { data, error } = await query;
      if (error) throw error;

      setCalculations(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateUndercoverage = async () => {
    try {
      setCalculating(true);

      // Calculate period dates
      const currentDate = new Date();
      let startDate: string, endDate: string;

      switch (filterPeriod) {
        case "current-month":
          startDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`;
          endDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()}`;
          break;
        case "current-quarter":
          const quarter = Math.floor(currentDate.getMonth() / 3) + 1;
          startDate = `${currentDate.getFullYear()}-${String((quarter - 1) * 3 + 1).padStart(2, '0')}-01`;
          endDate = `${currentDate.getFullYear()}-${String(quarter * 3).padStart(2, '0')}-${new Date(currentDate.getFullYear(), quarter * 3, 0).getDate()}`;
          break;
        default: // current-year
          startDate = `${currentDate.getFullYear()}-01-01`;
          endDate = `${currentDate.getFullYear()}-12-31`;
      }

      // Call the calculate_undercoverage function
      const { data, error } = await supabase.rpc('calculate_undercoverage', {
        p_project_id: filterProject || null,
        p_cost_center_id: null,
        p_period_start: startDate,
        p_period_end: endDate
      });

      if (error) throw error;

      toast({
        title: "Cálculo concluído!",
        description: "Análise de undercoverage atualizada com sucesso.",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro no cálculo",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCalculating(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterProject]);

  const getCoverageBadge = (percentage: number) => {
    if (percentage >= 100) {
      return <Badge variant="default">Coberto</Badge>;
    } else if (percentage >= 80) {
      return <Badge variant="secondary">Quase Coberto</Badge>;
    } else {
      return <Badge variant="destructive">Descoberto</Badge>;
    }
  };

  const getTotalUndercoverage = () => {
    const totalFixed = calculations.reduce((sum, item) => sum + item.total_fixed_costs, 0);
    const totalBillable = calculations.reduce((sum, item) => sum + item.billable_amount, 0);
    const totalUndercovered = calculations.reduce((sum, item) => sum + item.undercovered_amount, 0);
    const avgCoverage = calculations.length > 0 
      ? calculations.reduce((sum, item) => sum + item.coverage_percentage, 0) / calculations.length 
      : 0;

    return {
      totalFixed,
      totalBillable,
      totalUndercovered,
      avgCoverage,
    };
  };

  const totals = getTotalUndercoverage();

  if (loading) {
    return <div>Carregando análise de undercoverage...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Análise de Undercoverage</h2>
        <Button onClick={calculateUndercoverage} disabled={calculating}>
          <Calculator className="h-4 w-4 mr-2" />
          {calculating ? "Calculando..." : "Calcular Undercoverage"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Custos Fixos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totals.totalFixed)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Valor Faturável</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totals.totalBillable)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Valor Descoberto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totals.totalUndercovered)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">% Cobertura Média</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              {totals.avgCoverage.toFixed(1)}%
            </div>
            <Progress value={totals.avgCoverage} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={filterPeriod} onValueChange={setFilterPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Período de Cálculo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current-month">Mês Atual</SelectItem>
                <SelectItem value="current-quarter">Trimestre Atual</SelectItem>
                <SelectItem value="current-year">Ano Atual</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterProject} onValueChange={setFilterProject}>
              <SelectTrigger>
                <SelectValue placeholder="Projeto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os projetos</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setFilterProject("");
                setFilterPeriod("current-month");
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Cálculos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data do Cálculo</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Projeto</TableHead>
                <TableHead>Custos Fixos</TableHead>
                <TableHead>Horas Produtivas</TableHead>
                <TableHead>Valor Faturável</TableHead>
                <TableHead>% Cobertura</TableHead>
                <TableHead>Valor Descoberto</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calculations.map((calc) => (
                <TableRow key={calc.id}>
                  <TableCell>
                    {new Date(calc.calculation_date).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    {new Date(calc.period_start).toLocaleDateString("pt-BR")} - {" "}
                    {new Date(calc.period_end).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    {calc.project_name || calc.cost_center_name || "Geral"}
                  </TableCell>
                  <TableCell>
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(calc.total_fixed_costs)}
                  </TableCell>
                  <TableCell>{calc.productive_hours.toFixed(1)}h</TableCell>
                  <TableCell>
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(calc.billable_amount)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span>{calc.coverage_percentage.toFixed(1)}%</span>
                      <Progress value={calc.coverage_percentage} className="w-16" />
                    </div>
                  </TableCell>
                  <TableCell className="text-destructive font-medium">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(calc.undercovered_amount)}
                  </TableCell>
                  <TableCell>
                    {getCoverageBadge(calc.coverage_percentage)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}