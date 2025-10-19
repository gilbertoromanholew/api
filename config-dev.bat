@echo off
chcp 65001 >nul
cls
echo.
echo ================================================
echo   🔧 CONFIGURAÇÃO PARA DESENVOLVIMENTO
echo ================================================
echo.
echo Configurando ambiente para LOCALHOST...
echo.

REM ===================================
REM Frontend - tools-website-builder
REM ===================================
echo [1/2] Configurando Frontend (.env)...
cd /d "%~dp0..\tools-website-builder"

(
echo # Frontend - Vue App
echo VITE_APP_NAME="AJI - Assessora Jurídica Inteligente"
echo VITE_APP_VERSION=2.0.0
echo.
echo # API Backend ^(Express^)
echo VITE_API_URL=http://localhost:3000
echo.
echo # ⚠️ SUPABASE REMOVIDO DO FRONTEND
echo # Todas as operações agora passam pela API backend
) > .env

if %errorlevel% equ 0 (
    echo    ✅ Frontend configurado para localhost:3000
) else (
    echo    ❌ Erro ao configurar frontend
    pause
    exit /b 1
)

REM ===================================
REM Backend - api
REM ===================================
echo.
echo [2/2] Configurando Backend (.env)...
cd /d "%~dp0"

REM Ler o arquivo .env atual e modificar apenas FRONTEND_URL
powershell -Command "(Get-Content .env) -replace 'FRONTEND_URL=.*', 'FRONTEND_URL=http://localhost:5173' | Set-Content .env"

if %errorlevel% equ 0 (
    echo    ✅ Backend configurado para localhost:5173
) else (
    echo    ❌ Erro ao configurar backend
    pause
    exit /b 1
)

echo.
echo ================================================
echo   ✅ CONFIGURAÇÃO PARA DESENVOLVIMENTO COMPLETA!
echo ================================================
echo.
echo   Frontend: http://localhost:5173
echo   API:      http://localhost:3000
echo.
echo   Para iniciar os servidores:
echo   - Frontend: cd tools-website-builder ^&^& npm run dev
echo   - Backend:  cd api ^&^& npm start
echo.
echo ================================================
echo.
pause
