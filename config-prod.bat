@echo off
chcp 65001 >nul
cls
echo.
echo ================================================
echo   🚀 API - CONFIGURAÇÃO PARA PRODUÇÃO
echo ================================================
echo.
echo ⚠️  ATENÇÃO: Isso vai configurar para PRODUÇÃO!
echo.
echo    API:      localhost:3000 (rede local VPS)
echo    Frontend: localhost:80 (rede local VPS)
echo.
set /p confirm="Tem certeza? (S/N): "
if /i not "%confirm%"=="S" (
    echo.
    echo ❌ Configuração cancelada.
    pause
    exit /b 0
)

echo.
echo Configurando API para PRODUÇÃO (rede local VPS)...
echo.

REM ===================================
REM Backend - api
REM ===================================
echo [1/1] Configurando Backend (.env)...
cd /d "%~dp0"

REM Atualizar variáveis no .env
powershell -Command "(Get-Content .env) -replace 'HOST=.*', 'HOST=127.0.0.1' | Set-Content .env.tmp; Move-Item -Force .env.tmp .env"
powershell -Command "(Get-Content .env) -replace 'ALLOWED_IPS=.*', 'ALLOWED_IPS=127.0.0.1,localhost,::1' | Set-Content .env.tmp; Move-Item -Force .env.tmp .env"
powershell -Command "(Get-Content .env) -replace 'FRONTEND_URL=.*', 'FRONTEND_URL=http://localhost' | Set-Content .env.tmp; Move-Item -Force .env.tmp .env"

if %errorlevel% equ 0 (
    echo    ✅ Backend configurado para rede local
) else (
    echo    ❌ Erro ao configurar backend
    pause
    exit /b 1
)

if %errorlevel% equ 0 (
    echo    ✅ Backend configurado para rede local
) else (
    echo    ❌ Erro ao configurar backend
    pause
    exit /b 1
)

echo.
echo ================================================
echo   ✅ API CONFIGURADA PARA PRODUÇÃO!
echo ================================================
echo.
echo   API:      localhost:3000 (rede local)
echo   Frontend: localhost:80 (rede local)
echo.
echo   📋 PRÓXIMOS PASSOS:
echo.
echo   1. Configurar Supabase Coolify:
echo      - ADDITIONAL_REDIRECT_URLS=https://samm.host/auth*,https://samm.host/*
echo      - GOTRUE_SITE_URL=https://samm.host
echo.
echo   2. Configurar SMTP no Supabase (OBRIGATÓRIO):
echo      - SMTP_HOST=smtp.sendgrid.net
echo      - SMTP_PORT=587
echo      - SMTP_USER=apikey
echo      - SMTP_PASS=SUA_API_KEY
echo      - SMTP_SENDER=noreply@samm.host
echo.
echo   3. Subir API na VPS:
echo      cd api
echo      npm start
echo      (ou pm2 start server.js --name aji-api)
echo.
echo   4. Configurar firewall:
echo      sudo ufw deny 3000    (bloquear API externamente)
echo      sudo ufw allow 80     (frontend)
echo      sudo ufw allow 443    (HTTPS)
echo.
echo   5. Configurar Nginx apenas para frontend:
echo      Server na porta 443 apontando para localhost:80
echo.
echo ================================================
echo.
pause
