-- Create bank accounts table
CREATE TABLE public.bank_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_name TEXT NOT NULL,
  bank_code TEXT,
  agency_branch TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'checking', -- checking, savings, investment
  currency TEXT NOT NULL DEFAULT 'BRL',
  account_holder TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- active, inactive, closed
  current_balance NUMERIC NOT NULL DEFAULT 0,
  available_balance NUMERIC NOT NULL DEFAULT 0,
  overdraft_limit NUMERIC DEFAULT 0,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exchange rates table for multi-currency support
CREATE TABLE public.exchange_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  base_currency TEXT NOT NULL DEFAULT 'BRL',
  target_currency TEXT NOT NULL,
  rate NUMERIC NOT NULL,
  rate_date DATE NOT NULL DEFAULT CURRENT_DATE,
  source TEXT DEFAULT 'manual', -- manual, api, central_bank
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bank statements table
CREATE TABLE public.bank_statements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_account_id UUID NOT NULL REFERENCES public.bank_accounts(id),
  statement_date DATE NOT NULL,
  file_path TEXT,
  file_name TEXT,
  total_entries INTEGER DEFAULT 0,
  reconciled_entries INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, error
  import_notes TEXT,
  imported_by UUID,
  imported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bank transactions table
CREATE TABLE public.bank_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_account_id UUID NOT NULL REFERENCES public.bank_accounts(id),
  statement_id UUID REFERENCES public.bank_statements(id),
  transaction_date DATE NOT NULL,
  value_date DATE,
  amount NUMERIC NOT NULL,
  transaction_type TEXT NOT NULL, -- debit, credit
  description TEXT NOT NULL,
  document_number TEXT,
  counterpart_account TEXT,
  counterpart_name TEXT,
  category TEXT,
  reconciliation_status TEXT NOT NULL DEFAULT 'pending', -- pending, matched, manual, ignored
  reconciled_with_type TEXT, -- invoice_payment, payable, manual_entry
  reconciled_with_id UUID,
  reconciled_by UUID,
  reconciled_at TIMESTAMP WITH TIME ZONE,
  reconciliation_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cash flow projections table
CREATE TABLE public.cash_flow_projections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_account_id UUID REFERENCES public.bank_accounts(id),
  projection_date DATE NOT NULL,
  flow_type TEXT NOT NULL, -- inflow, outflow
  category TEXT NOT NULL, -- receivables, payables, other
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  source_type TEXT NOT NULL, -- invoice, payable, manual
  source_id UUID,
  scenario_type TEXT NOT NULL DEFAULT 'base', -- base, optimistic, conservative
  probability NUMERIC DEFAULT 100, -- percentage
  description TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payment execution table
CREATE TABLE public.payment_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_account_id UUID NOT NULL REFERENCES public.bank_accounts(id),
  payment_batch_id UUID REFERENCES public.payment_batches(id),
  payable_id UUID REFERENCES public.payables(id),
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  execution_date DATE NOT NULL,
  value_date DATE,
  payment_method TEXT NOT NULL, -- transfer, ted, pix, check, boleto
  beneficiary_bank TEXT,
  beneficiary_account TEXT,
  beneficiary_name TEXT,
  document_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, executed, failed, cancelled
  execution_reference TEXT,
  bank_transaction_id UUID REFERENCES public.bank_transactions(id),
  executed_by UUID,
  executed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cash position snapshots table
CREATE TABLE public.cash_position_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_date DATE NOT NULL,
  bank_account_id UUID REFERENCES public.bank_accounts(id),
  currency TEXT NOT NULL DEFAULT 'BRL',
  opening_balance NUMERIC NOT NULL DEFAULT 0,
  inflows NUMERIC NOT NULL DEFAULT 0,
  outflows NUMERIC NOT NULL DEFAULT 0,
  closing_balance NUMERIC NOT NULL DEFAULT 0,
  projected_balance_7d NUMERIC DEFAULT 0,
  projected_balance_30d NUMERIC DEFAULT 0,
  projected_balance_90d NUMERIC DEFAULT 0,
  scenario_type TEXT NOT NULL DEFAULT 'base',
  calculated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reconciliation rules table
CREATE TABLE public.reconciliation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  bank_account_id UUID REFERENCES public.bank_accounts(id),
  priority INTEGER NOT NULL DEFAULT 1,
  match_type TEXT NOT NULL, -- amount_date, description, document, combined
  description_pattern TEXT,
  amount_tolerance NUMERIC DEFAULT 0,
  date_tolerance INTEGER DEFAULT 0, -- days
  auto_reconcile BOOLEAN NOT NULL DEFAULT false,
  target_category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_flow_projections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_position_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reconciliation_rules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage bank accounts" ON public.bank_accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage exchange rates" ON public.exchange_rates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage bank statements" ON public.bank_statements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage bank transactions" ON public.bank_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage cash flow projections" ON public.cash_flow_projections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage payment executions" ON public.payment_executions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage cash position snapshots" ON public.cash_position_snapshots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage reconciliation rules" ON public.reconciliation_rules FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_bank_accounts_status ON public.bank_accounts(status);
CREATE INDEX idx_exchange_rates_currencies_date ON public.exchange_rates(base_currency, target_currency, rate_date);
CREATE INDEX idx_bank_transactions_account_date ON public.bank_transactions(bank_account_id, transaction_date);
CREATE INDEX idx_bank_transactions_reconciliation ON public.bank_transactions(reconciliation_status);
CREATE INDEX idx_cash_flow_projections_account_date ON public.cash_flow_projections(bank_account_id, projection_date);
CREATE INDEX idx_payment_executions_status ON public.payment_executions(status);
CREATE INDEX idx_cash_position_snapshots_date ON public.cash_position_snapshots(snapshot_date);

-- Create triggers for updated_at
CREATE TRIGGER update_bank_accounts_updated_at
  BEFORE UPDATE ON public.bank_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cash_flow_projections_updated_at
  BEFORE UPDATE ON public.cash_flow_projections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reconciliation_rules_updated_at
  BEFORE UPDATE ON public.reconciliation_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create audit triggers
CREATE TRIGGER audit_bank_accounts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.bank_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_bank_transactions_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.bank_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_payment_executions_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.payment_executions
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_trigger_function();

-- Function to update bank account balance
CREATE OR REPLACE FUNCTION public.update_bank_account_balance()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update account balance when transaction is added/modified
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.bank_accounts 
    SET current_balance = (
      SELECT COALESCE(SUM(
        CASE 
          WHEN transaction_type = 'credit' THEN amount 
          ELSE -amount 
        END
      ), 0)
      FROM public.bank_transactions 
      WHERE bank_account_id = NEW.bank_account_id
        AND reconciliation_status != 'ignored'
    )
    WHERE id = NEW.bank_account_id;
    
    RETURN NEW;
  END IF;
  
  -- Update account balance when transaction is deleted
  IF TG_OP = 'DELETE' THEN
    UPDATE public.bank_accounts 
    SET current_balance = (
      SELECT COALESCE(SUM(
        CASE 
          WHEN transaction_type = 'credit' THEN amount 
          ELSE -amount 
        END
      ), 0)
      FROM public.bank_transactions 
      WHERE bank_account_id = OLD.bank_account_id
        AND reconciliation_status != 'ignored'
    )
    WHERE id = OLD.bank_account_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to generate cash flow projections from receivables
CREATE OR REPLACE FUNCTION public.generate_cash_flow_from_receivables()
RETURNS void
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete existing receivables projections
  DELETE FROM public.cash_flow_projections 
  WHERE source_type = 'invoice' AND scenario_type = 'base';
  
  -- Insert projections from open invoices
  INSERT INTO public.cash_flow_projections (
    projection_date,
    flow_type,
    category,
    amount,
    currency,
    source_type,
    source_id,
    scenario_type,
    description
  )
  SELECT 
    i.due_date as projection_date,
    'inflow' as flow_type,
    'receivables' as category,
    (i.net_amount - COALESCE(payments.total_paid, 0)) as amount,
    i.currency,
    'invoice' as source_type,
    i.id as source_id,
    'base' as scenario_type,
    'Invoice: ' || i.invoice_number as description
  FROM public.invoices i
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

-- Function to generate cash flow projections from payables
CREATE OR REPLACE FUNCTION public.generate_cash_flow_from_payables()
RETURNS void
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete existing payables projections
  DELETE FROM public.cash_flow_projections 
  WHERE source_type = 'payable' AND scenario_type = 'base';
  
  -- Insert projections from open payables
  INSERT INTO public.cash_flow_projections (
    projection_date,
    flow_type,
    category,
    amount,
    currency,
    source_type,
    source_id,
    scenario_type,
    description
  )
  SELECT 
    p.due_date as projection_date,
    'outflow' as flow_type,
    'payables' as category,
    p.remaining_amount as amount,
    p.currency,
    'payable' as source_type,
    p.id as source_id,
    'base' as scenario_type,
    'Payable: ' || p.document_number as description
  FROM public.payables p
  WHERE p.status IN ('pending', 'partial')
    AND p.remaining_amount > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate cash position
CREATE OR REPLACE FUNCTION public.calculate_cash_position(
  p_calculation_date DATE DEFAULT CURRENT_DATE,
  p_scenario_type TEXT DEFAULT 'base'
)
RETURNS void
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  account_record RECORD;
  opening_balance NUMERIC;
  total_inflows NUMERIC;
  total_outflows NUMERIC;
  closing_balance NUMERIC;
  projected_7d NUMERIC;
  projected_30d NUMERIC;
  projected_90d NUMERIC;
BEGIN
  -- Delete existing snapshots for the date
  DELETE FROM public.cash_position_snapshots 
  WHERE snapshot_date = p_calculation_date 
    AND scenario_type = p_scenario_type;
  
  -- Calculate for each active bank account
  FOR account_record IN 
    SELECT * FROM public.bank_accounts WHERE status = 'active'
  LOOP
    -- Get opening balance (current balance)
    opening_balance := account_record.current_balance;
    
    -- Calculate inflows for the day
    SELECT COALESCE(SUM(amount), 0) INTO total_inflows
    FROM public.cash_flow_projections
    WHERE projection_date = p_calculation_date
      AND flow_type = 'inflow'
      AND scenario_type = p_scenario_type
      AND (bank_account_id IS NULL OR bank_account_id = account_record.id);
    
    -- Calculate outflows for the day
    SELECT COALESCE(SUM(amount), 0) INTO total_outflows
    FROM public.cash_flow_projections
    WHERE projection_date = p_calculation_date
      AND flow_type = 'outflow'
      AND scenario_type = p_scenario_type
      AND (bank_account_id IS NULL OR bank_account_id = account_record.id);
    
    closing_balance := opening_balance + total_inflows - total_outflows;
    
    -- Calculate projections
    SELECT COALESCE(SUM(
      CASE WHEN flow_type = 'inflow' THEN amount ELSE -amount END
    ), 0) INTO projected_7d
    FROM public.cash_flow_projections
    WHERE projection_date BETWEEN p_calculation_date AND p_calculation_date + INTERVAL '7 days'
      AND scenario_type = p_scenario_type
      AND (bank_account_id IS NULL OR bank_account_id = account_record.id);
    
    SELECT COALESCE(SUM(
      CASE WHEN flow_type = 'inflow' THEN amount ELSE -amount END
    ), 0) INTO projected_30d
    FROM public.cash_flow_projections
    WHERE projection_date BETWEEN p_calculation_date AND p_calculation_date + INTERVAL '30 days'
      AND scenario_type = p_scenario_type
      AND (bank_account_id IS NULL OR bank_account_id = account_record.id);
    
    SELECT COALESCE(SUM(
      CASE WHEN flow_type = 'inflow' THEN amount ELSE -amount END
    ), 0) INTO projected_90d
    FROM public.cash_flow_projections
    WHERE projection_date BETWEEN p_calculation_date AND p_calculation_date + INTERVAL '90 days'
      AND scenario_type = p_scenario_type
      AND (bank_account_id IS NULL OR bank_account_id = account_record.id);
    
    -- Insert snapshot
    INSERT INTO public.cash_position_snapshots (
      snapshot_date,
      bank_account_id,
      currency,
      opening_balance,
      inflows,
      outflows,
      closing_balance,
      projected_balance_7d,
      projected_balance_30d,
      projected_balance_90d,
      scenario_type,
      calculated_by
    ) VALUES (
      p_calculation_date,
      account_record.id,
      account_record.currency,
      opening_balance,
      total_inflows,
      total_outflows,
      closing_balance,
      opening_balance + projected_7d,
      opening_balance + projected_30d,
      opening_balance + projected_90d,
      p_scenario_type,
      auth.uid()
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update bank balance when transactions change
CREATE TRIGGER update_bank_balance_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.bank_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_bank_account_balance();

-- Insert default exchange rates
INSERT INTO public.exchange_rates (base_currency, target_currency, rate, rate_date) VALUES
('BRL', 'USD', 0.20, CURRENT_DATE),
('BRL', 'EUR', 0.18, CURRENT_DATE),
('USD', 'BRL', 5.00, CURRENT_DATE),
('EUR', 'BRL', 5.50, CURRENT_DATE);