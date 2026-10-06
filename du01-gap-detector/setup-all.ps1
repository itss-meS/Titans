Set-Location $PSScriptRoot

Write-Host "=== Setting up AI Service (Parth) ===" -ForegroundColor Cyan
if (Test-Path ".\ai\setup-ai.ps1") {
    Set-Location ".\ai"
    .\setup-ai.ps1
    Set-Location $PSScriptRoot
}

if (Test-Path ".\backend\setup-backend.ps1") {
    Write-Host "=== Setting up Backend (Sanskar) ===" -ForegroundColor Cyan
    Set-Location ".\backend"
    .\setup-backend.ps1
    Set-Location $PSScriptRoot
}

if (Test-Path ".\frontend\setup-frontend.ps1") {
    Write-Host "=== Setting up Frontend (Vardhan) ===" -ForegroundColor Cyan
    Set-Location ".\frontend"
    .\setup-frontend.ps1
    Set-Location $PSScriptRoot
}

Write-Host "Setup completed!" -ForegroundColor Green
