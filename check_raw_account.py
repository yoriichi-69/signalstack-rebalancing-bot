import requests
import json

try:
    r = requests.get('http://localhost:5000/api/account')
    data = r.json()
    
    print("=== RAW ACCOUNT DATA ===")
    print(json.dumps(data, indent=2))
    
except Exception as e:
    print(f"Error: {e}")
