import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Save, Plus } from "lucide-react";

interface RoleAssignmentDialogProps {
  userId: string;
  onClose: () => void;
  onSave: () => void;
}

const ROLES = [
  { value: "admin", label: "Administrador" },
  { value: "finance", label: "Financeiro" },
  { value: "projects", label: "Projetos" },
  { value: "manager", label: "Gestor" },
  { value: "auditor", label: "Auditor" },
  { value: "collaborator", label: "Colaborador" }
];

export function RoleAssignmentDialog({ userId, onClose, onSave }: RoleAssignmentDialogProps) {
  const [selectedRole, setSelectedRole] = useState("");
  const [currentRoles, setCurrentRoles] = useState([
    { role: "collaborator", label: "Colaborador", scope: "global" }
  ]);

  const handleAddRole = () => {
    if (!selectedRole) return;
    
    const roleLabel = ROLES.find(r => r.value === selectedRole)?.label || selectedRole;
    const newRole = {
      role: selectedRole,
      label: roleLabel,
      scope: "global"
    };
    
    setCurrentRoles([...currentRoles, newRole]);
    setSelectedRole("");
  };

  const handleRemoveRole = (index: number) => {
    setCurrentRoles(currentRoles.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    // TODO: Implement role assignment logic
    onSave();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Atribuir Papéis
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Papéis Atuais</Label>
            <div className="space-y-2">
              {currentRoles.map((role, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{role.label}</Badge>
                    <span className="text-sm text-muted-foreground">({role.scope})</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveRole(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Adicionar Papel</Label>
            <div className="flex space-x-2">
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione um papel" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.filter(role => !currentRoles.some(cr => cr.role === role.value)).map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAddRole} disabled={!selectedRole}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-gradient-primary">
              <Save className="h-4 w-4 mr-2" />
              Salvar Papéis
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}