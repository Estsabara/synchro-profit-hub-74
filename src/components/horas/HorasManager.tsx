import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimeEntriesManager } from "./TimeEntriesManager";
import { ExpensesManager } from "./ExpensesManager";
import { POCCalculator } from "./POCCalculator";
import { Clock, Receipt, TrendingUp, CalendarCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function HorasManager() {
  const [stats, setStats] = useState({
    pendingTimeEntries: 0,
    pendingExpenses: 0,
    totalHoursThisMonth: 0,
    totalExpensesThisMonth: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const currentMonth = new Date();
      const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      // Buscar estatísticas de horas
      const { data: timeEntries } = await supabase
        .from("time_entries")
        .select("hours_worked, status")
        .gte("work_date", firstDay.toISOString().split('T')[0])
        .lte("work_date", lastDay.toISOString().split('T')[0]);

      // Buscar estatísticas de despesas
      const { data: expenses } = await supabase
        .from("project_expenses")
        .select("amount, status")
        .gte("expense_date", firstDay.toISOString().split('T')[0])
        .lte("expense_date", lastDay.toISOString().split('T')[0]);

      const pendingTimeEntries = timeEntries?.filter(entry => entry.status === 'pending').length || 0;
      const pendingExpenses = expenses?.filter(expense => expense.status === 'pending').length || 0;
      const totalHoursThisMonth = timeEntries?.reduce((sum, entry) => sum + Number(entry.hours_worked || 0), 0) || 0;
      const totalExpensesThisMonth = expenses?.reduce((sum, expense) => sum + Number(expense.amount || 0), 0) || 0;

      setStats({
        pendingTimeEntries,
        pendingExpenses,
        totalHoursThisMonth,
        totalExpensesThisMonth
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Times, Horas & Despesas</h2>
          <p className="text-muted-foreground">
            Controle de horas trabalhadas, despesas de projeto e cálculo de POC
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horas Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingTimeEntries}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando aprovação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas Pendentes</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingExpenses}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando aprovação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horas Este Mês</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalHoursThisMonth.toFixed(1)}h
            </div>
            <p className="text-xs text-muted-foreground">
              Total registrado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas Este Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.totalExpensesThisMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Total registrado
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="time-entries" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="time-entries">Apontamento de Horas</TabsTrigger>
          <TabsTrigger value="expenses">Despesas</TabsTrigger>
          <TabsTrigger value="poc">POC</TabsTrigger>
        </TabsList>

        <TabsContent value="time-entries" className="space-y-4">
          <TimeEntriesManager onUpdate={fetchStats} />
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <ExpensesManager onUpdate={fetchStats} />
        </TabsContent>

        <TabsContent value="poc" className="space-y-4">
          <POCCalculator />
        </TabsContent>
      </Tabs>
    </div>
  );
}