from abc import ABC, abstractmethod
from typing import Dict, Any, Callable, Optional, Tuple

class BaseConverter(ABC):
    """
    Abstract base class for all file conversion engines.
    """

    @abstractmethod
    async def convert(
        self,
        input_path: str,
        output_path: str,
        source_ext: str,
        target_ext: str,
        options: Optional[Dict[str, Any]] = None,
        progress_callback: Optional[Callable[[int, str], None]] = None
    ) -> Tuple[bool, Optional[str]]:
        """
        Execute conversion from input_path to output_path.
        Returns: (success: bool, error_message: Optional[str])
        """
        pass
