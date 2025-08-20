import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, MapPin } from "lucide-react";

interface Address {
  id: string;
  entity_id: string;
  address_type: string;
  street: string;
  city: string;
  state: string;
  postal_code: string | null;
  country: string;
  is_primary: boolean;
  created_at: string;
}

interface AddressManagerProps {
  entityId: string;
  onAddressesUpdate?: () => void;
}

export function AddressManager({ entityId, onAddressesUpdate }: AddressManagerProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    address_type: 'commercial',
    street: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Brasil',
    is_primary: false,
  });

  useEffect(() => {
    if (entityId) {
      fetchAddresses();
    }
  }, [entityId]);

  const fetchAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from('entity_addresses')
        .select('*')
        .eq('entity_id', entityId)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao carregar endereços",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Formulário endereço submetido:", formData);
    
    try {
      const submitData = {
        ...formData,
        entity_id: entityId,
      };

      if (editingAddress) {
        const { error } = await supabase
          .from('entity_addresses')
          .update(submitData)
          .eq('id', editingAddress.id);
        
        if (error) throw error;
        toast({ title: "Sucesso", description: "Endereço atualizado com sucesso!" });
      } else {
        const { error } = await supabase
          .from('entity_addresses')
          .insert([submitData]);
        
        if (error) throw error;
        toast({ title: "Sucesso", description: "Endereço criado com sucesso!" });
      }
      
      fetchAddresses();
      onAddressesUpdate?.();
      resetForm();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao salvar endereço",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      address_type: 'commercial',
      street: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'Brasil',
      is_primary: false,
    });
    setEditingAddress(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (address: Address) => {
    setFormData({
      address_type: address.address_type,
      street: address.street,
      city: address.city,
      state: address.state,
      postal_code: address.postal_code || '',
      country: address.country,
      is_primary: address.is_primary,
    });
    setEditingAddress(address);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este endereço?')) return;
    
    try {
      const { error } = await supabase
        .from('entity_addresses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      fetchAddresses();
      onAddressesUpdate?.();
      toast({ title: "Sucesso", description: "Endereço excluído com sucesso!" });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao excluir endereço",
        variant: "destructive",
      });
    }
  };

  const getAddressTypeLabel = (type: string) => {
    switch (type) {
      case 'commercial': return 'Comercial';
      case 'residential': return 'Residencial';
      case 'billing': return 'Cobrança';
      case 'shipping': return 'Entrega';
      default: return type;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Endereços
          </CardTitle>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl" aria-describedby="address-form-description">
              <DialogHeader>
                <DialogTitle>
                  {editingAddress ? 'Editar Endereço' : 'Novo Endereço'}
                </DialogTitle>
                <div id="address-form-description" className="text-sm text-muted-foreground">
                  {editingAddress ? 'Edite as informações do endereço' : 'Cadastre um novo endereço'}
                </div>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="address_type">Tipo *</Label>
                    <Select value={formData.address_type} onValueChange={(value) => setFormData({...formData, address_type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="commercial">Comercial</SelectItem>
                        <SelectItem value="residential">Residencial</SelectItem>
                        <SelectItem value="billing">Cobrança</SelectItem>
                        <SelectItem value="shipping">Entrega</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="country">País</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => setFormData({...formData, country: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="street">Endereço *</Label>
                  <Input
                    id="street"
                    value={formData.street}
                    onChange={(e) => setFormData({...formData, street: e.target.value})}
                    placeholder="Rua, número, complemento"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">Cidade *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="state">Estado *</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({...formData, state: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="postal_code">CEP</Label>
                    <Input
                      id="postal_code"
                      value={formData.postal_code}
                      onChange={(e) => setFormData({...formData, postal_code: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_primary"
                    checked={formData.is_primary}
                    onChange={(e) => setFormData({...formData, is_primary: e.target.checked})}
                    className="rounded"
                  />
                  <Label htmlFor="is_primary">Endereço principal</Label>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingAddress ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <p className="text-center py-4">Carregando...</p>
        ) : addresses.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            Nenhum endereço cadastrado
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead>Cidade/Estado</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {addresses.map((address) => (
                <TableRow key={address.id}>
                  <TableCell>
                    {getAddressTypeLabel(address.address_type)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{address.street}</div>
                      {address.postal_code && (
                        <div className="text-sm text-muted-foreground">
                          CEP: {address.postal_code}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {address.city}, {address.state}
                    <br />
                    <span className="text-sm text-muted-foreground">
                      {address.country}
                    </span>
                  </TableCell>
                  <TableCell>
                    {address.is_primary && (
                      <Badge variant="default">Principal</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(address)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(address.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}