Set-Location $PSScriptRoot
.\.venv\Scripts\python.exe -m app.seed
Write-Host "Database seeded"
