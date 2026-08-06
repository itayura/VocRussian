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

url = f"{SUPABASE_URL}/rest/v1/user_push_subscriptions?user_id=eq.{USER_ID}&order=created_at.desc"
req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode('utf-8'))
    print(f"Total Subscriptions for User {USER_ID}: {len(data)}")
    for sub in data:
        print(f"ID: {sub['id']} | Created: {sub['created_at']} | Endpoint: {sub['endpoint'][:80]}...")
