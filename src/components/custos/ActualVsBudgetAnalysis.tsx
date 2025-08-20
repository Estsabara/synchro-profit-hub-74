import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VarianceAnalysis {
  category: string;
  project_name?: string;
  cost_center_name?: string;
  budget_amount: number;
  actual_amount: number;
  variance_amount: number;
  variance_percentage: number;
  currency: string;
}

export default function ActualVsBudgetAnalysis() {
  const [analysis, setAnalysis] = useState<VarianceAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterProject, setFilterProject] = useState<string>("");
  const [filterPeriod, setFilterPeriod] = useState<string>("current-year");
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

      // Calculate period dates
      const currentYear = new Date().getFullYear();
      let startDate: string, endDate: string;

      switch (filterPeriod) {
        case "current-month":
          startDate = `${currentYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`;
          endDate = `${currentYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${new Date(currentYear, new Date().getMonth() + 1, 0).getDate()}`;
          break;
        case "current-quarter":
          const quarter = Math.floor(new Date().getMonth() / 3) + 1;
          startDate = `${currentYear}-${String((quarter - 1) * 3 + 1).padStart(2, '0')}-01`;
          endDate = `${currentYear}-${String(quarter * 3).padStart(2, '0')}-${new Date(currentYear, quarter * 3, 0).getDate()}`;
          break;
        default: // current-year
          startDate = `${currentYear}-01-01`;
          endDate = `${currentYear}-12-31`;
      }

      // Fetch budget data
      let budgetQuery = supabase
        .from("budgets")
        .select(`
          category,
          amount,
          currency,
          project_id,
          cost_center_id,
          projects(name),
          cost_centers(name)
        `)
        .eq("status", "active")
        .eq("fiscal_year", currentYear)
        .gte("valid_from", startDate)
        .or(`valid_to.is.null,valid_to.gte.${endDate}`);

      if (filterProject) {
        budgetQuery = budgetQuery.eq("project_id", filterProject);
      }

      const { data: budgetData, error: budgetError } = await budgetQuery;
      if (budgetError) throw budgetError;

      // Fetch actual data
      let actualQuery = supabase
        .from("actuals")
        .select(`
          category,
          amount,
          currency,
          project_id,
          cost_center_id,
          projects(name),
          cost_centers(name)
        `)
        .gte("actual_date", startDate)
        .lte("actual_date", endDate);

      if (filterProject) {
        actualQuery = actualQuery.eq("project_id", filterProject);
      }

      const { data: actualData, error: actualError } = await actualQuery;
      if (actualError) throw actualError;

      // Process and combine data
      const analysisMap = new Map<string, VarianceAnalysis>();

      // Process budget data
      budgetData?.forEach((budget) => {
        const key = `${budget.category}-${budget.project_id || 'null'}-${budget.cost_center_id || 'null'}`;
        analysisMap.set(key, {
          category: budget.category,
          project_name: budget.projects?.name,
          cost_center_name: budget.cost_centers?.name,
          budget_amount: budget.amount || 0,
          actual_amount: 0,
          variance_amount: 0,
          variance_percentage: 0,
          currency: budget.currency,
        });
      });

      // Process actual data
      actualData?.forEach((actual) => {
        const key = `${actual.category}-${actual.project_id || 'null'}-${actual.cost_center_id || 'null'}`;
        if (analysisMap.has(key)) {
          const existing = analysisMap.get(key)!;
          existing.actual_amount += actual.amount || 0;
        } else {
          analysisMap.set(key, {
            category: actual.category,
            project_name: actual.projects?.name,
            cost_center_name: actual.cost_centers?.name,
            budget_amount: 0,
            actual_amount: actual.amount || 0,
            variance_amount: 0,
            variance_percentage: 0,
            currency: actual.currency,
          });
        }
      });

      // Calculate variances
      const analysisArray = Array.from(analysisMap.values()).map((item) => {
        item.variance_amount = item.actual_amount - item.budget_amount;
        item.variance_percentage = item.budget_amount > 0 
          ? (item.variance_amount / item.budget_amount) * 100 
          : 0;
        return item;
      });

      setAnalysis(analysisArray);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar análise",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterProject, filterPeriod]);

  const getVarianceBadge = (percentage: number) => {
    if (Math.abs(percentage) < 5) {
      return <Badge variant="default">Dentro do Esperado</Badge>;
    } else if (percentage > 0) {
      return <Badge variant="destructive">Acima do Orçamento</Badge>;
    } else {
      return <Badge variant="secondary">Abaixo do Orçamento</Badge>;
    }
  };

  const getVarianceIcon = (percentage: number) => {
    if (percentage > 0) {
      return <TrendingUp className="h-4 w-4 text-destructive" />;
    } else {
      return <TrendingDown className="h-4 w-4 text-green-600" />;
    }
  };

  const getTotalVariance = () => {
    const totalBudget = analysis.reduce((sum, item) => sum + item.budget_amount, 0);
    const totalActual = analysis.reduce((sum, item) => sum + item.actual_amount, 0);
    const totalVariance = totalActual - totalBudget;
    const totalVariancePercentage = totalBudget > 0 ? (totalVariance / totalBudget) * 100 : 0;

    return {
      totalBudget,
      totalActual,
      totalVariance,
      totalVariancePercentage,
    };
  };

  const totals = getTotalVariance();

  if (loading) {
    return <div>Carregando análise...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Análise ACT vs BGT</h2>
        <Button onClick={fetchData} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Orçamento Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totals.totalBudget)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Realizado Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totals.totalActual)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Variação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold flex items-center ${
              totals.totalVariance > 0 ? 'text-destructive' : 'text-green-600'
            }`}>
              {getVarianceIcon(totals.totalVariancePercentage)}
              <span className="ml-2">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(Math.abs(totals.totalVariance))}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {totals.totalVariancePercentage.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">% Executado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totals.totalBudget > 0 ? ((totals.totalActual / totals.totalBudget) * 100).toFixed(1) : 0}%
            </div>
            <Progress 
              value={totals.totalBudget > 0 ? (totals.totalActual / totals.totalBudget) * 100 : 0} 
              className="mt-2"
            />
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
                <SelectValue placeholder="Período" />
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
                setFilterPeriod("current-year");
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Análise Detalhada</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria</TableHead>
                <TableHead>Projeto/Centro de Custo</TableHead>
                <TableHead>Orçado</TableHead>
                <TableHead>Realizado</TableHead>
                <TableHead>Variação</TableHead>
                <TableHead>%</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analysis.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.category}</TableCell>
                  <TableCell>
                    {item.project_name || item.cost_center_name || "N/A"}
                  </TableCell>
                  <TableCell>
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: item.currency,
                    }).format(item.budget_amount)}
                  </TableCell>
                  <TableCell>
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: item.currency,
                    }).format(item.actual_amount)}
                  </TableCell>
                  <TableCell className={item.variance_amount > 0 ? 'text-destructive' : 'text-green-600'}>
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: item.currency,
                    }).format(Math.abs(item.variance_amount))}
                  </TableCell>
                  <TableCell className={item.variance_percentage > 0 ? 'text-destructive' : 'text-green-600'}>
                    {item.variance_percentage.toFixed(1)}%
                  </TableCell>
                  <TableCell>
                    {getVarianceBadge(item.variance_percentage)}
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