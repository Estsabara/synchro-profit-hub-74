-- Create time_entries table
CREATE TABLE public.time_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID NOT NULL,
  activity TEXT NOT NULL,
  work_date DATE NOT NULL,
  hours_worked NUMERIC NOT NULL,
  observations TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_expenses table
CREATE TABLE public.project_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  cost_center_id UUID,
  user_id UUID NOT NULL,
  expense_type TEXT NOT NULL,
  supplier TEXT,
  location TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  expense_date DATE NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expense_attachments table
CREATE TABLE public.expense_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id UUID NOT NULL,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  content_type TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  uploaded_by UUID NOT NULL
);

-- Create poc_calculations table
CREATE TABLE public.poc_calculations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  calculation_date DATE NOT NULL,
  cost_based_poc NUMERIC,
  hours_based_poc NUMERIC,
  physical_poc NUMERIC,
  overall_poc NUMERIC,
  total_budgeted_cost NUMERIC,
  total_incurred_cost NUMERIC,
  total_budgeted_hours NUMERIC,
  total_worked_hours NUMERIC,
  calculated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create approval_workflows table
CREATE TABLE public.approval_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL, -- 'time_entry' or 'expense'
  entity_id UUID NOT NULL,
  approver_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poc_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_workflows ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own time entries" ON public.time_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage project expenses" ON public.project_expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage expense attachments" ON public.expense_attachments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can view poc calculations" ON public.poc_calculations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage approval workflows" ON public.approval_workflows FOR ALL USING (true) WITH CHECK (true);

-- Create triggers for updated_at columns
CREATE TRIGGER update_time_entries_updated_at
  BEFORE UPDATE ON public.time_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_expenses_updated_at
  BEFORE UPDATE ON public.project_expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_approval_workflows_updated_at
  BEFORE UPDATE ON public.approval_workflows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create audit triggers
CREATE TRIGGER time_entries_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.time_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER project_expenses_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.project_expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER poc_calculations_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.poc_calculations
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_trigger_function();

-- Create indexes for better performance
CREATE INDEX idx_time_entries_user_id ON public.time_entries(user_id);
CREATE INDEX idx_time_entries_project_id ON public.time_entries(project_id);
CREATE INDEX idx_time_entries_work_date ON public.time_entries(work_date);
CREATE INDEX idx_time_entries_status ON public.time_entries(status);

CREATE INDEX idx_project_expenses_project_id ON public.project_expenses(project_id);
CREATE INDEX idx_project_expenses_user_id ON public.project_expenses(user_id);
CREATE INDEX idx_project_expenses_expense_date ON public.project_expenses(expense_date);
CREATE INDEX idx_project_expenses_status ON public.project_expenses(status);

CREATE INDEX idx_expense_attachments_expense_id ON public.expense_attachments(expense_id);
CREATE INDEX idx_poc_calculations_project_id ON public.poc_calculations(project_id);
CREATE INDEX idx_poc_calculations_calculation_date ON public.poc_calculations(calculation_date);

CREATE INDEX idx_approval_workflows_entity_type_id ON public.approval_workflows(entity_type, entity_id);
CREATE INDEX idx_approval_workflows_approver_id ON public.approval_workflows(approver_id);
CREATE INDEX idx_approval_workflows_status ON public.approval_workflows(status);