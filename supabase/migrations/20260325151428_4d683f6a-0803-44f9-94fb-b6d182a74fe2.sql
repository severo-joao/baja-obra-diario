
CREATE OR REPLACE FUNCTION public.generate_tool_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  next_num int;
BEGIN
  IF NEW.codigo_patrimonio IS NULL OR NEW.codigo_patrimonio = '' THEN
    SELECT COALESCE(MAX(
      CASE WHEN codigo_patrimonio ~ '^FERR-[0-9]+$'
        THEN CAST(SUBSTRING(codigo_patrimonio FROM 6) AS int)
        ELSE 0
      END
    ), 0) + 1
    INTO next_num
    FROM public.tools;
    
    NEW.codigo_patrimonio := 'FERR-' || LPAD(next_num::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generate_tool_code
  BEFORE INSERT ON public.tools
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_tool_code();
