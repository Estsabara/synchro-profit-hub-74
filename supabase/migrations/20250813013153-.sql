-- Create commitments table (Ordens de Fornecimento)
CREATE TABLE public.commitments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  commitment_number TEXT NOT NULL UNIQUE,
  supplier_id UUID NOT NULL,
  project_id UUID,
  cost_center_id UUID,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  issue_date DATE NOT NULL,
  expected_payment_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Create payables table (Contas a Pagar)
CREATE TABLE public.payables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  commitment_id UUID,
  supplier_id UUID NOT NULL,
  document_number TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  due_date DATE NOT NULL,
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_date DATE,
  paid_amount NUMERIC DEFAULT 0,
  remaining_amount NUMERIC,
  priority TEXT DEFAULT 'medium',
  description TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Create commitment_attachments table
CREATE TABLE public.commitment_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  commitment_id UUID NOT NULL,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  content_type TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  uploaded_by UUID NOT NULL
);

-- Create payment_schedules table
CREATE TABLE public.payment_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payable_id UUID NOT NULL,
  scheduled_date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  priority TEXT DEFAULT 'medium',
  approval_level INTEGER DEFAULT 1,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  executed_at TIMESTAMP WITH TIME ZONE,
  batch_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payment_batches table
CREATE TABLE public.payment_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_number TEXT NOT NULL UNIQUE,
  batch_date DATE NOT NULL,
  total_amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  executed_by UUID,
  executed_at TIMESTAMP WITH TIME ZONE,
  bank_file_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Create payment_approvals table
CREATE TABLE public.payment_approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL, -- 'payable', 'schedule', 'batch'
  entity_id UUID NOT NULL,
  approver_id UUID NOT NULL,
  approval_level INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  comments TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commitment_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_approvals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage commitments" ON public.commitments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage payables" ON public.payables FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage commitment attachments" ON public.commitment_attachments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage payment schedules" ON public.payment_schedules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage payment batches" ON public.payment_batches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage payment approvals" ON public.payment_approvals FOR ALL USING (true) WITH CHECK (true);

-- Create triggers for updated_at columns
CREATE TRIGGER update_commitments_updated_at
  BEFORE UPDATE ON public.commitments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payables_updated_at
  BEFORE UPDATE ON public.payables
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_schedules_updated_at
  BEFORE UPDATE ON public.payment_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_batches_updated_at
  BEFORE UPDATE ON public.payment_batches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create audit triggers
CREATE TRIGGER commitments_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.commitments
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER payables_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.payables
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER payment_schedules_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.payment_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_trigger_function();

-- Create function to update payable remaining amount
CREATE OR REPLACE FUNCTION public.update_payable_remaining_amount()
RETURNS TRIGGER AS $$
BEGIN
  NEW.remaining_amount = NEW.amount - COALESCE(NEW.paid_amount, 0);
  
  -- Update status based on payment
  IF NEW.remaining_amount <= 0 THEN
    NEW.status = 'paid';
  ELSIF NEW.paid_amount > 0 THEN
    NEW.status = 'partial';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for payable amount calculation
CREATE TRIGGER update_payable_amounts
  BEFORE INSERT OR UPDATE ON public.payables
  FOR EACH ROW
  EXECUTE FUNCTION public.update_payable_remaining_amount();

-- Create indexes for better performance
CREATE INDEX idx_commitments_supplier_id ON public.commitments(supplier_id);
CREATE INDEX idx_commitments_project_id ON public.commitments(project_id);
CREATE INDEX idx_commitments_cost_center_id ON public.commitments(cost_center_id);
CREATE INDEX idx_commitments_status ON public.commitments(status);
CREATE INDEX idx_commitments_expected_payment_date ON public.commitments(expected_payment_date);

CREATE INDEX idx_payables_commitment_id ON public.payables(commitment_id);
CREATE INDEX idx_payables_supplier_id ON public.payables(supplier_id);
CREATE INDEX idx_payables_due_date ON public.payables(due_date);
CREATE INDEX idx_payables_status ON public.payables(status);
CREATE INDEX idx_payables_priority ON public.payables(priority);

CREATE INDEX idx_commitment_attachments_commitment_id ON public.commitment_attachments(commitment_id);
CREATE INDEX idx_payment_schedules_payable_id ON public.payment_schedules(payable_id);
CREATE INDEX idx_payment_schedules_scheduled_date ON public.payment_schedules(scheduled_date);
CREATE INDEX idx_payment_schedules_status ON public.payment_schedules(status);
CREATE INDEX idx_payment_schedules_batch_id ON public.payment_schedules(batch_id);

CREATE INDEX idx_payment_batches_batch_date ON public.payment_batches(batch_date);
CREATE INDEX idx_payment_batches_status ON public.payment_batches(status);

CREATE INDEX idx_payment_approvals_entity_type_id ON public.payment_approvals(entity_type, entity_id);
CREATE INDEX idx_payment_approvals_approver_id ON public.payment_approvals(approver_id);
CREATE INDEX idx_payment_approvals_status ON public.payment_approvals(status);