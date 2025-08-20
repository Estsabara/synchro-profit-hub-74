import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DashboardsManager } from "./DashboardsManager";
import { ReportsManager } from "./ReportsManager";
import { KPIHistoryManager } from "./KPIHistoryManager";
import { BarChart3, LineChart, PieChart, Download, TrendingUp, TrendingDown, Calendar } from "lucide-react";

export function AnalyticsManager() {
  const [activeTab, setActiveTab] = useState("dashboards");

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics & Relatórios</h1>
          <p className="text-muted-foreground mt-2">
            Dashboards visuais e relatórios gerenciais integrados
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Agendar Relatório
          </Button>
          <Button className="bg-gradient-primary">
            <Download className="h-4 w-4 mr-2" />
            Exportar Dashboard
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-subtle border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dashboards Ativos</p>
                <p className="text-2xl font-bold text-foreground">3</p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-subtle border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Relatórios Salvos</p>
                <p className="text-2xl font-bold text-foreground">12</p>
              </div>
              <LineChart className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-subtle border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">KPIs Monitorados</p>
                <p className="text-2xl font-bold text-foreground">9</p>
              </div>
              <PieChart className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-subtle border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Último Snapshot</p>
                <p className="text-sm font-medium text-foreground">Hoje 09:00</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboards">Dashboards</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
          <TabsTrigger value="history">Histórico de KPIs</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboards" className="space-y-4">
          <DashboardsManager />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <ReportsManager />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <KPIHistoryManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}