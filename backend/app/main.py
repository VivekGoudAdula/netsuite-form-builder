from typing import Optional

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.gzip import GZipMiddleware

from .database import close_mongo_connection, connect_to_mongo
from .routes import (
    auth,
    catalogue,
    companies,
    currency,
    subsidiaries,
    forms,
    hsn,
    locations,
    departments,
    classes,
    accounts,
    items,
    vendors,
    customers,
    tax_nature,
    netsuite,
    netsuite_datasources,
    submissions,
    purchase_orders,
    users,
    workflows,
)

app = FastAPI(title="NetSuite Form Builder API", version="1.0.0")

_scheduler: Optional[AsyncIOScheduler] = None

# CORS Configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://net-suite-form-builder.vercel.app",
]

app.add_middleware(GZipMiddleware, minimum_size=1000)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    global _scheduler
    await connect_to_mongo()
    _scheduler = AsyncIOScheduler()
    _scheduler.start()


@app.on_event("shutdown")
async def shutdown_event():
    global _scheduler
    if _scheduler:
        _scheduler.shutdown(wait=False)
        _scheduler = None
    await close_mongo_connection()


# Include Routers
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(companies.router, prefix="/api")
app.include_router(forms.router, prefix="/api")
app.include_router(submissions.router, prefix="/api")
app.include_router(purchase_orders.router, prefix="/api")
app.include_router(catalogue.router, prefix="/api")
app.include_router(workflows.router, prefix="/api")
app.include_router(currency.router, prefix="/api")
app.include_router(subsidiaries.router, prefix="/api")
app.include_router(hsn.router, prefix="/api")
app.include_router(locations.router, prefix="/api")
app.include_router(departments.router, prefix="/api")
app.include_router(classes.router, prefix="/api")
app.include_router(accounts.router, prefix="/api")
app.include_router(items.router, prefix="/api")
app.include_router(vendors.router, prefix="/api")
app.include_router(customers.router, prefix="/api")
app.include_router(tax_nature.router, prefix="/api")
app.include_router(netsuite.router)
app.include_router(netsuite_datasources.router, prefix="/api")


@app.get("/")
async def root():
    return {"message": "NetSuite Form Builder Backend API is running"}
