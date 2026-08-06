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
    "title": "Test Reminder 🇷🇺",
    "body": "This is a test notification for your study streak!"
}).encode('utf-8')

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {SERVICE_KEY}"
}

req = urllib.request.Request(url, data=payload, headers=headers, method="POST")

try:
    with urllib.request.urlopen(req) as resp:
        res_body = resp.read().decode('utf-8')
        print("HTTP Status:", resp.status)
        print("Response Body:", res_body)
except urllib.error.HTTPError as e:
    print("HTTP Error Status:", e.code)
    print("HTTP Error Body:", e.read().decode('utf-8'))
except Exception as e:
    print("Error:", e)
