import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  Users,
  Folder,
  Target,
  DollarSign,
  Settings,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
} from "lucide-react";
import { EntitiesManager } from "@/components/cadastros/EntitiesManager";
import { ProjectsManager } from "@/components/cadastros/ProjectsManager";
import { CostCentersManager } from "@/components/cadastros/CostCentersManager";
import { RatesManager } from "@/components/cadastros/RatesManager";

const moduleCards = [
  {
    title: "Entidades",
    description: "Clientes, fornecedores e contatos",
    icon: Users,
    count: "245",
    status: "active",
    color: "bg-primary",
    tab: "entities"
  },
  {
    title: "Projetos",
    description: "Estrutura e hierarquia de projetos",
    icon: Folder,
    count: "47",
    status: "active",
    color: "bg-accent",
    tab: "projects"
  },
  {
    title: "Centros de Custo",
    description: "Organização contábil e departamental",
    icon: Target,
    count: "23",
    status: "active",
    color: "bg-success",
    tab: "cost-centers"
  },
  {
    title: "Rates & Tarifas",
    description: "Tabelas de preços e tarifações",
    icon: DollarSign,
    count: "156",
    status: "active",
    color: "bg-warning",
    tab: "rates"
  },
];

export default function Cadastros() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Cadastros & Estruturas</h1>
          <p className="text-muted-foreground mt-2">
            Base de dados de clientes, fornecedores, projetos, centros de custo, rates e regras
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button className="bg-gradient-primary">
            <Plus className="h-4 w-4 mr-2" />
            Novo Cadastro
          </Button>
        </div>
      </div>

      {/* Module Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {moduleCards.map((module, index) => {
          const Icon = module.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-all duration-200 group cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-lg ${module.color} text-white`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <Badge 
                    variant={module.status === "active" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {module.status === "active" ? "Ativo" : "Configurado"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                  {module.title}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {module.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary">
                    {module.count}
                  </span>
                  <Button variant="outline" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    Gerenciar
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Tabs */}
      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="entities" className="w-full">
            <TabsList className="grid w-full grid-cols-4 rounded-none">
              <TabsTrigger value="entities" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Entidades
              </TabsTrigger>
              <TabsTrigger value="projects" className="flex items-center gap-2">
                <Folder className="h-4 w-4" />
                Projetos
              </TabsTrigger>
              <TabsTrigger value="cost-centers" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Centros de Custo
              </TabsTrigger>
              <TabsTrigger value="rates" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Rates & Tarifas
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="entities" className="p-6">
              <EntitiesManager />
            </TabsContent>
            
            <TabsContent value="projects" className="p-6">
              <ProjectsManager />
            </TabsContent>
            
            <TabsContent value="cost-centers" className="p-6">
              <CostCentersManager />
            </TabsContent>
            
            <TabsContent value="rates" className="p-6">
              <RatesManager />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo da Base de Dados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">471</div>
              <div className="text-sm text-muted-foreground">Total de Registros</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-success mb-2">98.5%</div>
              <div className="text-sm text-muted-foreground">Dados Completos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-warning mb-2">7</div>
              <div className="text-sm text-muted-foreground">Pendentes de Validação</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent mb-2">4</div>
              <div className="text-sm text-muted-foreground">Módulos Ativos</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}