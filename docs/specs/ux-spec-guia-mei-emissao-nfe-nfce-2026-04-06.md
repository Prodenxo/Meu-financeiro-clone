# Especificação de front-end e UX — Guia MEI: emissão **NFS-e**, **NF-e** e **NFC-e** (aba de emissão)

**Versão:** 1.0  
**Data:** 2026-04-06  
**Autoria:** Uma (UX design expert / fluxo AIOX)  
**Requisitos de origem:** [`docs/prd/PRD-mei-emissao-nfe-nfce-plugnotas-guia-2026-04-06.md`](../prd/PRD-mei-emissao-nfe-nfce-plugnotas-guia-2026-04-06.md) (**FR-GUIA-FISC-***, **NFR-GUIA-FISC-***, **CR-GUIA-FISC-***)  
**Brief de apoio:** [`docs/brief/brief-emissao-nfe-nfce-plugnotas-aba-emissao-2026-04-06.md`](../brief/brief-emissao-nfe-nfce-plugnotas-aba-emissao-2026-04-06.md)

**Relação com specs e código de referência:**

- **Padrões visuais e classes:** [`docs/specs/ux-spec-meu-mei-ui-2026-03-30.md`](ux-spec-meu-mei-ui-2026-03-30.md) — reutilizar tokens já usados em `GuidesMei.tsx` (`admin-page-shell`, acordeões de emissão, `planner-button*`, badges).  
- **Catálogo MEI (NFS-e):** [`docs/specs/ux-spec-catalogo-mei-clientes-produtos-2026-03-30.md`](ux-spec-catalogo-mei-clientes-produtos-2026-03-30.md) — destinatário/tomador e produtos; **reutilização opcional** para destinatário em NF-e/NFC-e (PRD **CR-GUIA-FISC-04**).  
- **Implementação de referência (pré-mudança):** `frontend/src/pages/GuidesMei.tsx` — workspace tab `nfse`, formulário colapsável de emissão NFS-e, lista com `nfseDocumentTypeFilter`, integração `mei-notas`.

**Nota de nomenclatura:** copy voltada ao utilizador brasileiro (NFS-e, NF-e, NFC-e); documentação técnica mantém `documentType` **NFSE** / **NFE** / **NFCE** alinhado ao backend.

---

## 1. Objetivo deste documento

Contrato de **experiência, hierarquia visual, comportamento, *copy* e acessibilidade** para:

1. **Seleccionar o tipo de documento** no topo do painel de emissão (**FR-GUIA-FISC-01**).  
2. **Mostrar formulário contextual** por tipo sem misturar blocos de serviço e de produto (**FR-GUIA-FISC-02**, **FR-GUIA-FISC-03**).  
3. **Filtrar e legibilizar** o histórico por tipo (**FR-GUIA-FISC-05**).  
4. **Erros e bloqueios** compreensíveis (integração Plugnotas + configuração em falta) (**FR-GUIA-FISC-06**, **FR-GUIA-FISC-07**).  
5. **Ajuda contextual** mínima para reduzir confusão NFS-e vs NFC-e (**FR-GUIA-FISC-08**, P1).

Serve para critérios de aceite, *file list* e QA; **não** substitui a story nem o contrato de payload definido com **@architect**.

---

## 2. Princípios de UX

| Princípio | Aplicação |
|-----------|-----------|
| **Tipo primeiro** | O utilizador **vê e escolhe** o documento antes de preencher campos específicos; evita preencher “serviço” e descobrir depois que precisava de produto. |
| **Uma voz fiscal** | Mensagens de erro referem **qual nota** está em causa quando o backend ou o Plugnotas devolvem erros genéricos. |
| **Não regressão** | Quem só usa NFS-e encontra o **mesmo fluxo** após um único passo extra (tipo já pré-seleccionado = NFS-e, PRD §6.1). |
| **Honestidade quando bloqueado** | Se NF-e/NFC-e não estiver habilitado no emissor, **não** simular emissão: checklist ou contacto (**FR-GUIA-FISC-07**). |
| **Brownfield** | Reutilizar região de *feedback* já existente sob o botão Emitir (padrão FR-NFSE-UX), alertas fiscais e lista inferior. |

---

## 3. Arquitectura de informação

### 3.1 Separador de workspace (tab principal)

**Estado actual:** tab **"NFS-e"** com descrição *"Notas de serviço: emissão e acompanhamento"*.

**Recomendação UX (alinhada ao PRD):**

| Elemento | Recomendação | Alternativa brownfield |
|----------|--------------|-------------------------|
| **Label da tab** | **"Emissão fiscal"** ou **"Notas fiscais"** | Manter **"NFS-e"** e reforçar no **hero** / primeiro parágrafo do painel que inclui NF-e e NFC-e (subótimo para descoberta). |
| **Descrição curta** | *"NFS-e, NF-e e NFC-e: emitir e acompanhar"* | Atualizar subtítulo do `workspaceTabs` em `GuidesMei.tsx`. |
| **Badge** | *"Tipo + lista"* ou equivalente curto | Reutilizar lógica actual de badge se não houver tempo para *copy* nova. |

**Hero da página (`admin-hero-subtitle`):** quando `canViewNfse`, alinhar texto a **"…emissão de notas fiscais (NFS-e, NF-e e NFC-e)…"** em vez de só NFS-e — coerente com **FR-GUIA-FISC-01**.

### 3.2 Ordem vertical dentro do painel da tab de emissão

1. **Título de secção** (se existir) — ex.: **"Emitir nota"**.  
2. **Seletor de tipo de documento** (§4) — **sempre visível** no topo do bloco de emissão, **antes** de qualquer acordeão ou formulário.  
3. **Linha de ajuda contextual** (§5.4) — imediatamente abaixo do seletor (P0 mínimo: uma linha; P1: variante rica por tipo).  
4. **Alertas globais do modo** — certificado em falta, empresa não configurada, bloqueio Plugnotas para o tipo escolhido (§9).  
5. **Formulário contextual** — NFS-e: blocos actuais (prestador, tomador, serviço…); NF-e/NFC-e: blocos §6.  
6. **Pilha de feedback de emissão** — erros de validação, resposta API, Plugnotas (região já usada no Guia MEI).  
7. **Acções primárias** — **Emitir** (estado *loading* / *disabled* conforme pré-requisitos).  
8. **Lista / histórico** — com filtro por tipo (§7).

### 3.3 Erro ao utilizador (padrão transversal)

A pilha de feedback de emissão (item 6) e os alertas de integração fiscal devem alinhar-se ao contrato de experiência e *copy* de [`ux-spec-mensagens-erro-usuario-final-2026-04-07.md`](ux-spec-mensagens-erro-usuario-final-2026-04-07.md) (título humano, descrição, fonte do serviço de notas quando aplicável, detalhe colapsável, CTAs). Até à migração completa (**stories FR-ERR-P0-***), manter paridade funcional com `GuidesMei.tsx` e com os alertas fiscais existentes, evitando regressão na hierarquia definida no workspace NFS-e (bloqueio → validação → erro de servidor/provedor → sucesso).

---

## 4. Seletor de tipo de documento (**FR-GUIA-FISC-01**)

### 4.1 Padrão de controlo recomendado: **segmented control** (três segmentos)

| Opção | Label visível | Valor interno (`documentType`) |
|-------|----------------|---------------------------------|
| 1 | **NFS-e** | `NFSE` |
| 2 | **NF-e** | `NFE` |
| 3 | **NFC-e** | `NFCE` |

**Visual:**

- Três botões num único `group` com fundo neutro (`bg-slate-100` / *dark* equivalente) e segmento activo com contraste elevado (alinhado a botões primários já usados na página).  
- **Não** usar apenas ícones; texto sempre visível.  
- Em *mobile*, os três segmentos podem **encolher** tipografia (`text-sm`) mas **manter** labels completos (evitar "NF…" truncado ambíguo).

### 4.2 Acessibilidade (**NFR-GUIA-FISC-04**)

| Requisito | Implementação |
|-----------|----------------|
| Nome do grupo | `role="radiogroup"` com `aria-label="Tipo de nota fiscal a emitir"` **ou** `<fieldset>` + `<legend className="sr-only">Tipo de nota fiscal</legend>`. |
| Cada opção | `role="radio"` + `aria-checked` **ou** botões com `aria-pressed` mutuamente exclusivos (documentar na story o padrão escolhido). |
| Foco | *Tab* entra no grupo; setas **esquerda/direita** mudam opção se o padrão for *roving tabindex* (recomendado). |

**Evitar** `role="tablist"` aqui: o painel abaixo **não** é um *tab panel* independente no sentido ARIA — é um formulário que muda com o tipo; *radiogroup* reduz confusão com as tabs de workspace (Visão geral, DAS, …).

### 4.3 Valor por defeito (**PRD §6.1**)

- **Defeito recomendado:** **NFS-e** seleccionado ao entrar na tab ou ao montar o painel pela primeira vez na sessão.  
- **Opcional P1:** persistir último tipo em `localStorage` — se implementado, mostrar *hint* discreto na primeira troca de sessão: *"A mostrar o último tipo que utilizou."*

---

## 5. Mudança de tipo com dados preenchidos (**PRD §6.4**)

### 5.1 Regra de ouro

Nunca enviar **campos de NFS-e** misturados com **payload de NF-e/NFC-e**.

### 5.2 Comportamento especificado

| Situação | Comportamento |
|----------|----------------|
| Utilizador altera o tipo e **não há** dados tocados no formulário actual | Mudança **imediata**; mostrar skeleton breve opcional (<150ms) se o *layout* saltar. |
| Utilizador altera o tipo e **há** campos dirty (qualquer input alterado desde o último reset bem-sucedido) | Abrir **diálogo de confirmação** modal (ou `window.confirm` **apenas** se a equipa aceitar débito de UX). |

### 5.3 *Copy* do diálogo de confirmação

- **Título:** *"Alterar tipo de nota?"*  
- **Corpo:** *"Os dados preenchidos neste formulário serão limpos. Esta ação não pode ser desfeita."*  
- **Botões:** **Cancelar** (primário de fecho) | **Alterar tipo** (destrutivo/neutro, não verde de sucesso).

Após confirmação: **reset** completo do estado do formulário do modo anterior; foco move para o **primeiro campo** do novo modo ou para o seletor (decisão na story — preferir primeiro campo editável para fluxo rápido).

---

## 6. Formulário **NF-e** e **NFC-e** (**FR-GUIA-FISC-03**, **FR-GUIA-FISC-04**)

### 6.1 Estrutura em blocos (acordeões ou cartões)

Reutilizar o **padrão colapsável** já usado na emissão NFS-e (**FR-NFSE-UX-P1**) para densidade consistente:

| Ordem | Bloco | Conteúdo mínimo MVP (alinhado a validação servidor) |
|-------|--------|------------------------------------------------------|
| 1 | **Emitente** | CNPJ (14 dígitos), razão social (se o payload exigir além do CNPJ — **confirmar com architect**). *Hint:* *"Normalmente o CNPJ do seu MEI."* |
| 2 | **Destinatário** | CPF ou CNPJ, razão social. **Opcional P1:** combobox *"Cliente guardado (opcional)"* reutilizando catálogo se a story adoptar **CR-GUIA-FISC-04**. |
| 3 | **Itens** | Lista editável: **Adicionar linha** / **Remover linha** (MVP PRD §6.3). Por linha: código/SKU, descrição, **NCM** (8 dígitos), **CFOP** (4 dígitos), unidade, quantidade (>0), valor unitário (>0), **tributos** ICMS (CST ou CSOSN), PIS (CST), COFINS (CST). |
| 4 | **Pagamento / totais** (se obrigatório no payload) | Campos acordados na story; se forem derivados só no backend, omitir na UI e documentar. |

**Modelo:** campo técnico `modelo` — **não** expor ao utilizador final se o tipo **NF-e** vs **NFC-e** já implica 55 vs 65; o cliente pode enviar `modelo` pré-preenchido em *hidden* ou o backend normaliza (comportamento actual em `normalizeNfeLikeModel`).

### 6.2 Diferença percebida NFC-e vs NF-e (sem sobrecarregar)

- Sob o seletor, **uma linha** de ajuda que muda com o tipo (**FR-GUIA-FISC-08**):  
  - **NFC-e:** *"Para venda de mercadorias ao consumidor final (cupom fiscal eletrónico)."*  
  - **NF-e:** *"Para operações de mercadorias que exigem nota modelo 55 (ex.: B2B), conforme orientação do seu contador."*  
  - **NFS-e:** *"Para prestação de serviços sujeita a NFS-e municipal."*

### 6.3 Validação na UI (**PRD §5.1**)

- Validar **antes** do *submit* os mesmos mínimos que o servidor (`validateNfeLikePayload`): mensagens por campo com `aria-describedby` apontando para texto de erro.  
- **NCM / CFOP:** máscara ou *input* `inputMode="numeric"` + validação de comprimento; mostrar exemplo *placeholder* não substituto de label (ex.: NCM *"01012100"* só como *hint*).  
- **Tributos:** se a UI for pesada, **MVP** pode usar sub-formulário "Impostos da linha" colapsável por item.

### 6.4 *Empty state* de itens

- Se zero linhas: mensagem *"Adicione pelo menos um item à nota."* + botão **Adicionar item** visível.

---

## 7. Lista e filtros (**FR-GUIA-FISC-05**)

### 7.1 Filtro por tipo

- Evoluir o controlo actual (`nfseDocumentTypeFilter` `'all' | 'NFSE'`) para incluir **`NFE`** e **`NFCE`**:  
  - **Opções:** **Todas** | **NFS-e** | **NF-e** | **NFC-e** (rótulos amigáveis; valores de query alinhados ao backend).  
- Colocar o filtro **acima** da tabela ou na mesma *toolbar* que pesquisas existentes, à direita do título **"Notas emitidas"** (ou label actual equivalente).

### 7.2 Coluna "Tipo"

- Garantir **badge** ou *pill* por linha: cores **distintas** por tipo (ex.: NFS-e azul, NF-e âmbar, NFC-e verde) — definir tokens consistentes com o *design system*; se não houver tokens, usar `admin-badge-*` existentes com nova variante documentada na story.

### 7.3 Estados

- **Sem resultados para o filtro:** *"Não há notas deste tipo no período visível."* + link **"Mostrar todas"**.  
- **Erro de lista:** manter padrão actual (mensagem acima da lista com remissão à pilha de emissão se aplicável).

---

## 8. Erros e integração Plugnotas (**FR-GUIA-FISC-06**)

### 8.1 Hierarquia de mensagens

1. **Validação de cliente** — lista numerada ou por campo no topo da pilha de emissão.  
2. **HTTP / API** — mensagem genérica amigável + detalhe colapsável se existir *stack* técnico (evitar em produção para utilizador final).  
3. **Plugnotas** — `formatPlugnotasIntegrationError` + prefixo contextual: *"NFC-e:"* ou *"NF-e:"* quando o erro ocorrer após *submit* daquele modo.

### 8.2 `aria-live`

- Reutilizar a região já usada para feedback de emissão; em caso de erro após *submit*, **focar** o primeiro elemento da mensagem ou o cabeçalho da pilha (decisão implementação — documentar).

---

## 9. Bloqueio por configuração no emissor (**FR-GUIA-FISC-07**, **PRD §6.2**)

### 9.1 Quando mostrar

Quando o utilizador selecciona **NF-e** ou **NFC-e** e o sistema determina (via consulta empresa / *flag* / erro mapeado) que **não** é possível emitir:

### 9.2 Superfície UX recomendada: **callout** + lista de verificação

- **Componente:** `Alert` ou cartão `border-amber-200` / equivalente *dark*, ícone de aviso.  
- **Título:** *"Emissão de [NF-e|NFC-e] não disponível"*.  
- **Corpo:** breve explicação: *"A sua empresa ainda não está configurada para emitir este tipo de nota no emissor fiscal integrado."*  
- **Checklist (exemplos — ajustar à opção A/B do PRD):**  
  - Certificado A1 válido  
  - Dados da empresa atualizados na aba **Certificado e DAS** / configuração fiscal  
  - **CSC** e *token* NFC-e (se aplicável)  
- **CTA:** conforme arquitectura: **"Rever configuração"** (scroll para bloco relevante ou tab DAS), **"Contactar suporte"**, ou **"Concluir configuração"** se existir *wizard*.

### 9.3 Estado do formulário

- Campos de NF-e/NFC-e **desactivados** (*disabled*) com `aria-disabled` e *tooltip* ou texto: *"Complete a configuração acima para continuar."* **ou** formulário oculto excepto o *callout* — preferir **desactivado** para o utilizador perceber o que viria depois.

---

## 10. Responsividade

| Viewport | Ajuste |
|----------|--------|
| **< 640px** | Seletor em coluna **só se** os três segmentos não couberem — preferir *scroll horizontal* suave no grupo com `snap-x` a empilhar três linhas (altura excessiva). |
| **Formulário de itens** | Tabela transforma-se em **cartões empilhados** por linha ou *scroll* horizontal com primeira coluna *sticky* — seguir padrão já usado em tabelas admin no projeto se existir. |

---

## 11. Mapeamento FR → superfície UI

| ID | Superfície |
|----|------------|
| **FR-GUIA-FISC-01** | Segmented control / radiogroup no topo do painel de emissão. |
| **FR-GUIA-FISC-02** | Blocos NFS-e existentes; default NFS-e. |
| **FR-GUIA-FISC-03** | Acordeões Emitente, Destinatário, Itens (+ Pagamento se aplicável). |
| **FR-GUIA-FISC-04** | *Submit* com `documentType` + `payload`; modelo 55/65 não editável pelo user. |
| **FR-GUIA-FISC-05** | Filtro + badges na lista. |
| **FR-GUIA-FISC-06** | Pilha de feedback + prefixo de tipo + `aria-live`. |
| **FR-GUIA-FISC-07** | *Callout* + *disabled* formulário ou CTA de configuração. |
| **FR-GUIA-FISC-08** | Linha de ajuda dinâmica sob o seletor. |
| **FR-GUIA-FISC-09** | Combobox de produto na secção Itens (P1) — spec extensão futura. |
| **FR-GUIA-FISC-10** | Fora deste documento (admin); reutilizar §4–§9 em modal admin. |

---

## 12. Componentização sugerida (brownfield)

| Componente sugerido | Responsabilidade |
|---------------------|------------------|
| `MeiFiscalDocumentTypeSegmented` | Três opções, a11y, valor controlado, evento `onChange` com *dirty check* delegado ao pai. |
| `MeiNfeEmitForm` | Blocos emitente/destinatário/itens, validação local, *submit* payload. |
| `MeiNfseEmitForm` (extract) | Formulário actual NFS-e isolado para clareza de ficheiro. |
| `MeiFiscalNotesFilter` | Filtro Todas / NFSE / NFE / NFCE. |
| `PlugnotasCapabilityCallout` | Bloqueio §9, texto parametrizável por tipo. |

Local: `frontend/src/components/mei/` ou pasta já usada para extrair de `GuidesMei.tsx` (PRD risco de ficheiro grande).

---

## 13. Critérios de aceite UX (checklist QA)

- [ ] Utilizador identifica **em menos de 5 s** onde escolher NF-e vs NFC-e vs NFS-e (teste moderado simples ou heurística).  
- [ ] Troca de tipo com dados preenchidos **nunca** envia payload misto; confirmação aparece quando esperado (**§5**).  
- [ ] Default **NFS-e** ao abrir a tab; fluxo NFS-e **igual** ao actual após seleccionar NFS-e explicitamente (se o default já for NFS-e, verificar *refresh* e *state*).  
- [ ] Lista mostra tipo legível e filtro funciona para **NFE** e **NFCE** quando existirem registos.  
- [ ] Estado bloqueado (**§9**) explica **o quê** falta sem jargão interno ("Plugnotas" pode aparecer como *"emissor fiscal integrado"* na copy utilizador).  
- [ ] Teclado: seletor operável; erros anunciáveis; foco não preso após fechar diálogo de confirmação.  
- [ ] *Mobile:* formulário utilizável sem perda de campos obrigatórios.

---

## 14. Wireframe textual (referência rápida)

```
[ Tab: Emissão fiscal ]

Emitir nota
┌─────────────────────────────────────────────────────┐
│ Tipo:  ( NFS-e ) ( NF-e ) ( NFC-e )    ← segmented   │
│ Ajuda: "Para venda ao consumidor…"       ← dinâmico   │
└─────────────────────────────────────────────────────┘

[ Callout âmbar se NF-e/NFC-e bloqueado ]

▼ Emitente          (acordeão)
▼ Destinatário
▼ Itens             [+ Adicionar item]
  Linha 1: código, descrição, NCM, CFOP, …

[ Pilha de erros / sucesso — aria-live ]

          [ Emitir nota ]

─── Notas emitidas ───  [ Filtro: Todas ▾ ]

| Tipo   | Data | Status | … |
| NFS-e  | …    | …      |   |
| NFC-e  | …    | …      |   |
```

---

## 15. Change log

| Versão | Data | Notas |
|--------|------|--------|
| 1.0 | 2026-04-06 | Versão inicial a partir do PRD **PRD-mei-emissao-nfe-nfce-plugnotas-guia-2026-04-06.md**. |

---

*Próximo passo AIOX:* story em `docs/stories/` com referência a esta spec, **@architect** para contrato `emitir`, **@dev** com *file list* e gates do `AGENTS.md`.

— Uma, UX AIOX
