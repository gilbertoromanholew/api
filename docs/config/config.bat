@echo off
rem Define a página de código para UTF-8 para suportar caracteres especiais.
chcp 65001 >nul

rem Habilita a expansão de variável atrasada (necessário para :VER_CONFIG)
setlocal enabledelayedexpansion

title Configurador de Ambiente - AJI Tools
color 0A

:: ============================================
:: MENU PRINCIPAL
:: ============================================
:menu
cls
echo.
echo  ╔════════════════════════════════════════════════════════════════╗
echo  ║             🛠️  CONFIGURADOR DE AMBIENTE - AJI TOOLS 🛠️             ║
echo  ╚════════════════════════════════════════════════════════════════╝
echo.
echo  ┌────────────────────────────────────────────────────────────────┐
echo  │  MODO DE AMBIENTE                                              │
echo  ├────────────────────────────────────────────────────────────────┤
echo  │  [1] Configurar modo DESENVOLVIMENTO                            │
echo  │  [2] Configurar modo PRODUÇÃO                                  │
echo  │  [3] Ver configuração atual                                    │
echo  └────────────────────────────────────────────────────────────────┘
echo.
echo  ┌────────────────────────────────────────────────────────────────┐
echo  │  EXECUTAR SERVIÇOS                                             │
echo  ├────────────────────────────────────────────────────────────────┤
echo  │  [4] Iniciar API (Backend)                                      │
echo  │  [5] Iniciar Website (Frontend)                                 │
echo  │  [6] Iniciar AMBOS (API + Website)                              │
echo  └────────────────────────────────────────────────────────────────┘
echo.
echo  ┌────────────────────────────────────────────────────────────────┐
echo  │  UTILITÁRIOS                                                   │
echo  ├────────────────────────────────────────────────────────────────┤
echo  │  [7] Instalar dependências (npm install em todos os projetos)  │
echo  │  [8] Gerar Build de produção (Website)                          │
echo  │  [9] Limpar cache e node_modules                                │
echo  │  [0] Sair                                                       │
echo  └────────────────────────────────────────────────────────────────┘
echo.
set /p opcao="  👉 Escolha uma opção: "

if "%opcao%"=="1" goto CONFIG_DEV
if "%opcao%"=="2" goto CONFIG_PROD
if "%opcao%"=="3" goto VER_CONFIG
if "%opcao%"=="4" goto START_API
if "%opcao%"=="5" goto START_WEBSITE
if "%opcao%"=="6" goto START_BOTH
if "%opcao%"=="7" goto INSTALL_DEPS
if "%opcao%"=="8" goto BUILD_PROD
if "%opcao%"=="9" goto CLEAN_CACHE
if "%opcao%"=="0" goto EXIT

echo.
echo  ❌ Opção inválida! Tente novamente.
timeout /t 2 >nul
goto menu

:: ============================================
:: CONFIGURAR MODO DESENVOLVIMENTO
:: ============================================
:CONFIG_DEV
cls
echo.
echo  ╔════════════════════════════════════════════════════════════════╗
echo  ║  🔧 CONFIGURANDO MODO DESENVOLVIMENTO                            ║
echo  ╚════════════════════════════════════════════════════════════════╝
echo.

rem --- Configura a API para desenvolvimento ---
echo  📁 Configurando a API (Backend) para DEV...
echo  📂 Caminho: %~dp0api\dist-api
cd /d "%~dp0api\dist-api"

rem Verifica se o diretório existe
if not exist "%~dp0api\dist-api" (
    echo  ❌ ERRO: Diretório api\dist-api não encontrado!
    echo  📂 Caminho esperado: %~dp0api\dist-api
    pause
    goto menu
)

rem Remove o .env antigo se existir
if exist .env (
    echo  🗑️  Removendo .env antigo da API...
    del /f /q .env
)

echo  📝 Criando novo .env da API...
rem Criar arquivo .env linha por linha para maior confiabilidade
echo HOST=0.0.0.0> .env
echo PORT=3000>> .env
echo ALLOWED_IPS=127.0.0.1,localhost,::1,192.168.0.0/16,10.0.0.0/8> .env
echo FRONTEND_URL=http://localhost:5173>> .env
echo.>> .env
echo # Supabase Configuration>> .env
echo # DESENVOLVIMENTO: API acessa Supabase direto (sem proxy interno)>> .env
echo # URL para o backend se conectar>> .env
echo SUPABASE_URL=https://mpanel.samm.host>> .env
echo # URL interna para o proxy usar (em dev, usa mpanel direto)>> .env
echo SUPABASE_INTERNAL_URL=https://mpanel.samm.host>> .env
echo # Chaves de autenticacao (do Coolify)>> .env
echo SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MDgzNjAyMCwiZXhwIjo0OTE2NTA5NjIwLCJyb2xlIjoiYW5vbiJ9.xu-wG-XwUj9ONYoFnthyVk7rhm7HAoOGBH0CwicNdFw>> .env
echo SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MDgzNjAyMCwiZXhwIjo0OTE2NTA5NjIwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.5-gIzyxIrbWSRhrdPAOLpMf_xfoANe4JSpKjjOs4NiY>> .env
echo.>> .env
echo # Session Configuration>> .env
echo SESSION_SECRET=secret-de-desenvolvimento-com-pelo-menos-32-caracteres>> .env
echo SESSION_MAX_AGE=86400000>> .env
echo NODE_ENV=development>> .env

rem Verifica se o arquivo foi criado
if exist .env (
    echo  ✅ API configurada para DEV!
    echo  📄 Arquivo .env criado em: %~dp0api\dist-api\.env
) else (
    echo  ❌ ERRO: Falha ao criar .env da API!
    echo  📂 Diretório atual: %cd%
    echo  📂 Caminho do script: %~dp0
    pause
    goto menu
)
echo.

rem --- Configura o Website para desenvolvimento ---
echo  📁 Configurando o Website (Frontend) para DEV...
echo  📂 Caminho: %~dp0tools-website-builder
cd /d "%~dp0tools-website-builder"

rem Verifica se o diretório existe
if not exist "%~dp0tools-website-builder" (
    echo  ❌ ERRO: Diretório tools-website-builder não encontrado!
    echo  📂 Caminho esperado: %~dp0tools-website-builder
    pause
    goto menu
)

rem Remove o .env antigo se existir
if exist .env (
    echo  🗑️  Removendo .env antigo do Website...
    del /f /q .env
)

echo  📝 Criando novo .env do Website...
rem Criar arquivo .env linha por linha para maior confiabilidade
echo VITE_APP_NAME="AJI - Assessora Juridica Inteligente"> .env
echo VITE_APP_VERSION=2.0.0>> .env
echo VITE_API_URL=http://localhost:3000>> .env
echo # DESENVOLVIMENTO: Frontend acessa Supabase direto (sem proxy)>> .env
echo # API URL sem /api pois as rotas são diretas (/auth/session, não /api/auth/session)>> .env
echo VITE_SUPABASE_URL=https://mpanel.samm.host>> .env

rem Verifica se o arquivo foi criado
if exist .env (
    echo  ✅ Website configurado para DEV!
    echo  📄 Arquivo .env criado em: %~dp0tools-website-builder\.env
) else (
    echo  ❌ ERRO: Falha ao criar .env do Website!
    echo  📂 Diretório atual: %cd%
    echo  📂 Caminho do script: %~dp0
    pause
    goto menu
)
echo.

echo  ╔════════════════════════════════════════════════════════════════╗
echo  ║  ✅ MODO DESENVOLVIMENTO CONFIGURADO COM SUCESSO!                ║
echo  ╚════════════════════════════════════════════════════════════════╝
echo.
pause
goto menu

:: ============================================
:: CONFIGURAR MODO PRODUÇÃO
:: ============================================
:CONFIG_PROD
cls
echo.
echo  ╔════════════════════════════════════════════════════════════════╗
echo  ║  🚀 CONFIGURANDO MODO PRODUÇÃO                                  ║
echo  ╚════════════════════════════════════════════════════════════════╝
echo.
echo  ⚠️  ATENÇÃO: Isso irá SOBRESCREVER seus arquivos .env!
echo.
set /p confirma="  Deseja continuar? (S/N): "
if /i not "%confirma%"=="S" goto menu

rem --- Configura a API para producao ---
echo.
echo  📁 Configurando a API (Backend) para PROD...
echo  📂 Caminho: %~dp0api\dist-api
cd /d "%~dp0api\dist-api"

rem Verifica se o diretório existe
if not exist "%~dp0api\dist-api" (
    echo  ❌ ERRO: Diretório api\dist-api não encontrado!
    echo  📂 Caminho esperado: %~dp0api\dist-api
    pause
    goto menu
)

rem Remove o .env antigo se existir
if exist .env (
    echo  🗑️  Removendo .env antigo da API...
    del /f /q .env
)

echo  📝 Criando novo .env da API...
rem Criar arquivo .env linha por linha para maior confiabilidade
echo ALLOWED_IPS=10.244.0.0/16> .env
echo # Frontend está em samm.host, API em api.samm.host>> .env
echo FRONTEND_URL=https://samm.host>> .env
echo HOST=0.0.0.0>> .env
echo NODE_ENV=production>> .env
echo PORT=3000>> .env
echo SESSION_MAX_AGE=86400000>> .env
echo SESSION_SECRET=77750ce22daa1ae1d8b0d44e0c19fd5c1e32e80744a944459b9bb3d1470b344f>> .env
echo SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MDgzNjAyMCwiZXhwIjo0OTE2NTA5NjIwLCJyb2xlIjoiYW5vbiJ9.xu-wG-XwUj9ONYoFnthyVk7rhm7HAoOGBH0CwicNdFw>> .env
echo SUPABASE_INTERNAL_URL=http://supabase-kong:8000>> .env
echo SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MDgzNjAyMCwiZXhwIjo0OTE2NTA5NjIwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.5-gIzyxIrbWSRhrdPAOLpMf_xfoANe4JSpKjjOs4NiY>> .env
echo SUPABASE_URL=https://mpanel.samm.host>> .env

rem Verifica se o arquivo foi criado
if exist .env (
    echo  ✅ API configurada para PRODUCAO!
    echo  📄 Arquivo .env criado em: %~dp0api\dist-api\.env
) else (
    echo  ❌ ERRO: Falha ao criar .env da API!
    echo  📂 Diretório atual: %cd%
    echo  📂 Caminho do script: %~dp0
    pause
    goto menu
)
echo.

rem --- Configura o Website para producao ---
echo  📁 Configurando o Website (Frontend) para PROD...
echo  📂 Caminho: %~dp0tools-website-builder
cd /d "%~dp0tools-website-builder"

rem Verifica se o diretório existe
if not exist "%~dp0tools-website-builder" (
    echo  ❌ ERRO: Diretório tools-website-builder não encontrado!
    echo  📂 Caminho esperado: %~dp0tools-website-builder
    pause
    goto menu
)

rem Remove o .env antigo se existir
if exist .env (
    echo  🗑️  Removendo .env antigo do Website...
    del /f /q .env
)

echo  📝 Criando novo .env do Website...
rem Criar arquivo .env linha por linha para maior confiabilidade
echo VITE_APP_NAME="AJI - Assessora Juridica Inteligente"> .env
echo VITE_APP_VERSION=2.0.0>> .env
echo # API agora está em subdomínio separado: api.samm.host>> .env
echo VITE_API_URL=https://api.samm.host>> .env
echo VITE_SUPABASE_URL=https://mpanel.samm.host>> .env

rem Verifica se o arquivo foi criado
if exist .env (
    echo  ✅ Website configurado para PRODUCAO!
    echo  📄 Arquivo .env criado em: %~dp0tools-website-builder\.env
) else (
    echo  ❌ ERRO: Falha ao criar .env do Website!
    echo  📂 Diretório atual: %cd%
    echo  📂 Caminho do script: %~dp0
    pause
    goto menu
)
echo.

echo  ╔════════════════════════════════════════════════════════════════╗
echo  ║  ✅ MODO PRODUÇÃO CONFIGURADO COM SUCESSO!                      ║
echo  ╚════════════════════════════════════════════════════════════════╝
echo.
pause
goto menu

:: ============================================
:: VER CONFIGURAÇÃO ATUAL
:: ============================================
:VER_CONFIG
cls
echo.
echo  ╔════════════════════════════════════════════════════════════════╗
echo  ║  📋 CONFIGURAÇÃO ATUAL                                          ║
echo  ╚════════════════════════════════════════════════════════════════╝
echo.

:: Verificar API
echo  📁 API (Backend) [em api\dist-api]:
cd /d "%~dp0api\dist-api"
if exist .env (
    findstr /i "NODE_ENV" .env >nul
    if %errorlevel%==0 (
        for /f "tokens=1,* delims==" %%a in ('findstr /i "NODE_ENV" .env') do (
            set API_MODE=%%b
        )
        echo     NODE_ENV = !API_MODE!
    ) else (
        echo     ⚠️  NODE_ENV não encontrado no .env
    )
) else (
    echo     ❌ Arquivo .env não encontrado!
)

:: Verificar Website
echo.
echo  📁 Website (Frontend) [em tools-website-builder]:
cd /d "%~dp0tools-website-builder"
if exist .env (
    findstr /i "VITE_API_URL" .env >nul
    if %errorlevel%==0 (
        for /f "tokens=1,* delims==" %%a in ('findstr /i "VITE_API_URL" .env') do (
            set WEB_MODE=%%b
        )
        echo     VITE_API_URL = !WEB_MODE!
    ) else (
        echo     ⚠️  VITE_API_URL não encontrado no .env
    )
) else (
    echo     ❌ Arquivo .env não encontrado!
)

echo.
pause
goto menu

:: ============================================
:: INICIAR API
:: ============================================
:START_API
cls
echo  ╔════════════════════════════════════════════════════════════════╗
echo  ║  🚀 INICIANDO API (BACKEND)                                     ║
echo  ╚════════════════════════════════════════════════════════════════╝
echo.
echo URL: http://localhost:3000
echo Pressione CTRL+C na nova janela para parar.
echo.

cd /d "%~dp0api\dist-api"

rem Verifica se as dependencias estao instaladas
if not exist "node_modules" (
    echo  ⚠️  Dependencias nao encontradas. Instalando...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo  ❌ ERRO: Falha ao instalar dependencias!
        pause
        goto menu
    )
    echo.
    echo  ✅ Dependencias instaladas com sucesso!
    echo.
)

rem Roda o comando de start em uma nova janela
start "API Server" cmd /k "cd /d "%~dp0api\dist-api" && npm start"

echo  ✅ API iniciada em uma nova janela!
timeout /t 3 >nul
goto menu

:: ============================================
:: INICIAR WEBSITE
:: ============================================
:START_WEBSITE
cls
echo  ╔════════════════════════════════════════════════════════════════╗
echo  ║  🌐 INICIANDO WEBSITE (FRONTEND)                                ║
echo  ╚════════════════════════════════════════════════════════════════╝
echo.
echo URL: http://localhost:5173
echo Pressione CTRL+C na nova janela para parar.
echo.

cd /d "%~dp0tools-website-builder"

rem Verifica se as dependencias estao instaladas
if not exist "node_modules" (
    echo  ⚠️  Dependencias nao encontradas. Instalando...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo  ❌ ERRO: Falha ao instalar dependencias!
        pause
        goto menu
    )
    echo.
    echo  ✅ Dependencias instaladas com sucesso!
    echo.
)

rem Roda o comando de dev em uma nova janela
start "Website - Frontend" cmd /k "cd /d "%~dp0tools-website-builder" && npm run dev"

echo  ✅ Website iniciado em uma nova janela!
timeout /t 3 >nul
goto menu

:: ============================================
:: INICIAR AMBOS (API + WEBSITE)
:: ============================================
:START_BOTH
cls
echo  ╔════════════════════════════════════════════════════════════════╗
echo  ║  🚀 INICIANDO API + WEBSITE                                     ║
echo  ╚════════════════════════════════════════════════════════════════╝
echo.

rem Verifica dependencias da API
echo [1/2] Verificando dependencias da API (api\dist-api)...
cd /d "%~dp0api\dist-api"
if not exist "node_modules" (
    echo  ⚠️  Dependencias da API nao encontradas. Instalando...
    call npm install
    if %errorlevel% neq 0 (
        echo  ❌ ERRO: Falha ao instalar dependencias da API!
        pause
        goto menu
    )
    echo  ✅ Dependencias da API instaladas!
)

rem Verifica dependencias do Website
echo [2/2] Verificando dependencias do Website (tools-website-builder)...
cd /d "%~dp0tools-website-builder"
if not exist "node_modules" (
    echo  ⚠️  Dependencias do Website nao encontradas. Instalando...
    call npm install
    if %errorlevel% neq 0 (
        echo  ❌ ERRO: Falha ao instalar dependencias do Website!
        pause
        goto menu
    )
    echo  ✅ Dependencias do Website instaladas!
)
echo.

rem Abre uma nova janela do terminal para rodar a API (prod build).
echo Iniciando API (npm start)...
start "API Server (dist)" cmd /k "cd /d "%~dp0api\dist-api" && echo API (dist) rodando em http://localhost:3000 && npm start"

rem Aguarda um instante para a API comecar a subir.
timeout /t 2 >nul

rem Roda o website (dev mode) em outra janela.
echo Iniciando Website (npm run dev)...
start "Website - Frontend (dev)" cmd /k "cd /d "%~dp0tools-website-builder" && echo Website (dev) rodando em http://localhost:5173 && npm run dev"

echo.
echo  ╔════════════════════════════════════════════════════════════════╗
echo  ║  ✅ SERVIÇOS INICIADOS COM SUCESSO!                             ║
echo  ╚════════════════════════════════════════════════════════════════╝
echo.
echo  📡 API (Backend):   http://localhost:3000
echo  🎨 Website (Frontend): http://localhost:5173
echo.
pause
goto menu

:: ============================================
:: INSTALAR DEPENDÊNCIAS
:: ============================================
:INSTALL_DEPS
cls
echo.
echo  ╔════════════════════════════════════════════════════════════════╗
echo  ║  📦 INSTALANDO DEPENDÊNCIAS                                     ║
echo  ╚════════════════════════════════════════════════════════════════╝
echo.

echo  [1/2] Instalando dependências da API (api\dist-api)...
cd /d "%~dp0api\dist-api"
call npm install
echo  ✅ API: Dependências instaladas!

echo.
echo  [2/2] Instalando dependências do Website (tools-website-builder)...
cd /d "%~dp0tools-website-builder"
call npm install
echo  ✅ Website: Dependências instaladas!

echo.
echo  ╔════════════════════════════════════════════════════════════════╗
echo  ║  ✅ TODAS AS DEPENDÊNCIAS INSTALADAS!                           ║
echo  ╚════════════════════════════════════════════════════════════════╝
echo.
pause
goto menu

:: ============================================
:: BUILD DE PRODUÇÃO (WEBSITE)
:: ============================================
:BUILD_PROD
cls
echo.
echo  ╔════════════════════════════════════════════════════════════════╗
echo  ║  🏗️  GERAR BUILD DE PRODUÇÃO (WEBSITE)                          ║
echo  ╚════════════════════════════════════════════════════════════════╝
echo.
echo  ⚠️  ATENÇÃO: Isso irá compilar o Website para produção!
echo.
set /p confirma="  Deseja continuar? (S/N): "
if /i not "%confirma%"=="S" goto menu

rem Navega para a pasta do builder e verifica dependencias
cd /d "%~dp0tools-website-builder"

rem Verifica se as dependencias estao instaladas
if not exist "node_modules" (
    echo  ⚠️  Dependencias nao encontradas. Instalando...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo  ❌ ERRO: Falha ao instalar dependencias!
        pause
        goto menu
    )
    echo.
    echo  ✅ Dependencias instaladas com sucesso!
    echo.
)

rem Executa o build.
echo  🚀 Gerando novo build...
call npm run build

rem Verifica se o build falhou.
if %errorlevel% neq 0 (
    echo.
    echo  ❌ ERRO: O processo de build falhou. Verifique os logs acima.
    pause
    goto menu
)

echo  ✅ Build gerado com sucesso!
echo.

rem Remove o build antigo de tools_website\dist
if exist "%~dp0tools_website\dist\" (
    echo  🧹 Removendo build antigo de tools_website\dist...
    rmdir /s /q "%~dp0tools_website\dist\"
)

rem Copia a nova pasta 'dist' gerada para o local final
if exist "%~dp0tools-website-builder\dist\" (
    echo  � Copiando novo build para tools_website\dist...
    
    rem Cria a pasta tools_website se não existir
    if not exist "%~dp0tools_website\" mkdir "%~dp0tools_website"
    
    rem Copia toda a pasta dist (xcopy com /E /I copia subpastas e cria destino)
    xcopy "%~dp0tools-website-builder\dist" "%~dp0tools_website\dist\" /E /I /Y >nul
    
    if %errorlevel% equ 0 (
        echo  ✅ Build copiado com sucesso para tools_website\dist!
    ) else (
        echo  ❌ ERRO ao copiar build. Verifique as permissões.
        pause
        goto menu
    )
    echo.
) else (
    echo  ❌ ERRO: Pasta dist não foi gerada em tools-website-builder!
    pause
    goto menu
)

echo  ╔════════════════════════════════════════════════════════════════╗
echo  ║  ✅ BUILD DO WEBSITE CONCLUÍDO!                                 ║
echo  ╚════════════════════════════════════════════════════════════════╝
echo.
pause
goto menu

:: ============================================
:: LIMPAR CACHE E NODE_MODULES
:: ============================================
:CLEAN_CACHE
cls
echo.
echo  ╔════════════════════════════════════════════════════════════════╗
echo  ║  🧹 LIMPAR CACHE E NODE_MODULES                                 ║
echo  ╚════════════════════════════════════════════════════════════════╝
echo.
echo  ⚠️  ATENÇÃO: Isso irá deletar:
echo     • Pastas node_modules (em api\dist-api e tools-website-builder)
echo     • Pastas dist (em tools-website-builder e tools_website)
echo     • Cache do npm
echo.
echo  📝 Você precisará executar "npm install" novamente!
echo.
set /p confirma="  Deseja continuar? (S/N): "
if /i not "%confirma%"=="S" goto menu

echo.
echo  🧹 Limpando API (api\dist-api)...
cd /d "%~dp0api\dist-api"
if exist node_modules (
    rd /s /q node_modules
    echo  ✅ API: node_modules removido
)

echo.
echo  🧹 Limpando Website (tools-website-builder)...
cd /d "%~dp0tools-website-builder"
if exist node_modules (
    rd /s /q node_modules
    echo  ✅ Website: node_modules removido
)
if exist dist (
    rd /s /q dist
    echo  ✅ Website: dist removido
)

echo.
echo  🧹 Limpando pasta de build final (tools_website\dist)...
if exist "%~dp0tools_website\dist" (
    rd /s /q "%~dp0tools_website\dist"
    echo  ✅ Pasta de build final removida
)

echo.
echo  🧹 Limpando cache do npm...
call npm cache clean --force
echo  ✅ Cache do npm limpo!

echo.
echo  ╔════════════════════════════════════════════════════════════════╗
echo  ║  ✅ LIMPEZA CONCLUÍDA!                                         ║
echo  ╚════════════════════════════════════════════════════════════════╝
echo.
echo  💡 Execute a opção [7] para reinstalar as dependências
echo.
pause
goto menu

:: ============================================
:: SAIR
:: ============================================
:EXIT
cls
echo.
echo  ╔════════════════════════════════════════════════════════════════╗
echo  ║                                                                ║
echo  ║            👋 Até logo! Bom desenvolvimento!                   ║
echo  ║                                                                ║
echo  ╚════════════════════════════════════════════════════════════════╝
echo.
timeout /t 2 >nul
exit