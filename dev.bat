@echo off
:: ─────────────────────────────────────────────────────────────────────────────
:: dev.bat  –  GroceryRecipe local development server (Windows)
::
:: Usage:
::   dev.bat          (default port 8080)
::   dev.bat 3000     (custom port)
:: ─────────────────────────────────────────────────────────────────────────────
setlocal enabledelayedexpansion

:: Move to the project root (same directory as this script)
cd /d "%~dp0"

set "PORT=%~1"
if "%PORT%"=="" set "PORT=8080"

echo.
echo   GroceryRecipe - Dev Server
echo   ──────────────────────────────

:: ── Pick a server ─────────────────────────────────────────
where python3 >nul 2>&1
if %errorlevel%==0 (
    python3 -c "import sys; exit(0 if sys.version_info[0]==3 else 1)" 2>nul
    if !errorlevel!==0 (
        echo   Server : python3 -m http.server
        set "SERVER=python3 -m http.server %PORT%"
        goto :found
    )
)

where python >nul 2>&1
if %errorlevel%==0 (
    python -c "import sys; exit(0 if sys.version_info[0]==3 else 1)" 2>nul
    if !errorlevel!==0 (
        echo   Server : python -m http.server
        set "SERVER=python -m http.server %PORT%"
        goto :found
    )
)

where npx >nul 2>&1
if %errorlevel%==0 (
    echo   Server : npx serve
    set "SERVER=npx --yes serve -l %PORT% ."
    goto :found
)

echo.
echo   No suitable HTTP server found.
echo     Please install Python 3  -  https://python.org
echo     Or Node.js / npx          -  https://nodejs.org
echo.
exit /b 1

:found
set "URL=http://localhost:%PORT%"
echo   URL    : %URL%
echo   Root   : %~dp0
echo   Stop   : Ctrl+C
echo.

:: ── Open browser after a short delay ──────────────────────
start "" cmd /c "timeout /t 2 /nobreak >nul & start %URL%"

:: ── Start server ───────────────────────────────────────────
%SERVER%

endlocal
