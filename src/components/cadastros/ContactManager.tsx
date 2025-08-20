import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Phone, Mail } from "lucide-react";

interface Contact {
  id: string;
  entity_id: string;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  is_primary: boolean;
  created_at: string;
}

interface ContactManagerProps {
  entityId: string;
  onContactsUpdate?: () => void;
}

export function ContactManager({ entityId, onContactsUpdate }: ContactManagerProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    role: '',
    phone: '',
    email: '',
    is_primary: false,
  });

  useEffect(() => {
    if (entityId) {
      fetchContacts();
    }
  }, [entityId]);

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('entity_contacts')
        .select('*')
        .eq('entity_id', entityId)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao carregar contatos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Formulário contato submetido:", formData);
    
    try {
      const submitData = {
        ...formData,
        entity_id: entityId,
        phone: formData.phone || null,
        email: formData.email || null,
        role: formData.role || null,
      };

      if (editingContact) {
        const { error } = await supabase
          .from('entity_contacts')
          .update(submitData)
          .eq('id', editingContact.id);
        
        if (error) throw error;
        toast({ title: "Sucesso", description: "Contato atualizado com sucesso!" });
      } else {
        const { error } = await supabase
          .from('entity_contacts')
          .insert([submitData]);
        
        if (error) throw error;
        toast({ title: "Sucesso", description: "Contato criado com sucesso!" });
      }
      
      fetchContacts();
      onContactsUpdate?.();
      resetForm();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao salvar contato",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      role: '',
      phone: '',
      email: '',
      is_primary: false,
    });
    setEditingContact(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (contact: Contact) => {
    setFormData({
      name: contact.name,
      role: contact.role || '',
      phone: contact.phone || '',
      email: contact.email || '',
      is_primary: contact.is_primary,
    });
    setEditingContact(contact);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este contato?')) return;
    
    try {
      const { error } = await supabase
        .from('entity_contacts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      fetchContacts();
      onContactsUpdate?.();
      toast({ title: "Sucesso", description: "Contato excluído com sucesso!" });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao excluir contato",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Contatos
          </CardTitle>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl" aria-describedby="contact-form-description">
              <DialogHeader>
                <DialogTitle>
                  {editingContact ? 'Editar Contato' : 'Novo Contato'}
                </DialogTitle>
                <div id="contact-form-description" className="text-sm text-muted-foreground">
                  {editingContact ? 'Edite as informações do contato' : 'Cadastre um novo contato'}
                </div>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="role">Cargo/Função</Label>
                  <Input
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    placeholder="Ex: Gerente Comercial"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="email@exemplo.com"
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
                  <Label htmlFor="is_primary">Contato principal</Label>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingContact ? 'Atualizar' : 'Criar'}
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
        ) : contacts.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            Nenhum contato cadastrado
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">
                    {contact.name}
                  </TableCell>
                  <TableCell>
                    {contact.role || (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {contact.phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {contact.phone}
                        </div>
                      )}
                      {contact.email && (
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" />
                          {contact.email}
                        </div>
                      )}
                      {!contact.phone && !contact.email && (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {contact.is_primary && (
                      <Badge variant="default">Principal</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(contact)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(contact.id)}
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