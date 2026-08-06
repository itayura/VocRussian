import os
import urllib.request
import json
import base64

SUPABASE_URL = "https://bghuansvungabgsbxqjh.supabase.co"
SERVICE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

headers = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json"
}

url = f"{SUPABASE_URL}/rest/v1/user_push_subscriptions?select=*&order=created_at.desc&limit=10"
req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode('utf-8'))
    print(f"Latest 10 Push Subscriptions in DB:")
    for sub in data:
        print(f"ID: {sub['id']} | UserID: {sub['user_id']} | Created: {sub['created_at']} | Endpoint: {sub['endpoint'][:60]}...")
