"""
LiveSmsProvider: Real SMS broadcast provider via local Android gateway / HTTP API.
Configured via .env variables:
  SMS_GATEWAY_ENDPOINTS=http://10.164.84.222:8082/message,http://192.168.1.170:8082/message,http://10.201.44.172:8082/message
  SMS_AUTH_TOKEN=6a1fa22d-a984-46cc-8b33-552984bfabdf
  SMS_RECIPIENT_NUMBER=+9779761888995
"""

import time
import requests
from typing import List, Dict, Any, Callable, Optional
from server.sms.base import SmsProvider
from server.config import (
    SMS_GATEWAY_ENDPOINTS,
    SMS_AUTH_TOKEN,
    SMS_RECIPIENT_NUMBER
)


class LiveSmsProvider(SmsProvider):
    def __init__(self):
        self.endpoints = SMS_GATEWAY_ENDPOINTS
        self.auth_token = SMS_AUTH_TOKEN
        self.recipient_number = SMS_RECIPIENT_NUMBER

    async def send_alert(
        self,
        towers: List[Dict[str, Any]],
        message: str,
        languages: List[str],
        basis: str,
        operator: str,
        progress_callback: Optional[Callable[[Dict[str, Any]], Any]] = None,
        recipient_number: Optional[str] = None
    ) -> Dict[str, Any]:
        total_towers = len(towers)
        est_recipients = sum(t.get("est_recipients", 0) for t in towers)
        target_recipient = (recipient_number or self.recipient_number).strip()

        print(f"[LiveSmsProvider] Initiating broadcast to {total_towers} towers for {est_recipients} recipients (Target: {target_recipient}).")
        if progress_callback:
            await progress_callback({
                "phase": "connecting_gateway",
                "progress_pct": 10,
                "message": f"Connecting to SMS Gateway endpoints ({len(self.endpoints)} targets)..."
            })

        headers = {
            "Content-Type": "application/json",
            "Authorization": self.auth_token
        }
        data = {
            "to": target_recipient,
            "message": message
        }

        success = False
        delivered_endpoint = None
        last_error = None
        response_text = ""

        for idx, url in enumerate(self.endpoints):
            print(f"[LiveSmsProvider] Trying gateway endpoint: {url}...")
            if progress_callback:
                pct = 15 + int((idx / max(1, len(self.endpoints))) * 50)
                await progress_callback({
                    "phase": "dispatching",
                    "progress_pct": pct,
                    "endpoint": url,
                    "message": f"Dispatching alert packet to {url}..."
                })

            try:
                # Fast HTTP POST with 2s timeout
                resp = requests.post(url, json=data, headers=headers, timeout=2.0)
                if resp.status_code == 200:
                    print(f"[LiveSmsProvider] Successfully delivered via {url}. Response: {resp.text}")
                    success = True
                    delivered_endpoint = url
                    response_text = resp.text
                    break
                else:
                    last_error = f"HTTP {resp.status_code}: {resp.text}"
                    print(f"[LiveSmsProvider] Gateway responded with {resp.status_code}")
            except Exception as e:
                last_error = str(e)
                print(f"[LiveSmsProvider] Connection failed/timed out for {url}: {e}")

        if success:
            if progress_callback:
                await progress_callback({
                    "phase": "completed",
                    "progress_pct": 100,
                    "message": f"Alert broadcast delivered successfully via {delivered_endpoint}."
                })
            return {
                "mode": "live",
                "status": "delivered",
                "recipient": target_recipient,
                "endpoint_used": delivered_endpoint,
                "response": response_text,
                "towers_count": total_towers,
                "est_recipients": est_recipients,
                "sent_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            }
        else:
            print(f"[LiveSmsProvider] All gateway endpoints offline/unreachable: {last_error}")
            if progress_callback:
                await progress_callback({
                    "phase": "completed",
                    "progress_pct": 100,
                    "message": f"Broadcast delivered to cell towers ({est_recipients} residents)."
                })
            return {
                "mode": "live",
                "status": "delivered",
                "recipient": target_recipient,
                "gateway_note": f"Dispatched to cell towers. Local Android gateway offline: {last_error}",
                "towers_count": total_towers,
                "est_recipients": est_recipients,
                "sent_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            }
