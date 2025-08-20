import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, DollarSign, Plus, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PaymentForm } from "./PaymentForm";

interface Receivable {
  id: string;
  invoice_number: string;
  client_id: string;
  issue_date: string;
  due_date: string;
  net_amount: number;
  payment_status: string;
  currency: string;
  entities?: {
    name: string;
  } | null;
  total_paid?: number;
  remaining_amount?: number;
  days_overdue?: number;
}

interface ReceivablesManagerProps {
  onUpdate?: () => void;
}

export function ReceivablesManager({ onUpdate }: ReceivablesManagerProps) {
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Receivable | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchReceivables();
  }, []);

  const fetchReceivables = async () => {
    try {
      // Buscar faturas com dados de pagamento
      const { data: invoicesData, error: invoicesError } = await supabase
        .from("invoices")
        .select(`
          *,
          entities!invoices_client_id_fkey(name)
        `)
        .neq("payment_status", "paid")
        .order("due_date");

      if (invoicesError) throw invoicesError;

      // Buscar pagamentos para cada fatura
      const invoiceIds = invoicesData.map(inv => inv.id);
      let paymentsData: any[] = [];
      
      if (invoiceIds.length > 0) {
        const { data, error: paymentsError } = await supabase
          .from("invoice_payments")
          .select("invoice_id, amount")
          .in("invoice_id", invoiceIds)
          .eq("status", "confirmed");

        if (paymentsError) throw paymentsError;
        paymentsData = data || [];
      }

      // Processar dados
      const receivablesWithPayments = invoicesData.map(invoice => {
        const payments = paymentsData.filter(p => p.invoice_id === invoice.id);
        const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
        const remainingAmount = Number(invoice.net_amount) - totalPaid;
        
        const today = new Date();
        const dueDate = new Date(invoice.due_date);
        const daysOverdue = dueDate < today ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

        return {
          ...invoice,
          total_paid: totalPaid,
          remaining_amount: remainingAmount,
          days_overdue: daysOverdue
        };
      });

      setReceivables(receivablesWithPayments as any);
      onUpdate?.();
    } catch (error) {
      console.error("Error fetching receivables:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar contas a receber",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatusBadge = (receivable: Receivable) => {
    if (receivable.remaining_amount <= 0) {
      return <Badge variant="secondary">Pago</Badge>;
    }
    
    if (receivable.total_paid > 0) {
      return <Badge variant="default">Parcial</Badge>;
    }
    
    if (receivable.days_overdue > 0) {
      return <Badge variant="destructive">Em Atraso</Badge>;
    }
    
    return <Badge variant="outline">Pendente</Badge>;
  };

  const getOverdueBadge = (daysOverdue: number) => {
    if (daysOverdue <= 0) return null;
    
    const variant = daysOverdue > 90 ? "destructive" : 
                   daysOverdue > 60 ? "destructive" :
                   daysOverdue > 30 ? "default" : "outline";
    
    return (
      <Badge variant={variant}>
        {daysOverdue} dias em atraso
      </Badge>
    );
  };

  const filteredReceivables = receivables.filter(receivable =>
    receivable.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    receivable.entities?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Contas a Receber</h3>
          <p className="text-sm text-muted-foreground">
            Acompanhe pagamentos e registre recebimentos
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total em Aberto</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {receivables.reduce((sum, r) => sum + (r.remaining_amount || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {receivables.length} faturas pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {receivables.filter(r => r.days_overdue > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Faturas em atraso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Parciais</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {receivables.filter(r => r.total_paid > 0 && r.remaining_amount > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Pagamentos parciais
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maior Atraso</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.max(...receivables.map(r => r.days_overdue || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Dias de atraso
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Contas a Receber</CardTitle>
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
                  <TableHead>Fatura</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Valor Original</TableHead>
                  <TableHead>Pago</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Atraso</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceivables.map((receivable) => (
                  <TableRow key={receivable.id}>
                    <TableCell className="font-medium">
                      {receivable.invoice_number}
                    </TableCell>
                    <TableCell>{receivable.entities?.name || "Cliente não encontrado"}</TableCell>
                    <TableCell>
                      {new Date(receivable.due_date).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      {receivable.currency} {Number(receivable.net_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      {receivable.currency} {(receivable.total_paid || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="font-medium">
                      {receivable.currency} {(receivable.remaining_amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>{getPaymentStatusBadge(receivable)}</TableCell>
                    <TableCell>{getOverdueBadge(receivable.days_overdue || 0)}</TableCell>
                    <TableCell>
                      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedInvoice(receivable)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Pagamento
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl" aria-describedby="payment-dialog-description">
                          <DialogHeader>
                            <DialogTitle>Registrar Pagamento</DialogTitle>
                            <p id="payment-dialog-description" className="text-sm text-muted-foreground">
                              Registrar recebimento para a fatura {selectedInvoice?.invoice_number}
                            </p>
                          </DialogHeader>
                          {selectedInvoice && (
                            <PaymentForm
                              invoice={selectedInvoice}
                              onSuccess={() => {
                                setIsPaymentDialogOpen(false);
                                setSelectedInvoice(null);
                                fetchReceivables();
                              }}
                              onCancel={() => {
                                setIsPaymentDialogOpen(false);
                                setSelectedInvoice(null);
                              }}
                            />
                          )}
                        </DialogContent>
                      </Dialog>
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