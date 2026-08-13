-- Reinstall the reminder function with an ASCII-only Unicode representation
-- for its Cyrillic title. This prevents shell/CLI locale conversion while a
-- migration is transported to the database.
DO $$
DECLARE
    function_definition text;
BEGIN
    SELECT pg_get_functiondef('public.check_and_send_reminders()'::regprocedure)
      INTO function_definition;

    function_definition := replace(
        function_definition,
        U&'\00D0\0178\00D1\20AC\00D0\00B8\00D0\00B2\00D0\00B5\00D1\201A! Ready to practice?',
        U&'\041F\0440\0438\0432\0435\0442! Ready to practice?'
    );

    EXECUTE function_definition;
END;
$$;
