# PRD — **Atualização posterior** de documentos ativos (Plugnotas + Supabase)

**Versão:** 1.0  
**Data:** 2026-04-07  
**Tipo:** Brownfield — Guia MEI / cadastro emitente, espelho `user_mei_certificates.documentos_ativos`  
**Fonte canónica do pedido:** [`docs/brief/brief-atualizacao-posterior-documentos-ativos-plugnotas-supabase-2026-04-07.md`](../brief/brief-atualizacao-posterior-documentos-ativos-plugnotas-supabase-2026-04-07.md)

**Relação com outros artefatos:**

- **`docs/prd/PRD-cadastro-empresa-documentos-ativos-plugnotas-2026-04-07.md`** — selecção inicial de documentos activos no cadastro; requisitos **FR-CAD-DOC-\***. Este PRD **não duplica** esses requisitos; **estende** o ciclo de vida com **edição posterior** e **reconciliação**.  
- **`docs/stories/story-fr-cad-doc-p1-persistencia-documentos-ativos-supabase.md`** — persistência P1 do espelho `jsonb`.  
- **`supabase/migrations/20260407130000_add_documentos_ativos_user_mei_certificates.sql`** — coluna `documentos_ativos`.  
- **`docs/operacao-mei-nfse.md`** — política de `POST`/`PATCH`/`GET` empresa.  
- **Não substitui** orientação legal; o produto orquestra dados e chamadas ao provedor.

---

## 1. Resumo executivo

Depois do cadastro inicial, o utilizador pode **alterar** quais tipos de documento ficam activos no **Plugnotas** — na **app** (reabrindo o fluxo de empresa) ou **directamente no painel web** do provedor. O espelho local em **`user_mei_certificates.documentos_ativos`** existe para UX (pré-preenchimento, consistência offline da sessão) e deve **acompanhar** o estado remoto quando a app grava com sucesso; quando só o remoto muda, o produto deve **reduzir deriva** entre o que o utilizador vê na Guia MEI e o que o emissor realmente tem configurado.

Este PRD define requisitos rastreáveis (**FR-UPD-DOC-\***), NFRs, decisões de produto fechadas (incluindo **fonte de verdade** e **reconciliação**), compatibilidade brownfield e critérios de release para:

1. **Edição na app:** qualquer fluxo que altere documentos activos garante **`PATCH` Plugnotas** com `documentosAtivos` no payload quando aplicável **e** **`saveDocumentosAtivosMirror`** com a mesma selecção normalizada após sucesso.  
2. **Descoberta:** o utilizador percebe que pode **voltar** a alterar a selecção após o cadastro (copy, secção persistente ou acção explícita).  
3. **Reconciliação:** quando a alteração ocorre **só no Plugnotas**, a app **actualiza o espelho** através de **`GET empresa`** (estratégia MVP definida em §6) e, quando relevante, informa o utilizador.  
4. **Observabilidade opcional:** registo estruturado de falhas de espelho (P2).

---

## 2. Visão de produto (experiência)

O utilizador trata o Meu Financeiro e o Plugnotas como **um único estado mental** (“o que está activo no emissor”). Se mudar só num dos lados, espera que a **próxima vez** que abrir a Guia MEI veja algo **coerente** — ou uma explicação honesta se a API não permitir inferir o estado.

---

## 3. Problema e oportunidade

| Dimensão | Problema | Oportunidade |
|----------|----------|--------------|
| **Dois repositórios** | Plugnotas (emissão) vs Supabase (espelho UX). | Regras claras de escrita e leitura; reconciliação MVP. |
| **PATCH sem `documentosAtivos`** | O espelho só se grava se o body incluir `documentosAtivos` (`persistDocumentosAtivosMirrorAfterEmpresa`). | UI de “editar depois” **sempre** envia o bloco quando o utilizador altera ou confirma a selecção. |
| **Edição externa** | Portal Plugnotas não grava no Supabase. | `GET empresa` → normalizar → `saveDocumentosAtivosMirror` no fluxo acordado (§6.2). |
| **Suporte** | “A app mostra X mas o painel mostra Y.” | Mensagens de deriva opcionais + CTA “sincronizar” quando implementado. |

---

## 4. Personas e cenários

| Persona | Cenário de validação |
|---------|----------------------|
| **MEI — ajuste tardio** | Após meses, activa NFC-e no cadastro na app; `PATCH` sucede; coluna `documentos_ativos` no Supabase **coincide** com o enviado. |
| **MEI — só painel Plugnotas** | Altera tipos no `app2.plugnotas.com.br`; ao reabrir a Guia MEI, a selecção reflecte **GET empresa** (ou utilizador usa “sincronizar” se P1). |
| **Utilizador sem linha em `user_mei_certificates`** | `saveDocumentosAtivosMirror` não faz INSERT (comportamento actual); primeiro fluxo que cria linha + empresa continua canónico; PRD não obriga INSERT só para espelho. |

**Stakeholders:** PO, UX, Architect (contrato API, caching GET), Backend, Frontend, QA, Suporte.

---

## 5. Escopo

### 5.1 Dentro do escopo (MVP / P0)

- **Paridade app → Plugnotas → Supabase:** após **`atualizarPlugNotasEmpresa`** (ou rota equivalente) **bem-sucedida**, o payload inclui `documentosAtivos` quando o utilizador efectuou alteração na secção de documentos activos; o backend persiste o espelho (comportamento existente de `persistDocumentosAtivosMirrorAfterEmpresa`).  
- **Affordance de edição posterior:** secção ou acção identificável **depois** do primeiro cadastro (copy alinhada a §7).  
- **Precedência de exibição:** para **mostrar** a selecção na UI, **preferir estado derivado de `GET empresa`** quando a consulta for bem-sucedida e parseável; caso contrário, **espelho Supabase**; por último, **defaults** do PRD de cadastro (`PRD-cadastro-empresa-documentos-ativos-plugnotas-2026-04-07.md`, §6.2).  
- **Reconciliação inbound (MVP):** ao **carregar** o ecrã relevante da Guia MEI / cadastro (definir exactamente na story: montagem do componente ou entrada na rota), **uma** chamada **`GET empresa`** (com identificador já conhecido pelo fluxo — ex. CNPJ do emitente) quando pré-condições forem satisfeitas; após resposta válida, **persistir espelho** via backend (`GET` → normalizar `documentosAtivos` → `saveDocumentosAtivosMirror`). **Não** exigir clique do utilizador no MVP para esta primeira sincronização.  
- **Validação:** manter “pelo menos um tipo activo” e reutilizar normalização existente (`normalizeDocumentosAtivosShape`, etc.).  
- **Segurança:** escritas no espelho continuam pelo **backend** com credencial adequada (service role), sem expor segredos ao cliente.

### 5.2 Fora do escopo (fase 2 ou explícito)

- **Substituir** o Plugnotas.  
- **Webhook** em tempo real para cada alteração no painel Plugnotas (pode ser revisitado).  
- **Job agendado** só servidor para sync periódico (não MVP).  
- Emissão NF-e/NFC-e completa na UI (outros PRDs).  
- **INSERT** de linha `user_mei_certificates` **apenas** para gravar espelho sem certificado (mantém-se política actual: UPDATE só se existir linha).

### 5.3 P1 (opcional pós-MVP)

- Botão **“Sincronizar com Plugnotas”** explícito (além do carregamento automático).  
- **Banner** quando espelho ≠ remoto **e** ambos parseáveis (detecção de deriva).  
- Telemetria de falhas de espelho (ver §11).

---

## 6. Decisões de produto (fechadas neste PRD)

### 6.1 Fonte de verdade em conflito (exibição vs gravação)

| Momento | Regra |
|---------|--------|
| **Exibir** selecção na UI | **1º** estado normalizado de **`GET empresa`** (sucesso); **2º** espelho Supabase (`getDocumentosAtivosMirror` / status); **3º** defaults do PRD de cadastro. |
| **Após `PATCH` / `POST` bem-sucedido** iniciado na app | Sobrescrever espelho com a **mesma** selecção enviada (já implementado quando `documentosAtivos` está no payload). |
| **Próximo `PATCH`** | Basear intenção do utilizador no **estado mostrado** (que já prioriza remoto); merges de payload são responsabilidade técnica (**@architect** / story). |

### 6.2 Sincronização inbound (MVP)

**Decisão:** **Uma** chamada `GET empresa` no **carregamento** do ecrã de cadastro / Guia MEI relevante, **desde que** exista CNPJ (ou identificador exigido pela API) e o fluxo já tenha emitente configurado — **sem** obrigar o utilizador a premir um botão no MVP.

**Contenção de custo:** debounce / não repetir em cada re-render; cache curto na sessão ou TTL em memória conforme story + architect (evitar rate limit).

### 6.3 Payload mínimo no fluxo de “só alterar documentos”

**Decisão:** Quando a UI oferece edição **dedicada** de documentos activos, o cliente deve **incluir `documentosAtivos`** no corpo enviado ao backend **sempre** que o utilizador confirmar a alteração (não depender de omitir o campo). Os **restantes** campos do `PATCH` seguem política de merge já documentada (`operacao-mei-nfse.md`, ADRs) — **detalhe técnico na story**.

### 6.4 Espelho `null` e primeira escrita

**Decisão:** Se `documentos_ativos` for `null` e `GET empresa` for bem-sucedido, **preencher** o espelho com o resultado normalizado. Se `GET` falhar, UI usa defaults até haver sucesso remoto ou gravação pela app.

### 6.5 Falhas silenciosas de espelho (hoje)

**Decisão P2:** Opcionalmente registar **aviso** estruturado (nível `warn`) quando `saveDocumentosAtivosMirror` falhar após sucesso Plugnotas, **sem** falhar a resposta HTTP ao utilizador — alinhado ao comportamento actual, com melhor observabilidade.

---

## 7. Requisitos funcionais

| ID | Requisito | Prioridade |
|----|-----------|------------|
| **FR-UPD-DOC-01** | Existe caminho de utilizador para **alterar** documentos activos **após** o cadastro inicial (secção persistente, passo reentrável ou acção “Editar documentos activos”), sem obrigar novo upload de certificado quando o produto já suporta “atualizar sem certificado”. | P0 |
| **FR-UPD-DOC-02** | Ao guardar alteração **na app**, o pedido ao backend inclui **`documentosAtivos`** normalizado (`nfse`, `nfe`, `nfce`) quando o utilizador confirmou uma selecção válida (≥ um tipo activo). | P0 |
| **FR-UPD-DOC-03** | Após resposta **bem-sucedida** do Plugnotas nesse fluxo, o espelho Supabase **reflecte** a mesma selecção (via `persistDocumentosAtivosMirrorAfterEmpresa` ou equivalente). | P0 |
| **FR-UPD-DOC-04** | A UI **prioriza** para exibição o estado derivado de **`GET empresa`** quando disponível e válido; caso contrário, espelho local; depois defaults (§6.1). | P0 |
| **FR-UPD-DOC-05** | No **carregamento** do ecrã (MVP), executar reconciliação **GET → save mirror** uma vez por sessão/visita conforme regras de caching na story (§6.2). | P0 |
| **FR-UPD-DOC-06** | Se `GET empresa` falhar, a experiência **degrada** sem erro bloqueante: mostrar espelho ou defaults e mensagem discreta opcional (“Não foi possível confirmar o estado no emissor”). | P0 |
| **FR-UPD-DOC-07** | Copy pós-guardar confirma sucesso **do emissor** (Plugnotas) de forma compreensível, **sem** jargão de base de dados. | P1 |
| **FR-UPD-DOC-08** | (P1) Se espelho e remoto divergirem após `GET`, mostrar **aviso** não bloqueante e CTA “sincronizar” / “actualizar vista” conforme §5.3. | P1 |
| **FR-UPD-DOC-09** | (P2) Métrica ou log de falhas de persistência do espelho após sucesso remoto (§6.5). | P2 |

---

## 8. Requisitos não funcionais

| ID | Requisito | Notas |
|----|-----------|-------|
| **NFR-UPD-DOC-01** | **Performance** | Evitar tempestade de `GET empresa`; uma chamada controlada por visita/sessão salvo excepção técnica documentada. |
| **NFR-UPD-DOC-02** | **Segurança** | Sem credenciais Plugnotas ou PFX em logs; espelho só com dados não sensíveis (booleanos por tipo). |
| **NFR-UPD-DOC-03** | **Resiliência** | Falha de Supabase no espelho **não** falha o fluxo principal se o Plugnotas tiver sucedido (mantém actual). |
| **NFR-UPD-DOC-04** | **Qualidade** | Gates `lint`, `typecheck`, `test` (`AGENTS.md`); testes para novo fluxo GET→mirror conforme story. |
| **NFR-UPD-DOC-05** | **RLS** | Cliente browser não ganha escrita directa à tabela por este PRD; manter padrão backend/service role para UPDATE do espelho. |

---

## 9. Requisitos de compatibilidade (brownfield)

| ID | Requisito |
|----|-----------|
| **CR-UPD-DOC-01** | `cadastrarPlugNotasEmpresa` e `atualizarPlugNotasEmpresa` mantêm contratos actuais; evoluções são **aditivas**. |
| **CR-UPD-DOC-02** | Comportamento de `saveDocumentosAtivosMirror` (UPDATE só com linha existente) **mantém-se**; cenários sem linha continuam sem espelho até cadastro de certificado. |
| **CR-UPD-DOC-03** | Requisitos **FR-CAD-DOC-\*** do PRD de cadastro **continuam válidos**; este PRD adiciona ciclo de vida **posterior**. |
| **CR-UPD-DOC-04** | `operacao-mei-nfse.md` e ADRs de `PATCH` **não** são contornados; merges de payload validados com Architect. |

---

## 10. Integração técnica (resumo — detalhe na story + architect)

| Área | Abordagem |
|------|-----------|
| **Backend** | Reutilizar `consultarEmpresaPlugNotas` / `GET` existente; novo **use-case** ou rota agregada: “reconciliar espelho” = GET + `saveDocumentosAtivosMirror` (ou invocação interna após GET no controller de consulta já exposto). |
| **Normalização** | Reutilizar `plugnotas-empresa-documentos-ativos.js` para mapear resposta remota → `{ nfse, nfe, nfce }`. |
| **Frontend** | `GuidesMei` (ou serviço dedicado): ordem de hidratação remoto → espelho → default; efeito de montagem para disparar GET conforme §6.2. |
| **Supabase** | Coluna existente `documentos_ativos`; sem migração obrigatória para MVP deste PRD. |

---

## 11. Métricas de sucesso

| Objetivo | Métrica / evidência |
|----------|---------------------|
| **Paridade** | Em QA/staging, após `PATCH` com `documentosAtivos`, valor em Supabase = payload enviado (teste automatizado ou script). |
| **Menos deriva** | Redução qualitativa de relatórios “app vs painel” após introdução de GET no carregamento (suporte). |
| **Robustez** | Taxa de erro **não** aumenta no `GET` (monitorizar 4xx/5xx Plugnotas). |
| **Observabilidade (P2)** | Contagem de warns de falha de espelho (se **FR-UPD-DOC-09**). |

---

## 12. Riscos e mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Rate limit Plugnotas por GET frequente | Bloqueio intermitente | Caching, debounce, uma chamada por visita (§6.2, **NFR-UPD-DOC-01**). |
| Resposta `GET` parcialmente parseável | UI incorrecta | Fallback para espelho; não inventar flags (**FR-UPD-DOC-06**). |
| PATCH merge incorrecto | 400 ou estado errado | Story + Architect alinham com `operacao-mei-nfse.md`. |
| Utilizador sem linha Supabase | Espelho nunca gravado | Documentar; fluxo de certificado primeiro (**CR-UPD-DOC-02**). |

---

## 13. Epic e stories (proposta)

**Épico sugerido:** **Atualização posterior** e **reconciliação** de documentos activos (Plugnotas + Supabase).

| Story sugerida | Conteúdo mínimo |
|----------------|-----------------|
| **Story 1 (P0)** | Frontend: affordance pós-cadastro; envio **sempre** com `documentosAtivos` na confirmação de edição; testes de fluxo. |
| **Story 2 (P0)** | Backend: endpoint ou extensão de fluxo **GET empresa → saveDocumentosAtivosMirror**; testes unitários/integração com mocks. |
| **Story 3 (P0)** | Frontend: hidratação §6.1; `useEffect`/loader que dispara reconciliação no mount; tratamento **FR-UPD-DOC-06**. |
| **Story 4 (P1)** | UX: copy **FR-UPD-DOC-07**; banner opcional **FR-UPD-DOC-08**; botão sincronizar se PO aprovar P1. |
| **Story 5 (P2)** | Observabilidade **FR-UPD-DOC-09**. |

Cada story deve referenciar este PRD, o brief, checklist, **file list** e gates do `AGENTS.md`.

---

## 14. Critérios de release / Definition of Done (produto)

- [ ] **FR-UPD-DOC-01** a **FR-UPD-DOC-06** satisfeitos.  
- [ ] **FR-UPD-DOC-07** a **FR-UPD-DOC-09** satisfeitos ou explicitamente adiados com acordo PO.  
- [ ] **NFR-UPD-DOC-01** a **NFR-UPD-DOC-05** verificados.  
- [ ] **CR-UPD-DOC-01** a **CR-UPD-DOC-04** sem regressão em QA.  
- [ ] Decisões **§6.1** a **§6.5** reflectidas na implementação.  
- [ ] Architect validou ordem de chamadas, merge de `PATCH` e caching de `GET`.

---

## 15. Checklist de QA (produto)

1. Editar só documentos activos na app (sem novo certificado) — `documentos_ativos` no Supabase alinhado após sucesso.  
2. Abrir Guia MEI após alteração **só** no painel Plugnotas — UI mostra estado remoto após GET (ou fallback coerente com **FR-UPD-DOC-06**).  
3. `GET empresa` indisponível — UI não bloqueia; mensagem discreta se implementada.  
4. Não regressão: cadastro inicial e **FR-CAD-DOC-**\* continuam a passar smoke relevante.  
5. Duplo carregamento da página — no máximo **uma** chamada GET “relevante” por política de cache (verificar em rede).

---

## 16. Change log

| Versão | Data | Autor | Notas |
|--------|------|-------|-------|
| 1.0 | 2026-04-07 | PM (Morgan — a partir do brief) | Versão inicial completa; fecha decisões §6 do brief. |

---

*Próximo passo canónico AIOX: **@architect** — contrato GET→normalização→espelho, caching e merge de `PATCH`; **@sm** — story(ies) com IDs **FR-UPD-DOC-**\*; **@dev** — implementação com gates do `AGENTS.md`.*

— Morgan, planejando o futuro 📊
