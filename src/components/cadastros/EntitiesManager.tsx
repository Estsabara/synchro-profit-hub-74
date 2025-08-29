import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Edit, Trash2, Users, Building2, History, Download, Upload } from "lucide-react";
import { AddressManager } from "./AddressManager";
import { ContactManager } from "./ContactManager";
import { AuditHistory } from "./AuditHistory";

interface Entity {
  id: string;
  type: string;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  tax_number: string | null;
  bank_account: string | null;
  bank_name: string | null;
  status: string;
  created_at: string;
}

export function EntitiesManager() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    type: 'client' as 'client' | 'supplier',
    name: '',
    document: '',
    email: '',
    phone: '',
    tax_number: '',
    bank_account: '',
    bank_name: '',
  });

  useEffect(() => {
    fetchEntities();
  }, []);

  const fetchEntities = async () => {
    try {
      const { data, error } = await supabase
        .from('entities')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntities(data || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao carregar entidades",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Formulário submetido:", formData);

    const { data: { session } } = await supabase.auth.getSession();

    
    try {
      if (editingEntity) {
        const { error } = await supabase
          .from('entities')
          .update(formData)
          .eq('id', editingEntity.id);
        
        if (error) throw error;
        toast({ title: "Sucesso", description: "Entidade atualizada com sucesso!" });
      } else {
        const { error } = await supabase
          .from('entities')
          .insert([formData]);
        
        if (error) throw error;
        toast({ title: "Sucesso", description: "Entidade criada com sucesso!" });
      }
      
      fetchEntities();
      resetForm();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao salvar entidade",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    console.log("Resetando formulário");
    setFormData({
      type: 'client',
      name: '',
      document: '',
      email: '',
      phone: '',
      tax_number: '',
      bank_account: '',
      bank_name: '',
    });
    setEditingEntity(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (entity: Entity) => {
    setFormData({
      type: entity.type as 'client' | 'supplier',
      name: entity.name,
      document: entity.document || '',
      email: entity.email || '',
      phone: entity.phone || '',
      tax_number: entity.tax_number || '',
      bank_account: entity.bank_account || '',
      bank_name: entity.bank_name || '',
    });
    setEditingEntity(entity);
    setIsDialogOpen(true);
  };

  const handleViewDetails = (entity: Entity) => {
    setSelectedEntity(entity);
    setShowDetails(true);
  };

  const exportData = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Tipo,Nome,Documento,Email,Telefone,Status\n"
      + filteredEntities.map(e => 
          `${e.type},${e.name},"${e.document || ''}","${e.email || ''}","${e.phone || ''}",${e.status}`
        ).join("\n");
    
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `entidades_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta entidade?')) return;
    
    try {
      const { error } = await supabase
        .from('entities')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      fetchEntities();
      toast({ title: "Sucesso", description: "Entidade excluída com sucesso!" });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao excluir entidade",
        variant: "destructive",
      });
    }
  };

  const filteredEntities = entities.filter(entity => {
    const matchesSearch = entity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (entity.document?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
                         (entity.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
                         (entity.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesType = typeFilter === 'all' || entity.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getCompletionStats = () => {
    const total = entities.length;
    const complete = entities.filter(e => 
      e.name && e.document && e.email && e.phone && e.tax_number
    ).length;
    const percentage = total > 0 ? Math.round((complete / total) * 100) : 0;
    return { total, complete, percentage };
  };

  const stats = getCompletionStats();

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Entidades</h2>
          <p className="text-muted-foreground">
            {stats.total} registros • {stats.complete} completos ({stats.percentage}%)
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                console.log("Botão Nova Entidade clicado");
                resetForm();
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Entidade
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl" aria-describedby="entity-form-description">
              <DialogHeader>
                <DialogTitle>
                  {editingEntity ? 'Editar Entidade' : 'Nova Entidade'}
                </DialogTitle>
                <div id="entity-form-description" className="text-sm text-muted-foreground">
                  {editingEntity ? 'Edite as informações da entidade' : 'Cadastre uma nova entidade (cliente ou fornecedor)'}
                </div>
              </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Tipo</Label>
                  <Select value={formData.type} onValueChange={(value: 'client' | 'supplier') => setFormData({...formData, type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Cliente</SelectItem>
                      <SelectItem value="supplier">Fornecedor</SelectItem>
                    </SelectContent>
                  </Select>
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
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="document">CPF/CNPJ</Label>
                  <Input
                    id="document"
                    value={formData.document}
                    onChange={(e) => setFormData({...formData, document: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="tax_number">Inscrição Fiscal</Label>
                  <Input
                    id="tax_number"
                    value={formData.tax_number}
                    onChange={(e) => setFormData({...formData, tax_number: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bank_account">Conta Bancária</Label>
                  <Input
                    id="bank_account"
                    value={formData.bank_account}
                    onChange={(e) => setFormData({...formData, bank_account: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="bank_name">Banco</Label>
                  <Input
                    id="bank_name"
                    value={formData.bank_name}
                    onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingEntity ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nome ou documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="client">Clientes</SelectItem>
                <SelectItem value="supplier">Fornecedores</SelectItem>
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
                <TableHead>Tipo</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredEntities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Nenhuma entidade encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredEntities.map((entity) => (
                  <TableRow key={entity.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {entity.type === 'client' ? (
                          <Users className="h-4 w-4 text-primary" />
                        ) : (
                          <Building2 className="h-4 w-4 text-accent" />
                        )}
                        {entity.type === 'client' ? 'Cliente' : 'Fornecedor'}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{entity.name}</TableCell>
                    <TableCell>{entity.document}</TableCell>
                    <TableCell>{entity.email}</TableCell>
                    <TableCell>{entity.phone}</TableCell>
                    <TableCell>
                      <Badge variant={entity.status === 'active' ? 'default' : 'secondary'}>
                        {entity.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(entity)}
                        >
                          <History className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(entity)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(entity.id)}
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

      {/* Entity Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Detalhes: {selectedEntity?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedEntity && (
            <Tabs defaultValue="addresses" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="addresses">Endereços</TabsTrigger>
                <TabsTrigger value="contacts">Contatos</TabsTrigger>
                <TabsTrigger value="audit">Histórico</TabsTrigger>
              </TabsList>
              
              <TabsContent value="addresses" className="mt-4">
                <AddressManager 
                  entityId={selectedEntity.id} 
                  onAddressesUpdate={() => {/* Optional refresh */}} 
                />
              </TabsContent>
              
              <TabsContent value="contacts" className="mt-4">
                <ContactManager 
                  entityId={selectedEntity.id} 
                  onContactsUpdate={() => {/* Optional refresh */}} 
                />
              </TabsContent>
              
              <TabsContent value="audit" className="mt-4">
                <AuditHistory 
                  recordId={selectedEntity.id} 
                  tableName="entities" 
                />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}