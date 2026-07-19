@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0build-data-index.ps1"
