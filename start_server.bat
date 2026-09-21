@echo off
echo ============================================================
echo   GLACIERWATCH FIELD OPERATIONS CONSOLE
echo   Unified Server (Frontend + ML Inference Engine + ESP Receiver)
echo ============================================================
echo.
echo Opening: http://127.0.0.1:8000
echo.

cd /d "%~dp0"

if exist ".venv\Scripts\python.exe" (
    .venv\Scripts\python.exe -m uvicorn server.main:app --host 127.0.0.1 --port 8000
) else (
    python -m uvicorn server.main:app --host 127.0.0.1 --port 8000
)
pause
