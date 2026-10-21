# PulseMesh – Microservices Observability Dashboard

PulseMesh is a web-based observability dashboard designed to monitor
multiple backend services, track API requests, visualize traces,
and manage service incidents.

It demonstrates microservices communication, service health monitoring,
request tracing, and failure simulation through a centralized dashboard.

# PulseMesh – Microservices Observability Dashboard

PulseMesh is a web-based observability dashboard designed to monitor
multiple backend services, track API requests, visualize traces,
and manage service incidents.

It demonstrates microservices communication, service health monitoring,
request tracing, and failure simulation through a centralized dashboard.


## Features

- Real-time service health monitoring
- API request tracing and duration tracking
- Incident detection and resolution
- Simulated checkout and payment failures
- Centralized dashboard for service monitoring
- Automated project setup and startup scripts

## Tech Stack

### Frontend
- React.js
- Vite
- CSS

### Backend
- Python
- FastAPI
- HTTPX

### Database
- SQLite

### Tools
- Git
- GitHub
- VS Code
## Architecture

PulseMesh follows a microservices-based architecture consisting of a
React frontend and three independent backend services.

### Services

1. **Main API (Port 8000)**
   - Handles dashboard data, traces, and incidents.
   - Communicates with Auth and Payment services.

2. **Auth Service (Port 8001)**
   - Provides simulated authentication.

3. **Payment Service (Port 8002)**
   - Simulates payment processing and failures.

4. **Frontend (Port 5173)**
   - Displays service health, traces, checkout results, and incidents.

### Data Storage
- SQLite stores trace and incident records locally.

## Quick Start (Windows)

Follow these steps to run PulseMesh locally.

### 1. Clone the Repository

git clone https://github.com/Vaishnavi12162004/PulseMesh.git

### 2. Open the Project Folder

cd PulseMesh

### 3. Install Dependencies

Run the setup script:

setup.bat

This installs the required Python and frontend dependencies.

### 4. Start PulseMesh

Run:

start.bat

This launches the Main API, Auth Service, Payment Service, and Frontend in separate terminal windows.

### 5. Open the Dashboard

Open the frontend URL displayed in the terminal.

Default URL: http://localhost:5173
## Manual Setup

### Backend
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

### Frontend
Open a fourth terminal in `PulseMesh/frontend`:
```powershell
npm install
npm run dev
```
Open http://localhost:5173

## Demo
Run a normal checkout, inspect its trace, then run another checkout with “Simulate payment failure” selected and view Incidents.

This is an educational local simulation. Authentication is not secure production login and payments are simulated; no real money is collected. SQLite data is stored in `backend/app/pulsemesh.db`.
