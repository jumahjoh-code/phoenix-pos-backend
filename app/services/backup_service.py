import os
import subprocess
from datetime import datetime

BACKUP_DIR = "backups"

def ensure_backup_dir():
    if not os.path.exists(BACKUP_DIR):
        os.makedirs(BACKUP_DIR)


def create_backup():
    ensure_backup_dir()

    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"backup_{timestamp}.sql"
    filepath = os.path.join(BACKUP_DIR, filename)

    db_url = os.getenv("DATABASE_URL")

    if not db_url:
        raise Exception("DATABASE_URL not set")

    command = f'pg_dump "{db_url}" > "{filepath}"'

    result = subprocess.run(command, shell=True)

    if result.returncode != 0:
        raise Exception("Backup failed")

    return filepath


def restore_backup(file_path: str):
    db_url = os.getenv("DATABASE_URL")

    if not db_url:
        raise Exception("DATABASE_URL not set")

    if not os.path.exists(file_path):
        raise Exception("Backup file not found")

    command = f'psql "{db_url}" < "{file_path}"'

    result = subprocess.run(command, shell=True)

    if result.returncode != 0:
        raise Exception("Restore failed")

    return True


def list_backups():
    ensure_backup_dir()
    return sorted(os.listdir(BACKUP_DIR), reverse=True)