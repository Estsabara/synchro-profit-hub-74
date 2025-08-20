-- Create analytics dashboards table
CREATE TABLE public.analytics_dashboards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  dashboard_type TEXT NOT NULL DEFAULT 'general', -- general, operational, custom
  layout_config JSONB NOT NULL DEFAULT '{}',
  filters JSONB DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create analytics reports table
CREATE TABLE public.analytics_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL, -- table, chart, mixed
  data_source TEXT NOT NULL, -- projects, invoices, expenses, etc
  columns_config JSONB NOT NULL DEFAULT '{}',
  filters JSONB DEFAULT '{}',
  chart_config JSONB DEFAULT '{}',
  is_template BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create KPI snapshots table for historical tracking
CREATE TABLE public.analytics_kpi_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  kpi_name TEXT NOT NULL,
  kpi_value NUMERIC NOT NULL,
  kpi_unit TEXT DEFAULT 'number', -- number, currency, percentage, hours
  currency TEXT DEFAULT 'BRL',
  filters JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create analytics configurations table
CREATE TABLE public.analytics_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key TEXT NOT NULL UNIQUE,
  config_value JSONB NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analytics_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_kpi_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_configurations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage analytics dashboards" ON public.analytics_dashboards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage analytics reports" ON public.analytics_reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can view KPI snapshots" ON public.analytics_kpi_snapshots FOR SELECT USING (true);
CREATE POLICY "Users can manage analytics configurations" ON public.analytics_configurations FOR ALL USING (true) WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_analytics_dashboards_type ON public.analytics_dashboards(dashboard_type);
CREATE INDEX idx_analytics_reports_type ON public.analytics_reports(report_type);
CREATE INDEX idx_kpi_snapshots_date_name ON public.analytics_kpi_snapshots(snapshot_date, kpi_name);
CREATE INDEX idx_analytics_configurations_key ON public.analytics_configurations(config_key);

-- Create function to calculate main KPIs
CREATE OR REPLACE FUNCTION public.calculate_main_kpis(
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE,
  p_project_id UUID DEFAULT NULL,
  p_client_id UUID DEFAULT NULL,
  p_cost_center_id UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result JSONB := '{}';
  v_active_projects INTEGER := 0;
  v_total_backlog NUMERIC := 0;
  v_average_margin NUMERIC := 0;
  v_approved_hours NUMERIC := 0;
  v_aging_total NUMERIC := 0;
  v_undercoverage NUMERIC := 0;
  v_total_revenue NUMERIC := 0;
  v_total_costs NUMERIC := 0;
  v_cash_position NUMERIC := 0;
BEGIN
  -- Active projects
  SELECT COUNT(*)
  INTO v_active_projects
  FROM public.projects p
  WHERE p.status = 'active'
    AND (p_project_id IS NULL OR p.id = p_project_id)
    AND (p_cost_center_id IS NULL OR p.cost_center_id = p_cost_center_id);

  -- Total backlog from orders
  SELECT COALESCE(SUM(o.total_value), 0)
  INTO v_total_backlog
  FROM public.orders o
  WHERE o.status IN ('active', 'confirmed')
    AND (p_client_id IS NULL OR o.client_id = p_client_id);

  -- Average margin from orders
  SELECT COALESCE(AVG(o.margin_percentage), 0)
  INTO v_average_margin
  FROM public.orders o
  WHERE o.status IN ('active', 'confirmed')
    AND o.margin_percentage IS NOT NULL
    AND (p_client_id IS NULL OR o.client_id = p_client_id);

  -- Approved hours in period
  SELECT COALESCE(SUM(te.hours_worked), 0)
  INTO v_approved_hours
  FROM public.time_entries te
  WHERE te.status = 'approved'
    AND te.work_date BETWEEN p_start_date AND p_end_date
    AND (p_project_id IS NULL OR te.project_id = p_project_id);

  -- Aging receivables (overdue invoices)
  SELECT COALESCE(SUM(i.net_amount - COALESCE(payments.total_paid, 0)), 0)
  INTO v_aging_total
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
    AND i.due_date < CURRENT_DATE
    AND (i.net_amount - COALESCE(payments.total_paid, 0)) > 0
    AND (p_client_id IS NULL OR i.client_id = p_client_id);

  -- Total revenue in period
  SELECT COALESCE(SUM(i.net_amount), 0)
  INTO v_total_revenue
  FROM public.invoices i
  WHERE i.issue_date BETWEEN p_start_date AND p_end_date
    AND i.invoice_status = 'sent'
    AND (p_client_id IS NULL OR i.client_id = p_client_id)
    AND (p_project_id IS NULL OR i.project_id = p_project_id);

  -- Total costs in period
  SELECT COALESCE(SUM(a.amount), 0)
  INTO v_total_costs
  FROM public.actuals a
  WHERE a.actual_date BETWEEN p_start_date AND p_end_date
    AND (p_project_id IS NULL OR a.project_id = p_project_id)
    AND (p_cost_center_id IS NULL OR a.cost_center_id = p_cost_center_id);

  -- Current cash position
  SELECT COALESCE(SUM(ba.current_balance), 0)
  INTO v_cash_position
  FROM public.bank_accounts ba
  WHERE ba.status = 'active';

  -- Calculate undercoverage
  v_undercoverage := GREATEST(0, v_total_costs - v_total_revenue);

  -- Build result JSON
  v_result := jsonb_build_object(
    'activeProjects', v_active_projects,
    'totalBacklog', v_total_backlog,
    'averageMargin', v_average_margin,
    'approvedHours', v_approved_hours,
    'agingTotal', v_aging_total,
    'undercoverage', v_undercoverage,
    'totalRevenue', v_total_revenue,
    'totalCosts', v_total_costs,
    'cashPosition', v_cash_position,
    'calculatedAt', now()
  );

  RETURN v_result;
END;
$$;

-- Create function to generate dashboard data
CREATE OR REPLACE FUNCTION public.generate_dashboard_data(
  p_dashboard_type TEXT DEFAULT 'general',
  p_filters JSONB DEFAULT '{}'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result JSONB := '{}';
  v_start_date DATE;
  v_end_date DATE;
  v_project_id UUID;
  v_client_id UUID;
  v_cost_center_id UUID;
BEGIN
  -- Extract filters
  v_start_date := COALESCE((p_filters->>'startDate')::DATE, CURRENT_DATE - INTERVAL '30 days');
  v_end_date := COALESCE((p_filters->>'endDate')::DATE, CURRENT_DATE);
  v_project_id := (p_filters->>'projectId')::UUID;
  v_client_id := (p_filters->>'clientId')::UUID;
  v_cost_center_id := (p_filters->>'costCenterId')::UUID;

  IF p_dashboard_type = 'general' THEN
    -- Get main KPIs
    SELECT public.calculate_main_kpis(v_start_date, v_end_date, v_project_id, v_client_id, v_cost_center_id)
    INTO v_result;

  ELSIF p_dashboard_type = 'projects' THEN
    -- Project-specific dashboard data
    v_result := jsonb_build_object(
      'projectsData', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', p.id,
            'name', p.name,
            'status', p.status,
            'budget', COALESCE(budget_data.total_budget, 0),
            'spent', COALESCE(actual_data.total_spent, 0),
            'hours', COALESCE(hours_data.total_hours, 0)
          )
        )
        FROM public.projects p
        LEFT JOIN (
          SELECT 
            project_id,
            SUM(amount) as total_budget
          FROM public.budgets
          WHERE valid_from <= v_end_date AND (valid_to IS NULL OR valid_to >= v_start_date)
          GROUP BY project_id
        ) budget_data ON budget_data.project_id = p.id
        LEFT JOIN (
          SELECT 
            project_id,
            SUM(amount) as total_spent
          FROM public.actuals
          WHERE actual_date BETWEEN v_start_date AND v_end_date
          GROUP BY project_id
        ) actual_data ON actual_data.project_id = p.id
        LEFT JOIN (
          SELECT 
            project_id,
            SUM(hours_worked) as total_hours
          FROM public.time_entries
          WHERE work_date BETWEEN v_start_date AND v_end_date AND status = 'approved'
          GROUP BY project_id
        ) hours_data ON hours_data.project_id = p.id
        WHERE p.status = 'active'
          AND (v_project_id IS NULL OR p.id = v_project_id)
          AND (v_cost_center_id IS NULL OR p.cost_center_id = v_cost_center_id)
      )
    );

  ELSIF p_dashboard_type = 'financial' THEN
    -- Financial dashboard data
    v_result := jsonb_build_object(
      'monthlyRevenue', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'month', to_char(month_series, 'YYYY-MM'),
            'revenue', COALESCE(revenue_data.total, 0)
          )
        )
        FROM generate_series(
          date_trunc('month', v_start_date),
          date_trunc('month', v_end_date),
          '1 month'::INTERVAL
        ) month_series
        LEFT JOIN (
          SELECT 
            date_trunc('month', i.issue_date) as month,
            SUM(i.net_amount) as total
          FROM public.invoices i
          WHERE i.issue_date BETWEEN v_start_date AND v_end_date
            AND i.invoice_status = 'sent'
            AND (v_client_id IS NULL OR i.client_id = v_client_id)
          GROUP BY date_trunc('month', i.issue_date)
        ) revenue_data ON revenue_data.month = month_series
      ),
      'payablesStatus', (
        SELECT jsonb_build_object(
          'pending', COALESCE(SUM(CASE WHEN status = 'pending' THEN remaining_amount ELSE 0 END), 0),
          'overdue', COALESCE(SUM(CASE WHEN status = 'pending' AND due_date < CURRENT_DATE THEN remaining_amount ELSE 0 END), 0),
          'paid', COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0)
        )
        FROM public.payables
        WHERE due_date BETWEEN v_start_date AND v_end_date
      )
    );

  END IF;

  RETURN v_result;
END;
$$;

-- Create function to create KPI snapshot
CREATE OR REPLACE FUNCTION public.create_kpi_snapshot(
  p_snapshot_date DATE DEFAULT CURRENT_DATE,
  p_filters JSONB DEFAULT '{}'
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_kpis JSONB;
  v_kpi_record RECORD;
  v_count INTEGER := 0;
BEGIN
  -- Delete existing snapshots for the date
  DELETE FROM public.analytics_kpi_snapshots 
  WHERE snapshot_date = p_snapshot_date;

  -- Calculate current KPIs
  SELECT public.calculate_main_kpis(
    p_snapshot_date - INTERVAL '30 days',
    p_snapshot_date,
    (p_filters->>'projectId')::UUID,
    (p_filters->>'clientId')::UUID,
    (p_filters->>'costCenterId')::UUID
  ) INTO v_kpis;

  -- Insert KPI snapshots
  INSERT INTO public.analytics_kpi_snapshots (snapshot_date, kpi_name, kpi_value, kpi_unit, filters)
  VALUES 
    (p_snapshot_date, 'activeProjects', (v_kpis->>'activeProjects')::NUMERIC, 'number', p_filters),
    (p_snapshot_date, 'totalBacklog', (v_kpis->>'totalBacklog')::NUMERIC, 'currency', p_filters),
    (p_snapshot_date, 'averageMargin', (v_kpis->>'averageMargin')::NUMERIC, 'percentage', p_filters),
    (p_snapshot_date, 'approvedHours', (v_kpis->>'approvedHours')::NUMERIC, 'hours', p_filters),
    (p_snapshot_date, 'agingTotal', (v_kpis->>'agingTotal')::NUMERIC, 'currency', p_filters),
    (p_snapshot_date, 'undercoverage', (v_kpis->>'undercoverage')::NUMERIC, 'currency', p_filters),
    (p_snapshot_date, 'totalRevenue', (v_kpis->>'totalRevenue')::NUMERIC, 'currency', p_filters),
    (p_snapshot_date, 'totalCosts', (v_kpis->>'totalCosts')::NUMERIC, 'currency', p_filters),
    (p_snapshot_date, 'cashPosition', (v_kpis->>'cashPosition')::NUMERIC, 'currency', p_filters);

  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN v_count;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_analytics_dashboards_updated_at
  BEFORE UPDATE ON public.analytics_dashboards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_analytics_reports_updated_at
  BEFORE UPDATE ON public.analytics_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_analytics_configurations_updated_at
  BEFORE UPDATE ON public.analytics_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default dashboard configurations
INSERT INTO public.analytics_dashboards (name, description, dashboard_type, layout_config, is_default) VALUES
('Dashboard Geral', 'Visão geral dos principais indicadores', 'general', '{"widgets": ["kpis", "charts", "tables"]}', true),
('Dashboard de Projetos', 'Indicadores específicos de projetos', 'projects', '{"widgets": ["project_list", "budget_chart", "hours_chart"]}', false),
('Dashboard Financeiro', 'Indicadores financeiros e tesouraria', 'financial', '{"widgets": ["revenue_chart", "payables_status", "cash_flow"]}', false);

-- Insert default report templates
INSERT INTO public.analytics_reports (name, description, report_type, data_source, columns_config, is_template) VALUES
('Relatório de Projetos', 'Lista completa de projetos com orçamento e gastos', 'table', 'projects', '{"columns": ["name", "status", "budget", "spent", "margin"]}', true),
('Relatório de Receitas', 'Evolução mensal das receitas', 'chart', 'invoices', '{"chartType": "line", "xAxis": "month", "yAxis": "revenue"}', true),
('Relatório de Custos por Projeto', 'Análise de custos detalhada por projeto', 'mixed', 'actuals', '{"table": true, "chart": true, "groupBy": "project"}', true);

-- Insert default analytics configurations
INSERT INTO public.analytics_configurations (config_key, config_value, description) VALUES
('default_date_range', '{"days": 30}', 'Período padrão para filtros de data'),
('kpi_refresh_interval', '{"minutes": 15}', 'Intervalo de atualização dos KPIs'),
('chart_colors', '{"primary": "hsl(var(--primary))", "secondary": "hsl(var(--secondary))"}', 'Cores padrão para gráficos');