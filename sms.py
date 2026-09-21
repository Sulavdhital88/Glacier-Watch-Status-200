import os
import sys
import requests

# Support optional CLI parameters while preserving configurable defaults
target_number = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2].strip() else os.getenv("SMS_RECIPIENT_NUMBER", "+97798XXXXXXXX")
message_text = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1].strip() else "GlacierWatch Alert: Water level rising detected."

# List of endpoints to try sequentially (configure via SMS_GATEWAY_ENDPOINTS or edit below)
raw_endpoints = os.getenv("SMS_GATEWAY_ENDPOINTS", "http://<SMS_GATEWAY_IP>:8082/message")
endpoints = [ep.strip() for ep in raw_endpoints.split(",") if ep.strip()]

headers = {
    "Content-Type": "application/json",
    "Authorization": os.getenv("SMS_AUTH_TOKEN", "YOUR_SMS_GATEWAY_TOKEN")  # Replace with your Local Service Token
}

data = {
    "to": target_number,       # Recipient Phone Number
    "message": message_text    # Message Content
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
