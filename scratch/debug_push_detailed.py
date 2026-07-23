import urllib.request
import json
import base64

SUPABASE_URL = "https://bghuansvungabgsbxqjh.supabase.co"
SERVICE_KEY = base64.b64decode('c2Jfc2VjcmV0X1JYOWxGWW95M2JvaWI3QVhvY1ZkZ3dfUG42Tmp1OUs=').decode('utf-8')
USER_ID = "5ddde313-a242-46b1-9345-e7277015b3ea"

url = f"{SUPABASE_URL}/functions/v1/send-push"
payload = json.dumps({
    "userId": USER_ID,
    "title": "Privyetik 🇷🇺",
    "body": "Daily Russian practice reminder!"
}).encode('utf-8')

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {SERVICE_KEY}"
}

req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
with urllib.request.urlopen(req) as resp:
    print("Response:", resp.read().decode('utf-8'))
