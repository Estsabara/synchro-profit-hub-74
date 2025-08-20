-- Create invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  order_id UUID,
  project_id UUID,
  client_id UUID NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  gross_amount NUMERIC NOT NULL,
  tax_amount NUMERIC DEFAULT 0,
  net_amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  invoice_status TEXT NOT NULL DEFAULT 'draft',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  notes TEXT,
  document_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Create invoice_items table
CREATE TABLE public.invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL,
  description TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total_amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invoice_payments table
CREATE TABLE public.invoice_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL,
  payment_date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  reference_number TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Create aging_snapshots table
CREATE TABLE public.aging_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_date DATE NOT NULL,
  client_id UUID NOT NULL,
  invoice_id UUID NOT NULL,
  days_overdue INTEGER NOT NULL,
  overdue_amount NUMERIC NOT NULL,
  aging_bucket TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create POC-based billing schedules table
CREATE TABLE public.billing_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  project_id UUID,
  billing_type TEXT NOT NULL, -- 'poc', 'hours', 'milestone'
  milestone_description TEXT,
  percentage NUMERIC,
  amount NUMERIC NOT NULL,
  scheduled_date DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  invoice_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aging_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_schedules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage invoices" ON public.invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage invoice items" ON public.invoice_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage invoice payments" ON public.invoice_payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can view aging snapshots" ON public.aging_snapshots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage billing schedules" ON public.billing_schedules FOR ALL USING (true) WITH CHECK (true);

-- Create triggers for updated_at columns
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_billing_schedules_updated_at
  BEFORE UPDATE ON public.billing_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create audit triggers
CREATE TRIGGER invoices_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER invoice_payments_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.invoice_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_trigger_function();

-- Create function to calculate aging automatically
CREATE OR REPLACE FUNCTION public.calculate_aging_for_invoice(invoice_date DATE, snapshot_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(days_overdue INTEGER, aging_bucket TEXT) AS $$
BEGIN
  RETURN QUERY
  WITH aging_calc AS (
    SELECT 
      CASE 
        WHEN snapshot_date <= invoice_date THEN 0
        ELSE EXTRACT(DAY FROM (snapshot_date - invoice_date))::INTEGER
      END as days_calc
  )
  SELECT 
    aging_calc.days_calc as days_overdue,
    CASE 
      WHEN aging_calc.days_calc <= 0 THEN 'current'
      WHEN aging_calc.days_calc BETWEEN 1 AND 30 THEN '1-30'
      WHEN aging_calc.days_calc BETWEEN 31 AND 60 THEN '31-60'
      WHEN aging_calc.days_calc BETWEEN 61 AND 90 THEN '61-90'
      ELSE '90+'
    END as aging_bucket
  FROM aging_calc;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create function to generate aging snapshot
CREATE OR REPLACE FUNCTION public.generate_aging_snapshot(snapshot_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
  -- Delete existing snapshot for the date
  DELETE FROM public.aging_snapshots WHERE snapshot_date = $1;
  
  -- Generate new snapshot
  INSERT INTO public.aging_snapshots (snapshot_date, client_id, invoice_id, days_overdue, overdue_amount, aging_bucket)
  SELECT 
    $1 as snapshot_date,
    i.client_id,
    i.id as invoice_id,
    aging.days_overdue,
    (i.net_amount - COALESCE(payments.total_paid, 0)) as overdue_amount,
    aging.aging_bucket
  FROM public.invoices i
  CROSS JOIN LATERAL public.calculate_aging_for_invoice(i.due_date, $1) aging
  LEFT JOIN (
    SELECT 
      invoice_id,
      SUM(amount) as total_paid
    FROM public.invoice_payments
    WHERE status = 'confirmed'
    GROUP BY invoice_id
  ) payments ON payments.invoice_id = i.id
  WHERE i.payment_status != 'paid'
    AND (i.net_amount - COALESCE(payments.total_paid, 0)) > 0;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX idx_invoices_order_id ON public.invoices(order_id);
CREATE INDEX idx_invoices_project_id ON public.invoices(project_id);
CREATE INDEX idx_invoices_issue_date ON public.invoices(issue_date);
CREATE INDEX idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX idx_invoices_payment_status ON public.invoices(payment_status);
CREATE INDEX idx_invoices_invoice_status ON public.invoices(invoice_status);

CREATE INDEX idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);
CREATE INDEX idx_invoice_payments_invoice_id ON public.invoice_payments(invoice_id);
CREATE INDEX idx_invoice_payments_payment_date ON public.invoice_payments(payment_date);

CREATE INDEX idx_aging_snapshots_snapshot_date ON public.aging_snapshots(snapshot_date);
CREATE INDEX idx_aging_snapshots_client_id ON public.aging_snapshots(client_id);
CREATE INDEX idx_aging_snapshots_aging_bucket ON public.aging_snapshots(aging_bucket);

CREATE INDEX idx_billing_schedules_order_id ON public.billing_schedules(order_id);
CREATE INDEX idx_billing_schedules_project_id ON public.billing_schedules(project_id);
CREATE INDEX idx_billing_schedules_status ON public.billing_schedules(status);