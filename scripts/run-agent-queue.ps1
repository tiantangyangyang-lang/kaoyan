param(
    [Parameter(Mandatory = $true)]
    [string]$QueuePath,

    [switch]$PrepareOnly,

    [switch]$ContinueOnError,

    [ValidateRange(1, 1000)]
    [int]$StartAt = 1,

    [ValidateRange(0, 1000)]
    [int]$Limit = 0
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding = [Console]::OutputEncoding

if (-not $PrepareOnly -and ($env:CODEX_THREAD_ID -or $env:CODEX_SHELL)) {
    throw "run-agent-queue.ps1 must execute from a regular CMD terminal outside Codex/Claude sessions. Use -PrepareOnly here, or launch it from an external terminal."
}

$projectRoot = Split-Path -Parent $PSScriptRoot
$resolvedQueuePath = if ([System.IO.Path]::IsPathRooted($QueuePath)) {
    $QueuePath
}
else {
    Join-Path $projectRoot $QueuePath
}

if (-not (Test-Path -LiteralPath $resolvedQueuePath)) {
    throw "Queue file not found: $resolvedQueuePath"
}
$resolvedQueuePath = (Resolve-Path -LiteralPath $resolvedQueuePath).Path

$runTaskScript = Join-Path $PSScriptRoot "run-agent-task.ps1"
if (-not (Test-Path -LiteralPath $runTaskScript)) {
    throw "Missing runner script: $runTaskScript"
}

$queue = Get-Content -Raw -Encoding utf8 -LiteralPath $resolvedQueuePath | ConvertFrom-Json
if ($queue.schemaVersion -ne "agent-queue-v1") {
    throw "Unsupported queue schemaVersion: $($queue.schemaVersion)"
}

$entries = @($queue.tasks)
if ($entries.Count -eq 0) {
    throw "Queue file contains no tasks: $resolvedQueuePath"
}

$continueOnErrorEffective = if ($PSBoundParameters.ContainsKey("ContinueOnError")) {
    [bool]$ContinueOnError
}
elseif ($null -ne $queue.defaultContinueOnError) {
    [bool]$queue.defaultContinueOnError
}
else {
    $false
}

$allowedTasks = @(
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
)

function Get-RunDirectories {
    param([string]$Root)

    if (-not (Test-Path -LiteralPath $Root)) {
        return @()
    }

    return @(Get-ChildItem -LiteralPath $Root -Directory | Select-Object -ExpandProperty FullName)
}

function Read-ManifestStatus {
    param([string]$RunDirectory)

    $manifestPath = Join-Path $RunDirectory "run-manifest.json"
    if (-not (Test-Path -LiteralPath $manifestPath)) {
        return $null
    }

    try {
        return (Get-Content -Raw -Encoding utf8 -LiteralPath $manifestPath | ConvertFrom-Json).finalStatus
    }
    catch {
        return $null
    }
}

$selectedEntries = @()
for ($index = $StartAt - 1; $index -lt $entries.Count; $index++) {
    if ($Limit -gt 0 -and $selectedEntries.Count -ge $Limit) {
        break
    }
    $selectedEntries += [pscustomobject]@{
        queueIndex = $index + 1
        entry = $entries[$index]
    }
}

if ($selectedEntries.Count -eq 0) {
    throw "No queue entries selected. StartAt=$StartAt Limit=$Limit"
}

$queueName = if ($queue.queueName) { [string]$queue.queueName } else { [System.IO.Path]::GetFileNameWithoutExtension($resolvedQueuePath) }
$safeQueueName = ($queueName -replace '[^A-Za-z0-9._-]', '-').Trim('-')
if (-not $safeQueueName) {
    $safeQueueName = "agent-queue"
}

$queueReportRoot = Join-Path $projectRoot "content\reports\agent-queues"
New-Item -ItemType Directory -Force -Path $queueReportRoot | Out-Null

$queueRunId = "{0}-{1}" -f (Get-Date -Format "yyyyMMdd-HHmmss"), $safeQueueName
$queueRunDir = Join-Path $queueReportRoot $queueRunId
New-Item -ItemType Directory -Force -Path $queueRunDir | Out-Null

$queueLogPath = Join-Path $queueRunDir "queue-log.md"
$queueResultsPath = Join-Path $queueRunDir "queue-results.json"
$queueSummaryPath = Join-Path $queueRunDir "queue-summary.md"

$queueLog = [System.Collections.Generic.List[string]]::new()
$queueLog.Add("# Agent Queue Log")
$queueLog.Add("")
$queueLog.Add("- Queue name: $queueName")
$queueLog.Add("- Queue file: $resolvedQueuePath")
$queueLog.Add("- Queue run directory: $queueRunDir")
$queueLog.Add("- Prepare only: $([bool]$PrepareOnly)")
$queueLog.Add("- Continue on error: $continueOnErrorEffective")
$queueLog.Add("- Selected entries: $($selectedEntries.Count)")
$queueLog.Add("")

$results = [System.Collections.Generic.List[object]]::new()
$agentRunRoot = Join-Path $projectRoot "content\reports\agent-runs"
$stoppedEarly = $false

foreach ($selection in $selectedEntries) {
    $entry = $selection.entry
    $queueIndex = [int]$selection.queueIndex
    $taskName = [string]$entry.task
    if ($taskName -notin $allowedTasks) {
        throw "Unsupported queue task '$taskName' at index $queueIndex."
    }

    $maxTurns = if ($null -ne $entry.maxTurns -and [int]$entry.maxTurns -gt 0) {
        [int]$entry.maxTurns
    }
    else {
        60
    }

    $yearValue = 0
    if ($null -ne $entry.year -and "$($entry.year)".Trim()) {
        $yearValue = [int]$entry.year
    }

    $label = if ($entry.label) { [string]$entry.label } else { $taskName }
    $planOnly = [bool]$entry.planOnly

    $queueLog.Add("## [$queueIndex] $label")
    $queueLog.Add("")
    $queueLog.Add("- Task: $taskName")
    if ($yearValue -gt 0) {
        $queueLog.Add("- Year: $yearValue")
    }
    $queueLog.Add("- Max turns: $maxTurns")
    $queueLog.Add("- Plan only: $planOnly")
    $queueLog.Add("- Prepare only: $([bool]$PrepareOnly)")

    $args = @(
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-File", $runTaskScript,
        "-Task", $taskName,
        "-MaxTurns", $maxTurns.ToString()
    )
    if ($yearValue -gt 0) {
        $args += @("-Year", $yearValue.ToString())
    }
    if ($planOnly) {
        $args += "-PlanOnly"
    }
    if ($PrepareOnly) {
        $args += "-PrepareOnly"
    }

    $beforeRuns = Get-RunDirectories -Root $agentRunRoot
    $startedAt = (Get-Date).ToString("o")
    $exitCode = 1
    $runDirectory = $null
    $manifestStatus = $null
    $resultStatus = "failed"

    Push-Location $projectRoot
    try {
        & powershell.exe @args
        $exitCode = $LASTEXITCODE
    }
    finally {
        Pop-Location
    }

    $afterRuns = Get-RunDirectories -Root $agentRunRoot
    $newRuns = @($afterRuns | Where-Object { $_ -notin $beforeRuns } | Sort-Object)
    if ($newRuns.Count -gt 0) {
        $newRun = $newRuns[-1]
        $runDirectory = $newRun
        $manifestStatus = Read-ManifestStatus -RunDirectory $runDirectory
    }

    if ($exitCode -eq 0) {
        $resultStatus = if ($manifestStatus) { $manifestStatus } else { "completed" }
    }

    $results.Add([ordered]@{
        queueIndex = $queueIndex
        label = $label
        task = $taskName
        year = if ($yearValue -gt 0) { $yearValue } else { $null }
        planOnly = $planOnly
        prepareOnly = [bool]$PrepareOnly
        startedAt = $startedAt
        endedAt = (Get-Date).ToString("o")
        exitCode = $exitCode
        resultStatus = $resultStatus
        manifestStatus = $manifestStatus
        runDirectory = $runDirectory
    })

    $queueLog.Add("- Exit code: $exitCode")
    $queueLog.Add("- Run directory: $runDirectory")
    $queueLog.Add("- Manifest status: $manifestStatus")
    $queueLog.Add("")

    $entryFailed = (
        $exitCode -ne 0 -or
        $resultStatus -in @("blocked", "failed")
    )
    if ($entryFailed -and -not $continueOnErrorEffective) {
        $queueLog.Add("Queue stopped after entry $queueIndex because the task failed or was blocked and ContinueOnError is false.")
        $queueLog.Add("")
        $stoppedEarly = $true
        break
    }
}

$completedCount = @($results | Where-Object {
    $_.exitCode -eq 0 -and
    $_.resultStatus -notin @("blocked", "failed")
}).Count
$failedCount = @($results | Where-Object {
    $_.exitCode -ne 0 -or
    $_.resultStatus -in @("blocked", "failed")
}).Count
$queueStatus = if ($failedCount -gt 0) {
    if ($stoppedEarly) { "stopped_on_error" } else { "completed_with_failures" }
}
elseif ($PrepareOnly) {
    "prepared"
}
else {
    "completed"
}

$queuePayload = [ordered]@{
    schemaVersion = "agent-queue-run-v1"
    queueName = $queueName
    queueFile = $resolvedQueuePath
    queueRunDirectory = $queueRunDir
    prepareOnly = [bool]$PrepareOnly
    continueOnError = $continueOnErrorEffective
    startAt = $StartAt
    limit = $Limit
    selectedCount = $selectedEntries.Count
    completedCount = $completedCount
    failedCount = $failedCount
    finalStatus = $queueStatus
    entries = @($results)
}

$queuePayload | ConvertTo-Json -Depth 8 | Set-Content -Encoding utf8 -LiteralPath $queueResultsPath
$queueLog | Set-Content -Encoding utf8 -LiteralPath $queueLogPath

$summary = @(
    "# Agent Queue Summary",
    "",
    "- Queue name: $queueName",
    "- Queue file: $resolvedQueuePath",
    "- Queue run directory: $queueRunDir",
    "- Final status: **$queueStatus**",
    "- Selected entries: $($selectedEntries.Count)",
    "- Successful entries: $completedCount",
    "- Failed entries: $failedCount",
    "- Prepare only: $([bool]$PrepareOnly)",
    "- Continue on error: $continueOnErrorEffective",
    "",
    "## Next Check",
    "",
    "1. Read queue-log.md for per-entry details.",
    "2. Open each runDirectory final-summary.md before moving to the next human-review step.",
    "3. If this was a prepared queue, launch the same queue outside Codex in a local shell where Claude Code may run."
) -join [Environment]::NewLine
$summary | Set-Content -Encoding utf8 -LiteralPath $queueSummaryPath

Write-Host "Queue: $queueName"
Write-Host "Queue file: $resolvedQueuePath"
Write-Host "Queue run directory: $queueRunDir"
Write-Host "Final status: $queueStatus"
Write-Host "Successful entries: $completedCount"
Write-Host "Failed entries: $failedCount"

if ($failedCount -gt 0) {
    throw "Queue run finished with failures. Inspect: $queueSummaryPath"
}
