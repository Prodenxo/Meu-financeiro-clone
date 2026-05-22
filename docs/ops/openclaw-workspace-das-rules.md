# DAS no WhatsApp — regra única (colar em `DAS-WHATSAPP.md` no workspace)

## Um único comando por mês

```bash
/home/node/.openclaw/workspace/mf-das-send.sh 5521996185328 MM/YYYY
```

Substitui `TELEFONE_DO_REMETENTE_55` pelo número **de quem está a escrever** neste chat (cabeçalho no painel OpenClaw, com DDI 55, sem `+`).

**Nunca** uses números de exemplo da documentação se não forem o remetente actual.

Antes de enviar: `mf-curl.sh` + `resolve_user` com esse telefone — confirma o nome. Depois `mf-das-send.sh` com o **mesmo** telefone.

## Proibido

- `curl` / `fetch` com `$MF_API_URL`
- `get_das_current` no chat (com ou sem base64)
- Correr só `mf-das.sh` (só grava em `/tmp`, **não envia** WhatsApp)
- Dizer *"enviei"* sem ver no JSON do exec: `"whatsapp":"sent"`

## Só podes confirmar envio se o exec imprimir

```json
{"success":true,"whatsapp":"sent",...}
```

Se o JSON não tiver `"whatsapp":"sent"`, explica o erro — **não** digas que enviaste.
