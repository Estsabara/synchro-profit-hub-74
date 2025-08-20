import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Target, MapPin } from "lucide-react";

interface CostCenter {
  id: string;
  code: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  geographic_area: string | null;
  status: string;
  created_at: string;
  parent?: {
    name: string;
    code: string;
  };
}

export function CostCentersManager() {
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCostCenter, setEditingCostCenter] = useState<CostCenter | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    parent_id: '',
    geographic_area: '',
  });

  useEffect(() => {
    fetchCostCenters();
  }, []);

  const fetchCostCenters = async () => {
    try {
      const { data, error } = await supabase
        .from('cost_centers')
        .select(`
          *,
          parent:cost_centers!parent_id (
            name,
            code
          )
        `)
        .order('code');

      if (error) throw error;
      setCostCenters(data || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao carregar centros de custo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const submitData = {
        ...formData,
        parent_id: formData.parent_id || null,
      };

      if (editingCostCenter) {
        const { error } = await supabase
          .from('cost_centers')
          .update(submitData)
          .eq('id', editingCostCenter.id);
        
        if (error) throw error;
        toast({ title: "Sucesso", description: "Centro de custo atualizado com sucesso!" });
      } else {
        const { error } = await supabase
          .from('cost_centers')
          .insert([submitData]);
        
        if (error) throw error;
        toast({ title: "Sucesso", description: "Centro de custo criado com sucesso!" });
      }
      
      fetchCostCenters();
      resetForm();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao salvar centro de custo",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      parent_id: '',
      geographic_area: '',
    });
    setEditingCostCenter(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (costCenter: CostCenter) => {
    setFormData({
      code: costCenter.code,
      name: costCenter.name,
      description: costCenter.description || '',
      parent_id: costCenter.parent_id || '',
      geographic_area: costCenter.geographic_area || '',
    });
    setEditingCostCenter(costCenter);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este centro de custo?')) return;
    
    try {
      const { error } = await supabase
        .from('cost_centers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      fetchCostCenters();
      toast({ title: "Sucesso", description: "Centro de custo excluído com sucesso!" });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao excluir centro de custo",
        variant: "destructive",
      });
    }
  };

  const filteredCostCenters = costCenters.filter(costCenter => {
    const matchesSearch = costCenter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         costCenter.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || costCenter.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Get cost centers for parent selection (excluding the one being edited)
  const availableParents = costCenters.filter(cc => 
    cc.id !== editingCostCenter?.id && cc.parent_id !== editingCostCenter?.id
  );

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Centros de Custo</h2>
          <p className="text-muted-foreground">Organização contábil e departamental</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              console.log("Botão Novo Centro de Custo clicado");
              resetForm();
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Centro de Custo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl" aria-describedby="cost-center-form-description">
            <DialogHeader>
              <DialogTitle>
                {editingCostCenter ? 'Editar Centro de Custo' : 'Novo Centro de Custo'}
              </DialogTitle>
              <div id="cost-center-form-description" className="text-sm text-muted-foreground">
                {editingCostCenter ? 'Edite as informações do centro de custo' : 'Cadastre um novo centro de custo'}
              </div>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">Código *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    placeholder="Ex: CC001"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="parent_id">Centro de Custo Pai</Label>
                  <Select value={formData.parent_id} onValueChange={(value) => setFormData({...formData, parent_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o centro pai (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum (Raiz)</SelectItem>
                      {availableParents.map((parent) => (
                        <SelectItem key={parent.id} value={parent.id}>
                          {parent.code} - {parent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="geographic_area">Área Geográfica</Label>
                  <Select value={formData.geographic_area} onValueChange={(value) => setFormData({...formData, geographic_area: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a área" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não especificado</SelectItem>
                      <SelectItem value="Norte">Norte</SelectItem>
                      <SelectItem value="Nordeste">Nordeste</SelectItem>
                      <SelectItem value="Centro-Oeste">Centro-Oeste</SelectItem>
                      <SelectItem value="Sudeste">Sudeste</SelectItem>
                      <SelectItem value="Sul">Sul</SelectItem>
                      <SelectItem value="Internacional">Internacional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingCostCenter ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por código ou nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Centro Pai</TableHead>
                <TableHead>Área Geográfica</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredCostCenters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Nenhum centro de custo encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredCostCenters.map((costCenter) => (
                  <TableRow key={costCenter.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" />
                        <span className="font-mono font-medium">{costCenter.code}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{costCenter.name}</div>
                        {costCenter.description && (
                          <div className="text-sm text-muted-foreground truncate max-w-xs">
                            {costCenter.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {costCenter.parent ? (
                        <span className="text-sm">
                          {costCenter.parent.code} - {costCenter.parent.name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">Raiz</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {costCenter.geographic_area ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{costCenter.geographic_area}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={costCenter.status === 'active' ? 'default' : 'secondary'}>
                        {costCenter.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(costCenter)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(costCenter.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}