@echo off
chcp 65001 >nul
cd /d "%~dp0"
set "MATCHA_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not exist "%MATCHA_NODE%" set "MATCHA_NODE=node"
"%MATCHA_NODE%" server.js --open
pause
