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

interface TimeEntryFormProps {
  timeEntry?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TimeEntryForm({ timeEntry, onSuccess, onCancel }: TimeEntryFormProps) {
  const [formData, setFormData] = useState({
    project_id: "",
    activity: "",
    work_date: "",
    hours_worked: "",
    observations: ""
  });
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProjects();
    
    if (timeEntry) {
      setFormData({
        project_id: timeEntry.project_id || "",
        activity: timeEntry.activity || "",
        work_date: timeEntry.work_date || "",
        hours_worked: timeEntry.hours_worked?.toString() || "",
        observations: timeEntry.observations || ""
      });
    } else {
      // Set today's date as default
      const today = new Date().toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, work_date: today }));
    }
  }, [timeEntry]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const hoursWorked = parseFloat(formData.hours_worked);
      
      if (hoursWorked <= 0 || hoursWorked > 24) {
        throw new Error("Horas trabalhadas deve ser entre 0 e 24");
      }

      const timeEntryData = {
        ...formData,
        hours_worked: hoursWorked,
        user_id: "00000000-0000-0000-0000-000000000000" // Simulated user ID
      };

      if (timeEntry) {
        const { error } = await supabase
          .from("time_entries")
          .update(timeEntryData)
          .eq("id", timeEntry.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("time_entries")
          .insert([timeEntryData]);

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: timeEntry ? "Apontamento atualizado com sucesso" : "Apontamento criado com sucesso"
      });

      onSuccess();
    } catch (error: any) {
      console.error("Error saving time entry:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar apontamento",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="project_id">Projeto *</Label>
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
          <Label htmlFor="work_date">Data *</Label>
          <Input
            id="work_date"
            type="date"
            value={formData.work_date}
            onChange={(e) => setFormData({ ...formData, work_date: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hours_worked">Horas Trabalhadas *</Label>
          <Input
            id="hours_worked"
            type="number"
            step="0.25"
            min="0"
            max="24"
            value={formData.hours_worked}
            onChange={(e) => setFormData({ ...formData, hours_worked: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="activity">Atividade *</Label>
          <Input
            id="activity"
            value={formData.activity}
            onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
            placeholder="Descreva a atividade realizada"
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="observations">Observações</Label>
          <Textarea
            id="observations"
            value={formData.observations}
            onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
            placeholder="Observações adicionais (opcional)"
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : timeEntry ? "Atualizar" : "Criar"}
        </Button>
      </div>
    </form>
  );
}