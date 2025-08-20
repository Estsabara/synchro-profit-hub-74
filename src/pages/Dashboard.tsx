import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  Building2,
} from "lucide-react";

// Dados mockados para demonstração
const kpiData = [
  {
    title: "Faturamento do Mês",
    value: "R$ 1.250.000",
    change: "+12.5%",
    trend: "up" as const,
    icon: DollarSign,
  },
  {
    title: "Margem Média",
    value: "32.8%",
    change: "+2.1%",
    trend: "up" as const,
    icon: TrendingUp,
  },
  {
    title: "Projetos Ativos",
    value: "47",
    change: "+3",
    trend: "up" as const,
    icon: Building2,
  },
  {
    title: "Horas Apontadas",
    value: "8.420h",
    change: "-3.2%",
    trend: "down" as const,
    icon: Clock,
  },
];

const projectsData = [
  {
    name: "Projeto Alpha Tech",
    client: "TechCorp",
    progress: 85,
    budget: "R$ 450.000",
    status: "Em Andamento",
    urgency: "normal" as const,
  },
  {
    name: "Sistema Beta Finance",
    client: "FinanceGroup",
    progress: 95,
    budget: "R$ 280.000",
    status: "Finalização",
    urgency: "high" as const,
  },
  {
    name: "App Gamma Mobile",
    client: "StartupXYZ",
    progress: 45,
    budget: "R$ 150.000",
    status: "Desenvolvimento",
    urgency: "normal" as const,
  },
  {
    name: "Plataforma Delta",
    client: "EnterpriseABC",
    progress: 15,
    budget: "R$ 680.000",
    status: "Planejamento",
    urgency: "low" as const,
  },
];

const financialAlerts = [
  {
    type: "warning" as const,
    title: "Faturas Pendentes",
    description: "R$ 125.000 em faturas vencidas há mais de 30 dias",
  },
  {
    type: "success" as const,
    title: "Meta Atingida",
    description: "Faturamento mensal superou meta em 8.5%",
  },
  {
    type: "error" as const,
    title: "Orçamento Estourado",
    description: "Projeto Beta está 15% acima do orçamento",
  },
];

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Visão geral dos projetos e finanças
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-success-light text-success">
            Sistema Online
          </Badge>
          <Badge variant="outline">
            Última atualização: há 2 min
          </Badge>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <div className="flex items-center space-x-1 text-xs">
                  {kpi.trend === "up" ? (
                    <TrendingUp className="h-3 w-3 text-success" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-destructive" />
                  )}
                  <span
                    className={
                      kpi.trend === "up" ? "text-success" : "text-destructive"
                    }
                  >
                    {kpi.change}
                  </span>
                  <span className="text-muted-foreground">vs mês anterior</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projetos em Andamento */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>Projetos em Andamento</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {projectsData.map((project, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-medium">{project.name}</h4>
                    <Badge
                      variant={
                        project.urgency === "high"
                          ? "destructive"
                          : project.urgency === "normal"
                          ? "default"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {project.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Cliente: {project.client} • {project.budget}
                  </p>
                  <div className="flex items-center space-x-2">
                    <Progress value={project.progress} className="flex-1" />
                    <span className="text-sm font-medium">{project.progress}%</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Alertas Financeiros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Alertas</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {financialAlerts.map((alert, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border-l-4 ${
                  alert.type === "warning"
                    ? "border-warning bg-warning-light"
                    : alert.type === "success"
                    ? "border-success bg-success-light"
                    : "border-destructive bg-destructive/10"
                }`}
              >
                <div className="flex items-start space-x-2">
                  {alert.type === "warning" ? (
                    <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                  ) : alert.type === "success" ? (
                    <CheckCircle className="h-4 w-4 text-success mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                  )}
                  <div>
                    <h5 className="font-medium text-sm">{alert.title}</h5>
                    <p className="text-xs text-muted-foreground mt-1">
                      {alert.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}