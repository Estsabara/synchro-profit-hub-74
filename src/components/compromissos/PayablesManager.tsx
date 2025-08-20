import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Eye, Edit, Trash2, CreditCard, AlertTriangle, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PayableForm } from "./PayableForm";
import { PaymentForm } from "./PaymentForm";

interface Payable {
  id: string;
  document_number: string;
  supplier_id: string;
  amount: number;
  paid_amount: number;
  remaining_amount: number;
  currency: string;
  due_date: string;
  payment_method: string;
  status: string;
  priority: string;
  description: string;
  entities?: {
    name: string;
  } | null;
  commitments?: {
    commitment_number: string;
  } | null;
}

interface PayablesManagerProps {
  onUpdate?: () => void;
}

export function PayablesManager({ onUpdate }: PayablesManagerProps) {
  const [payables, setPayables] = useState<Payable[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPayable, setSelectedPayable] = useState<Payable | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPayables();
  }, []);

  const fetchPayables = async () => {
    try {
      const { data, error } = await supabase
        .from("payables")
        .select(`
          *,
          entities!payables_supplier_id_fkey(name),
          commitments!payables_commitment_id_fkey(commitment_number)
        `)
        .order("due_date", { ascending: true });

      if (error) throw error;
      setPayables((data as any) || []);
      onUpdate?.();
    } catch (error) {
      console.error("Error fetching payables:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar contas a pagar",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta conta a pagar?")) return;

    try {
      const { error } = await supabase
        .from("payables")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setPayables(payables.filter(payable => payable.id !== id));
      toast({
        title: "Sucesso",
        description: "Conta a pagar excluída com sucesso"
      });
    } catch (error) {
      console.error("Error deleting payable:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir conta a pagar",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (payable: Payable) => {
    if (payable.status === 'paid') {
      return <Badge variant="secondary">Pago</Badge>;
    }
    
    if (payable.status === 'partial') {
      return <Badge variant="default">Parcial</Badge>;
    }
    
    const today = new Date();
    const dueDate = new Date(payable.due_date);
    const isOverdue = dueDate < today;
    
    if (isOverdue) {
      return <Badge variant="destructive">Em Atraso</Badge>;
    }
    
    return <Badge variant="outline">Pendente</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
      low: "outline",
      medium: "default",
      high: "destructive"
    };
    const labels = {
      low: "Baixa",
      medium: "Média",
      high: "Alta"
    };
    return (
      <Badge variant={variants[priority] || "default"}>
        {labels[priority as keyof typeof labels] || priority}
      </Badge>
    );
  };

  const filteredPayables = payables.filter(payable =>
    payable.document_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payable.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payable.entities?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPending = payables.reduce((sum, p) => p.status !== 'paid' ? sum + Number(p.remaining_amount || 0) : sum, 0);
  const overdueCount = payables.filter(p => p.status !== 'paid' && new Date(p.due_date) < new Date()).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Contas a Pagar</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie contas a pagar e registre pagamentos
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Conta a Pagar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="create-payable-description">
            <DialogHeader>
              <DialogTitle>Nova Conta a Pagar</DialogTitle>
              <p id="create-payable-description" className="text-sm text-muted-foreground">
                Registrar nova conta a pagar
              </p>
            </DialogHeader>
            <PayableForm
              onSuccess={() => {
                setIsCreateDialogOpen(false);
                fetchPayables();
              }}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendente</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {payables.filter(p => p.status !== 'paid').length} contas em aberto
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Atraso</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
            <p className="text-xs text-muted-foreground">
              Contas vencidas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Contas</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payables.length}</div>
            <p className="text-xs text-muted-foreground">
              Todas as contas
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Contas a Pagar</CardTitle>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar contas..."
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
                  <TableHead>Documento</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Pago</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayables.map((payable) => (
                  <TableRow key={payable.id}>
                    <TableCell className="font-medium">
                      {payable.document_number}
                    </TableCell>
                    <TableCell>{payable.entities?.name || "Fornecedor não encontrado"}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {payable.description || "-"}
                    </TableCell>
                    <TableCell>
                      {payable.currency} {Number(payable.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      {payable.currency} {Number(payable.paid_amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="font-medium">
                      {payable.currency} {Number(payable.remaining_amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      {new Date(payable.due_date).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>{getPriorityBadge(payable.priority)}</TableCell>
                    <TableCell>{getStatusBadge(payable)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {payable.status !== 'paid' && (
                          <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedPayable(payable)}
                              >
                                <DollarSign className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl" aria-describedby="payment-dialog-description">
                              <DialogHeader>
                                <DialogTitle>Registrar Pagamento</DialogTitle>
                                <p id="payment-dialog-description" className="text-sm text-muted-foreground">
                                  Registrar pagamento para {selectedPayable?.document_number}
                                </p>
                              </DialogHeader>
                              {selectedPayable && (
                                <PaymentForm
                                  payable={selectedPayable}
                                  onSuccess={() => {
                                    setIsPaymentDialogOpen(false);
                                    setSelectedPayable(null);
                                    fetchPayables();
                                  }}
                                  onCancel={() => {
                                    setIsPaymentDialogOpen(false);
                                    setSelectedPayable(null);
                                  }}
                                />
                              )}
                            </DialogContent>
                          </Dialog>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPayable(payable)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPayable(payable);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(payable.id)}
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="edit-payable-description">
          <DialogHeader>
            <DialogTitle>Editar Conta a Pagar</DialogTitle>
            <p id="edit-payable-description" className="text-sm text-muted-foreground">
              Editar dados da conta selecionada
            </p>
          </DialogHeader>
          {selectedPayable && (
            <PayableForm
              payable={selectedPayable}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                setSelectedPayable(null);
                fetchPayables();
              }}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedPayable(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}