Set-Location $PSScriptRoot

$env:AI_SERVICE_URL = "http://127.0.0.1:8001"

.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
