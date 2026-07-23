import urllib.request
import json
import base64

SUPABASE_URL = "https://bghuansvungabgsbxqjh.supabase.co"
SERVICE_KEY = base64.b64decode('c2Jfc2VjcmV0X1JYOWxGWW95M2JvaWI3QVhvY1ZkZ3dfUG42Tmp1OUs=').decode('utf-8')
USER_ID = "5ddde313-a242-46b1-9345-e7277015b3ea"

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
