import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Eye, Edit, Trash2, FileText, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { InvoiceForm } from "./InvoiceForm";

interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string;
  issue_date: string;
  due_date: string;
  gross_amount: number;
  net_amount: number;
  currency: string;
  invoice_status: string;
  payment_status: string;
  created_at: string;
  entities?: {
    name: string;
  } | null;
  orders?: {
    order_number: string;
  } | null;
  projects?: {
    name: string;
  } | null;
}

interface InvoicesManagerProps {
  onUpdate?: () => void;
}

export function InvoicesManager({ onUpdate }: InvoicesManagerProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          entities!invoices_client_id_fkey(name),
          orders!invoices_order_id_fkey(order_number),
          projects!invoices_project_id_fkey(name)
        `)
        .order("issue_date", { ascending: false });

      if (error) throw error;
      setInvoices((data as any) || []);
      onUpdate?.();
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar faturas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("invoices")
        .update({ invoice_status: status })
        .eq("id", id);

      if (error) throw error;

      await fetchInvoices();
      toast({
        title: "Sucesso",
        description: "Status da fatura atualizado"
      });
    } catch (error) {
      console.error("Error updating invoice status:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta fatura?")) return;

    try {
      const { error } = await supabase
        .from("invoices")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setInvoices(invoices.filter(invoice => invoice.id !== id));
      toast({
        title: "Sucesso",
        description: "Fatura excluída com sucesso"
      });
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir fatura",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
      draft: "outline",
      sent: "default",
      paid: "secondary",
      cancelled: "destructive"
    };
    const labels = {
      draft: "Rascunho",
      sent: "Enviada",
      paid: "Paga",
      cancelled: "Cancelada"
    };
    return (
      <Badge variant={variants[status] || "secondary"}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
      pending: "outline",
      partial: "default",
      paid: "secondary",
      overdue: "destructive"
    };
    const labels = {
      pending: "Pendente",
      partial: "Parcial",
      paid: "Pago",
      overdue: "Em Atraso"
    };
    return (
      <Badge variant={variants[status] || "secondary"}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.entities?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.orders?.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.projects?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Faturas</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie e acompanhe todas as faturas emitidas
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Fatura
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="create-invoice-description">
            <DialogHeader>
              <DialogTitle>Nova Fatura</DialogTitle>
              <p id="create-invoice-description" className="text-sm text-muted-foreground">
                Criar uma nova fatura para cliente
              </p>
            </DialogHeader>
            <InvoiceForm
              onSuccess={() => {
                setIsCreateDialogOpen(false);
                fetchInvoices();
              }}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista de Faturas</CardTitle>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar faturas..."
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
                  <TableHead>Cliente</TableHead>
                  <TableHead>Pedido/Projeto</TableHead>
                  <TableHead>Emissão</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoice_number}
                    </TableCell>
                    <TableCell>{invoice.entities?.name || "Cliente não encontrado"}</TableCell>
                    <TableCell>
                      {invoice.orders?.order_number || invoice.projects?.name || "-"}
                    </TableCell>
                    <TableCell>
                      {new Date(invoice.issue_date).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      {new Date(invoice.due_date).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="text-right">
                        {invoice.currency} {Number(invoice.net_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(invoice.invoice_status)}</TableCell>
                    <TableCell>{getPaymentStatusBadge(invoice.payment_status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {invoice.invoice_status === 'draft' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusUpdate(invoice.id, 'sent')}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedInvoice(invoice)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(invoice.id)}
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="edit-invoice-description">
          <DialogHeader>
            <DialogTitle>Editar Fatura</DialogTitle>
            <p id="edit-invoice-description" className="text-sm text-muted-foreground">
              Editar dados da fatura selecionada
            </p>
          </DialogHeader>
          {selectedInvoice && (
            <InvoiceForm
              invoice={selectedInvoice}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                setSelectedInvoice(null);
                fetchInvoices();
              }}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedInvoice(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}