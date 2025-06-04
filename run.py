# run.py

import os
import sys

sys.path.append(os.path.dirname(__file__))

from app import create_app
from app.database import Base, engine
from app import models

# 🔧 Ініціалізація БД при запуску
Base.metadata.create_all(bind=engine)

app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("run:app", host="127.0.0.1", port=8000)
