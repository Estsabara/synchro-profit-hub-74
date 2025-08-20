-- Add missing triggers for existing tables
CREATE OR REPLACE TRIGGER audit_trigger_entities
  AFTER INSERT OR UPDATE OR DELETE ON public.entities
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE OR REPLACE TRIGGER audit_trigger_projects
  AFTER INSERT OR UPDATE OR DELETE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE OR REPLACE TRIGGER audit_trigger_cost_centers
  AFTER INSERT OR UPDATE OR DELETE ON public.cost_centers
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE OR REPLACE TRIGGER audit_trigger_hourly_rates
  AFTER INSERT OR UPDATE OR DELETE ON public.hourly_rates
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE OR REPLACE TRIGGER audit_trigger_entity_addresses
  AFTER INSERT OR UPDATE OR DELETE ON public.entity_addresses
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE OR REPLACE TRIGGER audit_trigger_entity_contacts
  AFTER INSERT OR UPDATE OR DELETE ON public.entity_contacts
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Add unique constraint for cost centers code
ALTER TABLE public.cost_centers 
ADD CONSTRAINT unique_cost_center_code UNIQUE (code);

-- Add foreign key references for projects
ALTER TABLE public.projects 
ADD CONSTRAINT fk_projects_client_id 
FOREIGN KEY (client_id) REFERENCES public.entities(id) ON DELETE RESTRICT;

ALTER TABLE public.projects 
ADD CONSTRAINT fk_projects_cost_center_id 
FOREIGN KEY (cost_center_id) REFERENCES public.cost_centers(id) ON DELETE SET NULL;

-- Add foreign key references for hourly_rates
ALTER TABLE public.hourly_rates 
ADD CONSTRAINT fk_hourly_rates_project_id 
FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

-- Add foreign key references for entity_addresses
ALTER TABLE public.entity_addresses 
ADD CONSTRAINT fk_entity_addresses_entity_id 
FOREIGN KEY (entity_id) REFERENCES public.entities(id) ON DELETE CASCADE;

-- Add foreign key references for entity_contacts
ALTER TABLE public.entity_contacts 
ADD CONSTRAINT fk_entity_contacts_entity_id 
FOREIGN KEY (entity_id) REFERENCES public.entities(id) ON DELETE CASCADE;