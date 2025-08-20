import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Calendar, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BacklogItem {
  id: string;
  order_number: string;
  client_name: string;
  description: string;
  total_value: number;
  delivered_value: number;
  remaining_value: number;
  margin_percentage: number;
  status: string;
  end_date: string;
}

interface BacklogViewProps {
  onBack: () => void;
}

export function BacklogView({ onBack }: BacklogViewProps) {
  const [backlogItems, setBacklogItems] = useState<BacklogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("");
  const [cutoffDate, setCutoffDate] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchBacklogData();
  }, []);

  const fetchBacklogData = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          order_number,
          description,
          total_value,
          margin_percentage,
          status,
          end_date,
          entities!orders_client_id_fkey(name)
        `)
        .in("status", ["approved", "in_progress"])
        .order("end_date");

      if (error) throw error;

      // Simular valores entregues (normalmente viria de módulo de faturamento)
      const backlog = (data || []).map(order => {
        const deliveredPercentage = Math.random() * 0.7; // 0% a 70% entregue
        const deliveredValue = order.total_value * deliveredPercentage;
        const remainingValue = order.total_value - deliveredValue;

        return {
          id: order.id,
          order_number: order.order_number,
          client_name: (order.entities as any)?.name || "Cliente não encontrado",
          description: order.description,
          total_value: order.total_value,
          delivered_value: deliveredValue,
          remaining_value: remainingValue,
          margin_percentage: order.margin_percentage,
          status: order.status,
          end_date: order.end_date
        };
      });

      setBacklogItems(backlog);
    } catch (error) {
      console.error("Error fetching backlog:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar backlog",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = backlogItems.filter(item => {
    const statusMatch = statusFilter === "all" || item.status === statusFilter;
    const clientMatch = !clientFilter || item.client_name.toLowerCase().includes(clientFilter.toLowerCase());
    const dateMatch = !cutoffDate || new Date(item.end_date) <= new Date(cutoffDate);
    
    return statusMatch && clientMatch && dateMatch;
  });

  const totalBacklog = filteredItems.reduce((sum, item) => sum + item.remaining_value, 0);
  const totalMargin = filteredItems.reduce((sum, item) => {
    const marginValue = item.remaining_value * (item.margin_percentage / 100);
    return sum + marginValue;
  }, 0);

  const averageMargin = filteredItems.length > 0 
    ? filteredItems.reduce((sum, item) => sum + item.margin_percentage, 0) / filteredItems.length
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Backlog de Pedidos</h2>
            <p className="text-muted-foreground">
              Análise dos valores pendentes de entrega/faturamento
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Backlog Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {totalBacklog.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredItems.length} pedidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem Backlog</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {totalMargin.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem Média</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {averageMargin.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meses de Trabalho</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(totalBacklog / 220000).toFixed(1)} 
            </div>
            <p className="text-xs text-muted-foreground">
              Estimativa baseada em R$ 220k/mês
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Filtros</CardTitle>
            <Filter className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Cliente</label>
              <Input
                placeholder="Filtrar por cliente..."
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data de Corte</label>
              <Input
                type="date"
                value={cutoffDate}
                onChange={(e) => setCutoffDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detalhamento do Backlog</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Entregue</TableHead>
                  <TableHead>Backlog</TableHead>
                  <TableHead>Margem %</TableHead>
                  <TableHead>Margem Backlog</TableHead>
                  <TableHead>Prazo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.order_number}
                    </TableCell>
                    <TableCell>{item.client_name}</TableCell>
                    <TableCell>
                      R$ {item.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      R$ {item.delivered_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="font-medium">
                      R$ {item.remaining_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>{item.margin_percentage.toFixed(1)}%</TableCell>
                    <TableCell>
                      R$ {(item.remaining_value * (item.margin_percentage / 100)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      {item.end_date ? new Date(item.end_date).toLocaleDateString('pt-BR') : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}