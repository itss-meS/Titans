Set-Location $PSScriptRoot
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Error "Frontend setup failed"
    exit 1
}
Write-Host "Frontend ready"
