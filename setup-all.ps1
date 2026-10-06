$steps = @(
    "du01-gap-detector\ai\setup-ai.ps1",
    "backend\setup-backend.ps1",
    "frontend\setup-frontend.ps1"
)

foreach ($step in $steps) {
    $path = Join-Path $PSScriptRoot $step
    if (-not (Test-Path $path)) {
        Write-Host "Skipping missing setup script: $step"
        continue
    }
    Write-Host "Running $step"
    $global:LASTEXITCODE = 0
    & $path
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Setup failed at $step (exit code $LASTEXITCODE). Fix the error above and run setup-all.ps1 again."
        exit 1
    }
}

Write-Host "All services are set up"
