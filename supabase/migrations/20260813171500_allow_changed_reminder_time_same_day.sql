-- A reminder already sent today should suppress duplicate deliveries for the
-- same configured time, but must not suppress a newly selected reminder time.
DO $$
DECLARE
    function_definition text;
    updated_definition text;
BEGIN
    SELECT pg_get_functiondef('public.check_and_send_reminders()'::regprocedure)
      INTO function_definition;

    updated_definition := function_definition;

    IF position('AND log.reminder_time = reminder_time' IN updated_definition) = 0 THEN
        updated_definition := replace(
            updated_definition,
            'AND to_char(timezone(user_tz, log.sent_at), ''YYYY-MM-DD'') = today_in_tz' || chr(10) ||
            '           ) THEN',
            'AND to_char(timezone(user_tz, log.sent_at), ''YYYY-MM-DD'') = today_in_tz' || chr(10) ||
            '                 AND log.reminder_time = reminder_time' || chr(10) ||
            '           ) THEN'
        );

        IF updated_definition = function_definition THEN
            RAISE EXCEPTION 'Reminder deduplication clause was not found';
        END IF;
    END IF;

    updated_definition := replace(
        updated_definition,
        'AS $function$' || chr(10) || 'DECLARE',
        'AS $function$' || chr(10) || '#variable_conflict use_variable' || chr(10) || 'DECLARE'
    );

    EXECUTE updated_definition;
END;
$$;
