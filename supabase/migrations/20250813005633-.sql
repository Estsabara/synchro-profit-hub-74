-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  client_id UUID NOT NULL,
  description TEXT NOT NULL,
  total_value NUMERIC NOT NULL,
  estimated_costs NUMERIC,
  margin_percentage NUMERIC,
  margin_value NUMERIC,
  start_date DATE,
  end_date DATE,
  currency TEXT NOT NULL DEFAULT 'BRL',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Create order_projects relationship table
CREATE TABLE public.order_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  project_id UUID NOT NULL,
  allocated_value NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(order_id, project_id)
);

-- Create order_attachments table
CREATE TABLE public.order_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  content_type TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  uploaded_by UUID
);

-- Create order_margin_revisions table
CREATE TABLE public.order_margin_revisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  previous_margin_percentage NUMERIC,
  new_margin_percentage NUMERIC,
  previous_margin_value NUMERIC,
  new_margin_value NUMERIC,
  revision_reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_margin_revisions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for orders
CREATE POLICY "Users can manage orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage order projects" ON public.order_projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage order attachments" ON public.order_attachments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage order margin revisions" ON public.order_margin_revisions FOR ALL USING (true) WITH CHECK (true);

-- Create triggers for updated_at columns
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create audit triggers
CREATE TRIGGER orders_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER order_projects_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.order_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER order_margin_revisions_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.order_margin_revisions
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_trigger_function();

-- Create indexes for better performance
CREATE INDEX idx_orders_client_id ON public.orders(client_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_order_number ON public.orders(order_number);
CREATE INDEX idx_order_projects_order_id ON public.order_projects(order_id);
CREATE INDEX idx_order_projects_project_id ON public.order_projects(project_id);
CREATE INDEX idx_order_attachments_order_id ON public.order_attachments(order_id);
CREATE INDEX idx_order_margin_revisions_order_id ON public.order_margin_revisions(order_id);