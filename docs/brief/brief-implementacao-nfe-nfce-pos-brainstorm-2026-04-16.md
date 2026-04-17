# Brief fino — implementação NF-e / NFC-e (pós-brainstorm)

**Data:** 2026-04-16  
**Origem:** sessão *brainstorm* (Atlas / analista), alinhada ao brownfield já documentado.  
**Não substitui:** PRD, arquitetura nem ADRs listados abaixo; consolida **candidatos de backlog** para PO/arquiteto/SM priorizarem.

**Referências canónicas do produto (ler antes de implementar):**

| Artefato | Conteúdo |
|----------|----------|
| `docs/brief/brief-emissao-nfe-nfce-plugnotas-aba-emissao-2026-04-06.md` | Problema, objetivos UX, estado brownfield, decisões em aberto |
| `docs/prd/PRD-mei-emissao-nfe-nfce-plugnotas-guia-2026-04-06.md` | FRs e critérios de release |
| `docs/technical/architecture-mei-emissao-nfe-nfce-guia-2026-04-06.md` | Rotas, validação, Plugnotas `POST /nfe` e `POST /nfce` |
| `docs/technical/adr-empresa-plugnotas-nfe-nfce-d1-2026-04-07.md` | **D1** — documentação + bloqueio quando modalidade inactiva |
| `docs/runbook/runbook-smoke-nfe-nfce-plugnotas-sandbox.md` | Smoke em sandbox |
| Documentação integrador | [Postman PlugNotas](https://documenter.getpostman.com/view/3720339/2sB3WpSh1R?version=latest), [NFC-e](https://docs.plugnotas.com.br/#tag/NFCe), [NF-e](https://docs.plugnotas.com.br/#tag/NFe) |

---

## 1. Escopo já coberto pelos artefatos (não reabrir sem nova decisão)

- Emissão unificada `POST …/mei-notas/emitir` com **NFE** / **NFCE**, validação servidor tipo NF-e, persistência com `document_type`.
- Linha **D1** para empresa Plugnotas: consulta de capacidades + **bloqueio honesto** na UI se `nfe`/`nfce` não estiverem disponíveis no integrador.

---

## 2. Temas do brainstorm → candidatos de implementação

Ordenação sugerida: **valor utilizador** × **dependência técnica** × **risco** (validar com PO).

| # | Tema | Ideia | Notas / dependências |
|---|------|--------|----------------------|
| A | **MVP emissão na UI** | Seletor NFS-e \| NF-e \| NFC-e, formulário contextual, envio coerente com `documentType` | Já é núcleo do PRD de 2026-04-06; backend preparado |
| B | **Bloqueio e orientação (D1)** | Manter `MeiFiscalCapabilityCallout` (ou equivalente) sincronizado com `GET …/empresa` | ADR D1; mensagens claras vs “bug da app” |
| C | **Habilitação guiada (D2)** | Fluxo que permita **ativar** modalidades NF-e/NFC-e no cadastro Plugnotas (PATCH controlado), com checklist fiscal | Backlog explícito no ADR; requer PRD/story próprios e contrato seguro |
| D | **Catálogo / produtos** | Reutilizar ou estender catálogo MEI para itens de NF-e/NFC-e (código interno, NCM, CFOP) | Brief 2026-04-06 §7.3; alinhar com stories de catálogo em curso |
| E | **Confiabilidade** | `idIntegração` estável e único; política de retry para falhas transitórias; eventual fila | Não inventar fila sem ADR; começar por idempotência explícita |
| F | **Observabilidade** | Métricas/logs por `document_type`, taxa de erro Plugnotas, latência até resposta | Compatível com “CLI First → Observability Second” do projeto |
| G | **Pós-emissão** | Consulta de status, XML/PDF/DANFE, cancelamento | Tags NFe/NFCe na doc Plugnotas; epic separado se não for MVP |
| H | **Feature flag (D3)** | Esconder NF-e/NFC-e por ambiente ou rollout | ADR lista como não adoptada; só com critério de produto |
| I | **Limite MEI** | Manter NFE/NFCE **fora** do somatório de limite até decisão explícita | Já referido na arquitetura; evitar regressão na UI de limite |

---

## 3. Fora deste briefing (explícito)

- Troca de integrador ou motor fiscal próprio.  
- Assessoria legal/tributária além do que o integrador e o contador exigem.  
- Requisitos não rastreados em PRD/story — não implementar “por brainstorming” sem artefato.

---

## 4. Próximos passos recomendados

1. **PO (@po):** priorizar linha **A → B → (D conforme catálogo)** vs **C** vs **G**; decidir se D2 entra em fase única ou épico posterior.  
2. **Arquiteto (@architect):** onde couber, detalhar contrato de PATCH empresa (D2) e limites de retry (E) sem divergir da API Plugnotas.  
3. **SM (@sm):** fatiar stories com file list e quality gates (`AGENTS.md`).  
4. **QA:** manter `docs/qa/plugnotas-multitipo-checklist.md` atualizado quando novos incrementos fecharem.

---

## 5. Riscos a acompanhar (registo do brainstorm)

- Payload UI ↔ API ↔ documentação Plugnotas em evolução — testes de contrato e smoke em sandbox.  
- Expectativa do utilizador quando a empresa **não** tem modalidade ativa (D1 já mitiga; comunicação de suporte alinhada ao ADR).  
- NFC-e (varejo) vs NF-e (B2B): textos de ajuda e validações específicas por modelo **55** / **65**.
