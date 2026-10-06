Set-Location $PSScriptRoot

Write-Host "=== Starting AI Service (Port 8001) ===" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\ai'; .\start-ai.ps1"

if (Test-Path ".\backend\start-backend.ps1") {
    Write-Host "=== Starting Backend Service ===" -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\backend'; .\start-backend.ps1"
}

if (Test-Path ".\frontend\start-frontend.ps1") {
    Write-Host "=== Starting Frontend Service ===" -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\frontend'; .\start-frontend.ps1"
}

Write-Host "All available services started in separate windows." -ForegroundColor Green
