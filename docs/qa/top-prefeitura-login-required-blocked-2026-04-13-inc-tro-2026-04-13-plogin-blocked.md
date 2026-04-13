# Evidencia TRO — prefeitura_login_required_blocked

- Data da execucao: 2026-04-13
- Responsavel: @dev (Dex)
- Story ID: STORY-FR-TRO-P1-FRONTEND-UX-VALIDACAO-NARRATIVA-CAUSALIDADE-PREFEITURA-LOGIN-REQUIRED-BLOCKED-2026-04-13
- Ticket interno (ID/link): `INC-TRO-2026-04-13-PLOGIN-BLOCKED`
- Ambiente (local/homologacao/producao controlada): local (`frontend` + `backend`)
- Evidencia manual da sessao UI/Network: ocorrencia interna registrada no browser com `POST /api/mei-notas/setup/emissao-fiscal/empresa` retornando `HTTP 400` e `errors.plugnotasCode = prefeitura_login_required_blocked`, sem exposicao de credenciais municipais.

## POST /api/mei-notas/setup/emissao-fiscal/empresa (FR-TRO-03)
- message: "Este cadastro segue NFS-e Nacional como padrao. Quando o emissor exigir acesso ao portal da prefeitura, o caso fica fora deste fluxo e precisa de triagem operacional."
- errors.plugnotasCode: `prefeitura_login_required_blocked`
- errors.plugnotasRequest.method: `POST`
- errors.plugnotasRequest.path: `/empresa`
- errors.httpStatus: `400`

### Anexo tecnico da aba Network (transcricao redigida)
- Fonte: DevTools > Network > Request `POST /api/mei-notas/setup/emissao-fiscal/empresa`
- Status HTTP observado: `400 Bad Request`
- Momento da captura: 2026-04-13 (sessao local da ocorrencia `INC-TRO-2026-04-13-PLOGIN-BLOCKED`)
- Preview/Response (campos relevantes redigidos):

```json
{
  "success": false,
  "message": "Este cadastro segue NFS-e Nacional como padrao. Quando o emissor exigir acesso ao portal da prefeitura, o caso fica fora deste fluxo e precisa de triagem operacional.",
  "errors": {
    "plugnotasCode": "prefeitura_login_required_blocked",
    "plugnotasRequest": {
      "method": "POST",
      "path": "/empresa"
    },
    "httpStatus": 400
  }
}
```

## GET causal (quando aplicavel)
- Endpoint consultado: `GET /api/mei-notas/setup/emissao-fiscal/empresa?cpfCnpj=17***72`
- Resultado: retorno negativo com `plugnotasCode = empresa_nao_cadastrada`
- Interpretacao causal (consequencia do POST falho): o `GET` posterior confirma que o cadastro nao foi concluido apos a falha no `POST`; nao representa causa raiz nem "erro de endpoint".

## Decisao operacional final
- Classificacao: `nao suportado no fluxo nacional`
- Decisao final: esperado pela politica vigente

## Validacao automatizada de suporte (frontend)
- Comando executado: `npm run test -- src/lib/fiscalUserError.test.ts src/pages/GuidesMei.certificate-connectivity.test.tsx`
- Resultado: `2` arquivos de teste aprovados, `29` testes aprovados, `0` falhas.
- Cobertura relevante:
  - `src/lib/fiscalUserError.test.ts`: garante narrativa para `prefeitura_login_required_blocked` com referencia a fluxo nacional e sem termos proibidos.
  - `src/pages/GuidesMei.certificate-connectivity.test.tsx`: garante causalidade `POST` falho -> `GET` consequente e ausencia de pedido de `login`/`senha` municipal na UI.

## Checklist de redaction
- [x] Sem token/certificado/credenciais em claro
- [x] Sem payload sensivel bruto
