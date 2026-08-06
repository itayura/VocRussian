-- The reminder scheduler now uses the named reminders secret API key.
-- Remove the compromised legacy service_role JWT copy from Vault.
DELETE FROM vault.secrets
WHERE name = 'service_role_key';
