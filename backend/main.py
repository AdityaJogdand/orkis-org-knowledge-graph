from fastapi import FastAPI

from .auth.router import router as auth_router
from .dashboard.router import router as dashboard_router

app = FastAPI(title="Orkis API")

app.include_router(auth_router)
app.include_router(dashboard_router)


@app.get("/health")
def health():
    return {"status": "ok"}
