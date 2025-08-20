import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CommitmentsManager } from "./CommitmentsManager";
import { PayablesManager } from "./PayablesManager";
import { PaymentScheduler } from "./PaymentScheduler";
import { FileText, CreditCard, Calendar, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function CompromissosManager() {
  const [stats, setStats] = useState({
    totalCommitments: 0,
    pendingPayables: 0,
    overduePayables: 0,
    scheduledPayments: 0,
    totalAmount: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Buscar compromissos
      const { data: commitments } = await supabase
        .from("commitments")
        .select("amount, status");

      // Buscar contas a pagar
      const { data: payables } = await supabase
        .from("payables")
        .select("remaining_amount, status, due_date");

      // Buscar agendamentos
      const { data: schedules } = await supabase
        .from("payment_schedules")
        .select("amount, status");

      const totalCommitments = commitments?.length || 0;
      const pendingPayables = payables?.filter(p => p.status === 'pending').length || 0;
      
      const today = new Date();
      const overduePayables = payables?.filter(p => 
        p.status === 'pending' && new Date(p.due_date) < today
      ).length || 0;
      
      const scheduledPayments = schedules?.filter(s => s.status === 'scheduled').length || 0;
      const totalAmount = payables?.reduce((sum, p) => sum + Number(p.remaining_amount || 0), 0) || 0;

      setStats({
        totalCommitments,
        pendingPayables,
        overduePayables,
        scheduledPayments,
        totalAmount
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Compromissos & Pagáveis</h2>
          <p className="text-muted-foreground">
            Gestão de compromissos com fornecedores e controle de pagamentos
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compromissos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCommitments}</div>
            <p className="text-xs text-muted-foreground">
              Ordens registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contas Pendentes</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingPayables}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando pagamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Atraso</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overduePayables}</div>
            <p className="text-xs text-muted-foreground">
              Vencidas não pagas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendados</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.scheduledPayments}</div>
            <p className="text-xs text-muted-foreground">
              Pagamentos futuros
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total a Pagar</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor em aberto
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="commitments" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="commitments">Compromissos</TabsTrigger>
          <TabsTrigger value="payables">Contas a Pagar</TabsTrigger>
          <TabsTrigger value="scheduler">Programação</TabsTrigger>
        </TabsList>

        <TabsContent value="commitments" className="space-y-4">
          <CommitmentsManager onUpdate={fetchStats} />
        </TabsContent>

        <TabsContent value="payables" className="space-y-4">
          <PayablesManager onUpdate={fetchStats} />
        </TabsContent>

        <TabsContent value="scheduler" className="space-y-4">
          <PaymentScheduler onUpdate={fetchStats} />
        </TabsContent>
      </Tabs>
    </div>
  );
}