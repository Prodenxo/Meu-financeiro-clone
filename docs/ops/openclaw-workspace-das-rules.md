# DAS no WhatsApp — regra única (colar em `DAS-WHATSAPP.md` no workspace)

## Um único comando por mês

```bash
/home/node/.openclaw/workspace/mf-das-send.sh 5521996185328 MM/YYYY
```

Substitui `5521996185328` pelo telefone com DDI **55** (sem `+`).

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
