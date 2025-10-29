# Script de Teste - Rate Limiting Inteligente
# Execute no PowerShell para testar os limites

Write-Host "🧪 Teste de Rate Limiting Inteligente" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Yellow
Write-Host ""

# URLs de teste
$baseUrl = "https://api.samm.host"

# Tokens de teste (substitua pelos reais)
$tokens = @{
    "anonymous" = $null
    "authenticated" = "SEU_TOKEN_AUTENTICADO_AQUI"  # Substitua
    "pro" = "SEU_TOKEN_PRO_AQUI"  # Substitua
}

function Test-RateLimit {
    param (
        [string]$userType,
        [string]$token,
        [int]$maxRequests = 50
    )

    Write-Host "Testing $userType user..." -ForegroundColor Green
    Write-Host "Max requests: $maxRequests" -ForegroundColor Gray

    $successCount = 0
    $errorCount = 0
    $rateLimitCount = 0

    for ($i = 1; $i -le $maxRequests; $i++) {
        try {
            $headers = @{}
            if ($token) {
                $headers["Authorization"] = "Bearer $token"
            }

            $response = Invoke-WebRequest -Uri "$baseUrl/user/profile" -Headers $headers -Method GET -TimeoutSec 10

            if ($response.StatusCode -eq 200) {
                $successCount++
            } else {
                Write-Host "Unexpected status: $($response.StatusCode)" -ForegroundColor Yellow
            }

        } catch {
            $statusCode = $_.Exception.Response.StatusCode
            if ($statusCode -eq 429) {
                $rateLimitCount++
                Write-Host "Request $i - 429 Rate Limited!" -ForegroundColor Red
                break
            } elseif ($statusCode -eq 401) {
                $errorCount++
            } else {
                Write-Host "Request $i - Error: $statusCode" -ForegroundColor Yellow
            }
        }

        # Pequena pausa
        Start-Sleep -Milliseconds 200

        if ($i % 10 -eq 0) {
            Write-Host "Progress: $i/$maxRequests (Success: $successCount, Errors: $errorCount)" -ForegroundColor Gray
        }
    }

    Write-Host "Results for $userType user:" -ForegroundColor Cyan
    Write-Host "  ✅ Success: $successCount" -ForegroundColor Green
    Write-Host "  ❌ Rate Limited: $rateLimitCount" -ForegroundColor Red
    Write-Host "  ⚠️  Other Errors: $errorCount" -ForegroundColor Yellow
    Write-Host ""
}

# Teste 1: Usuário anônimo (deve limitar rápido)
Test-RateLimit -userType "Anonymous" -token $tokens.anonymous -maxRequests 30

# Teste 2: Usuário autenticado (deve aguentar mais)
# Test-RateLimit -userType "Authenticated" -token $tokens.authenticated -maxRequests 80

# Teste 3: Usuário PRO (não deve limitar)
# Test-RateLimit -userType "PRO" -token $tokens.pro -maxRequests 100

Write-Host "🎉 Teste concluído!" -ForegroundColor Green
Write-Host "Para testar usuários autenticados, substitua os tokens no script." -ForegroundColor Gray