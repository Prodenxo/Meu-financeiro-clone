# Fluxo n8n - Envio DAS MEI via Z-API

## Objetivo
Enviar o PDF da guia DAS MEI (base64) via Z-API a partir do webhook do backend.

## Payload recebido do backend
```json
{
  "userId": "uuid",
  "displayName": "Nome",
  "phone": "55DDDNumeros",
  "competencia": "YYYY-MM",
  "periodoApuracao": "YYYYMM",
  "fileName": "das-mei-YYYYMM.pdf",
  "pdfBase64": "<base64 sem prefixo>",
  "message": "Olá ...",
  "source": "admin_mei_mirror"
}
```

## Fluxo recomendado no n8n
1) **Webhook** (recebe payload acima)

2) **HTTP Request (opcional)** – Enviar texto
   - **POST** `https://api.z-api.io/instances/<instance>/token/<token>/send-text`
   - **Headers**:
     - `Client-Token: <client-token>`
     - `Content-Type: application/json`
   - **Body**:
     ```json
     {
       "phone": "={{$json.phone}}",
       "message": "={{$json.message}}"
     }
     ```

3) **Set/Function** – Montar documento base64
   - Crie o campo `document`:
     ```
     data:application/pdf;base64,{{ $json.pdfBase64 }}
     ```

4) **HTTP Request** – Enviar PDF
   - **POST** `https://api.z-api.io/instances/<instance>/token/<token>/send-document/pdf`
   - **Headers**:
     - `Client-Token: <client-token>`
     - `Content-Type: application/json`
   - **Body**:
     ```json
     {
       "phone": "={{$json.phone}}",
       "document": "={{$json.document}}",
       "fileName": "={{$json.fileName}}"
     }
     ```

## Observações
- `phone` deve ser enviado sem máscara, formato `55DDDNumeros`.
- O campo `document` **deve** ter o prefixo `data:application/pdf;base64,`.
- Se não quiser enviar mensagem de texto, remova o passo 2.

## Webhook esperado
- Endpoint configurado no backend (`N8N_WHATSAPP_WEBHOOK_URL`): `https://auto-n8n-omega.k6fcpj.easypanel.host/webhook/DAS`.
- O workflow do n8n precisa estar ativo; se estiver inativo, o n8n retorna erro de webhook não registrado.
