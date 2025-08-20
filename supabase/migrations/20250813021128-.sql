-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  department TEXT,
  company_unit TEXT,
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  language TEXT DEFAULT 'pt-BR',
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active, inactive, suspended
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create app roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'finance', 'projects', 'auditor', 'manager', 'collaborator');

-- Create user roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  scope_type TEXT DEFAULT 'global', -- global, company, project, cost_center
  scope_id UUID, -- references the specific scope (project.id, cost_center.id, etc)
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(user_id, role, scope_type, scope_id)
);

-- Create permissions table
CREATE TABLE public.permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module TEXT NOT NULL, -- cadastros, vendas, horas, faturacao, etc
  action TEXT NOT NULL, -- create, read, update, delete, approve, export
  resource TEXT, -- specific resource within module
  role app_role NOT NULL,
  is_allowed BOOLEAN NOT NULL DEFAULT false,
  conditions JSONB DEFAULT '{}', -- additional conditions for the permission
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(module, action, resource, role)
);

-- Create workflow definitions table
CREATE TABLE public.workflow_definitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  object_type TEXT NOT NULL, -- time_entries, expenses, invoices, payables, etc
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  states JSONB NOT NULL DEFAULT '[]', -- array of workflow states
  transitions JSONB NOT NULL DEFAULT '{}', -- state transition rules
  approval_rules JSONB DEFAULT '{}', -- approval rules by value/role
  sla_hours INTEGER DEFAULT 24,
  escalation_rules JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workflow instances table
CREATE TABLE public.workflow_instances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_definition_id UUID NOT NULL REFERENCES public.workflow_definitions(id),
  object_type TEXT NOT NULL,
  object_id UUID NOT NULL,
  current_state TEXT NOT NULL,
  started_by UUID REFERENCES auth.users(id),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active', -- active, completed, cancelled
  metadata JSONB DEFAULT '{}'
);

-- Create workflow steps table
CREATE TABLE public.workflow_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_instance_id UUID NOT NULL REFERENCES public.workflow_instances(id) ON DELETE CASCADE,
  step_name TEXT NOT NULL,
  assignee_id UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, skipped, escalated
  action TEXT, -- approved, rejected, returned
  comments TEXT,
  attachments JSONB DEFAULT '[]',
  due_date TIMESTAMP WITH TIME ZONE,
  escalated_to UUID REFERENCES auth.users(id)
);

-- Create system parameters table
CREATE TABLE public.system_parameters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL, -- currency, tax, calendar, numbering, notification
  parameter_key TEXT NOT NULL,
  parameter_value JSONB NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  scope_type TEXT DEFAULT 'global',
  scope_id UUID,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(category, parameter_key, scope_type, scope_id)
);

-- Create notification templates table
CREATE TABLE public.notification_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  event_type TEXT NOT NULL, -- approval_pending, sla_warning, integration_failure
  channel TEXT NOT NULL, -- in_app, email
  subject TEXT,
  body_template TEXT NOT NULL,
  variables JSONB DEFAULT '{}', -- template variables
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user notification preferences table
CREATE TABLE public.user_notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  channel TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_type, channel)
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  event_type TEXT NOT NULL,
  channel TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread', -- unread, read, dismissed
  related_object_type TEXT,
  related_object_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Create integrations table
CREATE TABLE public.integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  integration_type TEXT NOT NULL, -- banking, its, webhook_out, api
  endpoint_url TEXT,
  authentication_type TEXT, -- oauth, api_key, basic, none
  configuration JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'inactive', -- active, inactive, error
  last_sync_at TIMESTAMP WITH TIME ZONE,
  last_error TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create integration logs table
CREATE TABLE public.integration_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id UUID NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  operation TEXT NOT NULL, -- sync, send, receive
  status TEXT NOT NULL, -- success, error, warning
  request_data JSONB,
  response_data JSONB,
  error_message TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role 
  FROM public.user_roles 
  WHERE user_id = auth.uid() 
    AND is_active = true 
    AND (expires_at IS NULL OR expires_at > now())
    AND scope_type = 'global'
  ORDER BY 
    CASE role 
      WHEN 'admin' THEN 1
      WHEN 'finance' THEN 2 
      WHEN 'manager' THEN 3
      WHEN 'projects' THEN 4
      WHEN 'auditor' THEN 5
      WHEN 'collaborator' THEN 6
    END
  LIMIT 1;
$$;

-- Create function to check if user has specific permission
CREATE OR REPLACE FUNCTION public.has_permission(
  p_module TEXT,
  p_action TEXT,
  p_resource TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.permissions p
    JOIN public.user_roles ur ON ur.role = p.role
    WHERE ur.user_id = auth.uid()
      AND ur.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > now())
      AND p.module = p_module
      AND p.action = p_action
      AND (p_resource IS NULL OR p.resource = p_resource)
      AND p.is_allowed = true
  );
$$;

-- Create RLS policies

-- Profiles: users can see their own profile, admins can see all
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL USING (public.get_current_user_role() = 'admin');

-- User roles: admins can manage, users can see their own
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage user roles" ON public.user_roles
  FOR ALL USING (public.get_current_user_role() = 'admin');

-- Permissions: admins can manage, others can view
CREATE POLICY "Users can view permissions" ON public.permissions
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage permissions" ON public.permissions
  FOR ALL USING (public.get_current_user_role() = 'admin');

-- Workflow definitions: managers+ can manage, others can view
CREATE POLICY "Users can view workflow definitions" ON public.workflow_definitions
  FOR SELECT USING (true);

CREATE POLICY "Managers can manage workflow definitions" ON public.workflow_definitions
  FOR ALL USING (public.get_current_user_role() IN ('admin', 'manager', 'finance'));

-- Workflow instances: users can see assigned workflows
CREATE POLICY "Users can view assigned workflows" ON public.workflow_instances
  FOR SELECT USING (
    started_by = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.workflow_steps ws 
      WHERE ws.workflow_instance_id = id 
        AND ws.assignee_id = auth.uid()
    )
  );

CREATE POLICY "Users can create workflow instances" ON public.workflow_instances
  FOR INSERT WITH CHECK (started_by = auth.uid());

-- System parameters: admins can manage, others can view
CREATE POLICY "Users can view system parameters" ON public.system_parameters
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage system parameters" ON public.system_parameters
  FOR ALL USING (public.get_current_user_role() = 'admin');

-- Notifications: users can see their own
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Integrations: admins and finance can manage
CREATE POLICY "Authorized users can view integrations" ON public.integrations
  FOR SELECT USING (public.get_current_user_role() IN ('admin', 'finance', 'manager'));

CREATE POLICY "Admins can manage integrations" ON public.integrations
  FOR ALL USING (public.get_current_user_role() = 'admin');

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workflow_definitions_updated_at
  BEFORE UPDATE ON public.workflow_definitions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_parameters_updated_at
  BEFORE UPDATE ON public.system_parameters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_templates_updated_at
  BEFORE UPDATE ON public.notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON public.integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.email
  );
  
  -- Assign default collaborator role
  INSERT INTO public.user_roles (user_id, role, granted_by)
  VALUES (NEW.id, 'collaborator', NEW.id);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default permissions matrix
INSERT INTO public.permissions (module, action, role, is_allowed) VALUES
-- Admin permissions (full access)
('cadastros', 'create', 'admin', true),
('cadastros', 'read', 'admin', true),
('cadastros', 'update', 'admin', true),
('cadastros', 'delete', 'admin', true),
('cadastros', 'approve', 'admin', true),
('cadastros', 'export', 'admin', true),

-- Finance permissions
('faturacao', 'create', 'finance', true),
('faturacao', 'read', 'finance', true),
('faturacao', 'update', 'finance', true),
('faturacao', 'approve', 'finance', true),
('faturacao', 'export', 'finance', true),
('compromissos', 'create', 'finance', true),
('compromissos', 'read', 'finance', true),
('compromissos', 'update', 'finance', true),
('compromissos', 'approve', 'finance', true),
('tesouraria', 'read', 'finance', true),
('tesouraria', 'update', 'finance', true),

-- Projects permissions  
('horas', 'create', 'projects', true),
('horas', 'read', 'projects', true),
('horas', 'update', 'projects', true),
('horas', 'approve', 'projects', true),
('custos', 'read', 'projects', true),
('vendas', 'read', 'projects', true),

-- Manager permissions (broader access)
('horas', 'approve', 'manager', true),
('custos', 'read', 'manager', true),
('custos', 'update', 'manager', true),
('faturacao', 'read', 'manager', true),
('compromissos', 'read', 'manager', true),
('analytics', 'read', 'manager', true),

-- Auditor permissions (read-only access)
('cadastros', 'read', 'auditor', true),
('vendas', 'read', 'auditor', true),
('horas', 'read', 'auditor', true),
('faturacao', 'read', 'auditor', true),
('compromissos', 'read', 'auditor', true),
('tesouraria', 'read', 'auditor', true),
('custos', 'read', 'auditor', true),
('analytics', 'read', 'auditor', true),
('contabilidade', 'read', 'auditor', true),
('governanca', 'read', 'auditor', true),

-- Collaborator permissions (limited access)
('horas', 'create', 'collaborator', true),
('horas', 'read', 'collaborator', true),
('horas', 'update', 'collaborator', true);

-- Insert default system parameters
INSERT INTO public.system_parameters (category, parameter_key, parameter_value, description) VALUES
('currency', 'default_currency', '"BRL"', 'Moeda padrão do sistema'),
('currency', 'decimal_places', '2', 'Casas decimais para valores monetários'),
('numbering', 'invoice_prefix', '"INV"', 'Prefixo para numeração de faturas'),
('numbering', 'order_prefix', '"ORD"', 'Prefixo para numeração de pedidos'),
('calendar', 'working_hours_per_day', '8', 'Horas de trabalho por dia'),
('calendar', 'working_days_per_week', '5', 'Dias de trabalho por semana'),
('security', 'session_timeout_hours', '8', 'Timeout da sessão em horas'),
('security', 'password_min_length', '8', 'Comprimento mínimo da senha'),
('workflow', 'default_sla_hours', '24', 'SLA padrão para workflows em horas');

-- Insert default notification templates
INSERT INTO public.notification_templates (name, event_type, channel, subject, body_template) VALUES
('Approval Pending - In App', 'approval_pending', 'in_app', 'Aprovação Pendente', 'Você tem uma aprovação pendente: {{object_type}} #{{object_id}}'),
('Approval Pending - Email', 'approval_pending', 'email', 'Aprovação Pendente - {{object_type}}', 'Olá {{user_name}}, você tem uma aprovação pendente para {{object_type}} #{{object_id}}. Prazo: {{due_date}}'),
('SLA Warning', 'sla_warning', 'in_app', 'SLA a Vencer', 'Atenção: SLA para {{object_type}} #{{object_id}} vence em {{hours_remaining}} horas'),
('Integration Failure', 'integration_failure', 'in_app', 'Falha na Integração', 'Falha detectada na integração {{integration_name}}: {{error_message}}');

-- Create indexes for performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);
CREATE INDEX idx_permissions_module_action ON public.permissions(module, action);
CREATE INDEX idx_workflow_instances_object ON public.workflow_instances(object_type, object_id);
CREATE INDEX idx_workflow_steps_assignee ON public.workflow_steps(assignee_id);
CREATE INDEX idx_notifications_user_status ON public.notifications(user_id, status);
CREATE INDEX idx_integration_logs_integration_id ON public.integration_logs(integration_id);
CREATE INDEX idx_audit_logs_table_record ON public.audit_logs(table_name, record_id);