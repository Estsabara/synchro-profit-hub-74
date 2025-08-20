import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PaymentFormProps {
  invoice: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PaymentForm({ invoice, onSuccess, onCancel }: PaymentFormProps) {
  const [formData, setFormData] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    amount: "",
    payment_method: "",
    reference_number: "",
    notes: ""
  });
  
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const paymentAmount = parseFloat(formData.amount);
      
      if (paymentAmount <= 0) {
        throw new Error("Valor do pagamento deve ser maior que zero");
      }

      if (paymentAmount > (invoice.remaining_amount || invoice.net_amount)) {
        throw new Error("Valor do pagamento não pode ser maior que o saldo devedor");
      }

      // Inserir pagamento
      const paymentData = {
        invoice_id: invoice.id,
        payment_date: formData.payment_date,
        amount: paymentAmount,
        payment_method: formData.payment_method,
        reference_number: formData.reference_number || null,
        notes: formData.notes || null,
        created_by: "00000000-0000-0000-0000-000000000000" // Simulated user ID
      };

      const { error: paymentError } = await supabase
        .from("invoice_payments")
        .insert([paymentData]);

      if (paymentError) throw paymentError;

      // Atualizar status da fatura
      const totalPaid = (invoice.total_paid || 0) + paymentAmount;
      const remainingAmount = invoice.net_amount - totalPaid;
      
      let paymentStatus = "pending";
      if (remainingAmount <= 0) {
        paymentStatus = "paid";
      } else if (totalPaid > 0) {
        paymentStatus = "partial";
      }

      const { error: updateError } = await supabase
        .from("invoices")
        .update({ payment_status: paymentStatus })
        .eq("id", invoice.id);

      if (updateError) throw updateError;

      toast({
        title: "Sucesso",
        description: `Pagamento de R$ ${paymentAmount.toFixed(2)} registrado com sucesso`
      });

      onSuccess();
    } catch (error: any) {
      console.error("Error registering payment:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao registrar pagamento",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Informações da fatura */}
      <div className="bg-muted p-4 rounded-lg">
        <h4 className="font-semibold mb-2">Informações da Fatura</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Número:</span> {invoice.invoice_number}
          </div>
          <div>
            <span className="text-muted-foreground">Cliente:</span> {invoice.entities?.name}
          </div>
          <div>
            <span className="text-muted-foreground">Valor Original:</span> {invoice.currency} {Number(invoice.net_amount).toFixed(2)}
          </div>
          <div>
            <span className="text-muted-foreground">Saldo Devedor:</span> {invoice.currency} {(invoice.remaining_amount || invoice.net_amount).toFixed(2)}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="payment_date">Data do Pagamento *</Label>
            <Input
              id="payment_date"
              type="date"
              value={formData.payment_date}
              onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor Recebido *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              max={invoice.remaining_amount || invoice.net_amount}
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
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
                <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="cash">Dinheiro</SelectItem>
                <SelectItem value="check">Cheque</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference_number">Número de Referência</Label>
            <Input
              id="reference_number"
              value={formData.reference_number}
              onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
              placeholder="Comprovante, TED, etc."
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observações sobre o pagamento"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Registrando..." : "Registrar Pagamento"}
          </Button>
        </div>
      </form>
    </div>
  );
}