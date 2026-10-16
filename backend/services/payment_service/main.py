from fastapi import FastAPI, Query
app = FastAPI(title="PulseMesh Payment Service")

@app.get("/")
def root():
    return {"service": "payment-service", "status": "running"}

@app.get("/health")
def health():
    return {"service": "payment-service", "status": "healthy"}

@app.post("/process-payment")
def process_payment(amount: float = Query(default=100, gt=0, le=1000000), simulate_failure: bool = False):
    # Educational simulation only; no real payment is collected.
    if simulate_failure:
        return {"status": "failed", "amount": amount, "message": "Simulated payment failure."}
    return {"status": "success", "amount": amount, "message": "Demo payment processed successfully."}
