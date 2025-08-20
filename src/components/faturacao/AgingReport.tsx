import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, TrendingDown, AlertTriangle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AgingData {
  client_id: string;
  client_name: string;
  current: number;
  bucket_1_30: number;
  bucket_31_60: number;
  bucket_61_90: number;
  bucket_90_plus: number;
  total_overdue: number;
}

interface AgingBucket {
  aging_bucket: string;
  total_amount: number;
  invoice_count: number;
}

export function AgingReport() {
  const [agingData, setAgingData] = useState<AgingData[]>([]);
  const [agingBuckets, setAgingBuckets] = useState<AgingBucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState("");
  const [snapshotDate, setSnapshotDate] = useState(new Date().toISOString().split('T')[0]);
  const { toast } = useToast();

  useEffect(() => {
    generateAgingReport();
  }, []);

  const generateAgingReport = async () => {
    setLoading(true);
    try {
      // Gerar snapshot de aging
      const { error: snapshotError } = await supabase.rpc('generate_aging_snapshot', {
        snapshot_date: snapshotDate
      });

      if (snapshotError) throw snapshotError;

      // Buscar dados de aging por cliente
      const { data: clientAgingData, error: clientError } = await supabase
        .from("aging_snapshots")
        .select(`
          client_id,
          aging_bucket,
          overdue_amount,
          entities!aging_snapshots_client_id_fkey(name)
        `)
        .eq("snapshot_date", snapshotDate);

      if (clientError) throw clientError;

      // Processar dados por cliente
      const clientMap = new Map();
      
      (clientAgingData as any[]).forEach((item) => {
        const clientId = item.client_id;
        const clientName = item.entities?.name || "Cliente não encontrado";
        
        if (!clientMap.has(clientId)) {
          clientMap.set(clientId, {
            client_id: clientId,
            client_name: clientName,
            current: 0,
            bucket_1_30: 0,
            bucket_31_60: 0,
            bucket_61_90: 0,
            bucket_90_plus: 0,
            total_overdue: 0
          });
        }
        
        const client = clientMap.get(clientId);
        const amount = Number(item.overdue_amount);
        
        switch (item.aging_bucket) {
          case 'current':
            client.current += amount;
            break;
          case '1-30':
            client.bucket_1_30 += amount;
            break;
          case '31-60':
            client.bucket_31_60 += amount;
            break;
          case '61-90':
            client.bucket_61_90 += amount;
            break;
          case '90+':
            client.bucket_90_plus += amount;
            break;
        }
        
        client.total_overdue += amount;
      });

      // Buscar dados consolidados por bucket
      const { data: bucketData, error: bucketError } = await supabase
        .from("aging_snapshots")
        .select("aging_bucket, overdue_amount")
        .eq("snapshot_date", snapshotDate);

      if (bucketError) throw bucketError;

      const bucketsMap = new Map();
      (bucketData || []).forEach(item => {
        const bucket = item.aging_bucket;
        if (!bucketsMap.has(bucket)) {
          bucketsMap.set(bucket, { aging_bucket: bucket, total_amount: 0, invoice_count: 0 });
        }
        const bucketInfo = bucketsMap.get(bucket);
        bucketInfo.total_amount += Number(item.overdue_amount);
        bucketInfo.invoice_count += 1;
      });

      setAgingData(Array.from(clientMap.values()));
      setAgingBuckets(Array.from(bucketsMap.values()));

      toast({
        title: "Sucesso",
        description: "Relatório de aging atualizado"
      });
    } catch (error) {
      console.error("Error generating aging report:", error);
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório de aging",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getBucketColor = (bucket: string) => {
    switch (bucket) {
      case 'current': return 'text-green-600';
      case '1-30': return 'text-yellow-600';
      case '31-60': return 'text-orange-600';
      case '61-90': return 'text-red-600';
      case '90+': return 'text-red-800';
      default: return 'text-gray-600';
    }
  };

  const getBucketLabel = (bucket: string) => {
    switch (bucket) {
      case 'current': return 'Em Dia';
      case '1-30': return '1-30 dias';
      case '31-60': return '31-60 dias';
      case '61-90': return '61-90 dias';
      case '90+': return '90+ dias';
      default: return bucket;
    }
  };

  const filteredAgingData = selectedClient 
    ? agingData.filter(item => item.client_id === selectedClient)
    : agingData;

  const totalOverdue = agingData.reduce((sum, item) => sum + item.total_overdue, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Aging de Clientes</h3>
          <p className="text-sm text-muted-foreground">
            Análise de inadimplência por faixas de atraso
          </p>
        </div>
        <Button onClick={generateAgingReport} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {loading ? "Atualizando..." : "Atualizar Aging"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configurações do Relatório</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="snapshot_date">Data de Referência</Label>
              <Input
                id="snapshot_date"
                type="date"
                value={snapshotDate}
                onChange={(e) => setSnapshotDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client_filter">Filtrar por Cliente</Label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os clientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os clientes</SelectItem>
                  {agingData.map((item) => (
                    <SelectItem key={item.client_id} value={item.client_id}>
                      {item.client_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {agingBuckets.map((bucket) => (
          <Card key={bucket.aging_bucket}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{getBucketLabel(bucket.aging_bucket)}</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getBucketColor(bucket.aging_bucket)}`}>
                R$ {bucket.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">
                {bucket.invoice_count} fatura(s)
              </p>
              <div className="mt-2">
                <Progress 
                  value={totalOverdue > 0 ? (bucket.total_amount / totalOverdue) * 100 : 0} 
                  className="h-2" 
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aging por Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Em Dia</TableHead>
                  <TableHead>1-30 dias</TableHead>
                  <TableHead>31-60 dias</TableHead>
                  <TableHead>61-90 dias</TableHead>
                  <TableHead>90+ dias</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Risco</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgingData.map((item) => {
                  const riskLevel = item.bucket_90_plus > 10000 ? 'high' : 
                                   item.bucket_61_90 > 5000 ? 'medium' : 'low';
                  
                  return (
                    <TableRow key={item.client_id}>
                      <TableCell className="font-medium">
                        {item.client_name}
                      </TableCell>
                      <TableCell className="text-green-600">
                        R$ {item.current.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-yellow-600">
                        R$ {item.bucket_1_30.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-orange-600">
                        R$ {item.bucket_31_60.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-red-600">
                        R$ {item.bucket_61_90.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-red-800 font-bold">
                        R$ {item.bucket_90_plus.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="font-bold">
                        R$ {item.total_overdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          riskLevel === 'high' ? 'destructive' : 
                          riskLevel === 'medium' ? 'default' : 'secondary'
                        }>
                          {riskLevel === 'high' ? 'Alto' : 
                           riskLevel === 'medium' ? 'Médio' : 'Baixo'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}