import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Eye, Edit, Trash2, FileText, Paperclip } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CommitmentForm } from "./CommitmentForm";

interface Commitment {
  id: string;
  commitment_number: string;
  supplier_id: string;
  description: string;
  amount: number;
  currency: string;
  issue_date: string;
  expected_payment_date: string;
  status: string;
  entities?: {
    name: string;
  } | null;
  projects?: {
    name: string;
  } | null;
  cost_centers?: {
    name: string;
  } | null;
}

interface CommitmentsManagerProps {
  onUpdate?: () => void;
}

export function CommitmentsManager({ onUpdate }: CommitmentsManagerProps) {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCommitment, setSelectedCommitment] = useState<Commitment | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCommitments();
  }, []);

  const fetchCommitments = async () => {
    try {
      const { data, error } = await supabase
        .from("commitments")
        .select(`
          *,
          entities!commitments_supplier_id_fkey(name),
          projects!commitments_project_id_fkey(name),
          cost_centers!commitments_cost_center_id_fkey(name)
        `)
        .order("issue_date", { ascending: false });

      if (error) throw error;
      setCommitments((data as any) || []);
      onUpdate?.();
    } catch (error) {
      console.error("Error fetching commitments:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar compromissos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("commitments")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      await fetchCommitments();
      toast({
        title: "Sucesso",
        description: "Status do compromisso atualizado"
      });
    } catch (error) {
      console.error("Error updating commitment status:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este compromisso?")) return;

    try {
      const { error } = await supabase
        .from("commitments")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setCommitments(commitments.filter(commitment => commitment.id !== id));
      toast({
        title: "Sucesso",
        description: "Compromisso excluído com sucesso"
      });
    } catch (error) {
      console.error("Error deleting commitment:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir compromisso",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
      draft: "outline",
      approved: "default",
      executed: "secondary",
      cancelled: "destructive"
    };
    const labels = {
      draft: "Rascunho",
      approved: "Aprovado",
      executed: "Executado",
      cancelled: "Cancelado"
    };
    return (
      <Badge variant={variants[status] || "secondary"}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const filteredCommitments = commitments.filter(commitment =>
    commitment.commitment_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    commitment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    commitment.entities?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Compromissos / Ordens de Fornecimento</h3>
          <p className="text-sm text-muted-foreground">
            Registre e gerencie compromissos assumidos com fornecedores
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Compromisso
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="create-commitment-description">
            <DialogHeader>
              <DialogTitle>Novo Compromisso</DialogTitle>
              <p id="create-commitment-description" className="text-sm text-muted-foreground">
                Registrar novo compromisso com fornecedor
              </p>
            </DialogHeader>
            <CommitmentForm
              onSuccess={() => {
                setIsCreateDialogOpen(false);
                fetchCommitments();
              }}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista de Compromissos</CardTitle>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar compromissos..."
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
                  <TableHead>Número</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Data Emissão</TableHead>
                  <TableHead>Previsão Pagto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCommitments.map((commitment) => (
                  <TableRow key={commitment.id}>
                    <TableCell className="font-medium">
                      {commitment.commitment_number}
                    </TableCell>
                    <TableCell>{commitment.entities?.name || "Fornecedor não encontrado"}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {commitment.description}
                    </TableCell>
                    <TableCell>
                      {commitment.currency} {Number(commitment.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      {new Date(commitment.issue_date).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      {new Date(commitment.expected_payment_date).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>{getStatusBadge(commitment.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {commitment.status === 'draft' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusUpdate(commitment.id, 'approved')}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedCommitment(commitment)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedCommitment(commitment);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(commitment.id)}
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="edit-commitment-description">
          <DialogHeader>
            <DialogTitle>Editar Compromisso</DialogTitle>
            <p id="edit-commitment-description" className="text-sm text-muted-foreground">
              Editar dados do compromisso selecionado
            </p>
          </DialogHeader>
          {selectedCommitment && (
            <CommitmentForm
              commitment={selectedCommitment}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                setSelectedCommitment(null);
                fetchCommitments();
              }}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedCommitment(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}