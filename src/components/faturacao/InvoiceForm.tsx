import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Entity {
  id: string;
  name: string;
}

interface Order {
  id: string;
  order_number: string;
}

interface Project {
  id: string;
  name: string;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
}

interface InvoiceFormProps {
  invoice?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function InvoiceForm({ invoice, onSuccess, onCancel }: InvoiceFormProps) {
  const [formData, setFormData] = useState({
    invoice_number: "",
    client_id: "",
    order_id: "",
    project_id: "",
    issue_date: "",
    due_date: "",
    currency: "BRL",
    invoice_status: "draft",
    payment_method: "",
    notes: ""
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    { description: "", quantity: 1, unit_price: 0, total_amount: 0 }
  ]);

  const [entities, setEntities] = useState<Entity[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchEntities();
    fetchOrders();
    fetchProjects();
    
    if (invoice) {
      setFormData({
        invoice_number: invoice.invoice_number || "",
        client_id: invoice.client_id || "",
        order_id: invoice.order_id || "",
        project_id: invoice.project_id || "",
        issue_date: invoice.issue_date || "",
        due_date: invoice.due_date || "",
        currency: invoice.currency || "BRL",
        invoice_status: invoice.invoice_status || "draft",
        payment_method: invoice.payment_method || "",
        notes: invoice.notes || ""
      });
      fetchInvoiceItems(invoice.id);
    } else {
      // Set today as default issue date and 30 days from now as due date
      const today = new Date().toISOString().split('T')[0];
      const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, issue_date: today, due_date: dueDate }));
      generateInvoiceNumber();
    }
  }, [invoice]);

  const fetchEntities = async () => {
    try {
      const { data, error } = await supabase
        .from("entities")
        .select("id, name")
        .eq("type", "client")
        .eq("status", "active")
        .order("name");

      if (error) throw error;
      setEntities(data || []);
    } catch (error) {
      console.error("Error fetching entities:", error);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number")
        .order("order_number");

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name")
        .eq("status", "active")
        .order("name");

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const fetchInvoiceItems = async (invoiceId: string) => {
    try {
      const { data, error } = await supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", invoiceId);

      if (error) throw error;
      
      if (data && data.length > 0) {
        setItems(data.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_amount: item.total_amount
        })));
      }
    } catch (error) {
      console.error("Error fetching invoice items:", error);
    }
  };

  const generateInvoiceNumber = async () => {
    try {
      const { count } = await supabase
        .from("invoices")
        .select("*", { count: 'exact', head: true });

      const nextNumber = (count || 0) + 1;
      const invoiceNumber = `INV-${new Date().getFullYear()}-${nextNumber.toString().padStart(4, '0')}`;
      setFormData(prev => ({ ...prev, invoice_number: invoiceNumber }));
    } catch (error) {
      console.error("Error generating invoice number:", error);
    }
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Recalculate total amount for this item
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total_amount = newItems[index].quantity * newItems[index].unit_price;
    }
    
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, unit_price: 0, total_amount: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const calculateTotals = () => {
    const grossAmount = items.reduce((sum, item) => sum + item.total_amount, 0);
    const taxAmount = 0; // Could be calculated based on tax rules
    const netAmount = grossAmount + taxAmount;
    
    return { grossAmount, taxAmount, netAmount };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { grossAmount, taxAmount, netAmount } = calculateTotals();

      const invoiceData = {
        ...formData,
        order_id: formData.order_id || null,
        project_id: formData.project_id || null,
        gross_amount: grossAmount,
        tax_amount: taxAmount,
        net_amount: netAmount,
        created_by: "00000000-0000-0000-0000-000000000000" // Simulated user ID
      };

      let invoiceId: string;

      if (invoice) {
        const { error } = await supabase
          .from("invoices")
          .update(invoiceData)
          .eq("id", invoice.id);

        if (error) throw error;
        invoiceId = invoice.id;

        // Delete existing items
        await supabase
          .from("invoice_items")
          .delete()
          .eq("invoice_id", invoiceId);
      } else {
        const { data: newInvoice, error } = await supabase
          .from("invoices")
          .insert([invoiceData])
          .select()
          .single();

        if (error) throw error;
        invoiceId = newInvoice.id;
      }

      // Insert items
      const itemsData = items.map(item => ({
        invoice_id: invoiceId,
        ...item
      }));

      const { error: itemsError } = await supabase
        .from("invoice_items")
        .insert(itemsData);

      if (itemsError) throw itemsError;

      toast({
        title: "Sucesso",
        description: invoice ? "Fatura atualizada com sucesso" : "Fatura criada com sucesso"
      });

      onSuccess();
    } catch (error: any) {
      console.error("Error saving invoice:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar fatura",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const { grossAmount, taxAmount, netAmount } = calculateTotals();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="invoice_number">Número da Fatura *</Label>
          <Input
            id="invoice_number"
            value={formData.invoice_number}
            onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="client_id">Cliente *</Label>
          <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o cliente" />
            </SelectTrigger>
            <SelectContent>
              {entities.map((entity) => (
                <SelectItem key={entity.id} value={entity.id}>
                  {entity.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="order_id">Pedido</Label>
          <Select value={formData.order_id} onValueChange={(value) => setFormData({ ...formData, order_id: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o pedido" />
            </SelectTrigger>
            <SelectContent>
              {orders.map((order) => (
                <SelectItem key={order.id} value={order.id}>
                  {order.order_number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="project_id">Projeto</Label>
          <Select value={formData.project_id} onValueChange={(value) => setFormData({ ...formData, project_id: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o projeto" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="issue_date">Data de Emissão *</Label>
          <Input
            id="issue_date"
            type="date"
            value={formData.issue_date}
            onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
            required
          />
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
          <Label htmlFor="payment_method">Forma de Pagamento</Label>
          <Select value={formData.payment_method} onValueChange={(value) => setFormData({ ...formData, payment_method: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a forma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bank_transfer">Transferência Bancária</SelectItem>
              <SelectItem value="boleto">Boleto</SelectItem>
              <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
              <SelectItem value="pix">PIX</SelectItem>
            </SelectContent>
          </Select>
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

      <Separator />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Itens da Fatura</CardTitle>
            <Button type="button" variant="outline" onClick={addItem}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg">
              <div className="md:col-span-2 space-y-2">
                <Label>Descrição *</Label>
                <Input
                  value={item.description}
                  onChange={(e) => updateItem(index, 'description', e.target.value)}
                  placeholder="Descrição do item"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Quantidade *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Preço Unitário *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unit_price}
                  onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Total</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    value={item.total_amount.toFixed(2)}
                    readOnly
                    className="bg-muted"
                  />
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}

          <Separator />

          <div className="space-y-2 max-w-md ml-auto">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>R$ {grossAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Impostos:</span>
              <span>R$ {taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>R$ {netAmount.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : invoice ? "Atualizar" : "Criar"}
        </Button>
      </div>
    </form>
  );
}