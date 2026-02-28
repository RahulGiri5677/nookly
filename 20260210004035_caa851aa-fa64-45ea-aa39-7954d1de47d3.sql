
-- Function to increment nook people count and auto-confirm
CREATE OR REPLACE FUNCTION public.increment_nook_people(nook_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _min_people INTEGER;
  _current INTEGER;
BEGIN
  UPDATE public.nooks
  SET current_people = current_people + 1
  WHERE id = nook_id
  RETURNING current_people, min_people INTO _current, _min_people;

  -- Auto-confirm if minimum reached
  IF _current >= _min_people THEN
    UPDATE public.nooks SET status = 'confirmed' WHERE id = nook_id AND status = 'pending';
  END IF;
END;
$$;
