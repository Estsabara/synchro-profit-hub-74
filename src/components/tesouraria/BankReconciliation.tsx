import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { FileSpreadsheet, CheckCircle, XCircle, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BankTransaction {
  id: string;
  transaction_date: string;
  amount: number;
  transaction_type: string;
  description: string;
  document_number: string;
  counterpart_name: string;
  reconciliation_status: string;
  reconciled_at: string;
  bank_accounts: { bank_name: string };
}

export default function BankReconciliation() {
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAccount, setFilterAccount] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch bank accounts
      const { data: accountsData } = await supabase
        .from("bank_accounts")
        .select("id, bank_name")
        .eq("status", "active");

      setBankAccounts(accountsData || []);

      // Fetch transactions
      let query = supabase
        .from("bank_transactions")
        .select(`
          *,
          bank_accounts(bank_name)
        `)
        .order("transaction_date", { ascending: false });

      if (filterAccount) {
        query = query.eq("bank_account_id", filterAccount);
      }

      if (filterStatus) {
        query = query.eq("reconciliation_status", filterStatus);
      }

      const { data: transactionsData, error } = await query;
      if (error) throw error;

      setTransactions(transactionsData || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterAccount, filterStatus]);

  const handleReconcile = async (transactionId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("bank_transactions")
        .update({
          reconciliation_status: status,
          reconciled_by: "current_user", // In real app, use auth.uid()
          reconciled_at: new Date().toISOString(),
        })
        .eq("id", transactionId);

      if (error) throw error;

      toast({
        title: "Conciliação atualizada!",
        description: `Transação marcada como ${status === 'matched' ? 'conciliada' : 'ignorada'}.`,
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro na conciliação",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pendente", variant: "secondary" as const },
      matched: { label: "Conciliada", variant: "default" as const },
      manual: { label: "Manual", variant: "outline" as const },
      ignored: { label: "Ignorada", variant: "destructive" as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTypeIcon = (type: string) => {
    return type === "credit" ? (
      <div className="flex items-center text-green-600">
        <span className="text-sm">Crédito</span>
      </div>
    ) : (
      <div className="flex items-center text-red-600">
        <span className="text-sm">Débito</span>
      </div>
    );
  };

  const getReconciliationStats = () => {
    const total = transactions.length;
    const reconciled = transactions.filter(t => t.reconciliation_status === 'matched').length;
    const pending = transactions.filter(t => t.reconciliation_status === 'pending').length;
    
    return { total, reconciled, pending, percentage: total > 0 ? (reconciled / total) * 100 : 0 };
  };

  const stats = getReconciliationStats();

  if (loading) {
    return <div>Carregando transações bancárias...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Conciliação Bancária</h2>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Importar Extrato
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Transações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Conciliadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.reconciled}</div>
            <p className="text-xs text-muted-foreground">{stats.percentage.toFixed(1)}%</p>
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
            <CardTitle className="text-sm">Taxa Conciliação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.percentage.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={filterAccount} onValueChange={setFilterAccount}>
              <SelectTrigger>
                <SelectValue placeholder="Conta bancária" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as contas</SelectItem>
                {bankAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.bank_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status de conciliação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="matched">Conciliada</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="ignored">Ignorada</SelectItem>
              </SelectContent>
            </Select>

            <Input placeholder="Buscar por descrição..." />

            <Button 
              variant="outline" 
              onClick={() => {
                setFilterAccount("");
                setFilterStatus("");
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileSpreadsheet className="h-5 w-5 mr-2" />
            Transações Bancárias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Conta</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Contrapartida</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {new Date(transaction.transaction_date).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>{transaction.bank_accounts.bank_name}</TableCell>
                  <TableCell>{getTypeIcon(transaction.transaction_type)}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{transaction.description}</div>
                      {transaction.document_number && (
                        <div className="text-sm text-muted-foreground">
                          Doc: {transaction.document_number}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{transaction.counterpart_name || "N/A"}</TableCell>
                  <TableCell>
                    <span className={transaction.transaction_type === "credit" ? "text-green-600" : "text-red-600"}>
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(transaction.amount)}
                    </span>
                  </TableCell>
                  <TableCell>{getStatusBadge(transaction.reconciliation_status)}</TableCell>
                  <TableCell>
                    {transaction.reconciliation_status === 'pending' && (
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReconcile(transaction.id, 'matched')}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReconcile(transaction.id, 'ignored')}
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