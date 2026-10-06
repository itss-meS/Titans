$scripts = @(
    "du01-gap-detector\ai\start-ai.ps1",
    "backend\start-backend.ps1",
    "frontend\start-frontend.ps1"
)

foreach ($script in $scripts) {
    $path = Join-Path $PSScriptRoot $script
    if (-not (Test-Path $path)) {
        Write-Host "Skipping missing service: $script"
        continue
    }
    Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", "`"$path`""
    Start-Sleep -Seconds 2
}

Write-Host "Frontend: http://127.0.0.1:5173"
Write-Host "Backend docs: http://127.0.0.1:8000/docs"
Write-Host "AI docs: http://127.0.0.1:8001/docs"
