import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { X, Save, Eye } from "lucide-react";

interface Report {
  id?: string;
  name: string;
  description: string;
  report_type: string;
  data_source: string;
  columns_config: any;
  filters: any;
  chart_config: any;
  is_template: boolean;
}

interface CustomReportBuilderProps {
  report?: Report | null;
  onClose: () => void;
  onSave: () => void;
}

const DATA_SOURCES = [
  { value: "projects", label: "Projetos" },
  { value: "invoices", label: "Faturas" },
  { value: "actuals", label: "Custos Reais" },
  { value: "time_entries", label: "Lançamentos de Horas" },
  { value: "payables", label: "Contas a Pagar" },
  { value: "orders", label: "Pedidos" }
];

const REPORT_TYPES = [
  { value: "table", label: "Tabela" },
  { value: "chart", label: "Gráfico" },
  { value: "mixed", label: "Misto (Tabela + Gráfico)" }
];

const CHART_TYPES = [
  { value: "bar", label: "Barras" },
  { value: "line", label: "Linha" },
  { value: "pie", label: "Pizza" },
  { value: "area", label: "Área" }
];

export function CustomReportBuilder({ report, onClose, onSave }: CustomReportBuilderProps) {
  const [formData, setFormData] = useState<Report>({
    name: "",
    description: "",
    report_type: "table",
    data_source: "projects",
    columns_config: { columns: [] },
    filters: {},
    chart_config: { chartType: "bar" },
    is_template: false
  });

  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (report) {
      setFormData(report);
      setSelectedColumns(report.columns_config?.columns || []);
    }
  }, [report]);

  const getAvailableColumns = (dataSource: string) => {
    const columnMaps = {
      projects: ["name", "status", "start_date", "end_date", "description"],
      invoices: ["invoice_number", "client_id", "net_amount", "issue_date", "due_date", "payment_status"],
      actuals: ["category", "amount", "actual_date", "project_id", "description"],
      time_entries: ["project_id", "hours_worked", "work_date", "activity", "status"],
      payables: ["document_number", "supplier_id", "amount", "due_date", "status"],
      orders: ["order_number", "client_id", "total_value", "status", "start_date"]
    };

    return columnMaps[dataSource as keyof typeof columnMaps] || [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const reportData = {
        ...formData,
        columns_config: { columns: selectedColumns },
        filters: formData.filters || {},
        chart_config: formData.chart_config || { chartType: "bar" }
      };

      if (report?.id) {
        const { error } = await supabase
          .from("analytics_reports")
          .update(reportData)
          .eq("id", report.id);

        if (error) throw error;
        toast.success("Relatório atualizado com sucesso");
      } else {
        const { error } = await supabase
          .from("analytics_reports")
          .insert([reportData]);

        if (error) throw error;
        toast.success("Relatório criado com sucesso");
      }

      onSave();
    } catch (error) {
      console.error("Error saving report:", error);
      toast.error("Erro ao salvar relatório");
    } finally {
      setLoading(false);
    }
  };

  const handleColumnToggle = (column: string) => {
    setSelectedColumns(prev => 
      prev.includes(column) 
        ? prev.filter(c => c !== column)
        : [...prev, column]
    );
  };

  const availableColumns = getAvailableColumns(formData.data_source);

  return (
    <Card className="bg-gradient-subtle border-primary/10">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          {report ? "Editar Relatório" : "Novo Relatório"}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Relatório</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="report_type">Tipo de Relatório</Label>
              <Select
                value={formData.report_type}
                onValueChange={(value) => setFormData({ ...formData, report_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <Separator />

          {/* Data Source */}
          <div className="space-y-2">
            <Label htmlFor="data_source">Fonte de Dados</Label>
            <Select
              value={formData.data_source}
              onValueChange={(value) => {
                setFormData({ ...formData, data_source: value });
                setSelectedColumns([]);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATA_SOURCES.map((source) => (
                  <SelectItem key={source.value} value={source.value}>
                    {source.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Column Selection */}
          <div className="space-y-4">
            <Label>Colunas a Exibir</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {availableColumns.map((column) => (
                <div key={column} className="flex items-center space-x-2">
                  <Checkbox
                    id={column}
                    checked={selectedColumns.includes(column)}
                    onCheckedChange={() => handleColumnToggle(column)}
                  />
                  <Label htmlFor={column} className="text-sm capitalize">
                    {column.replace(/_/g, " ")}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Chart Configuration */}
          {(formData.report_type === "chart" || formData.report_type === "mixed") && (
            <>
              <Separator />
              <div className="space-y-4">
                <Label>Configuração do Gráfico</Label>
                <div className="space-y-2">
                  <Label htmlFor="chart_type">Tipo de Gráfico</Label>
                  <Select
                    value={formData.chart_config?.chartType || "bar"}
                    onValueChange={(value) => 
                      setFormData({ 
                        ...formData, 
                        chart_config: { ...formData.chart_config, chartType: value }
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CHART_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Options */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_template"
              checked={formData.is_template}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, is_template: !!checked })
              }
            />
            <Label htmlFor="is_template">Salvar como template</Label>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="button" variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Visualizar
            </Button>
            <Button type="submit" disabled={loading} className="bg-gradient-primary">
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}