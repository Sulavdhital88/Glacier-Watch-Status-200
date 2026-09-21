import requests

import sys

# Support optional CLI parameters while preserving original defaults
target_number = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2].strip() else "+9779761888995"
message_text = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1].strip() else "Alert"

# List of all your endpoints to try sequentially
endpoints = [
    "http://10.164.84.222:8082/message",
    "http://192.168.1.170:8082/message",
    "http://10.201.44.172:8082/message"
]

headers = {
    "Content-Type": "application/json",
    "Authorization": "6a1fa22d-a984-46cc-8b33-552984bfabdf"  # Your Local Service Token
}

data = {
    "to": target_number,                   # Recipient Phone Number
    "message": message_text     # Message Content
}

success = False

for url in endpoints:
    print(f"Trying to connect to {url}...")
    try:
        response = requests.post(url, json=data, headers=headers, timeout=3)
        if response.status_code == 200:
            print("Successfully connected and sent!")
            print("Status Code:", response.status_code)
            print("Response:", response.text)
            success = True
            break
        else:
            print(f"Server responded with status code: {response.status_code}")
    except requests.exceptions.RequestException:
        print(f"Connection failed/timed out for {url}")

if not success:
    print("\nAll endpoints failed. Make sure your laptop is connected to the correct network where the phone is hosting.")