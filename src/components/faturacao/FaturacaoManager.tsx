import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InvoicesManager } from "./InvoicesManager";
import { ReceivablesManager } from "./ReceivablesManager";
import { AgingReport } from "./AgingReport";
import { Receipt, DollarSign, Clock, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function FaturacaoManager() {
  const [stats, setStats] = useState({
    totalInvoices: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    paidThisMonth: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const currentMonth = new Date();
      const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      // Buscar estatísticas de faturas
      const { data: invoices } = await supabase
        .from("invoices")
        .select("net_amount, payment_status, due_date, issue_date");

      // Buscar pagamentos do mês
      const { data: payments } = await supabase
        .from("invoice_payments")
        .select("amount")
        .gte("payment_date", firstDay.toISOString().split('T')[0])
        .lte("payment_date", lastDay.toISOString().split('T')[0])
        .eq("status", "confirmed");

      const totalInvoices = invoices?.length || 0;
      const pendingInvoices = invoices?.filter(inv => inv.payment_status === 'pending') || [];
      const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + Number(inv.net_amount || 0), 0);
      
      const today = new Date();
      const overdueInvoices = pendingInvoices.filter(inv => new Date(inv.due_date) < today);
      const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + Number(inv.net_amount || 0), 0);
      
      const paidThisMonth = payments?.reduce((sum, payment) => sum + Number(payment.amount || 0), 0) || 0;

      setStats({
        totalInvoices,
        pendingAmount,
        overdueAmount,
        paidThisMonth
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Faturação & Recebíveis</h2>
          <p className="text-muted-foreground">
            Controle completo do ciclo de faturamento e recebimento
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Faturas</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInvoices}</div>
            <p className="text-xs text-muted-foreground">
              Faturas registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendente de Pagamento</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Aguardando recebimento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Atraso</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {stats.overdueAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Vencidas não pagas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recebido Este Mês</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {stats.paidThisMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Pagamentos confirmados
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="invoices" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="invoices">Faturas</TabsTrigger>
          <TabsTrigger value="receivables">Contas a Receber</TabsTrigger>
          <TabsTrigger value="aging">Aging de Clientes</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
          <InvoicesManager onUpdate={fetchStats} />
        </TabsContent>

        <TabsContent value="receivables" className="space-y-4">
          <ReceivablesManager onUpdate={fetchStats} />
        </TabsContent>

        <TabsContent value="aging" className="space-y-4">
          <AgingReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}