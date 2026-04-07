# PRD — Cadastro do emitente: **documentos ativos** (Plugnotas)

**Versão:** 1.0  
**Data:** 2026-04-07  
**Tipo:** Brownfield — fluxo fiscal (certificado A1 + `POST`/`PATCH` empresa), UI Guia MEI / área de cadastro  
**Fonte canónica do pedido:** [`docs/brief/brief-cadastro-empresa-documentos-ativos-plugnotas-2026-04-07.md`](../brief/brief-cadastro-empresa-documentos-ativos-plugnotas-2026-04-07.md)

**Relação com outros artefatos:**

- **`docs/prd/PRD-meu-financeiro-produto-brownfield-2026-03-26.md`** — contexto NFS-e, Plugnotas, fonte de verdade.  
- **`docs/prd/PRD-mei-emissao-nfe-nfce-plugnotas-guia-2026-04-06.md`** — emissão multi-tipo na **aba de emissão**; este PRD trata **cadastro** e **habilitação** no provedor; as duas entregas devem coordenar-se mas **não** são obrigatoriamente a mesma release (ver §6.1).  
- **`docs/operacao-mei-nfse.md`** — política de payload `nfe`/`nfce`/`nfse`, `PATCH` sem sobrescrever blocos omitidos, NFS-e Nacional.  
- **`docs/adr/ADR-plugnotas-empresa-payload-apenas-nfse.md`** — decisão técnica de normalização; alterações ao cadastro podem exigir revisão ou ADR complementar.  
- **`docs/brief/brief-user-mei-certificates-nfse-campos-supabase.md`** — espelhamento local do emitente; flags de documentos ativos devem alinhar-se à persistência quando existir coluna/tabela adequada.  
- **Não substitui** orientação legal/tributária: o produto **orquestra** dados e chamadas; o utilizador e o contador permanecem responsáveis pela conformidade.

---

## 1. Resumo executivo

Na área de **cadastrar a empresa** no fluxo fiscal (upload de certificado digital + dados mínimos enviados ao **Plugnotas**), o utilizador deve poder **escolher explicitamente quais tipos de documento eletrónico ficam activos** no emissor — no mínimo **NFS-e**, **NF-e** e **NFC-e** — através de controlos claros (ex.: checkboxes numa secção ou separador **“Documentos ativos”**).

O backend, no modo MEI focado em serviço, **inactiva** hoje `nfe` e `nfce` no `POST` de empresa e aplica regras específicas a `nfse` (incluindo NFS-e Nacional). Este PRD define requisitos rastreáveis (**FR-CAD-DOC-\***), NFRs, decisões de produto, compatibilidade brownfield e critérios de release para:

1. **UI:** secção acessível de **documentos activos** com rótulos e ajuda curta por tipo.  
2. **Contrato:** a selecção reflecte-se no **payload** de `POST …/empresa` e, quando aplicável, em `PATCH …/empresa`, respeitando regras de não sobrescrever configuração remota indevidamente.  
3. **Copy dinâmica:** títulos e blocos de “dados mínimos” adaptam-se quando mais de um tipo está activo ou quando só NFS-e está activo.  
4. **Persistência local:** guardar preferência/espelho dos tipos activos quando o modelo de dados do produto o suportar (`user_mei_certificates` ou extensão acordada).  
5. **Não regressão:** utilizadores que só precisam de **NFS-e** mantêm um caminho simples (defaults e mensagens).

---

## 2. Visão de produto (experiência)

O utilizador compreende **antes ou durante o envio do cadastro** quais canais fiscais ficarão habilitados no Plugnotas, alinhando expectativa com o **painel web** do provedor e reduzindo surpresas (“pensei que só tinha NFS-e” / “activei produto mas o emissor recusou”).

MEIs que **prestam serviços e vendem mercadorias** podem marcar **NFS-e** e **NFC-e** (e **NF-e** quando aplicável) no **mesmo** cadastro emitente, sem depender apenas de defaults opacos do servidor.

---

## 3. Problema e oportunidade

| Dimensão | Problema | Oportunidade |
|----------|----------|--------------|
| **Transparência** | O cadastro não comunica quais tipos ficam activos no Plugnotas. | Selecção explícita + texto de apoio por tipo. |
| **Desalinhamento app ↔ painel** | Utilizador compara com `app2.plugnotas.com.br` e não reconhece o estado. | “Consultar cadastro no emissor” reflecte, na medida da API, os tipos ou explica limitações. |
| **Limitação D-01 (UI emissão)** | A Guia MEI expõe historicamente **só NFS-e** na emissão. | Cadastro pode preparar o provedor para **NF-e/NFC-e** sem obrigar a mesma release que a UI de emissão (§6.1). |
| **Erros 400** | Activar NF-e/NFC-e sem dados mínimos do tipo (CSC, IE, etc.). | Validação e bloqueio com mensagens mapeadas; campos contextualizados. |

---

## 4. Personas e cenários

| Persona | Cenário de validação |
|---------|----------------------|
| **MEI — só serviços** | Mantém **NFS-e** activo; pode deixar NF-e/NFC-e desmarcados; fluxo e copy permanecem familiares. |
| **MEI — serviços + venda ao consumidor** | Marca **NFS-e** e **NFC-e**; completa dados exigidos para NFC-e quando o produto os solicitar; cadastro enviado com blocos coerentes. |
| **MEI — necessidade de NF-e (mod. 55)** | Marca **NF-e**; preenche campos adicionais se o cadastro os exigir; submissão ou PATCH não falha silenciosamente. |
| **Utilizador a actualizar sem novo certificado** | Usa “Atualizar cadastro (sem novo certificado)” para alterar **documentos activos** e dados associados, com as mesmas regras de idempotência documentadas para `PATCH`. |

**Stakeholders:** PO (decisões §6), UX (secção “Documentos activos”, tabs vs bloco único), Architect (`plugnotas-mei-empresa-policy`, contrato Plugnotas), Backend, Frontend, QA, Suporte.

---

## 5. Escopo

### 5.1 Dentro do escopo (MVP / P0)

- **Secção “Documentos activos”** na área de cadastro da empresa (integrada ao fluxo existente de certificado + dados mínimos), com **três opções** canónicas: **NFS-e**, **NF-e**, **NFC-e** (controlos de selecção múltipla acessíveis — ver §8).  
- **Sincronização** da selecção com o **normalizador de empresa** e com `POST` / `PATCH` para o Plugnotas (`ativo`, `tipoContrato`, `config` quando exigido pelo policy layer — **detalhe técnico na story + @architect**).  
- **Regras de validação de negócio na app:** impedir envio inválido quando um tipo está activo mas faltam **pré-requisitos mínimos** acordados para esse tipo (lista na story com base na API e ADRs).  
- **Acção “Consultar cadastro no emissor”:** onde a resposta permitir, **reflectir** ou **explicar** o estado dos tipos activos; se a API não expuser simetria, mensagem honesta (sem inventar estado).  
- **“Atualizar cadastro (sem novo certificado)”:** aplicar alterações de documentos activos quando o contrato `PATCH` o permitir, com mensagens de erro claras em falha.  
- **Copy dinâmica:** quando **apenas NFS-e** está activo, manter títulos actuais ou equivalentes; quando **dois ou mais** tipos estão activos, usar título neutro (ex.: **“Configuração fiscal do emitente”** ou **“Dados para emissão no Plugnotas”**) — texto final na story com UX.  
- **Persistência:** se o modelo `user_mei_certificates` (ou tabela relacionada) for estendido, guardar flags ou lista canónica de tipos activos escolhidos para pré-preenchimento e auditoria.  
- **Testes e gates:** `npm run lint`, `npm run typecheck`, `npm test` conforme `AGENTS.md`; testes no normalizador / rotas conforme política do repo.

### 5.2 Fora do escopo (fase 2 ou explícito “não”)

- **Substituir** o Plugnotas ou outro integrador.  
- **CT-e** ou outros documentos sem requisito de negócio explícito.  
- **Implementação completa da aba de emissão** para NF-e/NFC-e: continua em **`PRD-mei-emissao-nfe-nfce-plugnotas-guia-2026-04-06.md`** (pode ser release separada).  
- **Substituir** o contador ou validar todas as regras fiscais municipais/estaduais no cliente além do mínimo para API.

---

## 6. Decisões de produto (fechadas neste PRD)

### 6.1 Relação com a Limitação D-01 (Guia MEI — emissão só NFS-e na UI)

**Decisão:** A funcionalidade de **documentos activos no cadastro** é **independente** da exposição de emissão NF-e/NFC-e na interface do Guia MEI.

- O utilizador pode **activar** NF-e e/ou NFC-e no **cadastro** para alinhar o emitente no Plugnotas **antes** ou **em paralelo** com a entrega da UI de emissão multi-tipo.  
- Enquanto a emissão NF-e/NFC-e **não** estiver disponível na UI, o produto deve mostrar **texto de ajuda** (uma linha ou tooltip) do tipo: a activação prepara o emissor; a **emissão** de notas de produto pode exigir **funcionalidade de emissão** e dados adicionais (CSC, etc.) conforme `PRD-mei-emissao-nfe-nfce-plugnotas-guia-2026-04-06.md`.

**Critério de fecho:** story confirma copy exacta e pontos de entrada de ajuda (link para guia interno / `operacao-mei-nfse.md` quando aplicável).

### 6.2 Defaults da selecção (novo fluxo vs retorno)

| Situação | Comportamento recomendado |
|----------|---------------------------|
| **Primeiro cadastro** (sem snapshot local nem consulta prévia) | **NFS-e** = activo; **NF-e** e **NFC-e** = inactivos (alinhado ao MEI prestador típico e ao comportamento histórico do policy layer). |
| **Consulta prévia** `GET …/empresa` devolve estado | **Preferir espelhar** o estado remoto na UI quando a resposta for parseável de forma fiável (**detalhe na story com @architect**). |
| **Snapshot local** existir | Pré-seleccionar de acordo com dados persistidos após migração/extensão de schema. |

**Critério de fecho:** story documenta qual combinação foi implementada e ordem de precedência (remoto > local > default).

### 6.3 Pelo menos um tipo activo

**Decisão:** Não é permitido gravar cadastro com **zero** tipos seleccionados quando o fluxo pressupõe emitente fiscal activo. A UI deve **bloquear** o envio com mensagem clara (“Seleccione pelo menos um tipo de documento.”).

*Excepção futura:* modo “rascunho” sem chamada ao Plugnotas — **fora do MVP** salvo decisão PO explícita.

### 6.4 Desmarcar NFS-e com Guia MEI a assumir NFS-e

**Decisão:** Se o utilizador **desmarcar NFS-e** mas o produto continuar a tratar o Guia MEI como hub principal de **serviços**, o sistema deve **avisar** (dialog ou banner) de que a emissão de NFS-e na app pode ficar **bloqueada** ou inconsistente com o emissor; **confirmar** antes de prosseguir ou impedir a acção conforme política de risco acordada na story.

### 6.5 PATCH sem incluir `nfe` / `nfce` no corpo

**Decisão de produto:** Alterações de **documentos activos** devem **sempre** poder ser expressas num fluxo que o utilizador entende como “guardar configuração”. Se o backend actual omitir blocos no `PATCH` para não reactivar NFC-e legada (`docs/operacao-mei-nfse.md`), a story deve definir **contrato explícito** (sempre enviar blocos quando o utilizador alterou a selecção, ou endpoint dedicado) — **@architect** — sem violar a intenção do ADR.

---

## 7. Requisitos funcionais

| ID | Requisito | Prioridade |
|----|-----------|------------|
| **FR-CAD-DOC-01** | Na área de cadastro da empresa (fluxo fiscal), existe secção identificável **“Documentos activos”** (ou equivalente com mesma semântica) com opções **NFS-e**, **NF-e** e **NFC-e**. | P0 |
| **FR-CAD-DOC-02** | O utilizador pode activar ou desactivar cada tipo de forma independente, sujeito a **FR-CAD-DOC-03** e §6.4. | P0 |
| **FR-CAD-DOC-03** | O sistema impede concluir o cadastro com **zero** tipos seleccionados (§6.3), com mensagem compreensível. | P0 |
| **FR-CAD-DOC-04** | A submissão de **novo cadastro** (`POST` empresa) envia ao backend a intenção de tipos activos de forma que o **policy layer** produza payload Plugnotas coerente (`nfse` / `nfe` / `nfce`). | P0 |
| **FR-CAD-DOC-05** | A acção **“Atualizar cadastro (sem novo certificado)”** permite alterar documentos activos quando o contrato API o suportar, com o mesmo nível de clareza de erro que o cadastro completo. | P0 |
| **FR-CAD-DOC-06** | **“Consultar cadastro no emissor”** actualiza ou mostra o estado dos tipos na medida em que a resposta da API o permitir; caso contrário, informa limitação sem dados falsos. | P0 |
| **FR-CAD-DOC-07** | Quando **só NFS-e** está activo, a experiência não piora injustificadamente para quem já usava o fluxo (copy pode manter ênfase NFS-e). | P0 |
| **FR-CAD-DOC-08** | Quando **dois ou mais** tipos estão activos, títulos principais usam formulação **neutra** (§5.1 copy dinâmica). | P1 |
| **FR-CAD-DOC-09** | Campos de “dados mínimos” **contextualizam-se**: mostrar ou destacar campos obrigatórios **por tipo activo** (ex.: requisitos adicionais para NFC-e/NF-e) — lista exacta na story. | P1 |
| **FR-CAD-DOC-10** | Se NF-e ou NFC-e estiverem activos e a emissão multi-tipo **não** estiver ainda na UI, exibir **ajuda breve** com remissão ao PRD de emissão / documentação interna (§6.1). | P1 |
| **FR-CAD-DOC-11** | (Opcional P2) Telemetria anónima de “combinação de tipos activos” para product analytics, **só** com base legal/política de cookies do produto. | P2 |

---

## 8. Requisitos não funcionais

| ID | Requisito | Notas |
|----|-----------|-------|
| **NFR-CAD-DOC-01** | **Acessibilidade** | `fieldset` + `legend` ou padrão equivalente; nomes acessíveis nos checkboxes; associação ao aviso de certificado A1 via `aria-describedby` quando fizer sentido. |
| **NFR-CAD-DOC-02** | **Segurança** | Sem expor certificado nem senha em novos logs; seguir redacção já definida para payloads (`PLUGNOTAS_DEBUG`, etc.). |
| **NFR-CAD-DOC-03** | **Consistência** | A selecção na UI não contradiz o normalizador servidor; uma única fonte de verdade para defaults. |
| **NFR-CAD-DOC-04** | **Qualidade** | Gates `lint`, `typecheck`, `test` (`AGENTS.md`); ficheiros tocados listados na story. |
| **NFR-CAD-DOC-05** | **Observabilidade** | Erros Plugnotas continuam mapeados para mensagens humanas (`fiscalUserError`, integração); novos códigos documentados se necessário. |

---

## 9. Requisitos de compatibilidade (brownfield)

| ID | Requisito |
|----|-----------|
| **CR-CAD-DOC-01** | Utilizadores que concluem cadastro **apenas com NFS-e** activo obtêm comportamento equivalente ao **policy** actual de modo MEI (sem regressão intencional de payload). |
| **CR-CAD-DOC-02** | Endpoints existentes de setup (`certificado`, `empresa`, `GET` consulta) permanecem utilizáveis; evoluções são **aditivas** ou documentadas como migração. |
| **CR-CAD-DOC-03** | `nfse.nacional` e regras de `PATCH` descritas em `operacao-mei-nfse.md` **não** são enfraquecidas por esta feature; qualquer interacção é validada na story. |
| **CR-CAD-DOC-04** | Integração com **`PRD-mei-emissao-nfe-nfce-…`**: se o utilizador só activar tipos no cadastro, a emissão ainda segue o roadmap daquele PRD; não há promessa de emissão NF-e/NFC-e só por este PRD. |

---

## 10. Integração técnica (resumo — detalhe na story + architect)

| Área | Abordagem |
|------|-----------|
| **API interna** | `POST` / `PATCH` / `GET` empresa sob prefixo `…/emissao-fiscal/empresa` (e alias `plugnotas` se existir). |
| **Policy** | `plugnotas-mei-empresa-policy.js` (ou sucessor) — mapear selecção UI → blocos `nfse` / `nfe` / `nfce`. |
| **Plugnotas** | Contrato oficial por tipo (`ativo`, `tipoContrato`, `config`); validar com documentação e painel. |
| **Persistência** | Extensão de `user_mei_certificates` ou campo JSON de preferências — alinhar a `brief-user-mei-certificates`. |
| **Frontend** | Componentes do cadastro em `GuidesMei` (ou módulos extraídos); reutilizar tokens e padrões de erro fiscais existentes. |

---

## 11. Métricas de sucesso

| Objetivo | Métrica / evidência |
|----------|---------------------|
| **Clareza** | Redução qualitativa de tickets “não sei o que está activo no Plugnotas” (suporte). |
| **Conclusão de cadastro** | Taxa de sucesso de `POST`/`PATCH` empresa sem 400 evitável por falta de campo quando tipo está activo (QA + monitorização de erros mapeados). |
| **Adopção** | Percentagem de utilizadores com mais de um tipo activo (se **FR-CAD-DOC-11** existir). |
| **Qualidade** | Zero regressões críticas em fluxo NFS-e-only (smoke). |

---

## 12. Riscos e mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Divergência entre painel Plugnotas e app | Confiança | Consulta + copy honesta; checklist operacional como em `operacao-mei-nfse.md`. |
| 400 por `config` incompleto para NFE/NFCE | Abandono | **FR-CAD-DOC-09**, validação pré-envio, mensagens mapeadas. |
| Conflito com ADR payload apenas NFS-e | Implementação bloqueada | Revisão conjunta Architect + ADR complementar se necessário. |
| Utilizador activa produto sem UI de emissão | Frustração | **FR-CAD-DOC-10**, §6.1. |

---

## 13. Epic e stories (proposta)

**Épico sugerido:** Cadastro emitente Plugnotas — **documentos activos** e alinhamento multi-tipo.

| Story sugerida | Conteúdo mínimo |
|----------------|-----------------|
| **Story A (P0)** | UI “Documentos activos”; estado default; integração com request de cadastro; testes de componente/contrato. |
| **Story B (P0)** | Policy backend + testes do normalizador; `PATCH` e `GET` coerentes com §6.5; documentar limitações API. |
| **Story C (P1)** | Copy dinâmica de títulos; campos condicionais por tipo; **FR-CAD-DOC-09**. |
| **Story D (P1)** | Persistência em `user_mei_certificates` (ou migração); hidratação ao reabrir cadastro. |
| **Story E** | Coordenação com **`PRD-mei-emissao-nfe-nfce-plugnotas-guia-2026-04-06.md`** — habilitação end-to-end quando ambos PRDs estiverem nas releases alinhadas. |

Cada story deve referenciar este PRD, o brief, checklist, **file list** e gates.

---

## 14. Critérios de release / Definition of Done (produto)

- [ ] **FR-CAD-DOC-01** a **FR-CAD-DOC-07** satisfeitos.  
- [ ] **FR-CAD-DOC-08** a **FR-CAD-DOC-10** satisfeitos ou explicitamente adiados com acordo PO (P1).  
- [ ] **NFR-CAD-DOC-01** a **NFR-CAD-DOC-05** verificados.  
- [ ] **CR-CAD-DOC-01** a **CR-CAD-DOC-04** sem regressão comprovada em QA.  
- [ ] Decisões **§6.1** a **§6.5** reflectidas na implementação e na documentação de operação se necessário.  
- [ ] Architect validou contrato de payload, impacto em `PATCH` e persistência.

---

## 15. Checklist de QA (produto)

1. Cadastro novo só NFS-e — comportamento equivalente ao baseline.  
2. Cadastro NFS-e + NFC-e — payload e consulta coerentes; mensagens se faltar pré-requisito.  
3. PATCH sem certificado — alteração de tipos persistida ou erro explicado.  
4. Tentativa de zero tipos — bloqueio com mensagem.  
5. Desmarcar NFS-e — aviso §6.4.  
6. Leitores de ecrã — secção “Documentos activos” navegável e rotulada.

---

## 16. Change log

| Versão | Data | Autor | Notas |
|--------|------|-------|-------|
| 1.0 | 2026-04-07 | PM (Morgan — a partir do brief Atlas) | Versão inicial a partir de `brief-cadastro-empresa-documentos-ativos-plugnotas-2026-04-07.md`. |

---

*Próximo passo canónico AIOX: **@architect** — contrato UI ↔ policy ↔ Plugnotas, impacto em `PATCH`; **@sm** — story(ies) em `docs/stories/` com IDs **FR-CAD-DOC-**\*; **@dev** — implementação com gates do `AGENTS.md`.*

— Morgan, planejando o futuro 📊
