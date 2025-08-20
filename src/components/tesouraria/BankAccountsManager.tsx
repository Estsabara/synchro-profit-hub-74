import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Eye, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import BankAccountForm from "./BankAccountForm";

interface BankAccount {
  id: string;
  bank_name: string;
  agency_branch: string;
  account_number: string;
  account_type: string;
  currency: string;
  account_holder: string;
  status: string;
  current_balance: number;
  available_balance: number;
  overdraft_limit: number;
}

export default function BankAccountsManager() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const { toast } = useToast();

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar contas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleEdit = (account: BankAccount) => {
    setSelectedAccount(account);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedAccount(null);
    fetchAccounts();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: "Ativa", variant: "default" as const },
      inactive: { label: "Inativa", variant: "secondary" as const },
      closed: { label: "Encerrada", variant: "outline" as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getAccountTypeBadge = (type: string) => {
    const typeConfig = {
      checking: { label: "Corrente", variant: "default" as const },
      savings: { label: "Poupança", variant: "secondary" as const },
      investment: { label: "Investimento", variant: "outline" as const },
    };
    
    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.checking;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getBalanceColor = (balance: number, overdraft: number = 0) => {
    if (balance < 0 && Math.abs(balance) > overdraft) {
      return "text-destructive";
    } else if (balance < 0) {
      return "text-amber-600";
    }
    return "text-foreground";
  };

  const getTotalBalance = () => {
    return accounts
      .filter(acc => acc.status === 'active')
      .reduce((sum, acc) => sum + acc.current_balance, 0);
  };

  if (loading) {
    return <div>Carregando contas bancárias...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Contas Bancárias</h2>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedAccount(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Conta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                {selectedAccount ? "Editar Conta Bancária" : "Nova Conta Bancária"}
              </DialogTitle>
            </DialogHeader>
            <BankAccountForm
              account={selectedAccount}
              onSuccess={handleFormSuccess}
              onCancel={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total de Contas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts.length}</div>
            <p className="text-xs text-muted-foreground">
              {accounts.filter(acc => acc.status === 'active').length} ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Saldo Consolidado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getBalanceColor(getTotalBalance())}`}>
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(getTotalBalance())}
            </div>
            <p className="text-xs text-muted-foreground">Todas as moedas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Contas BRL</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {accounts.filter(acc => acc.currency === 'BRL' && acc.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">Moeda nacional</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Multi-moeda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {accounts.filter(acc => acc.currency !== 'BRL' && acc.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">USD, EUR, outras</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contas Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Banco</TableHead>
                <TableHead>Agência/Conta</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Titular</TableHead>
                <TableHead>Moeda</TableHead>
                <TableHead>Saldo Atual</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">{account.bank_name}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{account.agency_branch}</div>
                      <div className="text-sm text-muted-foreground">{account.account_number}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getAccountTypeBadge(account.account_type)}</TableCell>
                  <TableCell>{account.account_holder}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{account.currency}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className={getBalanceColor(account.current_balance, account.overdraft_limit)}>
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: account.currency,
                      }).format(account.current_balance)}
                    </div>
                    {account.current_balance < 0 && account.overdraft_limit > 0 && (
                      <div className="text-xs text-muted-foreground">
                        Limite: {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: account.currency,
                        }).format(account.overdraft_limit)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(account.status)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(account)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {account.current_balance < 0 && Math.abs(account.current_balance) > account.overdraft_limit && (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
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