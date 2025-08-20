import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CashFlowProjection {
  id: string;
  projection_date: string;
  flow_type: string;
  category: string;
  amount: number;
  currency: string;
  scenario_type: string;
  description: string;
  bank_accounts?: { bank_name: string };
}

export default function CashFlowProjections() {
  const [projections, setProjections] = useState<CashFlowProjection[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState<string>("current-month");
  const [filterScenario, setFilterScenario] = useState<string>("base");
  const { toast } = useToast();

  const fetchProjections = async () => {
    try {
      setLoading(true);

      // Calculate period dates
      const currentDate = new Date();
      let startDate: string, endDate: string;

      switch (filterPeriod) {
        case "current-week":
          const startOfWeek = new Date(currentDate);
          startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          startDate = startOfWeek.toISOString().split('T')[0];
          endDate = endOfWeek.toISOString().split('T')[0];
          break;
        case "current-month":
          startDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`;
          endDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()}`;
          break;
        default: // next-30-days
          startDate = currentDate.toISOString().split('T')[0];
          endDate = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      }

      const { data, error } = await supabase
        .from("cash_flow_projections")
        .select(`
          *,
          bank_accounts(bank_name)
        `)
        .gte("projection_date", startDate)
        .lte("projection_date", endDate)
        .eq("scenario_type", filterScenario)
        .order("projection_date", { ascending: true });

      if (error) throw error;
      setProjections(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar projeções",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateProjections = async () => {
    try {
      setGenerating(true);

      // Generate projections from receivables
      const { error: receivablesError } = await supabase.rpc('generate_cash_flow_from_receivables');
      if (receivablesError) throw receivablesError;

      // Generate projections from payables
      const { error: payablesError } = await supabase.rpc('generate_cash_flow_from_payables');
      if (payablesError) throw payablesError;

      toast({
        title: "Projeções atualizadas!",
        description: "Projeções de fluxo de caixa geradas a partir de recebíveis e pagáveis.",
      });

      fetchProjections();
    } catch (error: any) {
      toast({
        title: "Erro ao gerar projeções",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchProjections();
  }, [filterPeriod, filterScenario]);

  const getFlowIcon = (type: string) => {
    return type === "inflow" ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const getCategoryBadge = (category: string) => {
    const categoryConfig = {
      receivables: { label: "Recebíveis", variant: "default" as const },
      payables: { label: "Pagáveis", variant: "destructive" as const },
      other: { label: "Outros", variant: "secondary" as const },
    };
    
    const config = categoryConfig[category as keyof typeof categoryConfig] || categoryConfig.other;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTotals = () => {
    const totalInflows = projections
      .filter(p => p.flow_type === 'inflow')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const totalOutflows = projections
      .filter(p => p.flow_type === 'outflow')
      .reduce((sum, p) => sum + p.amount, 0);
    
    return { totalInflows, totalOutflows, netFlow: totalInflows - totalOutflows };
  };

  const totals = getTotals();

  if (loading) {
    return <div>Carregando projeções de fluxo de caixa...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Projeções de Fluxo de Caixa</h2>
        <Button onClick={generateProjections} disabled={generating}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {generating ? "Gerando..." : "Atualizar Projeções"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
              Total Entradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totals.totalInflows)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <TrendingDown className="h-4 w-4 mr-2 text-red-600" />
              Total Saídas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totals.totalOutflows)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Fluxo Líquido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totals.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totals.netFlow)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Projeções</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projections.length}</div>
            <p className="text-xs text-muted-foreground">Cenário {filterScenario}</p>
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
                <SelectItem value="current-week">Semana Atual</SelectItem>
                <SelectItem value="current-month">Mês Atual</SelectItem>
                <SelectItem value="next-30-days">Próximos 30 Dias</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterScenario} onValueChange={setFilterScenario}>
              <SelectTrigger>
                <SelectValue placeholder="Cenário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="base">Base</SelectItem>
                <SelectItem value="optimistic">Otimista</SelectItem>
                <SelectItem value="conservative">Conservador</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setFilterPeriod("current-month");
                setFilterScenario("base");
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Calendário de Fluxo de Caixa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Conta</TableHead>
                <TableHead>Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projections.map((projection) => (
                <TableRow key={projection.id}>
                  <TableCell>
                    {new Date(projection.projection_date).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="flex items-center">
                    {getFlowIcon(projection.flow_type)}
                    <span className="ml-2">
                      {projection.flow_type === "inflow" ? "Entrada" : "Saída"}
                    </span>
                  </TableCell>
                  <TableCell>{getCategoryBadge(projection.category)}</TableCell>
                  <TableCell>{projection.description}</TableCell>
                  <TableCell>
                    {projection.bank_accounts?.bank_name || "Geral"}
                  </TableCell>
                  <TableCell>
                    <span className={projection.flow_type === "inflow" ? "text-green-600" : "text-red-600"}>
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: projection.currency,
                      }).format(projection.amount)}
                    </span>
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