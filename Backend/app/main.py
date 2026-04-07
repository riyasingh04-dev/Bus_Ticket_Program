from fastapi import FastAPI
from app.db.database import Base, engine
from fastapi.middleware.cors import CORSMiddleware

# Models imports required for create_all to detect tables
from app.modules.auth import model as auth_model
from app.modules.bus import model as bus_model
from app.modules.route import model as route_model
from app.modules.booking import model as booking_model
from app.modules.master import model as master_model
from app.modules.ledger import model as ledger_model

# Routers
from app.modules.auth.route import router as auth_router
from app.modules.user.route import router as user_router
from app.modules.bus.route import router as bus_router
from app.modules.route.route import router as route_router
from app.modules.booking.route import router as booking_router
from app.modules.master.route import router as master_router
from app.modules.ledger.route import router as ledger_router
from app.modules.user.analytics import router as analytics_router

app = FastAPI(title="Bus Ticket Booking API")

# Create tables automatically
# Refresh tables (stoppage update)
Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Specific origin required for credentials
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(user_router, prefix="/users", tags=["Users"])
app.include_router(bus_router, prefix="/buses", tags=["Buses"])
app.include_router(route_router, prefix="/routes", tags=["Routes"])
app.include_router(booking_router, prefix="/bookings", tags=["Bookings"])
app.include_router(master_router, prefix="/masters", tags=["Master Data"])
app.include_router(ledger_router, prefix="/ledger", tags=["Ledger & Earnings"])
app.include_router(analytics_router, prefix="/analytics", tags=["Dashboard Analytics"])