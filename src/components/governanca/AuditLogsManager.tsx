import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Settings } from "lucide-react";

export function AuditLogsManager() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Auditoria & Conformidade</h2>
          <p className="text-muted-foreground">Logs de atividades e versionamento</p>
        </div>
      </div>

      <Card className="bg-gradient-subtle border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Logs de Auditoria</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Auditoria em desenvolvimento</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}