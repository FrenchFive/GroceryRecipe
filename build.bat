@echo off
:: ─────────────────────────────────────────────────────────────────────────────
:: build.bat  –  GroceryRecipe production build / release export (Windows)
::
:: Creates a self-contained dist\ folder, a timestamped zip archive in
:: release\, and optionally an Android APK via Capacitor.
::
:: Usage:
::   build.bat            # web build only
::   build.bat --apk      # web build + Android debug APK
::
:: Prerequisites for --apk:
::   - Node.js >= 18,  npm
::   - Java 17+
::   - Android SDK with ANDROID_HOME / ANDROID_SDK_ROOT set
::   - Capacitor packages installed (run: npm install)
:: ─────────────────────────────────────────────────────────────────────────────
setlocal enabledelayedexpansion

:: Move to the project root (same directory as this script)
cd /d "%~dp0"
set "SCRIPT_DIR=%~dp0"
:: Remove trailing backslash
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

:: Generate a timestamp version string: YYYYMMDD-HHMMSS
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value 2^>nul') do set "DT=%%I"
set "VERSION=%DT:~0,4%%DT:~4,2%%DT:~6,2%-%DT:~8,2%%DT:~10,2%%DT:~12,2%"

set "DIST=%SCRIPT_DIR%\dist"
set "RELEASE_DIR=%SCRIPT_DIR%\release"
set "BUILD_APK=false"

:: ── Parse flags ───────────────────────────────────────────
for %%A in (%*) do (
    if "%%A"=="--apk" set "BUILD_APK=true"
)

echo.
echo   GroceryRecipe - Build
echo   ─────────────────────────
echo   Version : %VERSION%
echo   APK     : %BUILD_APK%
echo.

:: ── 1. Clean ^& create dist\ ───────────────────────────────
echo   Cleaning dist\ ...
if exist "%DIST%" rmdir /s /q "%DIST%"
mkdir "%DIST%\css"
mkdir "%DIST%\js"
mkdir "%DIST%\icons"

:: ── 2. Copy app files ─────────────────────────────────────
echo   Copying app files ...
copy "%SCRIPT_DIR%\index.html"    "%DIST%\" >nul
copy "%SCRIPT_DIR%\manifest.json" "%DIST%\" >nul
copy "%SCRIPT_DIR%\css\style.css" "%DIST%\css\" >nul
copy "%SCRIPT_DIR%\js\db.js"      "%DIST%\js\" >nul
copy "%SCRIPT_DIR%\js\app.js"     "%DIST%\js\" >nul
copy "%SCRIPT_DIR%\icons\*.png"   "%DIST%\icons\" >nul

:: ── 3. Write service worker with versioned cache name ─────
echo   Stamping service worker cache: grocery-recipe-%VERSION% ...

:: Use PowerShell for the regex replacement (equivalent of sed)
powershell -NoProfile -Command ^
  "(Get-Content '%SCRIPT_DIR%\sw.js' -Raw) -replace 'grocery-recipe-[^'']*', 'grocery-recipe-%VERSION%' | Set-Content -NoNewline '%DIST%\sw.js'"

:: ── 4. Create release archive ─────────────────────────────
if not exist "%RELEASE_DIR%" mkdir "%RELEASE_DIR%"

set "ARCHIVE="

:: Try PowerShell's Compress-Archive (available on Windows 10+)
where powershell >nul 2>&1
if %errorlevel%==0 (
    set "ARCHIVE=%RELEASE_DIR%\GroceryRecipe-%VERSION%.zip"
    echo   Creating zip: GroceryRecipe-%VERSION%.zip ...
    powershell -NoProfile -Command ^
      "Compress-Archive -Path '%DIST%\*' -DestinationPath '!ARCHIVE!' -Force"
    goto :archive_done
)

:: Fallback: try tar (available on Windows 10 1803+)
where tar >nul 2>&1
if %errorlevel%==0 (
    set "ARCHIVE=%RELEASE_DIR%\GroceryRecipe-%VERSION%.zip"
    echo   Creating zip: GroceryRecipe-%VERSION%.zip ...
    tar -a -cf "!ARCHIVE!" -C "%DIST%" .
    goto :archive_done
)

echo   zip / tar not found - skipping archive creation.
set "ARCHIVE=%DIST% (no archive)"

:archive_done

:: ── 5. Capacitor Android APK ─────────────────────────────
set "APK_PATH="
if "%BUILD_APK%"=="true" (
    echo.
    echo   Building Android APK ...
    echo   ──────────────────────────

    :: Sync web assets into the native project
    echo   Syncing Capacitor ...
    call npx cap sync android
    if !errorlevel! neq 0 (
        echo   Capacitor sync failed.
        goto :apk_done
    )

    :: Build debug APK via Gradle
    echo   Gradle assembleDebug ...
    cd /d "%SCRIPT_DIR%\android"
    call gradlew.bat assembleDebug --no-daemon
    if !errorlevel! neq 0 (
        echo   Gradle build failed.
        cd /d "%SCRIPT_DIR%"
        goto :apk_done
    )

    :: Locate the APK
    set "APK_SRC=%SCRIPT_DIR%\android\app\build\outputs\apk\debug\app-debug.apk"
    if exist "!APK_SRC!" (
        set "APK_PATH=%RELEASE_DIR%\GroceryRecipe-%VERSION%.apk"
        copy "!APK_SRC!" "!APK_PATH!" >nul
        echo   APK copied: GroceryRecipe-%VERSION%.apk
    ) else (
        echo   APK not found at expected path.
        echo       Check android\app\build\outputs\apk\ for output.
    )
    cd /d "%SCRIPT_DIR%"
)

:apk_done

:: ── 6. Summary ────────────────────────────────────────────
echo.
echo   Build complete!
echo.
echo   Output   : %DIST%\
echo   Archive  : %ARCHIVE%
if defined APK_PATH (
    echo   APK      : %APK_PATH%
)
echo.
echo   ──  Deploy options  ──────────────────────────────────
echo   GitHub Pages  :  push dist\ contents to the gh-pages branch
echo   Netlify       :  drag-and-drop the dist\ folder at app.netlify.com
echo   Vercel        :  run  vercel dist\  from this directory
echo   Any static    :  upload all files in dist\ to your web server
if "%BUILD_APK%"=="true" (
    echo   Android       :  install the APK from release\ on your device
)
echo   ─────────────────────────────────────────────────────
echo.

endlocal
