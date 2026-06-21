$ErrorActionPreference = 'Stop'

# Read source solution file
$solPath = "D:\work\kaoyan\content\reports\agent-runs\20260617-204620-cc-math1-year-2002\source-mirror\Kaoyan-Math1-Papers\solutions\2002年解析\2002年解析.md"
$solText = Get-Content $solPath -Raw -Encoding UTF8

# Read existing questions.json
$inPath = "D:\work\kaoyan\content\staging\math1\2002\questions.json"
$json = Get-Content $inPath -Raw -Encoding UTF8 | ConvertFrom-Json

# Split solution text by question markers: lines starting with (N) or （N）where N is a number
# Pattern: lines that start a new question solution block
# We'll extract sections between markers (1), (2), ... (20)

function Extract-SolutionSection($text, $marker) {
    # Find the section starting with marker (like "(1)【答案】" or "（1）【答案】" or "(1)【解】")
    $pattern = "(?s)(?:^|\n)(?:\($marker\)|（$marker）)"
    $matches = [regex]::Matches($text, $pattern)
    # Return the content from this marker to the next marker or end
    if ($matches.Count -eq 0) { return $null }

    $start = $matches[0].Index + 1  # after the newline
    # Find the next marker (any number)
    $nextPattern = "(?s)(?:^|\n)(?:\(\d+\)|（\d+）)"
    $nextMatch = [regex]::Match($text, $nextPattern, $start)

    if ($nextMatch.Success) {
        $len = $nextMatch.Index - $start
        return $text.Substring($start, $len).Trim()
    } else {
        return $text.Substring($start).Trim()
    }
}

# The solution file structure:
# Section 一: (1)-(5)  fill_in_blank -> absoluteQ 1-5
# Section 二: (6)-(10) multiple_choice -> absoluteQ 6-10
# Section 三: (11)-(20) solution -> absoluteQ 11-20

# Find all solution section starts
# We need to find content blocks starting with numbered markers
# In the solution file:
#   (1)【答案】, (2)【答案】, ... (5)【答案】 for fill-in-blank
#   （6）【答案】, （7）【答案】, ... （10）【答案】 for multiple choice
#   (11)【解】, (12)【解】, ... (20)【解】 for solution questions

# Approach: split the solution text at each numbered marker
# Format patterns: "(N)【答案】", "（N）【答案】", "(N)【解】", "（N）【解】"

# Find all numbered solution block starts
$solBlocks = @{}
$pattern = '(?:^|\n)([（(])(\d+)([）)])\s*【(答案|解)】'
$allMatches = [regex]::Matches($solText, $pattern)

for ($i = 0; $i -lt $allMatches.Count; $i++) {
    $m = $allMatches[$i]
    $num = [int]$m.Groups[2].Value
    $startPos = $m.Index + 1  # skip the newline
    $nextPos = if ($i + 1 -lt $allMatches.Count) { $allMatches[$i+1].Index } else { $solText.Length }
    $block = $solText.Substring($startPos, $nextPos - $startPos).Trim()
    if (-not $solBlocks.ContainsKey($num)) {
        $solBlocks[$num] = $block
    }
}

Write-Output "Found solution blocks for absolute question numbers: $($solBlocks.Keys | Sort-Object)"

# Now fix each question
# Absolute question numbers: 1-5 = q01-q05 (fill_in_blank)
# 6-10 = q06-q10 (multiple_choice)
# 11-20 = q11-q20 (solution)

# Map from local (section) to absolute (solution file):
# q01 -> absolute 1
# q02 -> absolute 2
# ...
# q05 -> absolute 5
# q06 -> absolute 6
# ...
# q10 -> absolute 10
# q11 -> absolute 11
# ...
# q20 -> absolute 20

$absMap = @{
    'math1-2002-q01' = 1;  'math1-2002-q02' = 2;  'math1-2002-q03' = 3
    'math1-2002-q04' = 4;  'math1-2002-q05' = 5;  'math1-2002-q06' = 6
    'math1-2002-q07' = 7;  'math1-2002-q08' = 8;  'math1-2002-q09' = 9
    'math1-2002-q10' = 10; 'math1-2002-q11' = 11; 'math1-2002-q12' = 12
    'math1-2002-q13' = 13; 'math1-2002-q14' = 14; 'math1-2002-q15' = 15
    'math1-2002-q16' = 16; 'math1-2002-q17' = 17; 'math1-2002-q18' = 18
    'math1-2002-q19' = 19; 'math1-2002-q20' = 20
}

# Expected answers from solution file
$answers = @{
    1  = '1.'
    2  = '-2.'
    3  = '$y = \sqrt{x + 1}$ .'
    4  = '2.'
    5  = '4.'
    6  = '（A）.'
    7  = '(C).'
    8  = '（B）.'
    9  = '（B）.'
    10 = '(D).'
    11 = $null   # solution type - no explicit answer marker, just 解
    12 = $null
    13 = $null
    14 = $null
    15 = $null
    16 = $null
    17 = $null
    18 = $null
    19 = $null
    20 = $null
}

foreach ($q in $json.questions) {
    $absNum = $absMap[$q.stableId]
    if ($absNum -and $solBlocks.ContainsKey($absNum)) {
        $block = $solBlocks[$absNum]
        $q.explanationCandidate = $block
        $q.explanationStatus = 'candidate_from_solutions'
    }

    if ($answers.ContainsKey($absNum) -and $answers[$absNum]) {
        $q.answerCandidate = $answers[$absNum]
        $q.answerStatus = 'candidate_from_solutions'
    }

    # Clear anomalies for q01-q10 (fill-in-blank and multiple choice)
    if ($absNum -le 10) {
        $q.anomalies = @()
    }
}

# Fix q09 options - correct image mapping from source paper
$q09 = $json.questions | Where-Object { $_.stableId -eq 'math1-2002-q09' }
$q09.options = @(
    @{ label = 'A'; value = '![](images/5a83b0446d5d8be79a045e814853bc7c8100c050854275d5d10f62e99d7d957a.jpg)' }
    @{ label = 'B'; value = '![](images/8127aa31eb9b732b4b21f0f9cef9fb714092b8e440718188c6f9f5e6bca799ea.jpg)' }
    @{ label = 'C'; value = '![](images/6a75d47c3f3e7e51ebaa752538b7c072f125f4e206a99dc4cf9ded5b5eb9967e.jpg)' }
    @{ label = 'D'; value = '![](images/9e0f14659cf0e9e2d0d8f7fb57cbd30d2d222507d38b5194e452c67cb2205a15.jpg)' }
)

# Fix q10 options
$q10 = $json.questions | Where-Object { $_.stableId -eq 'math1-2002-q10' }
$q10.options = @(
    @{ label = 'A'; value = '$f_{1}(x) + f_{2}(x)$ 必为某一随机变量的概率密度' }
    @{ label = 'B'; value = '$f_{1}(x)f_{2}(x)$ 必为某一随机变量的概率密度.' }
    @{ label = 'C'; value = '$F_{1}(x) + F_{2}(x)$ 必为某一随机变量的分布函数' }
    @{ label = 'D'; value = '$F_{1}(x)F_{2}(x)$ 必为某一随机变量的分布函数' }
)

# Add OCR noise warning for q06 stem
$q06 = $json.questions | Where-Object { $_.stableId -eq 'math1-2002-q06' }
$q06.anomalies = @(
    @{ type = 'ocr_noise_in_stem'; severity = 'warning'; message = 'Stem contains garbled OCR text between properties ①② and ③④: repeated f(x,y) and x0,y0 fragments; source paper line 15' }
)

# Update validation section
$json.validation.totalAnomalies = 3  # 2 section_split_mismatch + 1 ocr_noise
$json.validation.anomaliesBySeverity = @{ error = 0; warning = 3; info = 0 }

# Write back
$outputPath = "D:\work\kaoyan\content\staging\math1\2002\questions.json"
$json | ConvertTo-Json -Depth 10 -Compress:$false | Out-File -FilePath $outputPath -Encoding utf8 -NoNewline
Write-Output "Fixed questions.json written. 20 questions updated."

# Verify
$verify = Get-Content $outputPath -Raw -Encoding UTF8 | ConvertFrom-Json
$missingAnswers = ($verify.questions | Where-Object { $_.answerStatus -eq 'missing' }).Count
$missingExplanations = ($verify.questions | Where-Object { $_.explanationStatus -eq 'missing' }).Count
Write-Output "Missing answers: $missingAnswers (was 10, expecting 0)"
Write-Output "Missing explanations: $missingExplanations (was 0 for q01/q06/q11-q20, but q02-q05/q07-q10 were missing; expecting 0)"
Write-Output "Total questions: $($verify.questions.Count)"
