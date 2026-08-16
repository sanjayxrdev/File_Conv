from fastapi import APIRouter
from app.registry.conversion_registry import ConversionRegistry
from app.models.formats import FormatsRegistryResponse

router = APIRouter()

@router.get("/formats", response_model=FormatsRegistryResponse)
async def get_supported_formats():
    """
    Returns the supported conversion matrix.
    The frontend uses this endpoint to display valid target formats for any given source file.
    """
    return ConversionRegistry.get_full_registry_response()
