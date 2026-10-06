Set-Location $PSScriptRoot

$headers = @{
    "X-User-Role" = "teacher"
}

$subjects = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/subjects" -Headers $headers
foreach ($subject in $subjects) {
    foreach ($concept in $subject.concepts) {
        $saved = 0
        foreach ($difficulty in 1, 2, 3) {
            try {
                $body = @{
                    subject = $subject.id
                    concept = $concept
                    count = 4
                    difficulty = $difficulty
                } | ConvertTo-Json
                $generated = Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:8000/api/questions/generate" -Headers $headers -ContentType "application/json" -Body $body
                if ($generated.questions.Count -gt 0) {
                    $payload = ConvertTo-Json -InputObject @($generated.questions) -Depth 10
                    $result = Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:8000/api/questions" -Headers $headers -ContentType "application/json" -Body $payload
                    $saved += $result.inserted
                }
            } catch {
                continue
            }
        }
        Write-Host "${concept}: saved $saved questions"
    }
}
