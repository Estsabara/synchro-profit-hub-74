import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PaymentExecution {
  id: string;
  execution_date: string;
  amount: number;
  currency: string;
  payment_method: string;
  beneficiary_name: string;
  beneficiary_bank: string;
  beneficiary_account: string;
  status: string;
  bank_accounts: { bank_name: string };
  payables?: { document_number: string };
}

export default function PaymentExecution() {
  const [payments, setPayments] = useState<PaymentExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterMethod, setFilterMethod] = useState<string>("");
  const { toast } = useToast();

  const fetchPayments = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from("payment_executions")
        .select(`
          *,
          bank_accounts(bank_name),
          payables(document_number)
        `)
        .order("execution_date", { ascending: false });

      if (filterStatus) {
        query = query.eq("status", filterStatus);
      }

      if (filterMethod) {
        query = query.eq("payment_method", filterMethod);
      }

      const { data, error } = await query;
      if (error) throw error;

      setPayments(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar pagamentos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [filterStatus, filterMethod]);

  const executePayment = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from("payment_executions")
        .update({
          status: "executed",
          executed_by: "current_user", // In real app, use auth.uid()
          executed_at: new Date().toISOString(),
          execution_reference: `PAY-${Date.now()}`,
        })
        .eq("id", paymentId);

      if (error) throw error;

      toast({
        title: "Pagamento executado!",
        description: "Pagamento processado com sucesso.",
      });

      fetchPayments();
    } catch (error: any) {
      toast({
        title: "Erro na execução",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const cancelPayment = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from("payment_executions")
        .update({
          status: "cancelled",
          executed_by: "current_user",
          executed_at: new Date().toISOString(),
        })
        .eq("id", paymentId);

      if (error) throw error;

      toast({
        title: "Pagamento cancelado!",
        description: "Pagamento cancelado com sucesso.",
      });

      fetchPayments();
    } catch (error: any) {
      toast({
        title: "Erro no cancelamento",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pendente", variant: "secondary" as const, icon: AlertTriangle },
      executed: { label: "Executado", variant: "default" as const, icon: CheckCircle },
      failed: { label: "Falhou", variant: "destructive" as const, icon: XCircle },
      cancelled: { label: "Cancelado", variant: "outline" as const, icon: XCircle },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center">
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getMethodBadge = (method: string) => {
    const methodConfig = {
      transfer: { label: "Transferência", variant: "default" as const },
      ted: { label: "TED", variant: "secondary" as const },
      pix: { label: "PIX", variant: "outline" as const },
      check: { label: "Cheque", variant: "destructive" as const },
      boleto: { label: "Boleto", variant: "outline" as const },
    };
    
    const config = methodConfig[method as keyof typeof methodConfig] || methodConfig.transfer;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPaymentStats = () => {
    const total = payments.length;
    const pending = payments.filter(p => p.status === 'pending').length;
    const executed = payments.filter(p => p.status === 'executed').length;
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    
    return { total, pending, executed, totalAmount };
  };

  const stats = getPaymentStats();

  if (loading) {
    return <div>Carregando execuções de pagamento...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Execução de Pagamentos</h2>
        <Button>
          <Play className="h-4 w-4 mr-2" />
          Executar Lote
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Pagamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Executados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.executed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(stats.totalAmount)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="executed">Executado</SelectItem>
                <SelectItem value="failed">Falhou</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterMethod} onValueChange={setFilterMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Método de pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os métodos</SelectItem>
                <SelectItem value="transfer">Transferência</SelectItem>
                <SelectItem value="ted">TED</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="check">Cheque</SelectItem>
                <SelectItem value="boleto">Boleto</SelectItem>
              </SelectContent>
            </Select>

            <div></div>

            <Button 
              variant="outline" 
              onClick={() => {
                setFilterStatus("");
                setFilterMethod("");
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Programação de Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data Execução</TableHead>
                <TableHead>Conta Origem</TableHead>
                <TableHead>Beneficiário</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    {new Date(payment.execution_date).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>{payment.bank_accounts.bank_name}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{payment.beneficiary_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {payment.beneficiary_bank} - {payment.beneficiary_account}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getMethodBadge(payment.payment_method)}</TableCell>
                  <TableCell>
                    {payment.payables?.document_number || "N/A"}
                  </TableCell>
                  <TableCell>
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: payment.currency,
                    }).format(payment.amount)}
                  </TableCell>
                  <TableCell>{getStatusBadge(payment.status)}</TableCell>
                  <TableCell>
                    {payment.status === 'pending' && (
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => executePayment(payment.id)}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cancelPayment(payment.id)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}