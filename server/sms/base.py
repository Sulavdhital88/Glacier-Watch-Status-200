from abc import ABC, abstractmethod
from typing import List, Dict, Any, Callable, Optional


class SmsProvider(ABC):
    @abstractmethod
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
        """Dispatches SMS to selected cell towers."""
        pass
