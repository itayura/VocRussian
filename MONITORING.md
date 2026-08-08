# Monitoring

Push-delivery health is available in the Supabase **Table Editor**. Open the `push_delivery_health_monitor` view for a one-row summary covering the previous 24 hours.

The summary shows:

- accepted deliveries;
- expired endpoints cleaned automatically;
- unresolved failures;
- the latest delivery attempt; and
- the latest unresolved failure.

If `unresolved_failures_last_24_hours` is greater than zero, open `push_delivery_unresolved_failures` for the error code, error message, and attempt time. The full underlying history remains in `push_delivery_logs`.

HTTP 404 and 410 responses mean a phone's push subscription expired. The send function removes those subscriptions automatically, so the monitor counts them separately instead of treating them as incidents. A failed attempt followed by a successful attempt for the same subscription is also considered recovered.

Both monitoring views are admin-only. Anonymous and authenticated app clients cannot query them, and the views do not expose user IDs or push endpoints.
