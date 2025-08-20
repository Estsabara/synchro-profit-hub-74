import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Entity {
  id: string;
  name: string;
}

interface Commitment {
  id: string;
  commitment_number: string;
}

interface PayableFormProps {
  payable?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PayableForm({ payable, onSuccess, onCancel }: PayableFormProps) {
  const [formData, setFormData] = useState({
    commitment_id: "",
    supplier_id: "",
    document_number: "",
    amount: "",
    currency: "BRL",
    due_date: "",
    payment_method: "",
    priority: "medium",
    description: "",
    notes: ""
  });
  
  const [suppliers, setSuppliers] = useState<Entity[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSuppliers();
    fetchCommitments();
    
    if (payable) {
      setFormData({
        commitment_id: payable.commitment_id || "",
        supplier_id: payable.supplier_id || "",
        document_number: payable.document_number || "",
        amount: payable.amount?.toString() || "",
        currency: payable.currency || "BRL",
        due_date: payable.due_date || "",
        payment_method: payable.payment_method || "",
        priority: payable.priority || "medium",
        description: payable.description || "",
        notes: payable.notes || ""
      });
    } else {
      // Set default due date to 30 days from now
      const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, due_date: dueDate }));
    }
  }, [payable]);

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from("entities")
        .select("id, name")
        .eq("type", "supplier")
        .eq("status", "active")
        .order("name");

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  const fetchCommitments = async () => {
    try {
      const { data, error } = await supabase
        .from("commitments")
        .select("id, commitment_number")
        .eq("status", "approved")
        .order("commitment_number");

      if (error) throw error;
      setCommitments(data || []);
    } catch (error) {
      console.error("Error fetching commitments:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const amount = parseFloat(formData.amount);
      
      if (amount <= 0) {
        throw new Error("Valor deve ser maior que zero");
      }

      const payableData = {
        ...formData,
        amount: amount,
        commitment_id: formData.commitment_id || null,
        created_by: "00000000-0000-0000-0000-000000000000" // Simulated user ID
      };

      if (payable) {
        const { error } = await supabase
          .from("payables")
          .update(payableData)
          .eq("id", payable.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("payables")
          .insert([payableData]);

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: payable ? "Conta a pagar atualizada com sucesso" : "Conta a pagar criada com sucesso"
      });

      onSuccess();
    } catch (error: any) {
      console.error("Error saving payable:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar conta a pagar",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="document_number">Número do Documento *</Label>
          <Input
            id="document_number"
            value={formData.document_number}
            onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
            placeholder="NF, Boleto, etc."
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="supplier_id">Fornecedor *</Label>
          <Select value={formData.supplier_id} onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o fornecedor" />
            </SelectTrigger>
            <SelectContent>
              {suppliers.map((supplier) => (
                <SelectItem key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="commitment_id">Compromisso</Label>
          <Select value={formData.commitment_id} onValueChange={(value) => setFormData({ ...formData, commitment_id: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o compromisso" />
            </SelectTrigger>
            <SelectContent>
              {commitments.map((commitment) => (
                <SelectItem key={commitment.id} value={commitment.id}>
                  {commitment.commitment_number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Valor *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Moeda</Label>
          <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BRL">BRL - Real</SelectItem>
              <SelectItem value="USD">USD - Dólar</SelectItem>
              <SelectItem value="EUR">EUR - Euro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="due_date">Data de Vencimento *</Label>
          <Input
            id="due_date"
            type="date"
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="payment_method">Forma de Pagamento *</Label>
          <Select value={formData.payment_method} onValueChange={(value) => setFormData({ ...formData, payment_method: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a forma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bank_transfer">Transferência Bancária</SelectItem>
              <SelectItem value="boleto">Boleto</SelectItem>
              <SelectItem value="pix">PIX</SelectItem>
              <SelectItem value="check">Cheque</SelectItem>
              <SelectItem value="cash">Dinheiro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Prioridade</Label>
          <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Baixa</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Descrição</Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descrição da conta a pagar"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notes">Observações</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Observações adicionais"
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : payable ? "Atualizar" : "Criar"}
        </Button>
      </div>
    </form>
  );
}