import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Calculator, TrendingUp, TrendingDown, AlertTriangle, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CashPosition {
  id: string;
  snapshot_date: string;
  currency: string;
  opening_balance: number;
  inflows: number;
  outflows: number;
  closing_balance: number;
  projected_balance_7d: number;
  projected_balance_30d: number;
  projected_balance_90d: number;
  bank_accounts?: { bank_name: string };
}

export default function CashPositionDashboard() {
  const [positions, setPositions] = useState<CashPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [filterScenario, setFilterScenario] = useState<string>("base");
  const { toast } = useToast();

  const fetchCashPosition = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("cash_position_snapshots")
        .select(`
          *,
          bank_accounts(bank_name)
        `)
        .eq("snapshot_date", new Date().toISOString().split('T')[0])
        .eq("scenario_type", filterScenario)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPositions(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar posição de caixa",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateCashPosition = async () => {
    try {
      setCalculating(true);

      // First generate projections
      await Promise.all([
        supabase.rpc('generate_cash_flow_from_receivables'),
        supabase.rpc('generate_cash_flow_from_payables')
      ]);

      // Then calculate cash position
      const { error } = await supabase.rpc('calculate_cash_position', {
        p_calculation_date: new Date().toISOString().split('T')[0],
        p_scenario_type: filterScenario
      });

      if (error) throw error;

      toast({
        title: "Posição de caixa atualizada!",
        description: "Cálculos de posição de caixa atualizados com sucesso.",
      });

      fetchCashPosition();
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
    fetchCashPosition();
  }, [filterScenario]);

  const getConsolidatedPosition = () => {
    const totalOpening = positions.reduce((sum, p) => sum + p.opening_balance, 0);
    const totalInflows = positions.reduce((sum, p) => sum + p.inflows, 0);
    const totalOutflows = positions.reduce((sum, p) => sum + p.outflows, 0);
    const totalClosing = positions.reduce((sum, p) => sum + p.closing_balance, 0);
    const total7d = positions.reduce((sum, p) => sum + p.projected_balance_7d, 0);
    const total30d = positions.reduce((sum, p) => sum + p.projected_balance_30d, 0);
    const total90d = positions.reduce((sum, p) => sum + p.projected_balance_90d, 0);

    return {
      totalOpening,
      totalInflows,
      totalOutflows,
      totalClosing,
      total7d,
      total30d,
      total90d,
      netFlow: totalInflows - totalOutflows,
    };
  };

  const consolidated = getConsolidatedPosition();

  const getBalanceColor = (balance: number) => {
    if (balance < 0) return "text-destructive";
    if (balance < 100000) return "text-amber-600";
    return "text-green-600";
  };

  const getAlert = (balance: number) => {
    if (balance < 0) return { level: "critical", message: "Saldo negativo" };
    if (balance < 50000) return { level: "warning", message: "Saldo baixo" };
    return null;
  };

  if (loading) {
    return <div>Carregando dashboard de tesouraria...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard de Posição de Caixa</h2>
          <p className="text-muted-foreground">
            Visão consolidada da tesouraria - {new Date().toLocaleDateString("pt-BR")}
          </p>
        </div>
        <div className="flex space-x-2">
          <Select value={filterScenario} onValueChange={setFilterScenario}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="base">Cenário Base</SelectItem>
              <SelectItem value="optimistic">Otimista</SelectItem>
              <SelectItem value="conservative">Conservador</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={calculateCashPosition} disabled={calculating}>
            <Calculator className="h-4 w-4 mr-2" />
            {calculating ? "Calculando..." : "Atualizar"}
          </Button>
        </div>
      </div>

      {/* Consolidated Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <Wallet className="h-4 w-4 mr-2" />
              Posição Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getBalanceColor(consolidated.totalClosing)}`}>
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(consolidated.totalClosing)}
            </div>
            {getAlert(consolidated.totalClosing) && (
              <div className="flex items-center mt-2">
                <AlertTriangle className="h-3 w-3 mr-1 text-amber-500" />
                <span className="text-xs text-amber-600">
                  {getAlert(consolidated.totalClosing)?.message}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
              Entradas Previstas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(consolidated.totalInflows)}
            </div>
            <p className="text-xs text-muted-foreground">Hoje</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <TrendingDown className="h-4 w-4 mr-2 text-red-600" />
              Saídas Previstas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(consolidated.totalOutflows)}
            </div>
            <p className="text-xs text-muted-foreground">Hoje</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Fluxo Líquido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${consolidated.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(consolidated.netFlow)}
            </div>
            <p className="text-xs text-muted-foreground">Hoje</p>
          </CardContent>
        </Card>
      </div>

      {/* Projections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Projeção 7 Dias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getBalanceColor(consolidated.total7d)}`}>
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(consolidated.total7d)}
            </div>
            <Progress 
              value={Math.max(0, Math.min(100, (consolidated.total7d / 1000000) * 100))} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Projeção 30 Dias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getBalanceColor(consolidated.total30d)}`}>
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(consolidated.total30d)}
            </div>
            <Progress 
              value={Math.max(0, Math.min(100, (consolidated.total30d / 1000000) * 100))} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Projeção 90 Dias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getBalanceColor(consolidated.total90d)}`}>
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(consolidated.total90d)}
            </div>
            <Progress 
              value={Math.max(0, Math.min(100, (consolidated.total90d / 1000000) * 100))} 
              className="mt-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Position by Account */}
      <Card>
        <CardHeader>
          <CardTitle>Posição por Conta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {positions.map((position) => (
              <div key={position.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div>
                    <div className="font-medium">
                      {position.bank_accounts?.bank_name || "Conta Geral"}
                    </div>
                    <Badge variant="outline">{position.currency}</Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-sm text-muted-foreground">Abertura</div>
                    <div className="font-medium">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: position.currency,
                      }).format(position.opening_balance)}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground">Entradas</div>
                    <div className="font-medium text-green-600">
                      +{new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: position.currency,
                      }).format(position.inflows)}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground">Saídas</div>
                    <div className="font-medium text-red-600">
                      -{new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: position.currency,
                      }).format(position.outflows)}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground">Fechamento</div>
                    <div className={`font-medium ${getBalanceColor(position.closing_balance)}`}>
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: position.currency,
                      }).format(position.closing_balance)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {positions.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhuma posição calculada para hoje. Clique em "Atualizar" para gerar os cálculos.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}