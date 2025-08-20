import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Calculator, TrendingUp, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Project {
  id: string;
  name: string;
}

interface POCData {
  id: string;
  project_id: string;
  calculation_date: string;
  cost_based_poc: number;
  hours_based_poc: number;
  overall_poc: number;
  total_budgeted_cost: number;
  total_incurred_cost: number;
  total_budgeted_hours: number;
  total_worked_hours: number;
  projects?: {
    name: string;
  } | null;
}

export function POCCalculator() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [pocData, setPocData] = useState<POCData[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [cutoffDate, setCutoffDate] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProjects();
    fetchPOCData();
    
    // Set default cutoff date to today
    const today = new Date().toISOString().split('T')[0];
    setCutoffDate(today);
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name")
        .eq("status", "active")
        .order("name");

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const fetchPOCData = async () => {
    try {
      const { data, error } = await supabase
        .from("poc_calculations")
        .select(`
          *,
          projects!poc_calculations_project_id_fkey(name)
        `)
        .order("calculation_date", { ascending: false });

      if (error) throw error;
      setPocData((data as any) || []);
    } catch (error) {
      console.error("Error fetching POC data:", error);
    }
  };

  const calculatePOC = async () => {
    if (!selectedProject) {
      toast({
        title: "Erro",
        description: "Selecione um projeto para calcular o POC",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Buscar dados do projeto
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", selectedProject)
        .single();

      if (projectError) throw projectError;

      // Buscar horas trabalhadas até a data de corte
      const { data: timeEntries, error: timeError } = await supabase
        .from("time_entries")
        .select("hours_worked")
        .eq("project_id", selectedProject)
        .eq("status", "approved")
        .lte("work_date", cutoffDate);

      if (timeError) throw timeError;

      // Buscar despesas aprovadas até a data de corte
      const { data: expenses, error: expenseError } = await supabase
        .from("project_expenses")
        .select("amount")
        .eq("project_id", selectedProject)
        .eq("status", "approved")
        .lte("expense_date", cutoffDate);

      if (expenseError) throw expenseError;

      // Calcular totais
      const totalWorkedHours = timeEntries?.reduce((sum, entry) => sum + Number(entry.hours_worked || 0), 0) || 0;
      const totalIncurredCost = expenses?.reduce((sum, expense) => sum + Number(expense.amount || 0), 0) || 0;

      // Valores orçados (simulados - normalmente viriam do orçamento do projeto)
      const totalBudgetedHours = 1000; // Simulated
      const totalBudgetedCost = 100000; // Simulated

      // Calcular POCs
      const hoursBased = totalBudgetedHours > 0 ? (totalWorkedHours / totalBudgetedHours) * 100 : 0;
      const costBased = totalBudgetedCost > 0 ? (totalIncurredCost / totalBudgetedCost) * 100 : 0;
      const overallPOC = (hoursBased + costBased) / 2;

      // Salvar cálculo
      const pocCalculation = {
        project_id: selectedProject,
        calculation_date: cutoffDate,
        cost_based_poc: costBased,
        hours_based_poc: hoursBased,
        overall_poc: overallPOC,
        total_budgeted_cost: totalBudgetedCost,
        total_incurred_cost: totalIncurredCost,
        total_budgeted_hours: totalBudgetedHours,
        total_worked_hours: totalWorkedHours,
        calculated_by: "00000000-0000-0000-0000-000000000000" // Simulated user ID
      };

      const { error: insertError } = await supabase
        .from("poc_calculations")
        .insert([pocCalculation]);

      if (insertError) throw insertError;

      await fetchPOCData();

      toast({
        title: "Sucesso",
        description: `POC calculado: ${overallPOC.toFixed(1)}%`
      });

    } catch (error) {
      console.error("Error calculating POC:", error);
      toast({
        title: "Erro",
        description: "Erro ao calcular POC",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getPOCColor = (poc: number) => {
    if (poc >= 90) return "text-green-600";
    if (poc >= 70) return "text-yellow-600";
    if (poc >= 50) return "text-orange-600";
    return "text-red-600";
  };

  const filteredPOCData = selectedProject 
    ? pocData.filter(poc => poc.project_id === selectedProject)
    : pocData;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Cálculo de POC</h3>
          <p className="text-sm text-muted-foreground">
            Percentage of Completion - Acompanhe o progresso dos projetos
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="h-5 w-5 mr-2" />
            Calcular POC
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project">Projeto</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o projeto" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cutoff-date">Data de Corte</Label>
              <Input
                id="cutoff-date"
                type="date"
                value={cutoffDate}
                onChange={(e) => setCutoffDate(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button onClick={calculatePOC} disabled={loading} className="w-full">
                {loading ? "Calculando..." : "Calcular POC"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projetos Ativos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">
              Com cálculo de POC
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">POC Médio</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pocData.length > 0 
                ? (pocData.reduce((sum, poc) => sum + Number(poc.overall_poc || 0), 0) / pocData.length).toFixed(1) + "%"
                : "0%"
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Todos os projetos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Último Cálculo</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pocData.length > 0 
                ? new Date(pocData[0].calculation_date).toLocaleDateString('pt-BR')
                : "-"
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Data do último cálculo
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de POC</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Projeto</TableHead>
                <TableHead>POC por Custo</TableHead>
                <TableHead>POC por Horas</TableHead>
                <TableHead>POC Geral</TableHead>
                <TableHead>Progresso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPOCData.map((poc) => (
                <TableRow key={poc.id}>
                  <TableCell>
                    {new Date(poc.calculation_date).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>{poc.projects?.name || "Projeto não encontrado"}</TableCell>
                  <TableCell className={getPOCColor(poc.cost_based_poc)}>
                    {poc.cost_based_poc.toFixed(1)}%
                  </TableCell>
                  <TableCell className={getPOCColor(poc.hours_based_poc)}>
                    {poc.hours_based_poc.toFixed(1)}%
                  </TableCell>
                  <TableCell className={`font-bold ${getPOCColor(poc.overall_poc)}`}>
                    {poc.overall_poc.toFixed(1)}%
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Progress value={poc.overall_poc} className="w-20" />
                      <span className="text-sm text-muted-foreground">
                        {poc.overall_poc.toFixed(0)}%
                      </span>
                    </div>
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