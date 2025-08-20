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

interface Project {
  id: string;
  name: string;
}

interface CostCenter {
  id: string;
  name: string;
}

interface CommitmentFormProps {
  commitment?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CommitmentForm({ commitment, onSuccess, onCancel }: CommitmentFormProps) {
  const [formData, setFormData] = useState({
    commitment_number: "",
    supplier_id: "",
    project_id: "",
    cost_center_id: "",
    description: "",
    amount: "",
    currency: "BRL",
    issue_date: "",
    expected_payment_date: "",
    notes: ""
  });
  
  const [suppliers, setSuppliers] = useState<Entity[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSuppliers();
    fetchProjects();
    fetchCostCenters();
    
    if (commitment) {
      setFormData({
        commitment_number: commitment.commitment_number || "",
        supplier_id: commitment.supplier_id || "",
        project_id: commitment.project_id || "",
        cost_center_id: commitment.cost_center_id || "",
        description: commitment.description || "",
        amount: commitment.amount?.toString() || "",
        currency: commitment.currency || "BRL",
        issue_date: commitment.issue_date || "",
        expected_payment_date: commitment.expected_payment_date || "",
        notes: commitment.notes || ""
      });
    } else {
      // Set today's date as default issue date and 30 days from now as expected payment
      const today = new Date().toISOString().split('T')[0];
      const expectedDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, issue_date: today, expected_payment_date: expectedDate }));
      generateCommitmentNumber();
    }
  }, [commitment]);

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

  const fetchCostCenters = async () => {
    try {
      const { data, error } = await supabase
        .from("cost_centers")
        .select("id, name")
        .eq("status", "active")
        .order("name");

      if (error) throw error;
      setCostCenters(data || []);
    } catch (error) {
      console.error("Error fetching cost centers:", error);
    }
  };

  const generateCommitmentNumber = async () => {
    try {
      const { count } = await supabase
        .from("commitments")
        .select("*", { count: 'exact', head: true });

      const nextNumber = (count || 0) + 1;
      const commitmentNumber = `COM-${new Date().getFullYear()}-${nextNumber.toString().padStart(4, '0')}`;
      setFormData(prev => ({ ...prev, commitment_number: commitmentNumber }));
    } catch (error) {
      console.error("Error generating commitment number:", error);
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

      const commitmentData = {
        ...formData,
        amount: amount,
        project_id: formData.project_id || null,
        cost_center_id: formData.cost_center_id || null,
        created_by: "00000000-0000-0000-0000-000000000000" // Simulated user ID
      };

      if (commitment) {
        const { error } = await supabase
          .from("commitments")
          .update(commitmentData)
          .eq("id", commitment.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("commitments")
          .insert([commitmentData]);

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: commitment ? "Compromisso atualizado com sucesso" : "Compromisso criado com sucesso"
      });

      onSuccess();
    } catch (error: any) {
      console.error("Error saving commitment:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar compromisso",
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
          <Label htmlFor="commitment_number">Número do Compromisso *</Label>
          <Input
            id="commitment_number"
            value={formData.commitment_number}
            onChange={(e) => setFormData({ ...formData, commitment_number: e.target.value })}
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
          <Label htmlFor="cost_center_id">Centro de Custo</Label>
          <Select value={formData.cost_center_id} onValueChange={(value) => setFormData({ ...formData, cost_center_id: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o centro de custo" />
            </SelectTrigger>
            <SelectContent>
              {costCenters.map((center) => (
                <SelectItem key={center.id} value={center.id}>
                  {center.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Descrição *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descreva o compromisso"
            required
          />
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
          <Label htmlFor="expected_payment_date">Previsão de Pagamento *</Label>
          <Input
            id="expected_payment_date"
            type="date"
            value={formData.expected_payment_date}
            onChange={(e) => setFormData({ ...formData, expected_payment_date: e.target.value })}
            required
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
          {loading ? "Salvando..." : commitment ? "Atualizar" : "Criar"}
        </Button>
      </div>
    </form>
  );
}