import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Settings } from "lucide-react";

export function SystemParametersManager() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Parametrizações Globais</h2>
          <p className="text-muted-foreground">Moedas, tributos, calendários e numeração</p>
        </div>
      </div>

      <Card className="bg-gradient-subtle border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>Parâmetros do Sistema</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Parâmetros em desenvolvimento</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}