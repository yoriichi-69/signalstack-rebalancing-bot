@echo off
echo ========================================
echo    Starting CryptoRizz ChatBot Backend
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

:: Navigate to chat-bot directory
cd chat-bot || (
    echo ERROR: Failed to navigate to chat-bot directory.
    echo Please run this script from the project root.
    echo.
    pause
    exit /b 1
)

:: Check for required dependencies
echo Checking for required dependencies...
python -c "import flask, flask_cors, requests, langchain" >nul 2>nul
if %errorlevel% neq 0 (
    echo Installing required dependencies...
    pip install flask flask-cors langchain langchain_openai langchain_community langchain_huggingface requests python-dotenv
)

echo.
echo Starting chatbot server on port 6502...
echo.
echo [INFO] To interact with the chatbot:
echo   1. Open the CryptoRizz application in your browser
echo   2. Look for the chat button in the bottom-right corner
echo.
echo [INFO] To stop the server, press Ctrl+C
echo.

:: Start the server
python bot.py

:: If server exits with error
if %errorlevel% neq 0 (
    echo.
    echo ERROR: The chatbot server exited with an error.
    echo Please check the output above for details.
    echo.
    pause
) 