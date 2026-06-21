# Diagnose current state
$staging = Get-Content "D:\work\kaoyan\content\staging\math1\2003\questions.json" -Raw -Encoding UTF8 | ConvertFrom-Json
$repaired = Get-Content "D:\work\kaoyan\content\review\math1\2003\questions-structure-repaired.json" -Raw -Encoding UTF8 | ConvertFrom-Json

Write-Host "=== STAGING DIAGNOSIS ==="
Write-Host "Questions: $($staging.questions.Count)"
Write-Host "Q1 expl len: $($staging.questions[0].explanationCandidate.Length)"
Write-Host "Q2 expl len: $($staging.questions[1].explanationCandidate.Length)"
Write-Host "Q8 expl: '$($staging.questions[7].explanationCandidate)'"
Write-Host "Q8 answer: '$($staging.questions[7].answerCandidate)'"
Write-Host "Q20 expl: '$($staging.questions[19].explanationCandidate)'"
Write-Host "Q7 anomalies: $($staging.questions[6].anomalies | ConvertTo-Json -Compress)"

Write-Host "`n=== REPAIRED DIAGNOSIS ==="
Write-Host "Questions: $($repaired.questions.Count)"
Write-Host "Q1 expl len: $($repaired.questions[0].explanationCandidate.Length)"
Write-Host "Q8 expl len: $($repaired.questions[7].explanationCandidate.Length)"
Write-Host "Q8 answer: '$($repaired.questions[7].answerCandidate)'"
Write-Host "Q20 expl len: $($repaired.questions[19].explanationCandidate.Length)"
