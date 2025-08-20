import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface OrderFormProps {
  order?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function OrderForm({ order, onSuccess, onCancel }: OrderFormProps) {
  const [formData, setFormData] = useState({
    order_number: "",
    client_id: "",
    description: "",
    total_value: "",
    estimated_costs: "",
    margin_percentage: "",
    start_date: "",
    end_date: "",
    currency: "BRL",
    status: "draft"
  });
  
  const [entities, setEntities] = useState<Entity[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchEntities();
    fetchProjects();
    
    if (order) {
      setFormData({
        order_number: order.order_number || "",
        client_id: order.client_id || "",
        description: order.description || "",
        total_value: order.total_value?.toString() || "",
        estimated_costs: order.estimated_costs?.toString() || "",
        margin_percentage: order.margin_percentage?.toString() || "",
        start_date: order.start_date || "",
        end_date: order.end_date || "",
        currency: order.currency || "BRL",
        status: order.status || "draft"
      });
    }
  }, [order]);

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

  const calculateMargin = () => {
    const totalValue = parseFloat(formData.total_value) || 0;
    const estimatedCosts = parseFloat(formData.estimated_costs) || 0;
    const marginValue = totalValue - estimatedCosts;
    const marginPercentage = totalValue > 0 ? (marginValue / totalValue) * 100 : 0;
    
    setFormData(prev => ({
      ...prev,
      margin_percentage: marginPercentage.toFixed(2)
    }));
  };

  useEffect(() => {
    if (formData.total_value && formData.estimated_costs) {
      calculateMargin();
    }
  }, [formData.total_value, formData.estimated_costs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const totalValue = parseFloat(formData.total_value);
      const estimatedCosts = parseFloat(formData.estimated_costs) || 0;
      const marginPercentage = parseFloat(formData.margin_percentage) || 0;
      const marginValue = totalValue - estimatedCosts;

      const orderData = {
        ...formData,
        total_value: totalValue,
        estimated_costs: estimatedCosts,
        margin_percentage: marginPercentage,
        margin_value: marginValue
      };

      if (order) {
        const { error } = await supabase
          .from("orders")
          .update(orderData)
          .eq("id", order.id);

        if (error) throw error;
      } else {
        const { data: newOrder, error } = await supabase
          .from("orders")
          .insert([orderData])
          .select()
          .single();

        if (error) throw error;

        // Vincular projetos selecionados
        if (selectedProjects.length > 0) {
          const orderProjects = selectedProjects.map(projectId => ({
            order_id: newOrder.id,
            project_id: projectId
          }));

          const { error: projectError } = await supabase
            .from("order_projects")
            .insert(orderProjects);

          if (projectError) throw projectError;
        }
      }

      toast({
        title: "Sucesso",
        description: order ? "Pedido atualizado com sucesso" : "Pedido criado com sucesso"
      });

      onSuccess();
    } catch (error) {
      console.error("Error saving order:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar pedido",
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
          <Label htmlFor="order_number">Número do Pedido *</Label>
          <Input
            id="order_number"
            value={formData.order_number}
            onChange={(e) => setFormData({ ...formData, order_number: e.target.value })}
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

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Descrição *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="total_value">Valor Total *</Label>
          <Input
            id="total_value"
            type="number"
            step="0.01"
            value={formData.total_value}
            onChange={(e) => setFormData({ ...formData, total_value: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimated_costs">Custos Estimados</Label>
          <Input
            id="estimated_costs"
            type="number"
            step="0.01"
            value={formData.estimated_costs}
            onChange={(e) => setFormData({ ...formData, estimated_costs: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="margin_percentage">Margem Prevista (%)</Label>
          <Input
            id="margin_percentage"
            type="number"
            step="0.01"
            value={formData.margin_percentage}
            readOnly
            className="bg-muted"
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
          <Label htmlFor="start_date">Data de Início</Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_date">Data de Fim</Label>
          <Input
            id="end_date"
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Rascunho</SelectItem>
              <SelectItem value="approved">Aprovado</SelectItem>
              <SelectItem value="in_progress">Em Andamento</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {!order && (
        <Card>
          <CardHeader>
            <CardTitle>Projetos Vinculados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {projects.map((project) => (
                <div key={project.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`project-${project.id}`}
                    checked={selectedProjects.includes(project.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedProjects([...selectedProjects, project.id]);
                      } else {
                        setSelectedProjects(selectedProjects.filter(id => id !== project.id));
                      }
                    }}
                  />
                  <Label htmlFor={`project-${project.id}`}>{project.name}</Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : order ? "Atualizar" : "Criar"}
        </Button>
      </div>
    </form>
  );
}