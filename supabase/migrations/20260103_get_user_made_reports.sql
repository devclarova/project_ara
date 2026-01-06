CREATE OR REPLACE FUNCTION public.get_user_made_reports(reporter_profile_id UUID)
RETURNS SETOF public.reports
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT r.*
    FROM public.reports r
    WHERE r.reporter_id = reporter_profile_id
    OR r.reporter_id IN (SELECT pp.user_id FROM public.profiles pp WHERE pp.id = reporter_profile_id)
    ORDER BY r.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_made_reports TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_made_reports TO service_role;
