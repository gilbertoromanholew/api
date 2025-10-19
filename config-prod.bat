@echo off
chcp 65001 >nul
cls
echo.
echo ================================================
echo   🚀 CONFIGURAÇÃO PARA PRODUÇÃO
echo ================================================
echo.
echo ⚠️  ATENÇÃO: Isso vai configurar para PRODUÇÃO!
echo.
echo    Frontend: https://samm.host
echo    API:      https://api.samm.host
echo.
set /p confirm="Tem certeza? (S/N): "
if /i not "%confirm%"=="S" (
    echo.
    echo ❌ Configuração cancelada.
    pause
    exit /b 0
)

echo.
echo Configurando ambiente para PRODUÇÃO...
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
echo # API Backend ^(Express^) - PRODUÇÃO
echo VITE_API_URL=https://api.samm.host
echo.
echo # ⚠️ SUPABASE REMOVIDO DO FRONTEND
echo # Todas as operações agora passam pela API backend
) > .env

if %errorlevel% equ 0 (
    echo    ✅ Frontend configurado para https://api.samm.host
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
powershell -Command "(Get-Content .env) -replace 'FRONTEND_URL=.*', 'FRONTEND_URL=https://samm.host' | Set-Content .env"

if %errorlevel% equ 0 (
    echo    ✅ Backend configurado para https://samm.host
) else (
    echo    ❌ Erro ao configurar backend
    pause
    exit /b 1
)

REM ===================================
REM Atualizar CORS no server.js
REM ===================================
echo.
echo [IMPORTANTE] Atualizando CORS no server.js...
echo.
echo ⚠️  ATENÇÃO: Você precisa adicionar manualmente no server.js:
echo.
echo    origin: [
echo        'https://samm.host',           // ^<-- ADICIONAR
echo        'https://api.samm.host',
echo        // ... resto
echo    ]
echo.

echo.
echo ================================================
echo   ✅ CONFIGURAÇÃO PARA PRODUÇÃO COMPLETA!
echo ================================================
echo.
echo   Frontend: https://samm.host
echo   API:      https://api.samm.host
echo.
echo   📋 PRÓXIMOS PASSOS:
echo.
echo   1. Adicionar 'https://samm.host' no CORS do server.js
echo.
echo   2. Configurar Supabase Coolify:
echo      - ADDITIONAL_REDIRECT_URLS=https://samm.host/auth*,https://samm.host/*
echo      - GOTRUE_SITE_URL=https://samm.host
echo.
echo   3. Configurar SMTP no Supabase ^(OBRIGATÓRIO^):
echo      - SMTP_HOST=smtp.sendgrid.net
echo      - SMTP_PORT=587
echo      - SMTP_USER=apikey
echo      - SMTP_PASS=SUA_API_KEY
echo      - SMTP_SENDER=noreply@samm.host
echo.
echo   4. Build do frontend:
echo      cd tools-website-builder
echo      npm run build
echo.
echo   5. Subir API:
echo      cd api
echo      npm start
echo      ^(ou pm2 start server.js --name aji-api^)
echo.
echo ================================================
echo.
pause
