import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calculator, FileDown, Database, Plus } from "lucide-react";

export default function Contabilidade() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contabilidade & Exportações</h1>
          <p className="text-muted-foreground mt-2">
            Exportação de dados contábeis e financeiros
          </p>
        </div>
        <Button className="bg-gradient-primary">
          <Plus className="h-4 w-4 mr-2" />
          Nova Exportação
        </Button>
      </div>

      <div className="text-center py-24">
        <Calculator className="h-24 w-24 text-muted-foreground mx-auto mb-6" />
        <h2 className="text-2xl font-bold mb-4">Módulo em Desenvolvimento</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Sistema de contabilidade e exportações será implementado nas próximas iterações.
        </p>
        <Badge variant="outline" className="mt-4">Em Breve</Badge>
      </div>
    </div>
  );
}