import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Eye, Edit, Trash2, Receipt, Check, X, Paperclip } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ExpenseForm } from "./ExpenseForm";

interface Expense {
  id: string;
  expense_type: string;
  supplier: string;
  amount: number;
  currency: string;
  expense_date: string;
  description: string;
  status: string;
  created_at: string;
  projects?: {
    name: string;
  } | null;
}

interface ExpensesManagerProps {
  onUpdate?: () => void;
}

export function ExpensesManager({ onUpdate }: ExpensesManagerProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from("project_expenses")
        .select(`
          *,
          projects!project_expenses_project_id_fkey(name)
        `)
        .order("expense_date", { ascending: false });

      if (error) throw error;
      setExpenses((data as any) || []);
      onUpdate?.();
    } catch (error) {
      console.error("Error fetching expenses:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar despesas",
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
        .from("project_expenses")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      await fetchExpenses();
      toast({
        title: "Sucesso",
        description: approved ? "Despesa aprovada com sucesso" : "Despesa rejeitada"
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
    if (!confirm("Tem certeza que deseja excluir esta despesa?")) return;

    try {
      const { error } = await supabase
        .from("project_expenses")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setExpenses(expenses.filter(expense => expense.id !== id));
      toast({
        title: "Sucesso",
        description: "Despesa excluída com sucesso"
      });
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir despesa",
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

  const getExpenseTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      travel: "bg-blue-100 text-blue-800",
      material: "bg-green-100 text-green-800",
      service: "bg-purple-100 text-purple-800",
      other: "bg-gray-100 text-gray-800"
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${colors[type] || colors.other}`}>
        {type}
      </span>
    );
  };

  const filteredExpenses = expenses.filter(expense =>
    expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.projects?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.expense_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Despesas de Projeto</h3>
          <p className="text-sm text-muted-foreground">
            Registre e gerencie despesas vinculadas aos projetos
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Despesa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="create-expense-description">
            <DialogHeader>
              <DialogTitle>Nova Despesa</DialogTitle>
              <p id="create-expense-description" className="text-sm text-muted-foreground">
                Registrar uma nova despesa de projeto
              </p>
            </DialogHeader>
            <ExpenseForm
              onSuccess={() => {
                setIsCreateDialogOpen(false);
                fetchExpenses();
              }}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Despesas</CardTitle>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar despesas..."
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
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      {new Date(expense.expense_date).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>{expense.projects?.name || "Projeto não encontrado"}</TableCell>
                    <TableCell>{getExpenseTypeBadge(expense.expense_type)}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {expense.description}
                    </TableCell>
                    <TableCell>{expense.supplier || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Receipt className="h-4 w-4 mr-1 text-muted-foreground" />
                        {expense.currency} {Number(expense.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(expense.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {expense.status === 'pending' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApproval(expense.id, true)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const reason = prompt("Motivo da rejeição:");
                                if (reason) handleApproval(expense.id, false, reason);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedExpense(expense)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedExpense(expense);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(expense.id)}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="edit-expense-description">
          <DialogHeader>
            <DialogTitle>Editar Despesa</DialogTitle>
            <p id="edit-expense-description" className="text-sm text-muted-foreground">
              Editar dados da despesa selecionada
            </p>
          </DialogHeader>
          {selectedExpense && (
            <ExpenseForm
              expense={selectedExpense}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                setSelectedExpense(null);
                fetchExpenses();
              }}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedExpense(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}