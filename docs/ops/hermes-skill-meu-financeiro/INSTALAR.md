# Skill Meu Financeiro (Midas) — instalação no Hermes

Esta pasta contém uma **skill** que o Midas usa com a ferramenta **terminal** + `curl.exe` para falar com o teu backend `POST /api/bot/hermes/action`.

## 1. Copiar a skill

Copia a pasta **`meu-financeiro-midas`** inteira para:

`C:\Users\Usuário\.hermes\skills\meu-financeiro-midas`

(se a pasta `skills` não existir, cria-a)

## 2. Variáveis no `.env` do Hermes

Ficheiro: `C:\Users\Usuário\.hermes\.env`

```env
MEU_FINANCEIRO_API_URL=https://O-TEU-BACKEND.easypanel.host/api/bot/hermes/action
MEU_FINANCEIRO_HERMES_SECRET=o_mesmo_valor_que_HERMES_WEBHOOK_SECRET_no_servidor
```

(troca URL e segredo; **não** partilhes o segredo)

## 3. Passar estas variáveis ao terminal do Hermes

Em `C:\Users\Usuário\.hermes\config.yaml`, garante (ou acrescenta) algo como:

```yaml
terminal:
  env_passthrough:
    - MEU_FINANCEIRO_API_URL
    - MEU_FINANCEIRO_HERMES_SECRET
```

Reinicia o `hermes gateway`.

## 4. Ativar a skill no Hermes

No chat (ou `hermes chat`), pede para **carregar / usar a skill** `meu-financeiro-midas` ou pergunta algo que o `SKILL.md` descreve (lançar despesa).

## 5. SOUL

No `SOUL.md`, uma linha a dizer: para registar movimentos no Meu Financeiro, **seguir a skill `meu-financeiro-midas`** e usar o script com ficheiro JSON UTF-8.

Copia também o **trecho “Midas”** de `docs/ops/hermes-midas-knowledge-base.md` (secção *Trecho para colar no SOUL.md*) para o modelo interpretar frases tipo *“recebi 4599 de salário”* e usar o **telefone do remetente** no `phone`.

---

Referência de API: `docs/ops/hermes-midas-knowledge-base.md` e `docs/ops/hermes-bot-n8n-zapi.md`.
