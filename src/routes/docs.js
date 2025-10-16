export const getApiDocs = (req, res) => {
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API - Documentação</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            line-height: 1.6;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
            margin-bottom: 30px;
            text-align: center;
        }
        .header h1 {
            color: #667eea;
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        .status {
            display: inline-block;
            background: #4CAF50;
            color: white;
            padding: 8px 20px;
            border-radius: 20px;
            font-weight: bold;
            margin-top: 10px;
        }
        .info-box {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .info-box h2 {
            color: #667eea;
            margin-bottom: 15px;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }
        .endpoint {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 15px;
            border-left: 4px solid #667eea;
        }
        .endpoint h3 {
            color: #333;
            margin-bottom: 10px;
        }
        .method {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 5px;
            font-weight: bold;
            font-size: 0.9em;
            margin-right: 10px;
        }
        .method-post { background: #4CAF50; color: white; }
        .method-get { background: #2196F3; color: white; }
        .code {
            background: #2d2d2d;
            color: #f8f8f2;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            margin-top: 10px;
        }
        .ip-info {
            background: #e8f5e9;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #4CAF50;
        }
        .function-list {
            list-style: none;
        }
        .function-list li {
            padding: 8px;
            background: #f8f9fa;
            margin: 5px 0;
            border-radius: 5px;
            font-family: 'Courier New', monospace;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 API Documentação</h1>
            <p>Versão 2.0</p>
            <div class="status">● ONLINE</div>
        </div>

        <div class="info-box ip-info">
            <h2>🔒 Informações de Segurança</h2>
            <p><strong>Seu IP:</strong> ${req.ip}</p>
            <p><strong>Status:</strong> ✅ Autorizado</p>
            <p><strong>Filtro de IP:</strong> Ativo</p>
        </div>

        <div class="info-box">
            <h2>📡 Endpoints Disponíveis</h2>
            
            <div class="endpoint">
                <h3>
                    <span class="method method-post">POST</span>
                    /validate-cpf
                </h3>
                <p><strong>Descrição:</strong> Valida um CPF brasileiro</p>
                <p><strong>Parâmetros:</strong> { "cpf": "12345678901" }</p>
                <div class="code">curl -X POST https://api.samm.host/validate-cpf \\
  -H "Content-Type: application/json" \\
  -d '{"cpf": "12345678901"}'</div>
            </div>

            <div class="endpoint">
                <h3>
                    <span class="method method-post">POST</span>
                    /read-pdf
                </h3>
                <p><strong>Descrição:</strong> Extrai texto de um arquivo PDF</p>
                <p><strong>Parâmetros:</strong> Arquivo PDF via form-data (key: "pdf")</p>
                <div class="code">curl -X POST https://api.samm.host/read-pdf \\
  -F "pdf=@arquivo.pdf"</div>
            </div>

            <div class="endpoint">
                <h3>
                    <span class="method method-post">POST</span>
                    /calcular
                </h3>
                <p><strong>Descrição:</strong> Realiza operações matemáticas</p>
                <p><strong>Operações:</strong> somar, subtrair, multiplicar, dividir, porcentagem</p>
                <p><strong>Parâmetros:</strong> { "operacao": "somar", "a": 10, "b": 5 }</p>
                <div class="code">curl -X POST https://api.samm.host/calcular \\
  -H "Content-Type: application/json" \\
  -d '{"operacao": "somar", "a": 10, "b": 5}'</div>
            </div>
        </div>

        <div class="grid">
            <div class="info-box">
                <h2>🔧 Funções de Validação</h2>
                <ul class="function-list">
                    <li>isValidCPF(cpf)</li>
                </ul>
            </div>

            <div class="info-box">
                <h2>🧮 Funções de Cálculo</h2>
                <ul class="function-list">
                    <li>somar(a, b)</li>
                    <li>subtrair(a, b)</li>
                    <li>multiplicar(a, b)</li>
                    <li>dividir(a, b)</li>
                    <li>porcentagem(valor, %)</li>
                </ul>
            </div>

            <div class="info-box">
                <h2>📄 Funções de PDF</h2>
                <ul class="function-list">
                    <li>readPDF(buffer)</li>
                </ul>
            </div>
        </div>

        <div class="info-box">
            <h2>📚 Links Úteis</h2>
            <p>📂 <strong>Repositório:</strong> <a href="https://github.com/gilbertoromanholew/api" target="_blank">GitHub</a></p>
            <p>📖 <strong>Documentação JSON:</strong> <a href="/">Ver JSON</a></p>
        </div>
    </div>
</body>
</html>
    `;
    
    res.send(html);
};
