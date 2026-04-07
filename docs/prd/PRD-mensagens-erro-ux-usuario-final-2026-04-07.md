# PRD — Mensagens de erro compreensíveis para o utilizador final

**Versão:** 1.0  
**Data:** 2026-04-07  
**Tipo:** Brownfield — experiência transversal (frontend + coordenação com backend onde necessário)  
**Fontes:** `docs/brief/brief-mensagens-erro-ux-usuario-final-2026-04-07.md`

**Relação com outros documentos**

- **`docs/prd/PRD-meu-financeiro-produto-brownfield-2026-03-26.md`** — visão de produto; este PRD **não** altera regras de negócio fiscal nem contratos de API por si só, exceto quando for **estritoamente necessário** expor metadados de erro de forma estruturada para mapeamento na UI.  
- **`docs/prd/PRD-revisao-iu-ux-global-intuitividade-2026-04-01.md`** — programa global de IU/UX; reforça **FR-UX-GLOBAL-B05/B06** (bloqueios orientadores; MEI/fiscal com próximo passo). O presente PRD **especializa** a camada de **mensagens de erro** com requisitos rastreáveis e inventário.  
- **`docs/prd/PRD-meu-mei-ui-ux-melhoria-2026-03-30.md`** e **`docs/prd/PRD-mei-nfse-workspace-ui-ux-melhoria-2026-04-01.md`** — experiência Guia MEI / NFS-e; mensagens fiscais devem **alinhar** hierarquia e tom com este PRD sem contradizer specs de workspace.  
- **Specs UX:** `docs/specs/ux-spec-mei-nfse-workspace-2026-04-01.md`, `docs/specs/ux-spec-guia-mei-emissao-nfe-nfce-2026-04-06.md` — devem receber **adendos de exemplos de copy** após fecho do inventário (entregável).  
- **Código de referência:** `frontend/src/lib/fiscalUserError.ts`, `frontend/src/components/FiscalIntegrationErrorAlert.tsx`, `frontend/src/components/FetchErrorBanner.tsx`, `frontend/src/utils/buildApiErrorMessage.ts`, `frontend/src/services/apiClient.ts`.

---

## 1. Resumo executivo

O Meu Financeiro já **protege** parcialmente o utilizador contra mensagens inúteis (ex.: heurísticas em `fiscalUserError.ts`; avisos de origem do **provedor fiscal** em `FiscalIntegrationErrorAlert`). Persistem, no entanto, **lacunas sistemáticas**: strings genéricas (“Erro na requisição”), **jargão** (HTTP, paths, resumos de tentativas Plugnotas embutidos no mesmo texto que o utilizador lê), e blocos **sem hierarquia** (título / corpo / ação), o que aumenta abandono, contactos de suporte repetitivos e perceção de instabilidade.

Este PRD define **objetivos**, **taxonomia de erros**, **padrão único de apresentação**, **requisitos funcionais e não funcionais rastreáveis (FR-ERR-*, NFR-ERR-*)**, **fases de descoberta e implementação**, **métricas**, **ondas de priorização** e **critérios de release**, para que **toda** mensagem de erro visível ao utilizador final comunique: **o que falhou (linguagem simples)**, **o que fazer a seguir**, e **a fonte** (aplicação, rede, serviço de notas / emissor), sem expor detalhes internos desnecessários.

---

## 2. Visão de produto (experiência)

Quando algo corre mal, o utilizador — em particular o microempreendedor **sem** literacia técnica — deve **perceber em segundos** se o problema é **temporário** (tentar de novo), **de ligação** (verificar internet), **de sessão** (voltar a entrar), **de dados** (corrigir campo ou informação fiscal), ou **do serviço externo de notas** (ajustar conforme validação, com texto do provedor disponível de forma **secundária** e legível). Nenhum fluxo prioritário deve terminar numa **única linha opaca** sem orientação.

**Princípio reitor:** *erro = título humano + explicação curta + ação recuperável (quando aplicável) + origem explícita quando não for culpa da app*.

---

## 3. Problema e oportunidade

| Dimensão | Problema | Oportunidade |
|----------|----------|--------------|
| **Consistência** | O mesmo tipo de falha (rede, 401, validação) aparece com **tons e formatos diferentes** entre ecrãs. | Padrão visual e de copy **único** (componente ou contrato partilhado) com variantes por `source` e `severity`. |
| **Agregação técnica** | `buildApiErrorMessage` concatena mensagem, detalhes e metadados Plugnotas numa **única string** consumida pela UI. | Separar **copy humana** de **detalhe técnico** (colapsável, “Copiar para suporte”, ou só em log). |
| **Hierarquia** | Texto longo do provedor sem título simples por cima. | Título **sempre** em linguagem de utilizador; detalhe técnico/provedor **abaixo** ou expansível. |
| **Recuperação** | Falta de CTA (retry, voltar ao passo, abrir ajuda). | **FR explícitos** por categoria: recuperável vs não recuperável. |
| **Acessibilidade** | `role="alert"` existe, mas título/ação nem sempre são **anunciáveis** de forma útil. | Estrutura semântica estável (`h2`/`h3` ou `aria-labelledby`), foco gerido em modais. |

---

## 4. Personas, stakeholders e cenários de validação

### 4.1 Personas

| Persona | Necessidade | Implicação para erros |
|---------|-------------|------------------------|
| MEI autónomo (não técnico) | Saber **o que fazer** depois do erro | Imperativos claros; zero dependência de “HTTP”, “endpoint”, JSON. |
| MEI recorrente | Corrigir dados e reemitir rápido | Mensagens fiscais: título + texto do provedor preservado **legível** + CTA “Rever dados” / secção sugerida. |
| Utilizador do núcleo financeiro | Continuar após falha de rede | “Tentar novamente” + explicação de ligação; não misturar com erro fiscal. |

### 4.2 Stakeholders

Produto/PO (aprovação de copy e priorização), UX (tom, hierarquia, revisão de legibilidade), Engenharia frontend (componente e migração de call sites), Backend (opcional: enriquecer payload de erro estável), QA (regressão, a11y), Suporte (validação de “copiar detalhes” / ID de correlação, se adotado).

### 4.3 Cenários de validação (teste manual / moderado)

1. **Guia MEI — emissão com rejeição do provedor:** o utilizador identifica **que a validação veio do serviço de notas** e qual o **próximo passo** (rever campo X ou documentação) sem ler só JSON.  
2. **Catálogo MEI — falha ao gravar por rede:** mensagem de ligação + **Tentar novamente**; após sucesso, estado consistente.  
3. **Transações — erro ao carregar:** não fica apenas “Erro ao carregar transações” sem segunda frase de orientação.  
4. **Sessão expirada (401):** instrução de **sair e entrar** sem jargão; consistente com `mapMeiFiscalErrorToCopy` onde aplicável.

---

## 5. Escopo

### 5.1 Dentro do escopo

- **Fase A — Descoberta e especificação**
  - **Inventário** de superfícies e *call sites* que exibem erro (toast, banner, alert, inline, modal).  
  - **Taxonomia** de erro: `rede` | `indisponivel` | `sessao` | `permissao` | `validacao_cliente` | `provedor_fiscal` | `validacao_servidor` | `desconhecido` (ajustável após auditoria, máx. **8** categorias estáveis para analytics).  
  - **Tabela de copy canónica** por categoria (título, descrição, CTA primária, CTA secundária opcional, `source` label).  
  - **Contrato de UI** (props / tipo TypeScript) para componente ou *hook* `UserFacingError` (nome final a definir em implementação).  
  - **Adendo** às specs UX citadas com **exemplos** antes/depois.  
- **Fase B — Implementação**
  - Migração dos fluxos **P0** listados na secção 10 para o padrão único.  
  - Extensão ou criação de **mapeador** para erros da API genérica (equivalente conceitual a `mapMeiFiscalErrorToCopy` para `ApiClient`).  
  - Testes automatizados nos **mapeamentos** e, onde fizer sentido, testes de componente nos blocos de erro.  
- **Opcional (P2)** — Eventos analíticos `error_shown` com `category` estável, **sem** PII nem texto bruto completo do provedor (hash ou comprimento apenas, conforme política).

### 5.2 Fora do escopo

- **i18n** completa (pt apenas, salvo story futura).  
- Eliminar **toda** mensagem técnica em **painéis admin** ou ferramentas internas — pode coexistir vista “utilizador” vs “técnico”.  
- Garantir **zero** falhas do provedor fiscal — apenas **comunicação**.  
- Redesign global do *design system* além do necessário para consistência de alertas.

---

## 6. Taxonomia e padrão de apresentação (normativo)

### 6.1 Estrutura mínima de cada erro ao utilizador

| Elemento | Obrigatório | Notas |
|----------|-------------|--------|
| **Título** | Sim | Frase curta, sem códigos HTTP visíveis ao utilizador final. |
| **Descrição** | Sim | 1–3 frases; uma ideia por frase; tom neutro, sem culpar. |
| **Fonte** | Quando ≠ app | Ex.: “Esta mensagem foi enviada pelo serviço de emissão de notas.” |
| **CTA primária** | Se `recoverable === true` | Ex.: “Tentar novamente”, “Voltar ao certificado”, “Sair e entrar de novo”. |
| **CTA secundária** | Opcional | Link para documentação MEI / ajuda contextual. |
| **Detalhe técnico** | Opcional | Colapsável “Detalhes” ou “Informação para suporte”; pode incluir texto longo do provedor **após** o título humano. |

### 6.2 Proibições (utilizador final)

- Stack traces, JSON bruto como **única** mensagem, paths de ficheiro internos.  
- Códigos opacos (`err_xyz`) **sem** linha de tradução humana adjacente.  
- Mensagem **apenas** “Erro na requisição” em fluxos P0 sem segunda linha de orientação (ver **FR-ERR-04**).

---

## 7. Requisitos funcionais

### 7.1 Fase A — Documentação e desenho

| ID | Requisito | Prioridade |
|----|-----------|------------|
| **FR-ERR-A01** | Publicar **inventário de erros** (Markdown em `docs/`) com colunas: *superfície/rota*, *componente*, *origem atual da string*, *categoria taxonómica*, *copy proposta*, *recoverable*, *CTAs*. | P0 |
| **FR-ERR-A02** | Publicar **tabela de copy canónica** por categoria taxonómica (versão 1.0) aprovada por PO ou delegado. | P0 |
| **FR-ERR-A03** | Documentar **contrato TypeScript** do bloco de erro ao utilizador (`variant`, `category`, `source`, `recoverable`, `title`, `description`, `technicalDetail?`, `primaryAction?`, `secondaryAction?`). | P0 |
| **FR-ERR-A04** | Atualizar **`docs/specs/ux-spec-mei-nfse-workspace-2026-04-01.md`** e **`docs/specs/ux-spec-guia-mei-emissao-nfe-nfce-2026-04-06.md`** com **pelo menos um exemplo** antes/depois por tipo de erro fiscal relevante (bloqueio, provedor, rede). | P1 |
| **FR-ERR-A05** | Identificar **pontos** onde `buildApiErrorMessage` alimenta UI direta; propor **estratégia** (mapear no cliente vs estender payload backend) e registar decisão no inventário. | P0 |

### 7.2 Fase B — Produto e implementação

| ID | Requisito | Prioridade |
|----|-----------|------------|
| **FR-ERR-B01** | Implementar **componente ou sistema único** (reutilizável) que cumpra a estrutura da secção 6.1 e seja utilizado nos fluxos P0 migrados. | P0 |
| **FR-ERR-B02** | **Guia MEI** (certificado, capacidade fiscal, emissão NFSe / NF-e / NFC-e): toda falha visível cumpre 6.1; texto longo do provedor **não** substitui título humano. | P0 |
| **FR-ERR-B03** | **Catálogos MEI** (clientes, produtos/serviços): erros de gravação e rede com título + descrição + CTA quando recuperável. | P0 |
| **FR-ERR-B04** | **Transações e integrações** (ex.: `transactionStore`, Google Calendar): mensagens de falha **não** são apenas `Error.message` cru se esse texto for genérico ou técnico; usar mapeamento ou fallback canónico com orientação. | P0 |
| **FR-ERR-B05** | **Definições / sessão:** alinhar padrão com mapeamentos existentes (ex.: 401/403) onde houver duplicação de lógica; evitar cópias divergentes do mesmo significado. | P1 |
| **FR-ERR-B06** | Onde o backend devolver `success: false` com `errors.plugnotasCode` ou equivalente, a UI deve **preferir** mapeamento estável para título/descrição quando existir; texto bruto permanece em **detalhe** se necessário para correção fiscal. | P0 |
| **FR-ERR-B07** | **Fallback global** para erros não classificados: mensagem genérica **com** passos (tentar de novo, verificar ligação, contactar suporte com o que estava a fazer), alinhada a `MEI_FISCAL_ERROR_FALLBACK_DESCRIPTION` em espírito (pode unificar copy num único módulo). | P0 |
| **FR-ERR-B08** | (Opcional P2) Instrumentar evento analítico `error_shown` com `category` taxonómico estável, **sem** dados pessoais nem corpo completo de respostas do provedor. | P2 |

---

## 8. Requisitos não funcionais

| ID | Requisito | Notas |
|----|-----------|--------|
| **NFR-ERR-01** | Acessibilidade | Regiões de alerta com `role="alert"` ou equivalente; título associado via heading ou `aria-labelledby`; foco gerido em modais; contraste AA nos novos blocos. |
| **NFR-ERR-02** | Qualidade | `npm run lint`, `npm run typecheck`, `npm test` nos pacotes alterados; testes existentes MEI/rota permanecem verdes ou atualizados explicitamente. |
| **NFR-ERR-03** | Segurança e privacidade | “Copiar para suporte” não deve incluir tokens, cookies nem PII acidental; validar conteúdo do *clipboard* em revisão. |
| **NFR-ERR-04** | Manutenção | Mapeamentos centralizados (ficheiros dedicados); evitar *strings* duplicadas sem constante partilhada quando a copy for canónica. |
| **NFR-ERR-05** | Legibilidade | Copy prioritária P0 revista com **checklist interna** (ex.: uma ideia por frase, sem duplo negativo, imperativos consistentes “Verifique/Tente/Confirme”). |

---

## 9. Métricas de sucesso

| Objetivo | Métrica / evidência |
|----------|---------------------|
| Completar descoberta | Inventário **FR-ERR-A01** publicado e revisto por PO. |
| Cobertura P0 | **100%** dos fluxos da secção 10 migrados ou **explicitamente** isentos com justificativa no inventário. |
| Clareza | **Zero** ocorrências de “Erro na requisição” **isolado** em fluxos P0 (aceite QA). |
| Regressão fiscal | Emissão de teste (staging) com erro simulado do provedor: utilizador vê **título humano** + detalhe legível + aviso de fonte. |
| Qualidade contínua | Novos testes unitários nos mapeadores críticos **ou** ampliação de cobertura existente em `fiscalUserError` / novos módulos. |

---

## 10. Priorização — superfícies P0 (migração obrigatória Fase B)

1. **Guia MEI** — certificado, DAS/capacidade, workspaces de emissão (NFSe, NF-e, NFC-e).  
2. **Modais / páginas de catálogo MEI** — criação, edição, eliminação.  
3. **Transações** — carregamento e mutações com feedback de erro visível.  
4. **FetchErrorBanner** e equivalentes — harmonizar com o contrato único (pode ser *wrapper* do componente base).  
5. **Qualquer toast/banner** alimentado diretamente por `buildApiErrorMessage` ou `throw new Error(text)` técnico **sem** passagem pelo mapeador.

**P1:** restantes rotas do *shell* (orçamentos, agenda, definições) conforme capacidade da sprint, mantendo o inventário como fonte da verdade.

---

## 11. Riscos e mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Texto do provedor em inglês ou instável | Título humano genérico + detalhe bruto | Mapear códigos estáveis; título por `plugnotasCode` quando existir. |
| Esconder demais informação ao suporte | Tickets sem contexto | “Copiar detalhes”, ID de pedido (se backend expuser), colapsável técnico. |
| Esforço disperso por página | Atraso | **FR-ERR-B01** obrigatório; migração por ondas a partir do inventário. |
| Desalinhamento com PRD global | Conflito de aceite | Referência cruzada **FR-UX-GLOBAL-B05/B06**; este PRD prevalece na **camada de erro** onde mais específico. |

---

## 12. Critérios de release

1. Itens da onda em **staging** com evidência (screenshots ou gravação curta) para **amostra** de cada categoria taxonómica tocada.  
2. Gates do repositório verdes.  
3. QA: checklist **FR** da onda + verificação a11y básica nos componentes novos ou alterados.  
4. Stories em `docs/stories/` com checklist e *file list* atualizados conforme `AGENTS.md`.  
5. Inventário (A01) atualizado com estado **Feito** / **N/A** por linha.

---

## 13. Dependências e próximos passos (AIOX)

1. **@ux-design-expert** — rever hierarquia visual, tom e checklist de legibilidade (**NFR-ERR-05**).  
2. **@sm** — desdobrar Fase A e Fase B em stories (inventário + implementação por onda).  
3. **@architect** — se **FR-ERR-A05** concluir que o backend deve expor `userMessage` / `supportDetail` separados, ADR ou nota técnica mínima antes de alterar contrato.  
4. **@dev** — implementar **FR-ERR-B01** cedo para reduzir retrabalho nas migrações.  
5. **@qa** — casos de teste por categoria e regressão nos fluxos MEI.

---

## 14. Referências

- `docs/brief/brief-mensagens-erro-ux-usuario-final-2026-04-07.md`  
- `frontend/src/lib/fiscalUserError.ts`  
- `frontend/src/components/FiscalIntegrationErrorAlert.tsx`  
- `frontend/src/components/FetchErrorBanner.tsx`  
- `frontend/src/utils/buildApiErrorMessage.ts`  
- `docs/prd/PRD-revisao-iu-ux-global-intuitividade-2026-04-01.md`  

---

— *PRD completo para aprovação de PO; execução recomendada Fase A → Fase B com inventário como bloqueio lógico para migração em massa.*
