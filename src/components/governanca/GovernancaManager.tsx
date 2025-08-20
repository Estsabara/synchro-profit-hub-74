import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { UsersManager } from "./UsersManager";
import { PermissionsManager } from "./PermissionsManager";
import { WorkflowsManager } from "./WorkflowsManager";
import { AuditLogsManager } from "./AuditLogsManager";
import { SystemParametersManager } from "./SystemParametersManager";
import { IntegrationsManager } from "./IntegrationsManager";
import { NotificationsManager } from "./NotificationsManager";
import { 
  Shield, 
  Users, 
  Settings, 
  GitBranch, 
  FileText, 
  Globe, 
  Zap, 
  Bell,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";

export function GovernancaManager() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Governança, Segurança & Parametrização</h1>
          <p className="text-muted-foreground mt-2">
            Identidade, workflows, auditoria e configurações globais
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Shield className="h-4 w-4 mr-2" />
            Teste de Acesso
          </Button>
          <Button className="bg-gradient-primary">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </Button>
        </div>
      </div>

      {/* Status Dashboard */}
      {activeTab === "dashboard" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-subtle border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Usuários Ativos</p>
                  <p className="text-2xl font-bold text-foreground">12</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-subtle border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Aprovações Pendentes</p>
                  <p className="text-2xl font-bold text-foreground">7</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-subtle border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Integrações Ativas</p>
                  <p className="text-2xl font-bold text-foreground">3</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-subtle border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Eventos de Auditoria</p>
                  <p className="text-2xl font-bold text-foreground">156</p>
                </div>
                <Activity className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="permissions">Permissões</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="audit">Auditoria</TabsTrigger>
          <TabsTrigger value="parameters">Parâmetros</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gradient-subtle border-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Status de Segurança</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">RLS Ativo</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Políticas de Senha</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Auditoria Ativa</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Backup Automático</span>
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-subtle border-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <GitBranch className="h-5 w-5" />
                  <span>Workflows Ativos</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Aprovação de Horas</span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Ativo</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Aprovação de Despesas</span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Ativo</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Aprovação de Faturas</span>
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Pendente</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Aprovação de Pagamentos</span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Ativo</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <UsersManager />
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <PermissionsManager />
        </TabsContent>

        <TabsContent value="workflows" className="space-y-4">
          <WorkflowsManager />
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <AuditLogsManager />
        </TabsContent>

        <TabsContent value="parameters" className="space-y-4">
          <SystemParametersManager />
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <IntegrationsManager />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <NotificationsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}