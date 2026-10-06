# Titans

## Start the application

Run setup once from the repository root:

```powershell
.\setup-all.ps1
```

Then start the backend and frontend together:

```powershell
.\start-all.ps1
```

The frontend runs at `http://127.0.0.1:5173` and proxies all `/api` requests
to the FastAPI backend at `http://127.0.0.1:8000`. The backend API docs are
available at `http://127.0.0.1:8000/docs`. The backend calls the DU-01 AI
service at `http://127.0.0.1:8001`, whose docs are available at
`http://127.0.0.1:8001/docs`.

To start them separately:

```powershell
.\du01-gap-detector\ai\start-ai.ps1
.\backend\start-backend.ps1
.\frontend\start-frontend.ps1
```