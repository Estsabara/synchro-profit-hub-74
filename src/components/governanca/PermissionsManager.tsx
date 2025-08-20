import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Settings } from "lucide-react";

export function PermissionsManager() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Matriz de Permissões</h2>
          <p className="text-muted-foreground">Configure permissões por papel e módulo</p>
        </div>
      </div>

      <Card className="bg-gradient-subtle border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Matriz de Permissões</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Matriz de permissões em desenvolvimento</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}