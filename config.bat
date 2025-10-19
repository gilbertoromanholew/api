@echo off
chcp 65001 >nul
cls
echo.
echo ================================================
echo   📋 MENU DE CONFIGURAÇÃO - AJI
echo ================================================
echo.
echo   Escolha o ambiente:
echo.
echo   [1] 🏠 DESENVOLVIMENTO (localhost)
echo   [2] 🚀 PRODUÇÃO (samm.host)
echo   [3] ❌ Sair
echo.
echo ================================================
echo.

set /p escolha="Escolha uma opção (1-3): "

if "%escolha%"=="1" (
    cls
    call "%~dp0config-dev.bat"
) else if "%escolha%"=="2" (
    cls
    call "%~dp0config-prod.bat"
) else if "%escolha%"=="3" (
    echo.
    echo 👋 Até logo!
    timeout /t 2 >nul
    exit /b 0
) else (
    echo.
    echo ❌ Opção inválida!
    timeout /t 2 >nul
    call "%~dp0config.bat"
)
