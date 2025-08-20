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
import { Plus, Edit, Trash2, DollarSign, Calendar, Users } from "lucide-react";

interface HourlyRate {
  id: string;
  position: string;
  team: string | null;
  project_id: string | null;
  rate_value: number;
  currency: string;
  valid_from: string;
  valid_to: string | null;
  reimbursement_policy: string | null;
  billing_policy: string | null;
  created_at: string;
  updated_at: string;
  projects?: {
    name: string;
  } | null;
}

interface Project {
  id: string;
  name: string;
}

export function RatesManager() {
  const [rates, setRates] = useState<HourlyRate[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currencyFilter, setCurrencyFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<HourlyRate | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    position: '',
    team: '',
    project_id: '',
    rate_value: '',
    currency: 'BRL',
    valid_from: '',
    valid_to: '',
    reimbursement_policy: '',
    billing_policy: '',
  });

  useEffect(() => {
    fetchRates();
    fetchProjects();
  }, []);

  const fetchRates = async () => {
    try {
      const { data, error } = await supabase
        .from('hourly_rates')
        .select(`
          *,
          projects!hourly_rates_project_id_fkey (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRates(data as HourlyRate[] || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao carregar rates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const submitData = {
        ...formData,
        rate_value: parseFloat(formData.rate_value),
        project_id: formData.project_id || null,
        valid_to: formData.valid_to || null,
      };

      if (editingRate) {
        const { error } = await supabase
          .from('hourly_rates')
          .update(submitData)
          .eq('id', editingRate.id);
        
        if (error) throw error;
        toast({ title: "Sucesso", description: "Rate atualizado com sucesso!" });
      } else {
        const { error } = await supabase
          .from('hourly_rates')
          .insert([submitData]);
        
        if (error) throw error;
        toast({ title: "Sucesso", description: "Rate criado com sucesso!" });
      }
      
      fetchRates();
      resetForm();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao salvar rate",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      position: '',
      team: '',
      project_id: '',
      rate_value: '',
      currency: 'BRL',
      valid_from: '',
      valid_to: '',
      reimbursement_policy: '',
      billing_policy: '',
    });
    setEditingRate(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (rate: HourlyRate) => {
    setFormData({
      position: rate.position,
      team: rate.team || '',
      project_id: rate.project_id || '',
      rate_value: rate.rate_value.toString(),
      currency: rate.currency,
      valid_from: rate.valid_from,
      valid_to: rate.valid_to || '',
      reimbursement_policy: rate.reimbursement_policy || '',
      billing_policy: rate.billing_policy || '',
    });
    setEditingRate(rate);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este rate?')) return;
    
    try {
      const { error } = await supabase
        .from('hourly_rates')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      fetchRates();
      toast({ title: "Sucesso", description: "Rate excluído com sucesso!" });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao excluir rate",
        variant: "destructive",
      });
    }
  };

  const isRateActive = (rate: HourlyRate) => {
    const now = new Date();
    const validFrom = new Date(rate.valid_from);
    const validTo = rate.valid_to ? new Date(rate.valid_to) : null;
    
    return validFrom <= now && (!validTo || validTo >= now);
  };

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency === 'BRL' ? 'BRL' : currency,
      minimumFractionDigits: 2,
    }).format(value);
  };

  const filteredRates = rates.filter(rate => {
    const matchesSearch = rate.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (rate.team?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
                         (rate.projects?.name.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesCurrency = currencyFilter === 'all' || rate.currency === currencyFilter;
    return matchesSearch && matchesCurrency;
  });

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Rates & Tarifas</h2>
          <p className="text-muted-foreground">Tabelas de preços e tarifações</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              console.log("Botão Novo Rate clicado");
              resetForm();
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Rate
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl" aria-describedby="rate-form-description">
            <DialogHeader>
              <DialogTitle>
                {editingRate ? 'Editar Rate' : 'Novo Rate'}
              </DialogTitle>
              <div id="rate-form-description" className="text-sm text-muted-foreground">
                {editingRate ? 'Edite as informações do rate' : 'Cadastre um novo rate'}
              </div>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="position">Cargo/Posição *</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData({...formData, position: e.target.value})}
                    placeholder="Ex: Desenvolvedor Senior"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="team">Equipe</Label>
                  <Input
                    id="team"
                    value={formData.team}
                    onChange={(e) => setFormData({...formData, team: e.target.value})}
                    placeholder="Ex: Tech Team"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="rate_value">Valor/Hora *</Label>
                  <Input
                    id="rate_value"
                    type="number"
                    step="0.01"
                    value={formData.rate_value}
                    onChange={(e) => setFormData({...formData, rate_value: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="currency">Moeda</Label>
                  <Select value={formData.currency} onValueChange={(value) => setFormData({...formData, currency: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">BRL</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="project_id">Projeto (Opcional)</Label>
                  <Select value={formData.project_id} onValueChange={(value) => setFormData({...formData, project_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Geral" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Geral</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="valid_from">Válido Desde *</Label>
                  <Input
                    id="valid_from"
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({...formData, valid_from: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="valid_to">Válido Até</Label>
                  <Input
                    id="valid_to"
                    type="date"
                    value={formData.valid_to}
                    onChange={(e) => setFormData({...formData, valid_to: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reimbursement_policy">Política de Ressarcimento</Label>
                  <Textarea
                    id="reimbursement_policy"
                    value={formData.reimbursement_policy}
                    onChange={(e) => setFormData({...formData, reimbursement_policy: e.target.value})}
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="billing_policy">Política de Faturamento</Label>
                  <Textarea
                    id="billing_policy"
                    value={formData.billing_policy}
                    onChange={(e) => setFormData({...formData, billing_policy: e.target.value})}
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingRate ? 'Atualizar' : 'Criar'}
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
                placeholder="Buscar por cargo, equipe ou projeto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            
            <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por moeda" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="BRL">BRL</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
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
                <TableHead>Cargo/Posição</TableHead>
                <TableHead>Equipe/Projeto</TableHead>
                <TableHead>Valor/Hora</TableHead>
                <TableHead>Vigência</TableHead>
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
              ) : filteredRates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Nenhum rate encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredRates.map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-primary" />
                        <span className="font-medium">{rate.position}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {rate.team && (
                          <div className="flex items-center gap-1 text-sm">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            {rate.team}
                          </div>
                        )}
                        {rate.projects?.name && (
                          <div className="text-sm text-muted-foreground">
                            Projeto: {rate.projects.name}
                          </div>
                        )}
                        {!rate.team && !rate.projects?.name && (
                          <span className="text-muted-foreground text-sm">Geral</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono font-medium">
                        {formatCurrency(rate.rate_value, rate.currency)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <div>
                          <div>{new Date(rate.valid_from).toLocaleDateString('pt-BR')}</div>
                          {rate.valid_to && (
                            <div className="text-muted-foreground">
                              até {new Date(rate.valid_to).toLocaleDateString('pt-BR')}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={isRateActive(rate) ? 'default' : 'secondary'}>
                        {isRateActive(rate) ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(rate)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(rate.id)}
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