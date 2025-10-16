# Script de Teste de Endpoints da API
# Execute com: .\test-endpoints.ps1

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "🧪 TESTE DE ENDPOINTS - API" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:3000"

Write-Host "⚡ Servidor: $baseUrl`n" -ForegroundColor Yellow

# Teste 1: Rota raiz (documentação)
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "📝 Teste 1: GET / (Documentação JSON)" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/" -Method Get
    Write-Host "✅ SUCESSO" -ForegroundColor Green
    Write-Host "   Status: $($response.status)"
    Write-Host "   Versão: $($response.version)"
    Write-Host "   Seu IP: $($response.your_ip)"
} catch {
    Write-Host "❌ ERRO: $_" -ForegroundColor Red
}

# Teste 2: Listar usuários
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "👥 Teste 2: GET /usuarios (Listar)" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/usuarios" -Method Get
    Write-Host "✅ SUCESSO" -ForegroundColor Green
    Write-Host "   Total: $($response.data.total) usuários"
    Write-Host "   Usuários:"
    foreach ($user in $response.data.usuarios) {
        Write-Host "     - ID: $($user.id) | $($user.nome) | $($user.email)"
    }
} catch {
    Write-Host "❌ ERRO: $_" -ForegroundColor Red
}

# Teste 3: Buscar usuário específico
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "🔍 Teste 3: GET /usuarios/1 (Buscar por ID)" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/usuarios/1" -Method Get
    Write-Host "✅ SUCESSO" -ForegroundColor Green
    Write-Host "   Usuário:"
    Write-Host "     ID: $($response.data.id)"
    Write-Host "     Nome: $($response.data.nome)"
    Write-Host "     Email: $($response.data.email)"
    Write-Host "     Idade: $($response.data.idade)"
    Write-Host "     Ativo: $($response.data.ativo)"
} catch {
    Write-Host "❌ ERRO: $_" -ForegroundColor Red
}

# Teste 4: Estatísticas
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "📊 Teste 4: GET /usuarios/estatisticas" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/usuarios/estatisticas" -Method Get
    Write-Host "✅ SUCESSO" -ForegroundColor Green
    Write-Host "   Total: $($response.data.total)"
    Write-Host "   Ativos: $($response.data.ativos)"
    Write-Host "   Inativos: $($response.data.inativos)"
    Write-Host "   Idade média: $($response.data.idadeMedia)"
} catch {
    Write-Host "❌ ERRO: $_" -ForegroundColor Red
}

# Teste 5: Criar usuário (válido)
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "➕ Teste 5: POST /usuarios (Criar - válido)" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
try {
    $body = @{
        nome = "Teste PowerShell"
        email = "teste@powershell.com"
        idade = 25
        ativo = $true
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/usuarios" -Method Post -Body $body -ContentType "application/json"
    Write-Host "✅ SUCESSO" -ForegroundColor Green
    Write-Host "   ID criado: $($response.data.id)"
    Write-Host "   Nome: $($response.data.nome)"
    Write-Host "   Email: $($response.data.email)"
    $createdId = $response.data.id
} catch {
    Write-Host "❌ ERRO: $_" -ForegroundColor Red
}

# Teste 6: Criar usuário (inválido - validação)
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "⚠️  Teste 6: POST /usuarios (Criar - inválido)" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
try {
    $body = @{
        nome = "Jo"  # Nome muito curto
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/usuarios" -Method Post -Body $body -ContentType "application/json"
    Write-Host "❌ FALHOU: Deveria rejeitar dados inválidos" -ForegroundColor Red
} catch {
    Write-Host "✅ VALIDAÇÃO FUNCIONANDO" -ForegroundColor Green
    Write-Host "   Erro esperado: Validação rejeitou dados inválidos"
}

# Teste 7: Atualizar usuário
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "✏️  Teste 7: PUT /usuarios/:id (Atualizar)" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
try {
    $body = @{
        nome = "Nome Atualizado"
        idade = 26
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/usuarios/1" -Method Put -Body $body -ContentType "application/json"
    Write-Host "✅ SUCESSO" -ForegroundColor Green
    Write-Host "   Usuário atualizado: $($response.data.nome)"
    Write-Host "   Nova idade: $($response.data.idade)"
} catch {
    Write-Host "❌ ERRO: $_" -ForegroundColor Red
}

# Teste 8: Filtros
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "🔎 Teste 8: GET /usuarios?ativo=true (Filtros)" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/usuarios?ativo=true&idade_min=25" -Method Get
    Write-Host "✅ SUCESSO" -ForegroundColor Green
    Write-Host "   Filtrado: $($response.data.total) usuários (ativos, idade >= 25)"
} catch {
    Write-Host "❌ ERRO: $_" -ForegroundColor Red
}

# Teste 9: Rota inexistente (404)
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "🚫 Teste 9: GET /rota-inexistente (404)" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/rota-inexistente" -Method Get
    Write-Host "❌ FALHOU: Deveria retornar 404" -ForegroundColor Red
} catch {
    Write-Host "✅ TRATAMENTO 404 FUNCIONANDO" -ForegroundColor Green
    Write-Host "   Handler de 404 respondeu corretamente"
}

# Teste 10: Deletar usuário
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "🗑️  Teste 10: DELETE /usuarios/:id (Deletar)" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
try {
    if ($createdId) {
        $response = Invoke-RestMethod -Uri "$baseUrl/usuarios/$createdId" -Method Delete
        Write-Host "✅ SUCESSO" -ForegroundColor Green
        Write-Host "   Usuário ID $createdId deletado"
    } else {
        Write-Host "⏭️  PULADO: Nenhum usuário foi criado no teste 5" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ ERRO: $_" -ForegroundColor Red
}

# Teste 11: Logs API
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "📋 Teste 11: GET /api/logs (Logs de acesso)" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/logs?limit=5" -Method Get
    Write-Host "✅ SUCESSO" -ForegroundColor Green
    Write-Host "   Total de logs: $($response.total)"
    Write-Host "   Últimos 5 acessos registrados"
} catch {
    Write-Host "❌ ERRO: $_" -ForegroundColor Red
}

# Resumo final
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "📊 RESUMO DOS TESTES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Testes completos!" -ForegroundColor Green
Write-Host "`n💡 Dicas:" -ForegroundColor Yellow
Write-Host "   - Acesse http://localhost:3000/docs para documentação visual" -ForegroundColor White
Write-Host "   - Acesse http://localhost:3000/logs para dashboard de logs" -ForegroundColor White
Write-Host "   - Use http://localhost:3000/ para ver JSON da API`n" -ForegroundColor White
