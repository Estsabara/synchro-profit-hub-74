import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Filter, RefreshCw } from "lucide-react";

interface Filters {
  startDate: string;
  endDate: string;
  projectId?: string;
  clientId?: string;
  costCenterId?: string;
}

interface GlobalFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

interface Option {
  id: string;
  name: string;
}

export function GlobalFilters({ filters, onFiltersChange }: GlobalFiltersProps) {
  const [projects, setProjects] = useState<Option[]>([]);
  const [clients, setClients] = useState<Option[]>([]);
  const [costCenters, setCostCenters] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const fetchFilterOptions = async () => {
    setLoading(true);
    try {
      // Fetch projects
      const { data: projectsData } = await supabase
        .from("projects")
        .select("id, name")
        .eq("status", "active")
        .order("name");

      // Fetch clients (entities with type client)
      const { data: clientsData } = await supabase
        .from("entities")
        .select("id, name")
        .eq("type", "client")
        .eq("status", "active")
        .order("name");

      // Fetch cost centers
      const { data: costCentersData } = await supabase
        .from("cost_centers")
        .select("id, name")
        .eq("status", "active")
        .order("name");

      setProjects(projectsData || []);
      setClients(clientsData || []);
      setCostCenters(costCentersData || []);
    } catch (error) {
      console.error("Error fetching filter options:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof Filters, value: string | undefined) => {
    const newFilters = {
      ...filters,
      [key]: value === 'all' ? undefined : value
    };
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    onFiltersChange({
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <Card className="bg-gradient-subtle border-primary/10">
      <CardContent className="p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Filtros Globais</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchFilterOptions}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-date">Data Inicial</Label>
            <Input
              id="start-date"
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end-date">Data Final</Label>
            <Input
              id="end-date"
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Projeto</Label>
            <Select
              value={filters.projectId || ""}
              onValueChange={(value) => handleFilterChange("projectId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os projetos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os projetos</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Cliente</Label>
            <Select
              value={filters.clientId || ""}
              onValueChange={(value) => handleFilterChange("clientId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os clientes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os clientes</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Centro de Custo</Label>
            <Select
              value={filters.costCenterId || ""}
              onValueChange={(value) => handleFilterChange("costCenterId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os centros" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os centros</SelectItem>
                {costCenters.map((center) => (
                  <SelectItem key={center.id} value={center.id}>
                    {center.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={clearFilters}>
            Limpar Filtros
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}