-- Fix search_path for auto_link_lead_to_user function
CREATE OR REPLACE FUNCTION public.auto_link_lead_to_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NOT NULL AND NEW.linked_user_id IS NULL THEN
    SELECT id INTO NEW.linked_user_id
    FROM public.profiles
    WHERE LOWER(email) = LOWER(NEW.email)
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;