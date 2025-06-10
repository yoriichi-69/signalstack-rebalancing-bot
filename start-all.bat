@echo off
echo =============================================
echo    Starting CryptoRizz Application Suite
echo =============================================
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

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in your PATH.
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [1/3] Starting chatbot backend...
start cmd /k "title CryptoRizz ChatBot && cd chat-bot && python -c "import flask, flask_cors, requests" >nul 2>nul || (echo Installing dependencies... && pip install flask flask-cors requests python-dotenv) && python bot.py"

:: Wait 3 seconds for the chatbot to initialize
echo Waiting for chatbot to initialize...
timeout /t 3 /nobreak > nul

echo [2/3] Starting main backend...
cd backend || (
    echo ERROR: Failed to navigate to backend directory.
    echo Please run this script from the project root.
    echo.
    pause
    exit /b 1
)

start cmd /k "title CryptoRizz Backend && python app.py"

:: Wait 3 seconds for the backend to initialize
echo Waiting for backend to initialize...
timeout /t 3 /nobreak > nul

echo [3/3] Starting frontend...
cd ../frontend || (
    echo ERROR: Failed to navigate to frontend directory.
    echo Please run this script from the project root.
    echo.
    pause
    exit /b 1
)

:: Check if node_modules exists, if not, install dependencies
if not exist "node_modules\" (
    echo Installing frontend dependencies...
    npm install
)

echo Starting frontend server...
start cmd /k "title CryptoRizz Frontend && npm start"

echo.
echo =============================================
echo    All CryptoRizz services started!
echo =============================================
echo.
echo [INFO] The application will open in your browser
echo [INFO] To stop all services, close each terminal window
echo.
pause 