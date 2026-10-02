from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.cloud import router as cloud_router
from app.routers.scan import router as scan_router
from app.routers.dashboard import router as dashboard_router
from app.routers.reports import router as reports_router
from app.routers.analytics import router as analytics_router

__all__ = [
    "auth_router",
    "users_router",
    "cloud_router",
    "scan_router",
    "dashboard_router",
    "reports_router",
    "analytics_router",
]
