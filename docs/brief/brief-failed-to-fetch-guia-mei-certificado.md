# Brief: "Failed to fetch" ao enviar certificado (Guia MEI) — cadastro não chega ao Plugnotas

| Campo | Valor |
| --- | --- |
| **Data** | 2026-03-24 |
| **Contexto** | Formulário de CNPJ / certificado A1 na Guia MEI; operador vê banner **Failed to fetch** e o cadastro de empresa no Plugnotas não ocorre. |
| **Severidade percebida** | Alta (bloqueia o fluxo inteiro). |
| **Severidade real (causa raiz provável)** | Infraestrutura local / processo — **sem** evidência de rejeição pela API Plugnotas neste momento. |

---

## 1. O que os sintomas indicam (evidência da tela)

1. **Console:** `TypeError: Failed to fetch` na chamada que usa `apiClient` para **`POST /api/mei-guide/certificate`** (upload do certificado no **seu** backend, não no Plugnotas diretamente no browser).
2. **Console:** `GET http://localhost:3000/ net::ERR_CONNECTION_REFUSED` (várias linhas) — algo tentou falar com a origem **localhost:3000** e a conexão foi **recusada** (nada escutando naquele host/porta naquele instante, ou processo encerrado).
3. O banner genérico da UI sobre *validação JSON / Plugnotas* é um **fallback de mensagem** para erros de API; ele **não substitui** a leitura do console. Aqui o bloqueio é **antes** de qualquer resposta JSON do emissor.

**Conclusão analítica:** o problema primário **não é** "a API Plugnotas recusou o cadastro da empresa". É **falha de rede entre o navegador e o backend do Meu Financeiro** (ou entre o Vite e o backend no desenvolvimento local).

---

## 2. Arquitetura local relevante (para alinhar expectativas)

- O frontend em desenvolvimento costuma rodar no **Vite na porta 3000** (`frontend/vite.config.ts`: `server.port: 3000`).
- As chamadas ` /api/... ` são **proxied** para **`http://localhost:3333`** (mesmo arquivo: `proxy['/api'].target`).
- O upload de certificado da Guia MEI é **`POST /api/mei-guide/certificate`** (rota definida no backend; o frontend chama via `guidesMeiService.ts`).

Portanto, para o upload funcionar:

1. O **frontend** (Vite) deve estar de pé na **3000** (ou a URL que você usa).
2. O **backend** deve estar de pé na **3333** (ou o `target` do proxy precisa ser ajustado de forma consciente).
3. Se o backend **3333** não estiver rodando, o proxy devolve falha e o browser mostra **Failed to fetch** — o Plugnotas nem entra na história ainda.

---

## 3. Plano de solução (ordem recomendada)

### Passo A — Confirmar que o backend está vivo

1. No terminal do projeto, subir o backend na porta esperada (ex.: scripts da raiz que escutam em **3333** — conferir `package.json` / README).
2. Testar saúde, se existir rota de health, por exemplo:

   `GET http://localhost:3333/health`

   Esperado: **200** (ou documentação equivalente do projeto).

3. Se isso falhar, **não** depurar Plugnotas até o backend responder.

### Passo B — Confirmar o frontend e o proxy

1. Garantir que o Vite está rodando (**3000** por padrão).
2. Com backend no ar, repetir o envio do certificado e observar no **Network**:
   - Requisição para **`/api/mei-guide/certificate`** (mesma origem da página, ex. `:3000`).
   - Status **não** deve ser "(failed)" por conexão; deve aparecer um **código HTTP** (401, 400, 200, etc.).

### Passo C — Variáveis `VITE_API_URL` (somente se necessário)

- O `.env.example` do frontend sugere **`VITE_API_URL=http://localhost:3333`**.
- Com URL localhost configurada, o `apiClient` pode **chamar o backend direto** (sem depender só do proxy). Se estiver **vazio** em DEV, o cliente pode usar **base relativa `/api`** e depender exclusivamente do proxy — o que continua exigindo o backend em **3333**.

Documentação operacional geral: `docs/operacao-mei-nfse.md`.

### Passo D — Só depois disso: Plugnotas / cadastro empresa

Quando **`POST /api/mei-guide/certificate`** (ou o fluxo equivalente de certificado → empresa no seu build) retornar **sucesso**, aí sim, se ainda houver erro, investigar:

- resposta do backend com mensagem Plugnotas,
- `PLUGNOTAS_API_BASE_URL` / `PLUGNOTAS_API_KEY`,
- payload em **POST** `.../setup/emissao-fiscal/empresa` conforme `docs/operacao-mei-nfse.md` (seção cadastro NFC-e).

---

## 4. Critérios de sucesso (definição de "resolvido")

1. `GET http://localhost:3333/health` (ou equivalente) **OK**.
2. No DevTools → Network, **`POST /api/mei-guide/certificate`** completa com resposta HTTP (não "Failed to fetch" por conexão).
3. Fluxo seguinte (cadastro empresa no Plugnotas) pode falhar por **negócio/API** — aí sim vale correlacionar com doc Plugnotas e logs `[plugnotas]` / `PLUGNOTAS_DEBUG` conforme operação.

---

## 5. Riscos e armadilhas

- **Confundir** mensagem genérica da UI sobre Plugnotas com **erro de rede local** — atrasa o diagnóstico em horas.
- **Credential / PII em prints:** o brief não pede colar senhas de certificado ou tokens; use apenas trechos redigidos em incidentes.
- **Porta errada:** se alguém alterou a porta do backend sem atualizar o `vite.config.ts` proxy, o sintoma é o mesmo (falha de conexão no proxy).

---

## 6. Handoff sugerido

| Papel | Ação |
| --- | --- |
| **Dev / operações** | Garantir processo de dev: backend **3333** + frontend **3000** (ou documentar exceção). |
| **QA** | Caso de teste manual: "backend parado → deve falhar antes do Plugnotas com erro de rede claro" vs "backend no ar → erro só se API/devolver 4xx/5xx". |
| **Produto / suporte** | Base de conhecimento: primeiro checar conectividade com **próprio backend**, depois Plugnotas. |

---

— Brief elaborado para desbloqueio do fluxo **Guia MEI → certificado → empresa**. Próxima revisão quando o `POST /api/mei-guide/certificate` passar a retornar corpo JSON interpretável (sucesso ou erro de negócio).
