import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { History, User, Calendar } from "lucide-react";

interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: string;
  old_values: any;
  new_values: any;
  user_id: string | null;
  created_at: string;
}

interface AuditHistoryProps {
  recordId?: string;
  tableName?: string;
  limit?: number;
}

export function AuditHistory({ recordId, tableName, limit = 50 }: AuditHistoryProps) {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAuditLogs();
  }, [recordId, tableName]);

  const fetchAuditLogs = async () => {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (recordId) {
        query = query.eq('record_id', recordId);
      }

      if (tableName) {
        query = query.eq('table_name', tableName);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao carregar histórico de auditoria",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'INSERT': return 'Criação';
      case 'UPDATE': return 'Atualização';
      case 'DELETE': return 'Exclusão';
      default: return action;
    }
  };

  const getActionVariant = (action: string) => {
    switch (action) {
      case 'INSERT': return 'default';
      case 'UPDATE': return 'secondary';
      case 'DELETE': return 'destructive';
      default: return 'outline';
    }
  };

  const getTableLabel = (tableName: string) => {
    switch (tableName) {
      case 'entities': return 'Entidades';
      case 'projects': return 'Projetos';
      case 'cost_centers': return 'Centros de Custo';
      case 'hourly_rates': return 'Rates';
      case 'entity_addresses': return 'Endereços';
      case 'entity_contacts': return 'Contatos';
      default: return tableName;
    }
  };

  const formatChanges = (oldValues: any, newValues: any, action: string) => {
    if (action === 'INSERT') {
      const important = ['name', 'code', 'position', 'type', 'status'];
      const changes = Object.entries(newValues || {})
        .filter(([key, value]) => important.includes(key) && value)
        .slice(0, 3);
      
      return changes.length > 0 
        ? changes.map(([key, value]) => `${key}: ${value}`).join(', ')
        : 'Registro criado';
    }

    if (action === 'DELETE') {
      const important = ['name', 'code', 'position'];
      const deleted = Object.entries(oldValues || {})
        .filter(([key, value]) => important.includes(key) && value)
        .slice(0, 3);
      
      return deleted.length > 0 
        ? `Removido: ${deleted.map(([key, value]) => `${key}: ${value}`).join(', ')}`
        : 'Registro excluído';
    }

    if (action === 'UPDATE') {
      const changes = [];
      const oldVals = oldValues || {};
      const newVals = newValues || {};
      
      for (const key in newVals) {
        if (oldVals[key] !== newVals[key] && !['updated_at', 'created_at', 'id'].includes(key)) {
          changes.push(`${key}: ${oldVals[key] || 'vazio'} → ${newVals[key] || 'vazio'}`);
        }
      }
      
      return changes.slice(0, 2).join(', ') || 'Dados atualizados';
    }

    return 'Alteração realizada';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Histórico de Alterações
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <p className="text-center py-4">Carregando...</p>
        ) : auditLogs.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            Nenhum histórico encontrado
          </p>
        ) : (
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Tabela</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Alterações</TableHead>
                  <TableHead>Usuário</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <div>
                          <div>
                            {new Date(log.created_at).toLocaleDateString('pt-BR')}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {new Date(log.created_at).toLocaleTimeString('pt-BR')}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">
                        {getTableLabel(log.table_name)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getActionVariant(log.action)}>
                        {getActionLabel(log.action)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm max-w-xs truncate">
                        {formatChanges(log.old_values, log.new_values, log.action)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <User className="h-3 w-3 text-muted-foreground" />
                        {log.user_id ? (
                          <span className="text-xs font-mono">
                            {log.user_id.slice(-8)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Sistema</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}