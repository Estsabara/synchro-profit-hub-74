import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Eye, Edit, Trash2, Clock, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TimeEntryForm } from "./TimeEntryForm";

interface TimeEntry {
  id: string;
  activity: string;
  work_date: string;
  hours_worked: number;
  observations: string;
  status: string;
  created_at: string;
  projects?: {
    name: string;
  } | null;
}

interface TimeEntriesManagerProps {
  onUpdate?: () => void;
}

export function TimeEntriesManager({ onUpdate }: TimeEntriesManagerProps) {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTimeEntries();
  }, []);

  const fetchTimeEntries = async () => {
    try {
      const { data, error } = await supabase
        .from("time_entries")
        .select(`
          *,
          projects!time_entries_project_id_fkey(name)
        `)
        .order("work_date", { ascending: false });

      if (error) throw error;
      setTimeEntries((data as any) || []);
      onUpdate?.();
    } catch (error) {
      console.error("Error fetching time entries:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar apontamentos de horas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (id: string, approved: boolean, reason?: string) => {
    try {
      const updateData = {
        status: approved ? 'approved' : 'rejected',
        approved_at: approved ? new Date().toISOString() : null,
        rejection_reason: approved ? null : reason
      };

      const { error } = await supabase
        .from("time_entries")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      await fetchTimeEntries();
      toast({
        title: "Sucesso",
        description: approved ? "Horas aprovadas com sucesso" : "Horas rejeitadas"
      });
    } catch (error) {
      console.error("Error updating approval:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar aprovação",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este apontamento?")) return;

    try {
      const { error } = await supabase
        .from("time_entries")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setTimeEntries(timeEntries.filter(entry => entry.id !== id));
      toast({
        title: "Sucesso",
        description: "Apontamento excluído com sucesso"
      });
    } catch (error) {
      console.error("Error deleting time entry:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir apontamento",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
      pending: "outline",
      approved: "default",
      rejected: "destructive"
    };
    const labels = {
      pending: "Pendente",
      approved: "Aprovado",
      rejected: "Rejeitado"
    };
    return (
      <Badge variant={variants[status] || "secondary"}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const filteredEntries = timeEntries.filter(entry =>
    entry.activity.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.projects?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.observations?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Apontamento de Horas</h3>
          <p className="text-sm text-muted-foreground">
            Registre e gerencie horas trabalhadas por projeto
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Apontamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="create-time-entry-description">
            <DialogHeader>
              <DialogTitle>Novo Apontamento de Horas</DialogTitle>
              <p id="create-time-entry-description" className="text-sm text-muted-foreground">
                Registrar horas trabalhadas em um projeto
              </p>
            </DialogHeader>
            <TimeEntryForm
              onSuccess={() => {
                setIsCreateDialogOpen(false);
                fetchTimeEntries();
              }}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Apontamentos de Horas</CardTitle>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar apontamentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-80"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Atividade</TableHead>
                  <TableHead>Horas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      {new Date(entry.work_date).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>{entry.projects?.name || "Projeto não encontrado"}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {entry.activity}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                        {entry.hours_worked}h
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(entry.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {entry.status === 'pending' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApproval(entry.id, true)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const reason = prompt("Motivo da rejeição:");
                                if (reason) handleApproval(entry.id, false, reason);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedEntry(entry)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedEntry(entry);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(entry.id)}
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

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="edit-time-entry-description">
          <DialogHeader>
            <DialogTitle>Editar Apontamento de Horas</DialogTitle>
            <p id="edit-time-entry-description" className="text-sm text-muted-foreground">
              Editar dados do apontamento selecionado
            </p>
          </DialogHeader>
          {selectedEntry && (
            <TimeEntryForm
              timeEntry={selectedEntry}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                setSelectedEntry(null);
                fetchTimeEntries();
              }}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedEntry(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}