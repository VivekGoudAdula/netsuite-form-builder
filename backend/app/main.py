from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import connect_to_mongo, close_mongo_connection
from .routes import auth, users, companies, forms, submissions, mock, catalogue

app = FastAPI(title="NetSuite Form Builder API", version="1.0.0")

# CORS Configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "https://net-suite-form-builder.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Lifecycle events
@app.on_event("startup")
async def startup_event():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo_connection()

# Include Routers
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(companies.router, prefix="/api")
app.include_router(forms.router, prefix="/api")
app.include_router(submissions.router, prefix="/api")
app.include_router(catalogue.router, prefix="/api")
app.include_router(mock.router)

@app.get("/")
async def root():
    return {"message": "NetSuite Form Builder Backend API is running"}
