import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Project {
  id: string;
  name: string;
}

interface CostCenter {
  id: string;
  name: string;
}

interface CostCategory {
  id: string;
  name: string;
  category_type: string;
}

interface BudgetFormProps {
  budget?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function BudgetForm({ budget, onSuccess, onCancel }: BudgetFormProps) {
  const [formData, setFormData] = useState({
    project_id: "",
    cost_center_id: "",
    category: "",
    subcategory: "",
    budget_type: "cost",
    amount: "",
    currency: "BRL",
    valid_from: "",
    valid_to: "",
    fiscal_year: new Date().getFullYear().toString(),
    notes: "",
  });
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [costCategories, setCostCategories] = useState<CostCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
    if (budget) {
      setFormData({
        project_id: budget.project_id || "",
        cost_center_id: budget.cost_center_id || "",
        category: budget.category || "",
        subcategory: budget.subcategory || "",
        budget_type: budget.budget_type || "cost",
        amount: budget.amount?.toString() || "",
        currency: budget.currency || "BRL",
        valid_from: budget.valid_from || "",
        valid_to: budget.valid_to || "",
        fiscal_year: budget.fiscal_year?.toString() || new Date().getFullYear().toString(),
        notes: budget.notes || "",
      });
    }
  }, [budget]);

  const fetchData = async () => {
    try {
      const [projectsRes, costCentersRes, categoriesRes] = await Promise.all([
        supabase.from("projects").select("id, name").eq("status", "active"),
        supabase.from("cost_centers").select("id, name").eq("status", "active"),
        supabase.from("cost_categories").select("id, name, category_type").eq("is_active", true)
      ]);

      if (projectsRes.error) throw projectsRes.error;
      if (costCentersRes.error) throw costCentersRes.error;
      if (categoriesRes.error) throw categoriesRes.error;

      setProjects(projectsRes.data || []);
      setCostCenters(costCentersRes.data || []);
      setCostCategories(categoriesRes.data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Valor deve ser um número positivo");
      }

      const dataToSubmit = {
        ...formData,
        amount,
        fiscal_year: parseInt(formData.fiscal_year),
        project_id: formData.project_id || null,
        cost_center_id: formData.cost_center_id || null,
        valid_to: formData.valid_to || null,
      };

      let result;
      if (budget) {
        result = await supabase
          .from("budgets")
          .update(dataToSubmit)
          .eq("id", budget.id);
      } else {
        result = await supabase
          .from("budgets")
          .insert([dataToSubmit]);
      }

      if (result.error) throw result.error;

      toast({
        title: "Sucesso!",
        description: `Orçamento ${budget ? "atualizado" : "criado"} com sucesso.`,
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

  const availableCategories = costCategories.filter(
    cat => cat.category_type === formData.budget_type
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="project_id">Projeto</Label>
          <Select value={formData.project_id} onValueChange={(value) => 
            setFormData({ ...formData, project_id: value })
          }>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um projeto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhum projeto</SelectItem>
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
          <Select value={formData.cost_center_id} onValueChange={(value) => 
            setFormData({ ...formData, cost_center_id: value })
          }>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um centro de custo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhum centro de custo</SelectItem>
              {costCenters.map((center) => (
                <SelectItem key={center.id} value={center.id}>
                  {center.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="budget_type">Tipo de Orçamento</Label>
          <Select value={formData.budget_type} onValueChange={(value) => 
            setFormData({ ...formData, budget_type: value, category: "" })
          }>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cost">Custo</SelectItem>
              <SelectItem value="revenue">Receita</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Categoria *</Label>
          <Select value={formData.category} onValueChange={(value) => 
            setFormData({ ...formData, category: value })
          }>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              {availableCategories.map((category) => (
                <SelectItem key={category.id} value={category.name}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="subcategory">Subcategoria</Label>
          <Input
            id="subcategory"
            value={formData.subcategory}
            onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
            placeholder="Subcategoria (opcional)"
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
            placeholder="0.00"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Moeda</Label>
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
          <Label htmlFor="fiscal_year">Ano Fiscal *</Label>
          <Input
            id="fiscal_year"
            type="number"
            min="2020"
            max="2030"
            value={formData.fiscal_year}
            onChange={(e) => setFormData({ ...formData, fiscal_year: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="valid_from">Válido A Partir De *</Label>
          <Input
            id="valid_from"
            type="date"
            value={formData.valid_from}
            onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="valid_to">Válido Até</Label>
          <Input
            id="valid_to"
            type="date"
            value={formData.valid_to}
            onChange={(e) => setFormData({ ...formData, valid_to: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Observações sobre o orçamento..."
          rows={3}
        />
      </div>

      <div className="flex space-x-2 pt-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : budget ? "Atualizar" : "Criar"} Orçamento
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}