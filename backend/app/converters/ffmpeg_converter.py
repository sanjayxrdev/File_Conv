import asyncio
import os
import re
import shutil
import logging
from typing import Dict, Any, Callable, Optional, Tuple
from app.converters.base import BaseConverter
from app.core.config import settings

logger = logging.getLogger("ffmpeg_converter")

def find_ffmpeg_executable() -> str:
    # 1. Try standard system PATH
    ffmpeg = shutil.which("ffmpeg")
    if ffmpeg:
        return ffmpeg
    # 2. Check winget packages location
    winget_pkg_dir = os.path.expanduser(r"~\AppData\Local\Microsoft\WinGet\Packages")
    if os.path.exists(winget_pkg_dir):
        for root, dirs, files in os.walk(winget_pkg_dir):
            if "ffmpeg.exe" in files:
                return os.path.join(root, "ffmpeg.exe")
    return "ffmpeg"

class FFmpegConverter(BaseConverter):
    def __init__(self):
        self.ffmpeg_path = find_ffmpeg_executable()

    async def _get_duration(self, input_path: str) -> float:
        """Parse video/audio total duration in seconds using ffmpeg/ffprobe"""
        try:
            cmd = [self.ffmpeg_path, "-i", input_path]
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            _, stderr = await proc.communicate()
            stderr_text = stderr.decode('utf-8', errors='replace')
            match = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.\d+)", stderr_text)
            if match:
                hours, minutes, seconds = map(float, match.groups())
                return hours * 3600 + minutes * 60 + seconds
        except Exception as e:
            logger.warning(f"Failed to determine duration: {e}")
        return 0.0

    async def convert(
        self,
        input_path: str,
        output_path: str,
        source_ext: str,
        target_ext: str,
        options: Optional[Dict[str, Any]] = None,
        progress_callback: Optional[Callable[[int, str], None]] = None
    ) -> Tuple[bool, Optional[str]]:
        options = options or {}
        source_ext = source_ext.lower().lstrip(".")
        target_ext = target_ext.lower().lstrip(".")

        duration = await self._get_duration(input_path)

        # Build secure argument array
        cmd = [self.ffmpeg_path, "-y", "-i", input_path]

        # Video -> Audio Extraction
        if target_ext in ["mp3", "wav", "flac", "ogg", "opus", "aac", "m4a"]:
            cmd.extend(["-vn"])  # Disable video stream
            if target_ext == "mp3":
                bitrate = str(options.get("bitrate", "192"))
                # Sanitize bitrate option
                if bitrate in ["128", "192", "256", "320"]:
                    cmd.extend(["-b:a", f"{bitrate}k"])
            elif target_ext == "wav":
                sample_rate = str(options.get("sample_rate", "44100"))
                if sample_rate in ["22050", "44100", "48000"]:
                    cmd.extend(["-ar", sample_rate])
        
        # Video -> Animated GIF
        elif target_ext == "gif":
            fps = str(options.get("fps", 10))
            cmd.extend(["-vf", f"fps={fps},scale=480:-1:flags=lanczos"])

        # Video -> Video / Audio -> Audio
        else:
            if target_ext == "webm":
                cmd.extend(["-c:v", "libvpx-vp9", "-c:a", "libopus"])
            elif target_ext == "mp4":
                cmd.extend(["-c:v", "libx264", "-c:a", "aac", "-strict", "-2"])

        cmd.append(output_path)

        logger.info(f"Executing FFmpeg secure command: {cmd}")

        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            if progress_callback:
                progress_callback(5, "Processing stream encoding...")

            time_pattern = re.compile(r"time=(\d+):(\d+):(\d+\.\d+)")

            async def read_stderr():
                while True:
                    line = await process.stderr.readline()
                    if not line:
                        break
                    line_str = line.decode('utf-8', errors='replace')
                    match = time_pattern.search(line_str)
                    if match and duration > 0 and progress_callback:
                        h, m, s = map(float, match.groups())
                        elapsed = h * 3600 + m * 60 + s
                        pct = int(min(99, max(5, (elapsed / duration) * 100)))
                        progress_callback(pct, f"Encoding: {pct}%")

            await asyncio.wait_for(read_stderr(), timeout=settings.CONVERSION_TIMEOUT_SECONDS)
            await process.wait()

            if process.returncode == 0 and os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                if progress_callback:
                    progress_callback(100, "FFmpeg conversion complete")
                return True, None
            else:
                stderr_all = (await process.stderr.read()).decode('utf-8', errors='replace')
                return False, f"FFmpeg failed with code {process.returncode}: {stderr_all[-300:]}"

        except asyncio.TimeoutError:
            try:
                process.kill()
            except Exception:
                pass
            return False, f"Conversion timed out after {settings.CONVERSION_TIMEOUT_SECONDS} seconds."
        except Exception as e:
            return False, f"FFmpeg execution error: {str(e)}"
