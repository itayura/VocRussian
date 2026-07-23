import urllib.request
import json

url = "https://itayura.github.io/VocRussian/.well-known/assetlinks.json"
try:
    with urllib.request.urlopen(url) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        print("Asset Links Response:")
        print(json.dumps(data, indent=2))
except Exception as e:
    print("Error fetching assetlinks:", e)
