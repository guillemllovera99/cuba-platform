"""Image upload endpoint for product photos."""
import os
import uuid
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from auth import require_admin

router = APIRouter(prefix="/api/v1", tags=["upload"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_SIZE = 10 * 1024 * 1024  # 10MB


@router.post("/admin/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    admin: dict = Depends(require_admin),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, f"File type {file.content_type} not allowed. Use JPEG, PNG, WebP, or GIF.")

    data = await file.read()
    if len(data) > MAX_SIZE:
        raise HTTPException(400, "File too large. Maximum 10MB.")

    ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename and "." in file.filename else "jpg"
    if ext not in ("jpg", "jpeg", "png", "webp", "gif"):
        ext = "jpg"

    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(data)

    return {"url": f"/uploads/{filename}"}
