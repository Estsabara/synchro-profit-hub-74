import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Check, Clock, Package, FileDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PaymentSchedule {
  id: string;
  payable_id: string;
  scheduled_date: string;
  amount: number;
  status: string;
  priority: string;
  batch_id: string | null;
  payables?: {
    document_number: string;
    currency: string;
    entities?: {
      name: string;
    } | null;
  } | null;
}

interface PaymentSchedulerProps {
  onUpdate?: () => void;
}

export function PaymentScheduler({ onUpdate }: PaymentSchedulerProps) {
  const [schedules, setSchedules] = useState<PaymentSchedule[]>([]);
  const [selectedSchedules, setSelectedSchedules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("scheduled");
  const { toast } = useToast();

  useEffect(() => {
    fetchSchedules();
  }, [filterDate, filterStatus]);

  const fetchSchedules = async () => {
    try {
      let query = supabase
        .from("payment_schedules")
        .select(`
          *,
          payables!payment_schedules_payable_id_fkey(
            document_number,
            currency,
            entities!payables_supplier_id_fkey(name)
          )
        `)
        .order("scheduled_date");

      if (filterDate) {
        query = query.eq("scheduled_date", filterDate);
      }

      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSchedules((data as any) || []);
      onUpdate?.();
    } catch (error) {
      console.error("Error fetching payment schedules:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar programação de pagamentos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleToggle = (scheduleId: string) => {
    setSelectedSchedules(prev => 
      prev.includes(scheduleId) 
        ? prev.filter(id => id !== scheduleId)
        : [...prev, scheduleId]
    );
  };

  const handleApproveSelected = async () => {
    if (selectedSchedules.length === 0) {
      toast({
        title: "Aviso",
        description: "Selecione ao menos um pagamento para aprovar",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("payment_schedules")
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: "00000000-0000-0000-0000-000000000000" // Simulated user ID
        })
        .in("id", selectedSchedules);

      if (error) throw error;

      setSelectedSchedules([]);
      fetchSchedules();
      toast({
        title: "Sucesso",
        description: `${selectedSchedules.length} pagamento(s) aprovado(s)`
      });
    } catch (error) {
      console.error("Error approving schedules:", error);
      toast({
        title: "Erro",
        description: "Erro ao aprovar pagamentos",
        variant: "destructive"
      });
    }
  };

  const handleCreateBatch = async () => {
    if (selectedSchedules.length === 0) {
      toast({
        title: "Aviso",
        description: "Selecione ao menos um pagamento para criar lote",
        variant: "destructive"
      });
      return;
    }

    try {
      // Calcular total do lote
      const selectedItems = schedules.filter(s => selectedSchedules.includes(s.id));
      const totalAmount = selectedItems.reduce((sum, item) => sum + Number(item.amount), 0);

      // Criar lote
      const batchNumber = `LOTE-${new Date().getFullYear()}-${Date.now()}`;
      const { data: batch, error: batchError } = await supabase
        .from("payment_batches")
        .insert([{
          batch_number: batchNumber,
          batch_date: new Date().toISOString().split('T')[0],
          total_amount: totalAmount,
          payment_method: "bank_transfer",
          created_by: "00000000-0000-0000-0000-000000000000" // Simulated user ID
        }])
        .select()
        .single();

      if (batchError) throw batchError;

      // Atualizar agendamentos com o batch_id
      const { error: updateError } = await supabase
        .from("payment_schedules")
        .update({ 
          batch_id: batch.id,
          status: 'batched'
        })
        .in("id", selectedSchedules);

      if (updateError) throw updateError;

      setSelectedSchedules([]);
      fetchSchedules();
      toast({
        title: "Sucesso",
        description: `Lote ${batchNumber} criado com ${selectedSchedules.length} pagamento(s)`
      });
    } catch (error) {
      console.error("Error creating batch:", error);
      toast({
        title: "Erro",
        description: "Erro ao criar lote de pagamentos",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
      scheduled: "outline",
      approved: "default",
      batched: "secondary",
      executed: "secondary"
    };
    const labels = {
      scheduled: "Agendado",
      approved: "Aprovado",
      batched: "Lote",
      executed: "Executado"
    };
    return (
      <Badge variant={variants[status] || "secondary"}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
      low: "outline",
      medium: "default",
      high: "destructive"
    };
    const labels = {
      low: "Baixa",
      medium: "Média",
      high: "Alta"
    };
    return (
      <Badge variant={variants[priority] || "default"}>
        {labels[priority as keyof typeof labels] || priority}
      </Badge>
    );
  };

  const totalSelected = schedules
    .filter(s => selectedSchedules.includes(s.id))
    .reduce((sum, s) => sum + Number(s.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Programação de Pagamentos</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie agendamentos e crie lotes para execução
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {selectedSchedules.length > 0 && (
            <>
              <Badge variant="outline">
                {selectedSchedules.length} selecionado(s) - R$ {totalSelected.toFixed(2)}
              </Badge>
              <Button variant="outline" onClick={handleApproveSelected}>
                <Check className="h-4 w-4 mr-2" />
                Aprovar
              </Button>
              <Button onClick={handleCreateBatch}>
                <Package className="h-4 w-4 mr-2" />
                Criar Lote
              </Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Filtros</CardTitle>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Label htmlFor="filter-date">Data:</Label>
                <Input
                  id="filter-date"
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-40"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="filter-status">Status:</Label>
                <select
                  id="filter-status"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-1 border rounded-md"
                >
                  <option value="all">Todos</option>
                  <option value="scheduled">Agendado</option>
                  <option value="approved">Aprovado</option>
                  <option value="batched">Em Lote</option>
                  <option value="executed">Executado</option>
                </select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedSchedules.length === schedules.length && schedules.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedSchedules(schedules.map(s => s.id));
                        } else {
                          setSelectedSchedules([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Lote</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedSchedules.includes(schedule.id)}
                        onCheckedChange={() => handleScheduleToggle(schedule.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        {new Date(schedule.scheduled_date).toLocaleDateString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {schedule.payables?.document_number || "-"}
                    </TableCell>
                    <TableCell>
                      {schedule.payables?.entities?.name || "Fornecedor não encontrado"}
                    </TableCell>
                    <TableCell>
                      {schedule.payables?.currency || "BRL"} {Number(schedule.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>{getPriorityBadge(schedule.priority)}</TableCell>
                    <TableCell>{getStatusBadge(schedule.status)}</TableCell>
                    <TableCell>
                      {schedule.batch_id ? (
                        <Badge variant="outline">
                          <Package className="h-3 w-3 mr-1" />
                          Lote
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}