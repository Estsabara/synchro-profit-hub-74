import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BankAccountFormProps {
  account?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function BankAccountForm({ account, onSuccess, onCancel }: BankAccountFormProps) {
  const [formData, setFormData] = useState({
    bank_name: "",
    bank_code: "",
    agency_branch: "",
    account_number: "",
    account_type: "checking",
    currency: "BRL",
    account_holder: "",
    status: "active",
    current_balance: "0",
    available_balance: "0",
    overdraft_limit: "0",
    notes: "",
  });
  
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (account) {
      setFormData({
        bank_name: account.bank_name || "",
        bank_code: account.bank_code || "",
        agency_branch: account.agency_branch || "",
        account_number: account.account_number || "",
        account_type: account.account_type || "checking",
        currency: account.currency || "BRL",
        account_holder: account.account_holder || "",
        status: account.status || "active",
        current_balance: account.current_balance?.toString() || "0",
        available_balance: account.available_balance?.toString() || "0",
        overdraft_limit: account.overdraft_limit?.toString() || "0",
        notes: account.notes || "",
      });
    }
  }, [account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSubmit = {
        ...formData,
        current_balance: parseFloat(formData.current_balance),
        available_balance: parseFloat(formData.available_balance),
        overdraft_limit: parseFloat(formData.overdraft_limit),
        bank_code: formData.bank_code || null,
        notes: formData.notes || null,
      };

      let result;
      if (account) {
        result = await supabase
          .from("bank_accounts")
          .update(dataToSubmit)
          .eq("id", account.id);
      } else {
        result = await supabase
          .from("bank_accounts")
          .insert([dataToSubmit]);
      }

      if (result.error) throw result.error;

      toast({
        title: "Sucesso!",
        description: `Conta bancária ${account ? "atualizada" : "criada"} com sucesso.`,
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="bank_name">Nome do Banco *</Label>
          <Input
            id="bank_name"
            value={formData.bank_name}
            onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
            placeholder="Ex: Banco do Brasil"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bank_code">Código do Banco</Label>
          <Input
            id="bank_code"
            value={formData.bank_code}
            onChange={(e) => setFormData({ ...formData, bank_code: e.target.value })}
            placeholder="Ex: 001"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="agency_branch">Agência *</Label>
          <Input
            id="agency_branch"
            value={formData.agency_branch}
            onChange={(e) => setFormData({ ...formData, agency_branch: e.target.value })}
            placeholder="Ex: 1234-5"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="account_number">Número da Conta *</Label>
          <Input
            id="account_number"
            value={formData.account_number}
            onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
            placeholder="Ex: 12345-6"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="account_type">Tipo de Conta *</Label>
          <Select value={formData.account_type} onValueChange={(value) => 
            setFormData({ ...formData, account_type: value })
          }>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="checking">Conta Corrente</SelectItem>
              <SelectItem value="savings">Poupança</SelectItem>
              <SelectItem value="investment">Investimento</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Moeda *</Label>
          <Select value={formData.currency} onValueChange={(value) => 
            setFormData({ ...formData, currency: value })
          }>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BRL">Real (BRL)</SelectItem>
              <SelectItem value="USD">Dólar (USD)</SelectItem>
              <SelectItem value="EUR">Euro (EUR)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="account_holder">Titular da Conta *</Label>
          <Input
            id="account_holder"
            value={formData.account_holder}
            onChange={(e) => setFormData({ ...formData, account_holder: e.target.value })}
            placeholder="Nome do titular"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => 
            setFormData({ ...formData, status: value })
          }>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Ativa</SelectItem>
              <SelectItem value="inactive">Inativa</SelectItem>
              <SelectItem value="closed">Encerrada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="current_balance">Saldo Atual</Label>
          <Input
            id="current_balance"
            type="number"
            step="0.01"
            value={formData.current_balance}
            onChange={(e) => setFormData({ ...formData, current_balance: e.target.value })}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="available_balance">Saldo Disponível</Label>
          <Input
            id="available_balance"
            type="number"
            step="0.01"
            value={formData.available_balance}
            onChange={(e) => setFormData({ ...formData, available_balance: e.target.value })}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="overdraft_limit">Limite de Cheque Especial</Label>
          <Input
            id="overdraft_limit"
            type="number"
            step="0.01"
            min="0"
            value={formData.overdraft_limit}
            onChange={(e) => setFormData({ ...formData, overdraft_limit: e.target.value })}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Observações sobre a conta bancária..."
          rows={3}
        />
      </div>

      <div className="flex space-x-2 pt-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : account ? "Atualizar" : "Criar"} Conta
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}