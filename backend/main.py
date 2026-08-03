from fastapi import Depends, FastAPI

from .admin.router import router as admin_router
from .auth.dependencies import require_role
from .auth.router import router as auth_router
from .models import User

app = FastAPI(title="Orkis API")

app.include_router(auth_router)
app.include_router(admin_router)


@app.get("/dean/ping")
def dean_ping(current_user: User = Depends(require_role("associate_dean"))):
    return {"message": f"Hello, {current_user.full_name}. Dean access confirmed."}


@app.get("/health")
def health():
    return {"status": "ok"}
