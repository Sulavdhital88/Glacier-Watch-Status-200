import inspect
import asyncio
import time
import random
from typing import List, Dict, Any, Callable, Optional
from server.sms.base import SmsProvider


class MockSmsProvider(SmsProvider):
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
        """
        Simulates location-based cell broadcast / SMS to towers.
        Advances tower status through: queued -> sent -> delivered.
        """
        tower_statuses = {
            t["id"]: {
                "id": t["id"],
                "name": t.get("name", t["id"]),
                "est_recipients": t.get("est_recipients", 0),
                "status": "queued",
                "progress_pct": 0
            }
            for t in towers
        }

        async def report(overall_status: str):
            if progress_callback:
                payload = {
                    "overall_status": overall_status,
                    "towers": list(tower_statuses.values()),
                    "total_recipients": sum(t["est_recipients"] for t in towers),
                    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
                }
                if inspect.iscoroutinefunction(progress_callback):
                    await progress_callback(payload)
                else:
                    progress_callback(payload)

        # 1. Initial queued state
        await report("queued")
        await asyncio.sleep(0.4)

        # 2. Sending state (progressively send to towers)
        for t in towers:
            tid = t["id"]
            tower_statuses[tid]["status"] = "sending"
            tower_statuses[tid]["progress_pct"] = 45
            await report("sending")
            await asyncio.sleep(0.3 + random.uniform(0.1, 0.3))
            tower_statuses[tid]["status"] = "sent"
            tower_statuses[tid]["progress_pct"] = 80
            await report("sending")

        await asyncio.sleep(0.5)

        # 3. Delivered state
        for t in towers:
            tid = t["id"]
            tower_statuses[tid]["status"] = "delivered"
            tower_statuses[tid]["progress_pct"] = 100

        await report("delivered")

        return {
            "mode": "mock",
            "status": "delivered",
            "recipient": recipient_number or "+9779761888995",
            "towers_count": len(towers),
            "est_recipients": sum(t.get("est_recipients", 0) for t in towers),
            "sent_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
