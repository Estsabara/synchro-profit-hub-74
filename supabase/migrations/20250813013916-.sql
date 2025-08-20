-- Create budgets table for project/cost center budgets
CREATE TABLE public.budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id),
  cost_center_id UUID REFERENCES public.cost_centers(id),
  category TEXT NOT NULL,
  subcategory TEXT,
  budget_type TEXT NOT NULL DEFAULT 'cost', -- cost, revenue
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  valid_from DATE NOT NULL,
  valid_to DATE,
  fiscal_year INTEGER NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active', -- active, inactive, superseded
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create budget revisions table for budget change history
CREATE TABLE public.budget_revisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  previous_amount NUMERIC NOT NULL,
  new_amount NUMERIC NOT NULL,
  revision_reason TEXT NOT NULL,
  revision_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create actuals table for realized costs
CREATE TABLE public.actuals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id),
  cost_center_id UUID REFERENCES public.cost_centers(id),
  category TEXT NOT NULL,
  subcategory TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  actual_date DATE NOT NULL,
  source_type TEXT NOT NULL, -- time_entry, expense, payable, commitment
  source_id UUID NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create undercoverage calculations table
CREATE TABLE public.undercoverage_calculations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  calculation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  project_id UUID REFERENCES public.projects(id),
  cost_center_id UUID REFERENCES public.cost_centers(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_fixed_costs NUMERIC NOT NULL DEFAULT 0,
  productive_hours NUMERIC NOT NULL DEFAULT 0,
  billable_amount NUMERIC NOT NULL DEFAULT 0,
  coverage_percentage NUMERIC NOT NULL DEFAULT 0,
  undercovered_amount NUMERIC NOT NULL DEFAULT 0,
  calculated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cost categories lookup table
CREATE TABLE public.cost_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  parent_category TEXT,
  category_type TEXT NOT NULL DEFAULT 'cost', -- cost, revenue
  description TEXT,
  is_fixed BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.undercoverage_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage budgets" ON public.budgets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage budget revisions" ON public.budget_revisions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can view actuals" ON public.actuals FOR SELECT USING (true);
CREATE POLICY "Users can manage undercoverage calculations" ON public.undercoverage_calculations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage cost categories" ON public.cost_categories FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_budgets_project_id ON public.budgets(project_id);
CREATE INDEX idx_budgets_cost_center_id ON public.budgets(cost_center_id);
CREATE INDEX idx_budgets_fiscal_year ON public.budgets(fiscal_year);
CREATE INDEX idx_actuals_project_id ON public.actuals(project_id);
CREATE INDEX idx_actuals_date ON public.actuals(actual_date);
CREATE INDEX idx_actuals_source ON public.actuals(source_type, source_id);
CREATE INDEX idx_undercoverage_period ON public.undercoverage_calculations(period_start, period_end);

-- Create triggers for updated_at
CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_actuals_updated_at
  BEFORE UPDATE ON public.actuals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create audit triggers
CREATE TRIGGER audit_budgets_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.budgets
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_budget_revisions_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.budget_revisions
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_trigger_function();

-- Function to automatically create actuals from time entries
CREATE OR REPLACE FUNCTION public.create_actual_from_time_entry()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create actual if time entry is approved
  IF NEW.status = 'approved' AND (OLD IS NULL OR OLD.status != 'approved') THEN
    INSERT INTO public.actuals (
      project_id,
      category,
      amount,
      actual_date,
      source_type,
      source_id,
      description
    )
    SELECT 
      NEW.project_id,
      'Labor Costs',
      NEW.hours_worked * COALESCE(hr.rate_value, 0),
      NEW.work_date,
      'time_entry',
      NEW.id,
      'Time entry: ' || NEW.activity
    FROM public.hourly_rates hr
    WHERE hr.project_id = NEW.project_id
      AND hr.valid_from <= NEW.work_date
      AND (hr.valid_to IS NULL OR hr.valid_to >= NEW.work_date)
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically create actuals from expenses
CREATE OR REPLACE FUNCTION public.create_actual_from_expense()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create actual if expense is approved
  IF NEW.status = 'approved' AND (OLD IS NULL OR OLD.status != 'approved') THEN
    INSERT INTO public.actuals (
      project_id,
      cost_center_id,
      category,
      amount,
      actual_date,
      source_type,
      source_id,
      description
    ) VALUES (
      NEW.project_id,
      NEW.cost_center_id,
      NEW.expense_type,
      NEW.amount,
      NEW.expense_date,
      'expense',
      NEW.id,
      'Expense: ' || NEW.description
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically create actuals from payables
CREATE OR REPLACE FUNCTION public.create_actual_from_payable()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create actual when payable is paid
  IF NEW.status = 'paid' AND (OLD IS NULL OR OLD.status != 'paid') THEN
    INSERT INTO public.actuals (
      category,
      amount,
      actual_date,
      source_type,
      source_id,
      description
    ) VALUES (
      'Supplier Costs',
      NEW.amount,
      NEW.payment_date,
      'payable',
      NEW.id,
      'Payment: ' || COALESCE(NEW.description, NEW.document_number)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate undercoverage
CREATE OR REPLACE FUNCTION public.calculate_undercoverage(
  p_project_id UUID DEFAULT NULL,
  p_cost_center_id UUID DEFAULT NULL,
  p_period_start DATE DEFAULT CURRENT_DATE - INTERVAL '1 month',
  p_period_end DATE DEFAULT CURRENT_DATE
)
RETURNS UUID AS $$
DECLARE
  v_calculation_id UUID;
  v_fixed_costs NUMERIC := 0;
  v_productive_hours NUMERIC := 0;
  v_billable_amount NUMERIC := 0;
  v_coverage_percentage NUMERIC := 0;
  v_undercovered_amount NUMERIC := 0;
BEGIN
  -- Calculate fixed costs for the period
  SELECT COALESCE(SUM(amount), 0) INTO v_fixed_costs
  FROM public.actuals a
  JOIN public.cost_categories cc ON cc.name = a.category
  WHERE cc.is_fixed = true
    AND a.actual_date BETWEEN p_period_start AND p_period_end
    AND (p_project_id IS NULL OR a.project_id = p_project_id)
    AND (p_cost_center_id IS NULL OR a.cost_center_id = p_cost_center_id);

  -- Calculate productive hours and billable amount
  SELECT 
    COALESCE(SUM(te.hours_worked), 0),
    COALESCE(SUM(te.hours_worked * hr.rate_value), 0)
  INTO v_productive_hours, v_billable_amount
  FROM public.time_entries te
  LEFT JOIN public.hourly_rates hr ON hr.project_id = te.project_id
    AND hr.valid_from <= te.work_date
    AND (hr.valid_to IS NULL OR hr.valid_to >= te.work_date)
  WHERE te.status = 'approved'
    AND te.work_date BETWEEN p_period_start AND p_period_end
    AND (p_project_id IS NULL OR te.project_id = p_project_id);

  -- Calculate coverage percentage
  IF v_fixed_costs > 0 THEN
    v_coverage_percentage := (v_billable_amount / v_fixed_costs) * 100;
  END IF;

  -- Calculate undercovered amount
  v_undercovered_amount := GREATEST(0, v_fixed_costs - v_billable_amount);

  -- Insert calculation result
  INSERT INTO public.undercoverage_calculations (
    project_id,
    cost_center_id,
    period_start,
    period_end,
    total_fixed_costs,
    productive_hours,
    billable_amount,
    coverage_percentage,
    undercovered_amount,
    calculated_by
  ) VALUES (
    p_project_id,
    p_cost_center_id,
    p_period_start,
    p_period_end,
    v_fixed_costs,
    v_productive_hours,
    v_billable_amount,
    v_coverage_percentage,
    v_undercovered_amount,
    auth.uid()
  ) RETURNING id INTO v_calculation_id;

  RETURN v_calculation_id;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically create actuals
CREATE TRIGGER time_entry_to_actual_trigger
  AFTER INSERT OR UPDATE ON public.time_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.create_actual_from_time_entry();

CREATE TRIGGER expense_to_actual_trigger
  AFTER INSERT OR UPDATE ON public.project_expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.create_actual_from_expense();

CREATE TRIGGER payable_to_actual_trigger
  AFTER INSERT OR UPDATE ON public.payables
  FOR EACH ROW
  EXECUTE FUNCTION public.create_actual_from_payable();

-- Insert default cost categories
INSERT INTO public.cost_categories (name, category_type, is_fixed, description) VALUES
('Labor Costs', 'cost', false, 'Employee and contractor labor costs'),
('Equipment & Software', 'cost', true, 'Equipment, software licenses and IT costs'),
('Office & Facilities', 'cost', true, 'Rent, utilities, office supplies'),
('Travel & Entertainment', 'cost', false, 'Business travel and client entertainment'),
('Supplier Costs', 'cost', false, 'External supplier and vendor costs'),
('Marketing & Sales', 'cost', false, 'Marketing campaigns and sales activities'),
('Professional Services', 'cost', false, 'Legal, accounting, consulting services'),
('Project Revenue', 'revenue', false, 'Revenue from client projects'),
('Recurring Revenue', 'revenue', false, 'Subscription and recurring revenue streams');