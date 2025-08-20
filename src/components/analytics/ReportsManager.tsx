import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CustomReportBuilder } from "./CustomReportBuilder";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, FileText, BarChart3, PieChart, Edit, Trash2, Download } from "lucide-react";

interface Report {
  id: string;
  name: string;
  description: string;
  report_type: string;
  data_source: string;
  columns_config: any;
  filters: any;
  chart_config: any;
  is_template: boolean;
  created_at: string;
}

export function ReportsManager() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from("analytics_reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Erro ao carregar relatórios");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este relatório?")) return;

    try {
      const { error } = await supabase
        .from("analytics_reports")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Relatório excluído com sucesso");
      fetchReports();
    } catch (error) {
      console.error("Error deleting report:", error);
      toast.error("Erro ao excluir relatório");
    }
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case "table":
        return <FileText className="h-4 w-4" />;
      case "chart":
        return <BarChart3 className="h-4 w-4" />;
      case "mixed":
        return <PieChart className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getReportTypeBadge = (type: string) => {
    const variants = {
      table: "default",
      chart: "secondary", 
      mixed: "outline"
    } as const;

    return (
      <Badge variant={variants[type as keyof typeof variants] || "default"}>
        {getReportTypeIcon(type)}
        <span className="ml-1 capitalize">{type}</span>
      </Badge>
    );
  };

  if (loading) {
    return <div className="text-center py-8">Carregando relatórios...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Relatórios Customizáveis</h2>
          <p className="text-muted-foreground">Crie e gerencie relatórios personalizados</p>
        </div>
        <Button onClick={() => setShowBuilder(true)} className="bg-gradient-primary">
          <Plus className="h-4 w-4 mr-2" />
          Novo Relatório
        </Button>
      </div>

      {showBuilder && (
        <CustomReportBuilder
          report={editingReport}
          onClose={() => {
            setShowBuilder(false);
            setEditingReport(null);
          }}
          onSave={() => {
            setShowBuilder(false);
            setEditingReport(null);
            fetchReports();
          }}
        />
      )}

      <Card className="bg-gradient-subtle border-primary/10">
        <CardHeader>
          <CardTitle>Relatórios Salvos</CardTitle>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum relatório encontrado</p>
              <Button 
                variant="outline" 
                onClick={() => setShowBuilder(true)}
                className="mt-4"
              >
                Criar Primeiro Relatório
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fonte de Dados</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{report.name}</p>
                        {report.description && (
                          <p className="text-sm text-muted-foreground">
                            {report.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getReportTypeBadge(report.report_type)}
                    </TableCell>
                    <TableCell className="capitalize">
                      {report.data_source.replace("_", " ")}
                    </TableCell>
                    <TableCell>
                      {report.is_template && (
                        <Badge variant="outline">Template</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(report.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingReport(report);
                            setShowBuilder(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteReport(report.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}