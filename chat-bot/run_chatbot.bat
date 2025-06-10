@echo off
echo *********************************************
echo *   CryptoRizz Chatbot - Enhanced Version   *
echo *********************************************
echo.
echo Starting chatbot with mock data mode...
echo This version works without any API keys!
echo.

:: Set the environment variable for Python script
set MOCK_DATA_MODE=true

:: Run the bot
python bot.py

:: If server exits with error
if %errorlevel% neq 0 (
    echo.
    echo ERROR: The chatbot server exited with an error.
    echo Please check the output above for details.
    echo.
    pause
) 