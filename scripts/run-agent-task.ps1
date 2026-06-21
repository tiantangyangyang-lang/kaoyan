param(
    [Parameter(Mandatory = $true)]
    [ValidateSet(
        "cc-inventory",
        "cc-math1-2020",
        "ds-math1-2020",
        "cc-math1-year",
        "cc-math1-legacy-repair-strict",
        "cc-math1-pdf-evidence-repair",
        "cc-math1-apply-visual-evidence",
        "cc-math1-recover-evidence-json",
        "cc-math1-md-finalize-year",
        "cc-finalize-summary",
        "ds-math1-year",
        "cc-math2-2020",
        "ds-math2-2020"
    )]
    [string]$Task,

    [switch]$PrepareOnly,

    [switch]$PlanOnly,

    [ValidateRange(1987, 2025)]
    [int]$Year = 0,

    [ValidateRange(1, 200)]
    [int]$MaxTurns = 60
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding = [Console]::OutputEncoding

$projectRoot = Split-Path -Parent $PSScriptRoot
$specPath = Join-Path $projectRoot "真题内容解析与代理处理规范.md"
$promptPath = Join-Path $projectRoot "prompts\$Task.md"
$contractPath = Join-Path $projectRoot "prompts\agent-result-contract.md"
$reportDir = Join-Path $projectRoot "content\reports\agent-runs"

if (-not (Test-Path -LiteralPath $specPath)) {
    throw "Missing specification file: $specPath"
}

if (-not (Test-Path -LiteralPath $promptPath)) {
    throw "Missing task prompt: $promptPath"
}

if (-not (Test-Path -LiteralPath $contractPath)) {
    throw "Missing result contract: $contractPath"
}

New-Item -ItemType Directory -Force -Path $reportDir | Out-Null

$permissionMode = if ($PlanOnly) { "plan" } else { "acceptEdits" }
if ($Task -in @("cc-math1-year", "cc-math1-legacy-repair-strict", "cc-math1-pdf-evidence-repair", "cc-math1-apply-visual-evidence", "cc-math1-recover-evidence-json", "cc-math1-md-finalize-year", "ds-math1-year") -and $Year -eq 0) {
    throw "-Year is required for task $Task."
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$runId = if ($Year -gt 0) { "$timestamp-$Task-$Year" } else { "$timestamp-$Task" }
$runDir = Join-Path $reportDir $runId
$logPath = Join-Path $runDir "terminal.log"
$manifestPath = Join-Path $runDir "run-manifest.json"
$beforePath = Join-Path $runDir "source-before.json"
$afterPath = Join-Path $runDir "source-after.json"
$integrityPath = Join-Path $runDir "source-integrity.json"
$outputBeforePath = Join-Path $runDir "output-before.json"
$outputAfterPath = Join-Path $runDir "output-after.json"
$outputIntegrityPath = Join-Path $runDir "output-integrity.json"
$resultPath = Join-Path $runDir "agent-result.json"
$agentReportPath = Join-Path $runDir "agent-report.md"
$summaryPath = Join-Path $runDir "final-summary.md"
$effectivePromptPath = Join-Path $runDir "prompt.md"
$sourceMirrorDir = Join-Path $runDir "source-mirror"
$externalLauncherPath = Join-Path $runDir "run-external-claude.cmd"
$handoffPath = Join-Path $runDir "external-handoff.md"

New-Item -ItemType Directory -Force -Path $runDir | Out-Null

$prompt = Get-Content -Raw -Encoding utf8 -LiteralPath $promptPath
$prompt = $prompt.Replace("{{YEAR}}", [string]$Year).Replace("{{RUN_DIR}}", $runDir)
$contract = Get-Content -Raw -Encoding utf8 -LiteralPath $contractPath
$contract = $contract.Replace("{{RUN_DIR}}", $runDir).Replace("{{RUN_ID}}", $runId).Replace("{{TASK}}", $Task)
$sourceDirs = switch -Wildcard ($Task) {
    "*inventory" { @("D:\work\Kaoyan-Math1-Papers", "D:\work\Kaoyan-Math2-Papers") }
    "*math1*" { @("D:\work\Kaoyan-Math1-Papers") }
    "*math2*" { @("D:\work\Kaoyan-Math2-Papers") }
}

$allowedWritePrefixes = switch ($Task) {
    "cc-inventory" { @("content\inventory\", "scripts\", "tests\") }
    "cc-math1-2020" { @("content\staging\math1\2020\", "content\reports\pilot-math1-2020\", "scripts\", "tests\") }
    "ds-math1-2020" { @("content\review\math1\2020\", "content\reports\pilot-math1-2020\") }
    "cc-math1-year" { @("content\staging\math1\$Year\", "content\reports\math1-$Year\", "scripts\", "tests\") }
    "cc-math1-legacy-repair-strict" { @("content\staging\math1\$Year\", "content\reports\math1-$Year\", "scripts\", "tests\") }
    "cc-math1-pdf-evidence-repair" { @("content\staging\math1\$Year\", "content\reports\math1-$Year\", "scripts\", "tests\") }
    "cc-math1-apply-visual-evidence" { @("content\staging\math1\$Year\", "content\reports\math1-$Year\", "scripts\", "tests\") }
    "cc-math1-recover-evidence-json" { @("content\staging\math1\$Year\", "content\reports\math1-$Year\", "scripts\", "tests\") }
    "cc-math1-md-finalize-year" { @("content\staging\math1\$Year\", "content\review\math1\$Year\", "content\reports\math1-$Year\") }
    "cc-finalize-summary" { @("content\final\math1\", "content\reports\math1-final\") }
    "ds-math1-year" { @("content\review\math1\$Year\", "content\reports\math1-$Year\") }
    "cc-math2-2020" { @("content\staging\math2\2020\", "content\reports\pilot-math2-2020\", "scripts\", "tests\") }
    "ds-math2-2020" { @("content\review\math2\2020\", "content\reports\pilot-math2-2020\") }
}

foreach ($dir in $sourceDirs) {
    if (-not (Test-Path -LiteralPath $dir)) {
        throw "Missing read-only source directory: $dir"
    }
}

function Copy-TaskSourceMirror {
    param([string]$TaskName, [string]$DestinationRoot)

    $copyPlan = switch ($TaskName) {
        "cc-inventory" {
            @(
                [pscustomobject]@{ root = "D:\work\Kaoyan-Math1-Papers"; relative = "README.md" },
                [pscustomobject]@{ root = "D:\work\Kaoyan-Math1-Papers"; relative = "LICENSE" },
                [pscustomobject]@{ root = "D:\work\Kaoyan-Math2-Papers"; relative = "README.md" }
            )
        }
        { $_ -in @("cc-math1-2020", "ds-math1-2020") } {
            @(
                [pscustomobject]@{ root = "D:\work\Kaoyan-Math1-Papers"; relative = "papers\2020年考研数学(一)真题.md" },
                [pscustomobject]@{ root = "D:\work\Kaoyan-Math1-Papers"; relative = "solutions\2020年解析" }
            )
        }
        "cc-math1-md-finalize-year" {
            $items = @()
            $sourceRoot = "D:\work\Kaoyan-Math1-Papers"
            $paperRoot = Join-Path $sourceRoot "papers"
            foreach ($paper in Get-ChildItem -LiteralPath $paperRoot -File |
                Where-Object { $_.Name -like "$Year*.md" }) {
                $items += [pscustomobject]@{
                    root = $sourceRoot
                    relative = "papers\$($paper.Name)"
                }
            }

            $solutionRoot = Join-Path $sourceRoot "solutions\${Year}年解析"
            if (Test-Path -LiteralPath $solutionRoot) {
                foreach ($solution in Get-ChildItem -LiteralPath $solutionRoot -Recurse -File -Filter *.md) {
                    $relative = $solution.FullName.Substring($sourceRoot.Length + 1)
                    $items += [pscustomobject]@{ root = $sourceRoot; relative = $relative }
                }
                $solutionImages = Join-Path $solutionRoot "images"
                if (Test-Path -LiteralPath $solutionImages) {
                    $items += [pscustomobject]@{
                        root = $sourceRoot
                        relative = $solutionImages.Substring($sourceRoot.Length + 1)
                    }
                }
            }

            $paperImagesRoot = Join-Path $paperRoot "images"
            if (Test-Path -LiteralPath $paperImagesRoot) {
                foreach ($imageDirectory in Get-ChildItem -LiteralPath $paperImagesRoot -Directory |
                    Where-Object { $_.Name -like "$Year*" }) {
                    $items += [pscustomobject]@{
                        root = $sourceRoot
                        relative = "papers\images\$($imageDirectory.Name)"
                    }
                }
            }

            if ($items.Count -eq 0) {
                throw "No Markdown-first Math1 source inputs found for year $Year."
            }
            $items
        }
        { $_ -in @("cc-math1-year", "cc-math1-legacy-repair-strict", "cc-math1-pdf-evidence-repair", "cc-math1-apply-visual-evidence", "cc-math1-recover-evidence-json", "cc-math1-md-finalize-year", "ds-math1-year") } {
            $items = @()
            $paperRoot = "D:\work\Kaoyan-Math1-Papers\papers"
            foreach ($paper in Get-ChildItem -LiteralPath $paperRoot -File |
                Where-Object { $_.Name -like "$Year*.md" }) {
                $items += [pscustomobject]@{
                    root = "D:\work\Kaoyan-Math1-Papers"
                    relative = "papers\$($paper.Name)"
                }
            }
            $paperImagesRoot = Join-Path $paperRoot "images"
            if (Test-Path -LiteralPath $paperImagesRoot) {
                foreach ($imageDirectory in Get-ChildItem -LiteralPath $paperImagesRoot -Directory |
                    Where-Object { $_.Name -like "$Year*" }) {
                    $items += [pscustomobject]@{
                        root = "D:\work\Kaoyan-Math1-Papers"
                        relative = "papers\images\$($imageDirectory.Name)"
                    }
                }
            }
            $solutionRelative = "solutions\${Year}年解析"
            if (Test-Path -LiteralPath (Join-Path "D:\work\Kaoyan-Math1-Papers" $solutionRelative)) {
                $items += [pscustomobject]@{
                    root = "D:\work\Kaoyan-Math1-Papers"
                    relative = $solutionRelative
                }
            }
            if ($items.Count -eq 0) {
                throw "No Math1 source inputs found for year $Year."
            }
            $items
        }
        { $_ -in @("cc-math2-2020", "ds-math2-2020") } {
            @(
                [pscustomobject]@{ root = "D:\work\Kaoyan-Math2-Papers"; relative = "papers\math2_2020.pdf" },
                [pscustomobject]@{ root = "D:\work\Kaoyan-Math2-Papers"; relative = "papers\MinerU_markdown_math2_2020_2065687152877731840.md" },
                [pscustomobject]@{ root = "D:\work\Kaoyan-Math2-Papers"; relative = "solutions\2020" }
            )
        }
    }

    foreach ($item in $copyPlan) {
        $sourceRoot = $item.root
        $relativePath = $item.relative
        $sourcePath = Join-Path $sourceRoot $relativePath
        if (-not (Test-Path -LiteralPath $sourcePath)) {
            throw "Missing source mirror input: $sourcePath"
        }

        $repoName = Split-Path -Leaf $sourceRoot
        $destinationPath = Join-Path (Join-Path $DestinationRoot $repoName) $relativePath
        New-Item -ItemType Directory -Force -Path (Split-Path -Parent $destinationPath) | Out-Null
        Copy-Item -LiteralPath $sourcePath -Destination $destinationPath -Recurse -Force
    }
}

New-Item -ItemType Directory -Force -Path $sourceMirrorDir | Out-Null
Copy-TaskSourceMirror -TaskName $Task -DestinationRoot $sourceMirrorDir

$mirrorInstruction = @(
    "SOURCE SAFETY:",
    "- Use only the copied source mirror at: $sourceMirrorDir",
    "- For inventory metadata, also use source-before.json in the same run directory.",
    "- Do not access the original D:\work\Kaoyan-Math1-Papers or D:\work\Kaoyan-Math2-Papers directories.",
    "- The wrapper will compare original source hashes before and after this run."
) -join [Environment]::NewLine

$effectivePrompt = if ($PlanOnly) {
    $prompt + [Environment]::NewLine + [Environment]::NewLine + $mirrorInstruction +
        [Environment]::NewLine + [Environment]::NewLine +
        "PLAN ONLY: Do not create or modify project files. Print the plan, risks, expected write paths, and verification commands."
}
else {
    $prompt + [Environment]::NewLine + [Environment]::NewLine + $mirrorInstruction +
        [Environment]::NewLine + [Environment]::NewLine + $contract +
        [Environment]::NewLine + [Environment]::NewLine +
        "Result-file reminder: commandsRun must never be an empty array. If you truly used no shell commands, set commandsRun to [""(none)""] and state that explicitly in agent-report.md."
}
Set-Content -Encoding utf8 -LiteralPath $effectivePromptPath -Value $effectivePrompt

$launcherArgs = @("-Task", $Task)
if ($Year -gt 0) {
    $launcherArgs += @("-Year", $Year.ToString())
}
if ($PlanOnly) {
    $launcherArgs += "-PlanOnly"
}
$launcherArgs += @("-MaxTurns", $MaxTurns.ToString())
$launcherCommand = "call scripts\run-agent-task.cmd " + ($launcherArgs -join " ")
$launcherContent = @(
    "@echo off",
    "setlocal",
    "cd /d `"$projectRoot`"",
    $launcherCommand
) -join [Environment]::NewLine
Set-Content -Encoding ascii -LiteralPath $externalLauncherPath -Value $launcherContent

$modeLabel = if ($PlanOnly) { "plan_only" } else { "real_run" }
$handoffLines = @(
    "# External Claude Code Handoff",
    "",
    "- Run ID: $runId",
    "- Task: $Task",
    "- Mode: $modeLabel",
    "- Project root: $projectRoot",
    "- Prepared prompt: prompt.md",
    "- Source mirror: source-mirror\\",
    "- External launcher: run-external-claude.cmd",
    "",
    "## Use From A Regular CMD Terminal",
    "",
    "1. cd /d $projectRoot",
    "2. content\\reports\\agent-runs\\$runId\\run-external-claude.cmd",
    "",
    "## Boundary",
    "",
    "- This prepared bundle does not run Claude Code by itself.",
    "- It packages the exact task parameters and a read-only source mirror for external execution.",
    "- The actual wrapper run still happens through scripts\\run-agent-task.cmd in a regular CMD shell where claude is available on PATH.",
    "- Do not start this from inside an interactive Claude Code or Codex session."
) -join [Environment]::NewLine
Set-Content -Encoding utf8 -LiteralPath $handoffPath -Value $handoffLines

function Get-SourceSnapshot {
    param([string[]]$Directories)

    $repositories = @()
    foreach ($dir in $Directories) {
        $head = (& git -C $dir rev-parse HEAD 2>$null)
        $gitStatus = @(& git -C $dir status --porcelain=v1 2>$null)
        $rootPrefix = $dir.TrimEnd("\") + "\"
        $files = Get-ChildItem -LiteralPath $dir -Recurse -File |
            Where-Object { $_.FullName -notlike "$rootPrefix.git\*" } |
            Sort-Object FullName |
            ForEach-Object {
            $relativePath = $_.FullName.Substring($rootPrefix.Length)
            [ordered]@{
                relativePath = $relativePath
                length = $_.Length
                lastWriteTimeUtc = $_.LastWriteTimeUtc.ToString("o")
                sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName).Hash
            }
        }

        $repositories += [ordered]@{
            root = $dir
            headCommit = $head
            dirty = ($gitStatus.Count -gt 0)
            gitStatus = $gitStatus
            files = @($files)
        }
    }

    return [ordered]@{
        capturedAt = (Get-Date).ToString("o")
        repositories = $repositories
    }
}

function Get-ProjectSnapshot {
    param([string]$Root)

    $rootPrefix = $Root.TrimEnd("\") + "\"
    $agentRunsPrefix = Join-Path $Root "content\reports\agent-runs"
    $claudeLogsPrefix = Join-Path $Root ".claude\logs"
    $files = Get-ChildItem -LiteralPath $Root -Recurse -File |
        Where-Object {
            $_.FullName -notlike "$agentRunsPrefix\*" -and
            $_.FullName -notlike "$claudeLogsPrefix\*"
        } |
        Sort-Object FullName |
        ForEach-Object {
            [ordered]@{
                relativePath = $_.FullName.Substring($rootPrefix.Length)
                length = $_.Length
                sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName).Hash
            }
        }

    return [ordered]@{
        capturedAt = (Get-Date).ToString("o")
        files = @($files)
    }
}

function Compare-ProjectSnapshots {
    param($Before, $After, [string[]]$AllowedPrefixes)

    $beforeMap = @{}
    foreach ($file in $Before.files) {
        $beforeMap[$file.relativePath] = $file.sha256
    }

    $afterMap = @{}
    foreach ($file in $After.files) {
        $afterMap[$file.relativePath] = $file.sha256
    }

    $allPaths = @(@($beforeMap.Keys) + @($afterMap.Keys) | Sort-Object -Unique)
    $changedPaths = @()
    foreach ($path in $allPaths) {
        if ($beforeMap[$path] -ne $afterMap[$path]) {
            $changedPaths += $path
        }
    }

    $unauthorizedPaths = @()
    foreach ($path in $changedPaths) {
        $allowed = $false
        foreach ($prefix in $AllowedPrefixes) {
            if ($path.StartsWith($prefix, [StringComparison]::OrdinalIgnoreCase)) {
                $allowed = $true
                break
            }
        }
        if (-not $allowed) {
            $unauthorizedPaths += $path
        }
    }

    return [ordered]@{
        passed = ($unauthorizedPaths.Count -eq 0)
        allowedWritePrefixes = $AllowedPrefixes
        changedPaths = $changedPaths
        unauthorizedPaths = $unauthorizedPaths
    }
}

function Normalize-ReportedProjectPath {
    param(
        [string]$PathValue,
        [string]$ProjectRoot
    )

    if ([string]::IsNullOrWhiteSpace($PathValue)) {
        return $null
    }

    $candidate = ([string]$PathValue).Trim().Replace("/", "\")
    $normalizedProjectRoot = [System.IO.Path]::GetFullPath($ProjectRoot).TrimEnd("\")

    try {
        if ([System.IO.Path]::IsPathRooted($candidate)) {
            $fullCandidate = [System.IO.Path]::GetFullPath($candidate)
            if ($fullCandidate.StartsWith($normalizedProjectRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
                return $fullCandidate.Substring($normalizedProjectRoot.Length).TrimStart("\")
            }
            return $fullCandidate
        }
    }
    catch {
        return $candidate
    }

    return $candidate
}

function Write-JsonFile {
    param($Value, [string]$Path)
    $Value | ConvertTo-Json -Depth 12 | Set-Content -Encoding utf8 -LiteralPath $Path
}

function Resolve-ClaudeCommand {
    $direct = Get-Command claude -ErrorAction SilentlyContinue
    if ($direct) {
        return $direct
    }

    $candidates = @(
        "C:\Users\60549\AppData\Roaming\npm\claude.cmd",
        "C:\Users\60549\AppData\Roaming\npm\claude",
        "C:\Users\60549\AppData\Local\Microsoft\WinGet\Packages\Anthropic.ClaudeCode_Microsoft.Winget.Source_8wekyb3d8bbwe\claude.exe"
    )

    foreach ($candidate in $candidates) {
        if (Test-Path -LiteralPath $candidate) {
            return [pscustomobject]@{
                Source = $candidate
                Name = [System.IO.Path]::GetFileName($candidate)
            }
        }
    }

    return $null
}

$startedAt = Get-Date
$beforeSnapshot = Get-SourceSnapshot -Directories $sourceDirs
Write-JsonFile -Value $beforeSnapshot -Path $beforePath
$outputBeforeSnapshot = Get-ProjectSnapshot -Root $projectRoot
Write-JsonFile -Value $outputBeforeSnapshot -Path $outputBeforePath

$manifest = [ordered]@{
    schemaVersion = "agent-run-v1"
    runId = $runId
    task = $Task
    prepareOnly = [bool]$PrepareOnly
    planOnly = [bool]$PlanOnly
    startedAt = $startedAt.ToString("o")
    endedAt = $null
    processExitCode = $null
    sourceIntegrityPassed = $null
    outputIntegrityPassed = $null
    agentResultValid = $null
    finalStatus = "running"
    runDirectory = $runDir
    sourceDirectories = $sourceDirs
}
Write-JsonFile -Value $manifest -Path $manifestPath

if ($PrepareOnly) {
    $manifest.endedAt = (Get-Date).ToString("o")
    $manifest.finalStatus = "prepared"
    Write-JsonFile -Value $manifest -Path $manifestPath

    $summary = @(
        "# Agent Run Summary",
        "",
        "- Run ID: $runId",
        "- Task: $Task",
        "- Final status: **prepared**",
        "- Prepare only: True",
        "- Plan only: $([bool]$PlanOnly)",
        "- External launcher: run-external-claude.cmd",
        "- Handoff note: external-handoff.md",
        "- Prepared prompt: prompt.md",
        "- Source mirror: source-mirror\\",
        "",
        "## Decision",
        "",
        "Prepared an external Claude Code bundle. Start it from a CMD session where `claude` is already available on PATH."
    ) -join [Environment]::NewLine
    Set-Content -Encoding utf8 -LiteralPath $summaryPath -Value $summary
    return
}

$claude = Resolve-ClaudeCommand
if (-not $claude) {
    throw "Claude Code is not available in PATH and no fallback install path was found."
}

try {
    $arguments = @(
        "--permission-mode", $permissionMode,
        "--append-system-prompt-file", $specPath,
        "--max-turns", $MaxTurns.ToString()
    )

    if ($Task -in @("cc-math1-recover-evidence-json", "cc-math1-md-finalize-year", "cc-finalize-summary")) {
        $arguments += @(
            "--allowedTools",
            "Read",
            "Edit",
            "Write",
            "Bash(node *)",
            "Bash(python *)",
            "Bash(powershell *)",
            "Bash(powershell.exe *)"
        )
    }

    $arguments += @("-p", $effectivePrompt)

    Write-Host "Task: $Task"
    Write-Host "Permission mode: $permissionMode"
    Write-Host "Run ID: $runId"
    Write-Host "Run directory: $runDir"
    Write-Host "Log: $logPath"
    Write-Host "Reject every request to modify a source directory."

    $processExitCode = 1
    $invocationError = $null
    Push-Location $projectRoot
    try {
        try {
            & $claude.Source @arguments 2>&1 | Tee-Object -FilePath $logPath
            $processExitCode = $LASTEXITCODE
        }
        catch {
            $invocationError = $_.Exception.Message
            $invocationError | Add-Content -Encoding utf8 -LiteralPath $logPath
        }
    }
    finally {
        Pop-Location
    }

    $afterSnapshot = Get-SourceSnapshot -Directories $sourceDirs
    Write-JsonFile -Value $afterSnapshot -Path $afterPath

    $beforeComparable = $beforeSnapshot.repositories | ConvertTo-Json -Depth 12 -Compress
    $afterComparable = $afterSnapshot.repositories | ConvertTo-Json -Depth 12 -Compress
    $sourceIntegrityPassed = ($beforeComparable -eq $afterComparable)
    Write-JsonFile -Value ([ordered]@{
        runId = $runId
        passed = $sourceIntegrityPassed
        note = if ($sourceIntegrityPassed) { "Source snapshots match." } else { "Source directories changed. The run must fail and be reviewed." }
    }) -Path $integrityPath

    $outputAfterSnapshot = Get-ProjectSnapshot -Root $projectRoot
    Write-JsonFile -Value $outputAfterSnapshot -Path $outputAfterPath
    $outputIntegrity = Compare-ProjectSnapshots -Before $outputBeforeSnapshot -After $outputAfterSnapshot -AllowedPrefixes $allowedWritePrefixes
    $prohibitedStatusPaths = @()
    foreach ($path in $outputIntegrity.changedPaths) {
        if ($path.EndsWith(".json", [StringComparison]::OrdinalIgnoreCase)) {
            $fullPath = Join-Path $projectRoot $path
            if ((Test-Path -LiteralPath $fullPath) -and
                (Select-String -LiteralPath $fullPath -Pattern '"status"\s*:\s*"(approved|published)"' -Quiet)) {
                $prohibitedStatusPaths += $path
            }
        }
    }
    $outputIntegrity.prohibitedStatusPaths = $prohibitedStatusPaths
    if ($prohibitedStatusPaths.Count -gt 0) {
        $outputIntegrity.passed = $false
    }
    Write-JsonFile -Value $outputIntegrity -Path $outputIntegrityPath
    $outputIntegrityPassed = $outputIntegrity.passed

    $agentResultValid = [bool]$PlanOnly
    $agentStatus = $null
    $agentChecksPassed = [bool]$PlanOnly
    $resultError = $null
    if ($PlanOnly) {
        $agentStatus = "planned"
    }
    elseif (Test-Path -LiteralPath $resultPath) {
        try {
            $agentResult = Get-Content -Raw -Encoding utf8 -LiteralPath $resultPath | ConvertFrom-Json
            if ($agentResult.runId -ne $runId) { throw "agent-result.json runId mismatch." }
            if ($agentResult.task -ne $Task) { throw "agent-result.json task mismatch." }
            if ($agentResult.status -notin @("completed", "completed_with_warnings", "blocked", "failed")) {
                throw "agent-result.json has an invalid status."
            }
            $agentStatus = $agentResult.status
            $failedChecks = @($agentResult.checks | Where-Object { $_.status -eq "failed" })
            $notRunChecks = @($agentResult.checks | Where-Object { $_.status -eq "not_run" })
            $reportedErrorCount = 0
            if ($null -ne $agentResult.counts.errors) {
                $reportedErrorCount = [int]$agentResult.counts.errors
            }
            $reportedPaths = @(
                @($agentResult.changedFiles) + @($agentResult.createdFiles) |
                ForEach-Object { Normalize-ReportedProjectPath -PathValue $_ -ProjectRoot $projectRoot } |
                Where-Object { $_ }
            )
            $unreportedChangedPaths = @(
                $outputIntegrity.changedPaths |
                Where-Object { $_ -notin $reportedPaths }
            )
            $commandsRunCount = @($agentResult.commandsRun).Count
            $completedStatus = $agentStatus -in @("completed", "completed_with_warnings")
            $reportedWarningsCount = @($agentResult.warnings).Count
            if ($completedStatus -and $commandsRunCount -eq 0) {
                throw "Completed task reported no commandsRun."
            }
            if ($agentStatus -eq "completed" -and $notRunChecks.Count -gt 0) {
                throw "Completed task has not_run checks. Use completed_with_warnings."
            }
            if ($agentStatus -eq "completed_with_warnings" -and
                $reportedWarningsCount -eq 0 -and
                [int]$agentResult.counts.warnings -eq 0) {
                throw "completed_with_warnings task reported no warnings."
            }
            if ($unreportedChangedPaths.Count -gt 0) {
                throw "agent-result.json omitted changed project paths: $($unreportedChangedPaths -join ', ')"
            }
            $agentChecksPassed = $true
            if ($agentStatus -eq "completed") {
                $agentChecksPassed = (
                    $failedChecks.Count -eq 0 -and
                    $reportedErrorCount -eq 0 -and
                    $notRunChecks.Count -eq 0
                )
            }
            elseif ($agentStatus -eq "completed_with_warnings") {
                $hasFindings = (
                    $failedChecks.Count -gt 0 -or
                    $reportedErrorCount -gt 0 -or
                    $reportedWarningsCount -gt 0 -or
                    [int]$agentResult.counts.warnings -gt 0 -or
                    $notRunChecks.Count -gt 0
                )
                if (-not $hasFindings) {
                    throw "completed_with_warnings task reported no findings."
                }
            }
            $agentResultValid = $true
        }
        catch {
            $resultError = $_.Exception.Message
        }
    }
    else {
        $resultError = "Missing agent-result.json."
    }

    $finalStatus = if ($processExitCode -ne 0 -or -not $sourceIntegrityPassed -or -not $outputIntegrityPassed -or -not $agentResultValid -or -not $agentChecksPassed) {
        "failed"
    }
    elseif ($PlanOnly) {
        "planned"
    }
    elseif ($agentStatus -eq "blocked") {
        "blocked"
    }
    elseif ($agentStatus -eq "failed") {
        "failed"
    }
    else {
        $agentStatus
    }

    $manifest.endedAt = (Get-Date).ToString("o")
    $manifest.processExitCode = $processExitCode
    $manifest.sourceIntegrityPassed = $sourceIntegrityPassed
    $manifest.outputIntegrityPassed = $outputIntegrityPassed
    $manifest.agentResultValid = $agentResultValid
    $manifest.agentChecksPassed = $agentChecksPassed
    $manifest.finalStatus = $finalStatus
    Write-JsonFile -Value $manifest -Path $manifestPath

    $decision = if ($finalStatus -eq "planned") {
        "Plan generated. Review terminal.log before starting the real task."
    }
    elseif ($finalStatus -in @("completed", "completed_with_warnings")) {
        "Automated work finished. Human review is still required; do not publish directly."
    }
    elseif ($finalStatus -eq "blocked") {
        "The task is blocked. Resolve agent-report.md blockers before starting the next batch."
    }
    else {
        "The task failed. Inspect source-integrity.json, agent-result.json, and terminal.log."
    }

    $summaryLines = @(
        "# Agent Run Summary",
        "",
        "- Run ID: $runId",
        "- Task: $Task",
        "- Final status: **$finalStatus**",
        "- Process exit code: $processExitCode",
        "- Source integrity passed: $sourceIntegrityPassed",
        "- Output integrity passed: $outputIntegrityPassed",
        "- Agent result valid: $agentResultValid",
        "- Agent checks passed: $agentChecksPassed",
        "- Agent reported status: $agentStatus",
        "- Result validation error: $resultError",
        "- Invocation error: $invocationError",
        "- Terminal log: terminal.log",
        "- Agent report present: $(Test-Path -LiteralPath $agentReportPath)",
        "",
        "## Decision",
        "",
        $decision
    )
    $summary = $summaryLines -join [Environment]::NewLine
    Set-Content -Encoding utf8 -LiteralPath $summaryPath -Value $summary

    if ($finalStatus -eq "failed") {
        throw "Agent task failed. Inspect: $summaryPath"
    }
}
finally {
    # Keep the caller's existing Claude Code provider configuration unchanged.
}







