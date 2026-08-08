-- Provide an owner-facing push monitor in the Supabase Table Editor without
-- exposing cross-user delivery data through the public API.
CREATE OR REPLACE VIEW public.push_delivery_health_monitor
WITH (security_invoker = true)
AS
WITH recent AS (
    SELECT *
    FROM public.push_delivery_logs
    WHERE attempted_at >= now() - interval '24 hours'
),
unresolved AS (
    SELECT failed.id, failed.attempted_at
    FROM recent failed
    WHERE failed.status = 'failed'
      -- These responses mean the endpoint expired and is removed automatically.
      AND failed.status_code IS DISTINCT FROM 404
      AND failed.status_code IS DISTINCT FROM 410
      AND NOT EXISTS (
          SELECT 1
          FROM public.push_delivery_logs recovered
          WHERE recovered.subscription_id = failed.subscription_id
            AND recovered.status = 'accepted'
            AND recovered.attempted_at > failed.attempted_at
      )
)
SELECT
    now() AS checked_at,
    count(*) FILTER (WHERE status = 'accepted') AS accepted_last_24_hours,
    count(*) FILTER (
        WHERE status = 'failed' AND status_code IN (404, 410)
    ) AS expired_endpoints_cleaned_last_24_hours,
    (SELECT count(*) FROM unresolved) AS unresolved_failures_last_24_hours,
    max(attempted_at) AS latest_attempt_at,
    (SELECT max(attempted_at) FROM unresolved) AS latest_unresolved_failure_at
FROM recent;

CREATE OR REPLACE VIEW public.push_delivery_unresolved_failures
WITH (security_invoker = true)
AS
SELECT
    failed.id AS delivery_log_id,
    failed.subscription_id,
    failed.attempted_at,
    failed.status_code,
    failed.error_message
FROM public.push_delivery_logs failed
WHERE failed.attempted_at >= now() - interval '24 hours'
  AND failed.status = 'failed'
  AND failed.status_code IS DISTINCT FROM 404
  AND failed.status_code IS DISTINCT FROM 410
  AND NOT EXISTS (
      SELECT 1
      FROM public.push_delivery_logs recovered
      WHERE recovered.subscription_id = failed.subscription_id
        AND recovered.status = 'accepted'
        AND recovered.attempted_at > failed.attempted_at
  )
ORDER BY failed.attempted_at DESC;

REVOKE ALL ON public.push_delivery_health_monitor FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.push_delivery_unresolved_failures FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.push_delivery_health_monitor TO service_role;
GRANT SELECT ON public.push_delivery_unresolved_failures TO service_role;

COMMENT ON VIEW public.push_delivery_health_monitor IS
    'Admin-only 24-hour summary for monitoring push delivery health in Supabase.';
COMMENT ON VIEW public.push_delivery_unresolved_failures IS
    'Admin-only recent push failures excluding expired endpoints and later recoveries.';
