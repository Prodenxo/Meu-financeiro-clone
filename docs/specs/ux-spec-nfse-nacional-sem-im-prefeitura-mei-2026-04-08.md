# Especificação de front-end e UX — **NFS-e Nacional** no cadastro Plugnotas (sem IM/prefeitura no fluxo MEI)

**Versão:** 1.0  
**Data:** 2026-04-08  
**Autoria:** Uma (UX design expert, fluxo AIOX)  
**Requisitos de origem:** [`docs/prd/PRD-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md`](../prd/PRD-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md) (**FR-NAT-UX-01**, **FR-NAT-UX-02**, **FR-NAT-ERR-01**; alinhamento a **FR-NAT-API-01** na story com @dev)  
**Brief de apoio:** [`docs/brief/brief-nfse-nacional-sem-im-prefeitura-2026-04-08.md`](../brief/brief-nfse-nacional-sem-im-prefeitura-2026-04-08.md)

**Relação com specs e código de referência:**

- **Documentos ativos:** [`docs/specs/ux-spec-cadastro-empresa-documentos-ativos-plugnotas-2026-04-07.md`](ux-spec-cadastro-empresa-documentos-ativos-plugnotas-2026-04-07.md) — esta spec **acrescenta** comunicação explícita de **NFS-e Nacional** quando o percurso continua “apenas NFS-e” ou NFS-e como tipo escolhido.  
- **Orquestração certificado + empresa:** [`docs/specs/ux-spec-empresa-plugnotas-orquestrada-cadastro-certificado-2026-04-07.md`](ux-spec-empresa-plugnotas-orquestrada-cadastro-certificado-2026-04-07.md) — painel de retry e fases mantêm-se; enriquece-se **copy de erro** (abaixo).  
- **Padrões Guia MEI:** [`docs/specs/ux-spec-meu-mei-ui-2026-03-30.md`](ux-spec-meu-mei-ui-2026-03-30.md) — `admin-section-*`, `admin-alert-*`, `planner-button-*`.  
- **Mensagens de erro (contexto global):** [`docs/specs/ux-spec-mensagens-erro-usuario-final-2026-04-07.md`](ux-spec-mensagens-erro-usuario-final-2026-04-07.md).  
- **Operação:** [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md) — deve reflectir modo nacional vs municipal (**FR-NAT-DOC-01**, entrega doc; esta spec cita âncoras esperadas).  
- **Implementação de referência:**  
  - `frontend/src/pages/GuidesMei.tsx` — workspace **DAS** (`activeWorkspace === 'das'`), bloco *Certificado digital*, alertas `admin-alert-warning`, painel âmbar de retry de empresa (`plugnotasPendingRetry`), `GuiaMeiEmpresaCadastroErrorPanel`.  
  - `frontend/src/utils/nfEmissionCompany.ts` — payload `nfse` com `nacional: true` por defeito.  
  - `frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts` — `shouldOfferNfseNacionalOperacaoDocHint`, `getNfseNacionalOperacaoHelpHref`.

**Nota:** não usar o carácter “§” em *strings* de UI. Em documentação interna, usar “secção” ou número do PRD.

---

## 1. Objetivo deste documento

Contrato de **experiência, hierarquia, microcopy, estados de erro e acessibilidade** para:

1. O utilizador **perceber** que o cadastro fiscal do MEI, neste produto, visa **NFS-e no ambiente nacional** (paridade com o toggle do painel Plugnotas), **sem** interpretar que **inscrição municipal** ou **prefeitura** são passos obrigatórios **do formulário** (**FR-NAT-UX-01**, **FR-NAT-UX-02**).  
2. Quando o emissor devolver erro mencionando **IM** ou **`prefeitura`** no JSON, a UI oferece **explicação calma + próximos passos + link** de ajuda operacional quando aplicável (**FR-NAT-ERR-01**).  
3. **Honestidade:** não prometer que “nunca” serão pedidos dados municipais no lado do provedor; em caso de conflito API versus expectativa, a mensagem **explicita** essa possibilidade (PRD §11).

Serve para critérios de aceite de story, *file list* e QA visual; **não** substitui contrato JSON nem decisão de `@architect`.

---

## 2. Princípios de UX

| Princípio | Aplicação |
|-----------|-----------|
| **Clareza de modo** | “NFS-e Nacional” aparece como **rótulo de modo**, não como jargon de API (`nfse.nacional`). |
| **Sem culpa falsa** | Se o erro for do **provedor/conta**, não sugerir que o utilizador “esqueceu” IM no nosso formulário. |
| **Continuidade** | Manter **Editar dados**, retry e *scroll* para o formulário já existentes; melhorar **conteúdo** do painel e do painel vermelho quando for erro genérico. |
| **Densidade** | Callout de modo nacional: **1 título + 2 linhas** no máximo no MVP; evitar parede de texto acima do CNPJ. |
| **A11y** | Novo conteúdo informativo: `role="region"` + `aria-labelledby` apontando para o título; erros: manter `role="alert"` onde já existe. |

---

## 3. Arquitetura de informação (IA)

### 3.1 Área afetada (MVP)

**Workspace:** Guia MEI — painel **DAS** / **Certificado digital** (`#mei-panel-das`), apenas quando `canViewNfse` for verdadeiro (o utilizador tem permissão de ver fluxo NFS-e). Se no futuro o cadastro fiscal for partilhado sem NFS-e, este callout **não** aparece (condição de produto a validar com PO).

### 3.2 Hierarquia de conteúdo (ordem vertical sugerida)

| Ordem | Bloco | Alteração nesta spec |
|------|--------|----------------------|
| NAT-L0 | Título *Certificado digital* | Sem mudança estrutural. |
| NAT-L1 | Alertas existentes (certificado em uso, opcional, aviso NFS-e A1) | Ver **§4.2** (ajuste opcional da linha A1 para mencionar **NFS-e Nacional** sem alongar demais). |
| NAT-L2 | **Novo:** Callout **modo NFS-e Nacional** | **§5** — **FR-NAT-UX-02**. |
| NAT-L3 | Erros / retry / sucesso | **§6** — copy e link de ajuda (**FR-NAT-ERR-01**). |
| NAT-L4 | CNPJ, ficheiro, senha, documentos ativos (se houver), dados mínimos | **Sem** novos campos obrigatórios para IM ou prefeitura (**FR-NAT-UX-01**). |
| NAT-L5 | Ações (Concluir configuração / Enviar / Consultar / Atualizar) | Sem mudança de IA; apenas garantir que validação local **não** exige IM/prefeitura. |

### 3.3 Onde **não** colocar o callout (evitar)

- **Substituir** o alerta amarelo legal de certificado A1 por um texto longo só sobre nacional.  
- **Separador “Emitir nota”** (workspace NFS-e): a ajuda sobre “prefeitura/provedor” na emissão (**GuidesMei** ~L3843) refere-se à **regra fiscal na nota**, não ao cadastro — **não** misturar com IM de cadastro; opcionalmente, numa story futura, uma palavra “(na emissão)” pode desambiguar.

---

## 4. Componentes e microcopy

### 4.1 Callout informativo **NFS-e Nacional** (**FR-NAT-UX-02**)

**Tipo visual:** reutilizar padrão **informativo** neutro (sugerido: `rounded-lg border border-slate-200/80 bg-slate-50/90` em tema claro; equivalente `dark:` coerente com `admin-section-card`, **sem** cor de erro).

**Estrutura:**

| Elemento | Conteúdo canónico (PT-BR) |
|----------|-----------------------------|
| **Título** (`h3`, classe tipo `text-sm font-semibold`) | NFS-e em ambiente nacional |
| **Corpo** (1–2 frases, `text-sm text-slate-600 dark:text-slate-300`) | O cadastro desta área envia a configuração de **NFS-e Nacional** para o emissor fiscal, alinhada à opção “NFS-e Nacional” do painel Plugnotas. **Não** é necessário preencher inscrição municipal nem escolher prefeitura aqui. |
| **Nota honesta** (opcional, `text-xs`, mesma cor que hints) | Se o emissor recusar o cadastro pedindo dados municipais, pode ser limitação da conta ou da API — siga a mensagem de erro ou o guia de operação. |

**Identificação para QA:** `data-testid="mei-nfse-nacional-mode-callout"` (ou equivalente acordado na story).

**A11y:** `role="region"` e `aria-labelledby` no `id` do título (ex.: `id="mei-nfse-nacional-callout-heading"`).

### 4.2 Ajuste opcional do aviso A1 existente (linha única)

O alerta amarelo actual (NFS-e precisa de cadastro + A1) pode ganhar **uma frase final** opcional:

- *“A emissão de serviço configurada aqui segue o fluxo de NFS-e Nacional.”*

**Critério:** só aplicar se PO validar que não aumenta ansiedade; caso contrário, manter apenas o callout **§4.1**.

---

## 5. Estados de erro e retry (**FR-NAT-ERR-01**)

### 5.1 Detecção heurística (front-end)

Reutilizar e, se necessário, **estender** `shouldOfferNfseNacionalOperacaoDocHint` para cobrir mensagens do provedor que mencionem **explicitamente**:

- `inscricaoMunicipal`, `inscrição municipal`,  
- `prefeitura` em contexto de validação de **empresa** / `nfse.config`,  
- `Preenchimento obrigatório` ligado a esses campos na mesma mensagem.

**Regra de produto:** quando o match ocorrer **e** o utilizador está no fluxo de cadastro MEI (DAS + NFS-e), mostrar bloco de ajuda adicional (link “Ver guia de operação fiscal” já existente no painel âmbar — alinhar *href* com `getNfseNacionalOperacaoHelpHref()`).

### 5.2 Corpo sugerido para o painel âmbar de retry (refino de copy)

Manter título **“Não foi possível concluir o registro da empresa”**.

**Parágrafo adicional** (após o detalhe técnico opcional), **condicional** ao match de erro municipal:

> O emissor pediu dados de **cadastro municipal** (inscrição municipal ou prefeitura). Para o fluxo de **NFS-e Nacional** isso costuma indicar que a conta ou o ambiente ainda espera outro tipo de configuração. Confirme no **painel Plugnotas** se “NFS-e Nacional” está ativo para este CNPJ e se a API do servidor usa o mesmo ambiente (produção ou homologação). Se estiver tudo certo, fale com o **suporte Plugnotas**.

**CTAs:** manter **Editar dados** (não obrigar a editar campos que não existem); o botão continua a levar ao formulário para revisão geral.

**Link:** manter ou adicionar o mesmo padrão de âncora que `nfseNacionalPlugnotasErrorHints` (guia interno / `VITE_MEI_OPERACAO_NFSE_DOC_URL`).

### 5.3 Painel vermelho genérico (`GuiaMeiEmpresaCadastroErrorPanel`)

Quando a mensagem for exibida neste componente, aplicar a **mesma** lógica condicional de bloco auxiliar + link (componente compartilhado ou *slot* “dica NFS-e Nacional”) para não duplicar regras só no painel âmbar.

### 5.4 Tom e linguagem

- Evitar repetir *strings* cruas da API (`POST /empresa`, nomes de campos JSON) no título visível; se necessário para suporte, manter no detalhe expandível ou texto secundário em `text-xs`.  
- Não afirmar “bug do Plugnotas”; usar “pode ser limitação da conta ou configuração”.

---

## 6. Validação de formulário (front-end)

| Regra | Especificação |
|-------|----------------|
| **FR-NAT-UX-01** | Garantir que `getNfEmissionCompanyValidationMessage` e quaisquer validações DAS **não** exijam IM nem prefeitura. |
| Campos futuros | Se PO activar **modo municipal** (PRD §6.3-B), voltar a spec com *toggle* explícito “Municipal” vs “Nacional”; fora de escopo do MVP actual. |

---

## 7. Rastreabilidade PRD → UX

| ID PRD | Entrega UX (esta spec) |
|--------|-------------------------|
| **FR-NAT-UX-01** | Secções **§3.2**, **§6** — ausência de campos obrigatórios municipais. |
| **FR-NAT-UX-02** | Secção **§4.1** — callout *NFS-e em ambiente nacional*. |
| **FR-NAT-ERR-01** | Secção **§5** — heuristic, copy condicional, link de ajuda. |
| Critério release 3 (PRD §10) | Copy aprovada em story + QA com mensagem simulada contendo `inscricaoMunicipal` / `prefeitura`. |

---

## 8. Lista de ficheiros prováveis (@dev)

1. `frontend/src/pages/GuidesMei.tsx` — inserir callout **§4.1** (condição `canViewNfse`); enriquecer painéis de erro **§5**.  
2. `frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts` — padrões / função para erro municipal sem exigir “nacional” no texto; manter comentário cruzado com `docs/operacao-mei-nfse.md`.  
3. Componente existente de erro de cadastro, se extrair bloco “dica nacional” para reutilização (opcional refactor).  
4. Testes: `nfseNacionalPlugnotasErrorHints` (novos casos de mensagem); possivelmente teste de snapshot ou RTL do callout (se o repo adicionar).  
5. `docs/operacao-mei-nfse.md` — **não** é front-end, mas deve alinhar âncora citada (**FR-NAT-DOC-01**).

---

## 9. Checklist de QA visual / conteúdo

1. Com `canViewNfse`, o callout **§4.1** é visível **antes** do CNPJ/ficheiro.  
2. Não surgem asteriscos ou mensagens “campo obrigatório” para IM/prefeitura.  
3. Simular erro com texto contendo `inscricaoMunicipal` e `prefeitura`: aparece bloco **§5.2** e link de guia.  
4. Tema escuro: contraste legível no callout neutro e no painel âmbar.  
5. Leitor de ecrã: região nacional anunciada; alertas de erro não duplicados sem necessidade.

---

## 10. Wireframe textual (referência rápida)

```
[ Certificado digital                    ]

[ Sucesso / avisos existentes            ]

[ ▢ NFS-e em ambiente nacional           ]  ← novo (NAT-L2)
[   Texto curto + nota honesta opcional ]

[ Painel retry / erro — copy enriquecido ]  ← §5

[ CNPJ | Ficheiro .pfx | Senha           ]

[ Documentos ativos — se implementado    ]

[ Dados mínimos do emitente              ]

[ CTA Concluir / secundários             ]
```

---

## Change log

| Data | Autor | Nota |
| --- | --- | --- |
| 2026-04-08 | Uma | Spec inicial a partir do PRD `PRD-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md`. |
