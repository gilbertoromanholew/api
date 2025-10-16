# 📄 Funcionalidade: Leitura de PDF

## Descrição
Extrai texto de arquivos PDF enviados via upload.

## Endpoint
**POST /read-pdf**

## Como usar
Envie um arquivo PDF via form-data com a chave `pdf`.

### Exemplo (usando curl):
```bash
curl -X POST http://localhost:3000/read-pdf \
  -F "pdf=@arquivo.pdf"
```

### Resposta de sucesso:
```json
{
  "success": true,
  "text": "Texto extraído do PDF...",
  "pages": 5
}
```

### Respostas de erro:
```json
{
  "error": "Nenhum arquivo PDF foi enviado."
}
```

```json
{
  "error": "O arquivo enviado não é um PDF válido."
}
```

## Arquivos:
- `pdfController.js` - Lógica de processamento
- `pdfRoutes.js` - Rota do endpoint
