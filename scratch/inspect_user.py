import os
import urllib.request
import json
import base64

SUPABASE_URL = "https://bghuansvungabgsbxqjh.supabase.co"
SERVICE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
USER_ID = os.environ["SUPABASE_TEST_USER_ID"]

headers = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json"
}

def query_table(endpoint):
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            return data
    except Exception as e:
        return f"Error: {e}"

print("--- 1. Querying voc_stats for user ---")
stats = query_table(f"voc_stats?user_id=eq.{USER_ID}")
print(json.dumps(stats, indent=2))

print("\n--- 2. Querying user_push_subscriptions for user ---")
subs = query_table(f"user_push_subscriptions?user_id=eq.{USER_ID}")
print(json.dumps(subs, indent=2))

print("\n--- 3. Querying ALL push subscriptions ---")
all_subs = query_table("user_push_subscriptions?select=id,user_id,endpoint,created_at")
print(json.dumps(all_subs, indent=2))

print("\n--- 4. Querying app_config ---")
config = query_table("app_config?select=*")
print(json.dumps(config, indent=2))
