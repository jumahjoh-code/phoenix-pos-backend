from fastapi import APIRouter, HTTPException, Depends
from app.services.backup_service import create_backup, restore_backup, list_backups
from app.dependencies import require_admin
import os

router = APIRouter(prefix="/backup", tags=["Backup"])


# =========================
# 📦 CREATE BACKUP
# =========================
@router.post("/create")
def backup_create(admin=Depends(require_admin)):
    try:
        path = create_backup()
        return {
            "message": "Backup created",
            "file": path
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =========================
# 📄 LIST BACKUPS
# =========================
@router.get("/")
def backup_list(admin=Depends(require_admin)):
    try:
        backups = list_backups()
        return {"backups": backups}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =========================
# 🔁 RESTORE BACKUP
# =========================
@router.post("/restore")
def backup_restore(file: str, admin=Depends(require_admin)):
    try:
        # 🔒 SECURITY: only allow files inside backups directory
        if not file.startswith("backups/"):
            raise HTTPException(status_code=400, detail="Invalid file path")

        if not os.path.exists(file):
            raise HTTPException(status_code=404, detail="Backup file not found")

        restore_backup(file)

        return {
            "message": "Restore successful",
            "file": file
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))