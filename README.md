# PulseMesh Final Demo

## Backend
Open PowerShell in `PulseMesh/backend`:
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```
Run these in three separate terminals, all from `backend` (activate `.venv` in the main API terminal):
```powershell
python -m uvicorn app.main:app --reload --port 8000
python -m uvicorn services.auth_service.main:app --reload --port 8001
python -m uvicorn services.payment_service.main:app --reload --port 8002
```
API docs: http://127.0.0.1:8000/docs

## Frontend
Open a fourth terminal in `PulseMesh/frontend`:
```powershell
npm install
npm run dev
```
Open http://localhost:5173

## Demo
Run a normal checkout, inspect its trace, then run another checkout with “Simulate payment failure” selected and view Incidents.

This is an educational local simulation. Authentication is not secure production login and payments are simulated; no real money is collected. SQLite data is stored in `backend/app/pulsemesh.db`.
