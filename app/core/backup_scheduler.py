import threading
import time
from datetime import datetime
from app.services.backup_service import create_backup

# =========================
# ⚙️ CONFIG
# =========================
BACKUP_INTERVAL = 3600  # seconds (1 hour)


# =========================
# 🔄 BACKUP SCHEDULER
# =========================
def start_backup_scheduler():
    def run():
        print("🟢 Backup scheduler started")

        while True:
            try:
                print(f"🔄 Running auto-backup at {datetime.utcnow()}")

                filepath = create_backup()

                print(f"✅ Backup successful: {filepath}")

            except Exception as e:
                print(f"❌ Backup failed: {str(e)}")

            # wait before next cycle
            time.sleep(BACKUP_INTERVAL)

    thread = threading.Thread(target=run, daemon=True)
    thread.start()