import os
import urllib.request
import json
import base64

SUPABASE_URL = "https://bghuansvungabgsbxqjh.supabase.co"
SERVICE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
USER_ID = os.environ["SUPABASE_TEST_USER_ID"]

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
