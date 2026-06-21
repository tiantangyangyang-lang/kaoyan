@echo off
setlocal

if "%~1"=="" (
  echo Usage: %~nx0 -QueuePath ^<path-to-queue.json^> [additional run-agent-queue args]
  exit /b 1
)

for %%I in ("%~dp0..") do set "PROJECT_ROOT=%%~fI"

start "Claude Queue Runner" /d "%PROJECT_ROOT%" cmd /k "call scripts\run-agent-queue.cmd %*"
