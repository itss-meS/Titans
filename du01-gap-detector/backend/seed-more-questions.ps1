Set-Location $PSScriptRoot

$concepts = @(
    "Variables",
    "Loops",
    "Functions",
    "Stack Frames",
    "Recursion",
    "Memoization",
    "Dynamic Programming"
)

foreach ($concept in $concepts) {
    $totalSaved = 0
    try {
        foreach ($diff in 1..3) {
            $body = @{
                subject = "programming"
                concept = $concept
                count = 4
                difficulty = $diff
            } | ConvertTo-Json

            $genResponse = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/questions/generate" -Method Post -Body $body -ContentType "application/json" -Headers @{"X-User-Role"="teacher"} -ErrorAction Stop
            
            if ($genResponse.questions -and $genResponse.questions.Count -gt 0) {
                $saveBody = $genResponse.questions | ConvertTo-Json -Depth 5
                $saveResponse = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/questions" -Method Post -Body $saveBody -ContentType "application/json" -Headers @{"X-User-Role"="teacher"} -ErrorAction Stop
                $totalSaved += $saveResponse.saved
            }
        }
        Write-Host "Saved $totalSaved questions for concept: $concept" -ForegroundColor Green
    }
    catch {
        Write-Host "Failed to generate/save questions for concept: $concept" -ForegroundColor Red
    }
}
