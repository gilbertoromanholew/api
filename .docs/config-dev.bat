@echo off
chcp 65001 >nul
cls
echo.
echo ================================================
echo   🏠 API - CONFIGURAÇÃO PARA DESENVOLVIMENTO
echo ================================================
echo.
echo Configurando API para LOCALHOST...
echo.

REM ===================================
REM Backend - api
REM ===================================
echo [1/1] Configurando Backend (.env)...
cd /d "%~dp0"

REM Atualizar variáveis no .env
powershell -Command "(Get-Content .env) -replace 'HOST=.*', 'HOST=0.0.0.0' | Set-Content .env.tmp; Move-Item -Force .env.tmp .env"
powershell -Command "(Get-Content .env) -replace 'ALLOWED_IPS=.*', 'ALLOWED_IPS=*' | Set-Content .env.tmp; Move-Item -Force .env.tmp .env"
powershell -Command "(Get-Content .env) -replace 'FRONTEND_URL=.*', 'FRONTEND_URL=http://localhost:5173' | Set-Content .env.tmp; Move-Item -Force .env.tmp .env"

if %errorlevel% equ 0 (
    echo    ✅ Backend configurado para localhost:5173
) else (
    echo    ❌ Erro ao configurar backend
    pause
    exit /b 1
)

echo.
echo ================================================
echo   ✅ API CONFIGURADA PARA DESENVOLVIMENTO!
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
