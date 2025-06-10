@echo off
echo ========================================
echo    Starting CryptoRizz ChatBot (FIXED)
echo ========================================
echo.

:: Check if Python is installed
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in your PATH.
    echo Please install Python from https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

:: Run the enhanced starter script
python start_fixed.py

:: If server exits with error
if %errorlevel% neq 0 (
    echo.
    echo ERROR: The chatbot server exited with an error.
    echo Please check the output above for details.
    echo.
    pause
) 