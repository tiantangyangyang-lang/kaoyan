@echo off
setlocal
cd /d "%~dp0\..\.."
call scripts\launch-agent-queue-external.cmd -QueuePath D:\work\kaoyan\content\queues\math1-md-finalize-all.json
