from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/drone", tags=["drone"])

class Command(BaseModel):
    command: str

@router.post("/command")
def execute_command(cmd: Command):
    # Тут можна вставити реальний виклик до дрона
    # Наприклад: if cmd.command == "ARM": subprocess...

    valid_commands = ["ARM", "DISARM", "TAKEOFF", "LAND"]
    if cmd.command not in valid_commands:
        raise HTTPException(status_code=400, detail="Недопустима команда")

    print(f"Отримана команда: {cmd.command}")  # Поки що просто виводимо

    return {"message": f"Команда '{cmd.command}' отримана"}
