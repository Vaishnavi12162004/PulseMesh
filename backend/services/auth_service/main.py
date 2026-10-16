from fastapi import FastAPI
app = FastAPI(title="PulseMesh Auth Service")

@app.get("/")
def root():
    return {"service": "auth-service", "status": "running"}

@app.get("/health")
def health():
    return {"service": "auth-service", "status": "healthy"}

@app.get("/demo-auth")
def demo_auth():
    # Educational simulation only; this is not secure production authentication.
    return {"authenticated": True, "mode": "simulation", "message": "Demo authentication accepted."}
