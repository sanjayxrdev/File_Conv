from typing import Dict, Any, Optional, List
from app.models.formats import SourceFormatInfo, TargetFormatInfo, FormatOption, FormatsRegistryResponse

CONVERSION_REGISTRY: Dict[str, Dict[str, Any]] = {
    # ------------------ PRESENTATION FORMATS ------------------
    "pptx": {
        "label": "PowerPoint Presentation (PPTX)",
        "category": "document",
        "mime_types": ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
        "targets": {
            "pdf": {"label": "PDF Document", "engine": "pptx", "category": "document", "is_lossy": False, "options": []},
            "png": {"label": "PNG Images (Slide 1)", "engine": "pptx", "category": "image", "is_lossy": False, "options": []},
            "jpg": {"label": "JPEG Images (Slide 1)", "engine": "pptx", "category": "image", "is_lossy": True, "options": []},
            "md": {"label": "Markdown Presentation (.md)", "engine": "pptx", "category": "text", "is_lossy": True, "options": []}
        }
    },
    "ppt": {
        "label": "PowerPoint Presentation (PPT)",
        "category": "document",
        "mime_types": ["application/vnd.ms-powerpoint"],
        "targets": {
            "pdf": {"label": "PDF Document", "engine": "pptx", "category": "document", "is_lossy": False, "options": []},
            "png": {"label": "PNG Images (Slide 1)", "engine": "pptx", "category": "image", "is_lossy": False, "options": []},
            "jpg": {"label": "JPEG Images (Slide 1)", "engine": "pptx", "category": "image", "is_lossy": True, "options": []},
            "md": {"label": "Markdown Presentation (.md)", "engine": "pptx", "category": "text", "is_lossy": True, "options": []}
        }
    },

    # ------------------ SPREADSHEET FORMATS ------------------
    "xlsx": {
        "label": "Excel Workbook (XLSX)",
        "category": "document",
        "mime_types": ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
        "targets": {
            "csv": {"label": "CSV Table", "engine": "spreadsheet", "category": "text", "is_lossy": False, "options": []},
            "json": {"label": "JSON Data", "engine": "spreadsheet", "category": "text", "is_lossy": False, "options": []},
            "pdf": {"label": "PDF Document", "engine": "spreadsheet", "category": "document", "is_lossy": False, "options": []},
            "txt": {"label": "Plain Text", "engine": "spreadsheet", "category": "text", "is_lossy": True, "options": []}
        }
    },
    "xls": {
        "label": "Excel Workbook Legacy (XLS)",
        "category": "document",
        "mime_types": ["application/vnd.ms-excel"],
        "targets": {
            "csv": {"label": "CSV Table", "engine": "spreadsheet", "category": "text", "is_lossy": False, "options": []},
            "json": {"label": "JSON Data", "engine": "spreadsheet", "category": "text", "is_lossy": False, "options": []},
            "pdf": {"label": "PDF Document", "engine": "spreadsheet", "category": "document", "is_lossy": False, "options": []},
            "txt": {"label": "Plain Text", "engine": "spreadsheet", "category": "text", "is_lossy": True, "options": []}
        }
    },

    # ------------------ WEB / HTML FORMATS ------------------
    "html": {
        "label": "HTML Document",
        "category": "text",
        "mime_types": ["text/html", "application/xhtml+xml"],
        "targets": {
            "pdf": {"label": "PDF Document", "engine": "html", "category": "document", "is_lossy": False, "options": []},
            "md": {"label": "Markdown File (.md)", "engine": "html", "category": "text", "is_lossy": False, "options": []},
            "txt": {"label": "Plain Text File", "engine": "html", "category": "text", "is_lossy": True, "options": []},
            "docx": {"label": "Word Document (DOCX)", "engine": "html", "category": "document", "is_lossy": False, "options": []}
        }
    },
    "htm": {
        "label": "HTML Document",
        "category": "text",
        "mime_types": ["text/html"],
        "targets": {
            "pdf": {"label": "PDF Document", "engine": "html", "category": "document", "is_lossy": False, "options": []},
            "md": {"label": "Markdown File (.md)", "engine": "html", "category": "text", "is_lossy": False, "options": []},
            "txt": {"label": "Plain Text File", "engine": "html", "category": "text", "is_lossy": True, "options": []},
            "docx": {"label": "Word Document (DOCX)", "engine": "html", "category": "document", "is_lossy": False, "options": []}
        }
    },

    # ------------------ VIDEO FORMATS ------------------
    "mp4": {
        "label": "MP4 Video",
        "category": "video",
        "mime_types": ["video/mp4", "video/x-m4v"],
        "targets": {
            "avi": {
                "label": "AVI Video",
                "engine": "ffmpeg",
                "category": "video",
                "is_lossy": True,
                "options": [
                    FormatOption(name="preset", label="Preset", type="select", default="medium", options=["fast", "medium", "slow"]),
                ]
            },
            "mkv": {
                "label": "Matroska Video (MKV)",
                "engine": "ffmpeg",
                "category": "video",
                "is_lossy": False,
                "options": []
            },
            "mov": {
                "label": "QuickTime Video (MOV)",
                "engine": "ffmpeg",
                "category": "video",
                "is_lossy": True,
                "options": []
            },
            "webm": {
                "label": "WebM Video",
                "engine": "ffmpeg",
                "category": "video",
                "is_lossy": True,
                "options": []
            },
            "mp3": {
                "label": "MP3 Audio (Extract)",
                "engine": "ffmpeg",
                "category": "audio",
                "is_lossy": True,
                "options": [
                    FormatOption(name="bitrate", label="Bitrate (kbps)", type="select", default="192", options=["128", "192", "256", "320"])
                ]
            },
            "wav": {
                "label": "WAV Audio (Extract)",
                "engine": "ffmpeg",
                "category": "audio",
                "is_lossy": False,
                "options": [
                    FormatOption(name="sample_rate", label="Sample Rate (Hz)", type="select", default="44100", options=["22050", "44100", "48000"])
                ]
            },
            "flac": {
                "label": "FLAC Audio (Extract)",
                "engine": "ffmpeg",
                "category": "audio",
                "is_lossy": False,
                "options": []
            },
            "aac": {
                "label": "AAC Audio (Extract)",
                "engine": "ffmpeg",
                "category": "audio",
                "is_lossy": True,
                "options": []
            },
            "gif": {
                "label": "Animated GIF",
                "engine": "ffmpeg",
                "category": "image",
                "is_lossy": True,
                "options": [
                    FormatOption(name="fps", label="Frames per second", type="number", default=10, min=1, max=30)
                ]
            }
        }
    },
    "webm": {
        "label": "WebM Video",
        "category": "video",
        "mime_types": ["video/webm"],
        "targets": {
            "mp4": {"label": "MP4 Video", "engine": "ffmpeg", "category": "video", "is_lossy": True, "options": []},
            "mp3": {"label": "MP3 Audio", "engine": "ffmpeg", "category": "audio", "is_lossy": True, "options": []},
            "wav": {"label": "WAV Audio", "engine": "ffmpeg", "category": "audio", "is_lossy": False, "options": []},
            "gif": {"label": "Animated GIF", "engine": "ffmpeg", "category": "image", "is_lossy": True, "options": []}
        }
    },
    "avi": {
        "label": "AVI Video",
        "category": "video",
        "mime_types": ["video/x-msvideo"],
        "targets": {
            "mp4": {"label": "MP4 Video", "engine": "ffmpeg", "category": "video", "is_lossy": True, "options": []},
            "mkv": {"label": "MKV Video", "engine": "ffmpeg", "category": "video", "is_lossy": False, "options": []},
            "mp3": {"label": "MP3 Audio", "engine": "ffmpeg", "category": "audio", "is_lossy": True, "options": []}
        }
    },
    "mkv": {
        "label": "MKV Video",
        "category": "video",
        "mime_types": ["video/x-matroska"],
        "targets": {
            "mp4": {"label": "MP4 Video", "engine": "ffmpeg", "category": "video", "is_lossy": True, "options": []},
            "webm": {"label": "WebM Video", "engine": "ffmpeg", "category": "video", "is_lossy": True, "options": []},
            "mp3": {"label": "MP3 Audio", "engine": "ffmpeg", "category": "audio", "is_lossy": True, "options": []}
        }
    },

    # ------------------ AUDIO FORMATS ------------------
    "mp3": {
        "label": "MP3 Audio",
        "category": "audio",
        "mime_types": ["audio/mpeg", "audio/mp3"],
        "targets": {
            "wav": {
                "label": "WAV Audio",
                "engine": "ffmpeg",
                "category": "audio",
                "is_lossy": False,
                "options": [
                    FormatOption(name="sample_rate", label="Sample Rate (Hz)", type="select", default="44100", options=["22050", "44100", "48000"])
                ]
            },
            "flac": {"label": "FLAC Audio", "engine": "ffmpeg", "category": "audio", "is_lossy": False, "options": []},
            "ogg": {"label": "OGG Vorbis Audio", "engine": "ffmpeg", "category": "audio", "is_lossy": True, "options": []},
            "opus": {"label": "Opus Audio", "engine": "ffmpeg", "category": "audio", "is_lossy": True, "options": []},
            "aac": {"label": "AAC Audio", "engine": "ffmpeg", "category": "audio", "is_lossy": True, "options": []}
        }
    },
    "wav": {
        "label": "WAV Audio",
        "category": "audio",
        "mime_types": ["audio/wav", "audio/x-wav"],
        "targets": {
            "mp3": {
                "label": "MP3 Audio",
                "engine": "ffmpeg",
                "category": "audio",
                "is_lossy": True,
                "options": [
                    FormatOption(name="bitrate", label="Bitrate (kbps)", type="select", default="192", options=["128", "192", "256", "320"])
                ]
            },
            "flac": {"label": "FLAC Audio", "engine": "ffmpeg", "category": "audio", "is_lossy": False, "options": []},
            "ogg": {"label": "OGG Audio", "engine": "ffmpeg", "category": "audio", "is_lossy": True, "options": []},
            "opus": {"label": "Opus Audio", "engine": "ffmpeg", "category": "audio", "is_lossy": True, "options": []}
        }
    },
    "flac": {
        "label": "FLAC Audio",
        "category": "audio",
        "mime_types": ["audio/flac"],
        "targets": {
            "mp3": {"label": "MP3 Audio", "engine": "ffmpeg", "category": "audio", "is_lossy": True, "options": []},
            "wav": {"label": "WAV Audio", "engine": "ffmpeg", "category": "audio", "is_lossy": False, "options": []}
        }
    },

    # ------------------ IMAGE FORMATS ------------------
    "png": {
        "label": "PNG Image",
        "category": "image",
        "mime_types": ["image/png"],
        "targets": {
            "jpg": {
                "label": "JPEG Image",
                "engine": "image",
                "category": "image",
                "is_lossy": True,
                "options": [
                    FormatOption(name="quality", label="Quality (%)", type="number", default=90, min=10, max=100)
                ]
            },
            "webp": {
                "label": "WebP Image",
                "engine": "image",
                "category": "image",
                "is_lossy": True,
                "options": [
                    FormatOption(name="quality", label="Quality (%)", type="number", default=85, min=10, max=100)
                ]
            },
            "bmp": {"label": "BMP Image", "engine": "image", "category": "image", "is_lossy": False, "options": []},
            "gif": {"label": "GIF Image", "engine": "image", "category": "image", "is_lossy": True, "options": []},
            "pdf": {"label": "PDF Document", "engine": "image", "category": "document", "is_lossy": False, "options": []}
        }
    },
    "jpg": {
        "label": "JPEG Image",
        "category": "image",
        "mime_types": ["image/jpeg", "image/jpg"],
        "targets": {
            "png": {"label": "PNG Image", "engine": "image", "category": "image", "is_lossy": False, "options": []},
            "webp": {"label": "WebP Image", "engine": "image", "category": "image", "is_lossy": True, "options": []},
            "bmp": {"label": "BMP Image", "engine": "image", "category": "image", "is_lossy": False, "options": []},
            "pdf": {"label": "PDF Document", "engine": "image", "category": "document", "is_lossy": False, "options": []}
        }
    },
    "jpeg": {
        "label": "JPEG Image",
        "category": "image",
        "mime_types": ["image/jpeg"],
        "targets": {
            "png": {"label": "PNG Image", "engine": "image", "category": "image", "is_lossy": False, "options": []},
            "webp": {"label": "WebP Image", "engine": "image", "category": "image", "is_lossy": True, "options": []},
            "pdf": {"label": "PDF Document", "engine": "image", "category": "document", "is_lossy": False, "options": []}
        }
    },
    "webp": {
        "label": "WebP Image",
        "category": "image",
        "mime_types": ["image/webp"],
        "targets": {
            "png": {"label": "PNG Image", "engine": "image", "category": "image", "is_lossy": False, "options": []},
            "jpg": {"label": "JPEG Image", "engine": "image", "category": "image", "is_lossy": True, "options": []}
        }
    },

    # ------------------ DOCUMENT FORMATS ------------------
    "pdf": {
        "label": "PDF Document",
        "category": "document",
        "mime_types": ["application/pdf"],
        "targets": {
            "docx": {"label": "Word Document (DOCX)", "engine": "pdf", "category": "document", "is_lossy": False, "options": []},
            "png": {
                "label": "PNG Images (Page 1)",
                "engine": "pdf",
                "category": "image",
                "is_lossy": False,
                "options": [
                    FormatOption(name="dpi", label="DPI Resolution", type="select", default="150", options=["72", "150", "300"])
                ]
            },
            "jpg": {"label": "JPEG Images (Page 1)", "engine": "pdf", "category": "image", "is_lossy": True, "options": []},
            "md": {"label": "Markdown File (MD)", "engine": "pdf", "category": "text", "is_lossy": True, "options": []},
            "txt": {"label": "Text File (TXT)", "engine": "pdf", "category": "text", "is_lossy": True, "options": []}
        }
    },
    "docx": {
        "label": "Word Document (DOCX)",
        "category": "document",
        "mime_types": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
        "targets": {
            "txt": {"label": "Text File (TXT)", "engine": "document", "category": "text", "is_lossy": True, "options": []},
            "md": {"label": "Markdown File (MD)", "engine": "document", "category": "text", "is_lossy": True, "options": []},
            "pdf": {"label": "PDF Document", "engine": "document", "category": "document", "is_lossy": False, "options": []}
        }
    },
    "doc": {
        "label": "Word Document Legacy (DOC)",
        "category": "document",
        "mime_types": ["application/msword"],
        "targets": {
            "docx": {"label": "Word Document (DOCX)", "engine": "document", "category": "document", "is_lossy": False, "options": []},
            "txt": {"label": "Text File (TXT)", "engine": "document", "category": "text", "is_lossy": True, "options": []},
            "md": {"label": "Markdown File (MD)", "engine": "document", "category": "text", "is_lossy": True, "options": []},
            "pdf": {"label": "PDF Document", "engine": "document", "category": "document", "is_lossy": False, "options": []}
        }
    },

    # ------------------ TEXT / CODE FORMATS ------------------
    "txt": {
        "label": "Plain Text (TXT)",
        "category": "text",
        "mime_types": ["text/plain"],
        "targets": {
            "md": {"label": "Markdown File (MD)", "engine": "document", "category": "text", "is_lossy": False, "options": []},
            "pdf": {"label": "PDF Document", "engine": "document", "category": "document", "is_lossy": False, "options": []},
            
            # Code Target Conversions
            "py": {"label": "Python Script (.py)", "engine": "code", "category": "code", "is_lossy": False, "options": []},
            "c": {"label": "C Source (.c)", "engine": "code", "category": "code", "is_lossy": False, "options": []},
            "ipynb": {"label": "Jupyter Notebook (.ipynb)", "engine": "code", "category": "code", "is_lossy": False, "options": []},
            "js": {"label": "JavaScript (.js)", "engine": "code", "category": "code", "is_lossy": False, "options": []},
            "css": {"label": "CSS Stylesheet (.css)", "engine": "code", "category": "code", "is_lossy": False, "options": []},
            "html": {"label": "HTML Document (.html)", "engine": "code", "category": "code", "is_lossy": False, "options": []},
            "java": {"label": "Java Source (.java)", "engine": "code", "category": "code", "is_lossy": False, "options": []},
            "rs": {"label": "Rust Source (.rs)", "engine": "code", "category": "code", "is_lossy": False, "options": []},
            "cs": {"label": "C# Source (.cs)", "engine": "code", "category": "code", "is_lossy": False, "options": []}
        }
    },
    "md": {
        "label": "Markdown File (MD)",
        "category": "text",
        "mime_types": ["text/markdown", "text/plain"],
        "targets": {
            "txt": {"label": "Plain Text (TXT)", "engine": "document", "category": "text", "is_lossy": False, "options": []},
            "pdf": {"label": "PDF Document", "engine": "document", "category": "document", "is_lossy": False, "options": []},
            "html": {"label": "HTML Document", "engine": "document", "category": "text", "is_lossy": False, "options": []}
        }
    },
    "csv": {
        "label": "CSV Table",
        "category": "text",
        "mime_types": ["text/csv", "application/csv"],
        "targets": {
            "xlsx": {"label": "Excel Workbook (XLSX)", "engine": "document", "category": "document", "is_lossy": False, "options": []},
            "json": {"label": "JSON Data", "engine": "document", "category": "text", "is_lossy": False, "options": []},
            "pdf": {"label": "PDF Document", "engine": "document", "category": "document", "is_lossy": False, "options": []}
        }
    },
    "json": {
        "label": "JSON Data",
        "category": "text",
        "mime_types": ["application/json", "text/json"],
        "targets": {
            "csv": {"label": "CSV Table", "engine": "document", "category": "text", "is_lossy": False, "options": []}
        }
    }
}

class ConversionRegistry:
    @staticmethod
    def get_supported_source_formats() -> List[str]:
        return list(CONVERSION_REGISTRY.keys())

    @staticmethod
    def get_source_info(source_ext: str) -> Optional[SourceFormatInfo]:
        source_ext = source_ext.lower().lstrip(".")
        if source_ext not in CONVERSION_REGISTRY:
            return None
        data = CONVERSION_REGISTRY[source_ext]
        targets = []
        for target_ext, target_data in data["targets"].items():
            targets.append(
                TargetFormatInfo(
                    target_ext=target_ext,
                    label=target_data["label"],
                    engine=target_data["engine"],
                    category=target_data["category"],
                    is_lossy=target_data.get("is_lossy", False),
                    options=target_data.get("options", [])
                )
            )
        return SourceFormatInfo(
            ext=source_ext,
            label=data["label"],
            category=data["category"],
            mime_types=data["mime_types"],
            targets=targets
        )

    @staticmethod
    def is_conversion_supported(source_ext: str, target_ext: str) -> bool:
        source_ext = source_ext.lower().lstrip(".")
        target_ext = target_ext.lower().lstrip(".")
        if source_ext not in CONVERSION_REGISTRY:
            return False
        return target_ext in CONVERSION_REGISTRY[source_ext]["targets"]

    @staticmethod
    def get_target_info(source_ext: str, target_ext: str) -> Optional[Dict[str, Any]]:
        source_ext = source_ext.lower().lstrip(".")
        target_ext = target_ext.lower().lstrip(".")
        if not ConversionRegistry.is_conversion_supported(source_ext, target_ext):
            return None
        return CONVERSION_REGISTRY[source_ext]["targets"][target_ext]

    @staticmethod
    def get_full_registry_response() -> FormatsRegistryResponse:
        formats_dict = {}
        for ext in CONVERSION_REGISTRY.keys():
            info = ConversionRegistry.get_source_info(ext)
            if info:
                formats_dict[ext] = info
        return FormatsRegistryResponse(
            categories=["video", "audio", "image", "document", "text", "code"],
            formats=formats_dict
        )
