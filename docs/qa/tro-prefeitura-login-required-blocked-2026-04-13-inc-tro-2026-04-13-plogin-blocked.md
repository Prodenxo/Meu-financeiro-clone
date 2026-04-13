# Evidencia TRO Operacao/QA — prefeitura_login_required_blocked

- Data da execucao: 2026-04-13
- Responsavel: @dev (Dex)
- Story ID: STORY-FR-TRO-P1-OPERACAO-QA-PROTOCOLO-TRIAGEM-EVIDENCIA-PREFEITURA-LOGIN-REQUIRED-BLOCKED-2026-04-13
- Ticket interno (ID/link): `INC-TRO-2026-04-13-PLOGIN-BLOCKED`
- Ambiente (local/homologacao/producao controlada): local (`frontend` + `backend`)

## Evidencia minima FR-TRO-03
- message: "Este cadastro segue NFS-e Nacional como padrao. Quando o emissor exigir acesso ao portal da prefeitura, o caso fica fora deste fluxo e precisa de triagem operacional."
- errors.plugnotasCode: `prefeitura_login_required_blocked`
- errors.plugnotasRequest.method: `POST`
- errors.plugnotasRequest.path: `/empresa`
- errors.httpStatus: `400`

### Anexo tecnico de evidencias (response/log redigido)
- Fonte browser: DevTools > Network > Request `POST /api/mei-notas/setup/emissao-fiscal/empresa`
- Status HTTP observado: `400 Bad Request`
- Fonte backend: log redigido `[plugnotas empresa cadastro] ... 400 request payload (redacted)` correlacionado por metodo/path/status/codigo.
- Janela temporal da correlacao: mesma sessao local da ocorrencia `INC-TRO-2026-04-13-PLOGIN-BLOCKED`.

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

## Causalidade operacional (quando aplicavel)
- Registro do POST falho: `POST /api/mei-notas/setup/emissao-fiscal/empresa` com `HTTP 400` e `plugnotasCode = prefeitura_login_required_blocked`.
- Registro do GET posterior: `GET /api/mei-notas/setup/emissao-fiscal/empresa?cpfCnpj=17***72` com retorno negativo (`plugnotasCode = empresa_nao_cadastrada`).
- Interpretacao: GET negativo como consequencia do POST falho.

## Decisao final
- Classificacao: nao suportado no fluxo nacional
- Decisao: esperado pela politica vigente

## Rastreamento de legado (TOP -> TRO)
- Artefato legado relacionado: `docs/qa/top-prefeitura-login-required-blocked-2026-04-13-inc-tro-2026-04-13-plogin-blocked.md`
- Relacao: o registro `top-...` permanece como historico de execucao anterior (story TOP frontend/UX); este artefato `tro-...` e o registo canonico da ocorrencia para a tratativa operacional FR-TRO.

## Checklist de redaction
- [x] Sem token/certificado/credenciais em claro
- [x] Sem payload sensivel bruto
