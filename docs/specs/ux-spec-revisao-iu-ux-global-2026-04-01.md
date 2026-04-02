# Especificação de front-end e UX — Revisão global IU/UX (intuitividade / primeiro contacto)

**Versão:** 1.0  
**Data:** 2026-04-01  
**Autoria:** Uma (UX design expert / fluxo AIOX)  
**Requisitos de origem:** `docs/prd/PRD-revisao-iu-ux-global-intuitividade-2026-04-01.md`  
**Brief:** `docs/brief/brief-revisao-iu-ux-intuitividade-site.md`  
**Implementação de referência:** `frontend/src/` (React, React Router), *shell* em `frontend/src/Layout/`, rotas em `frontend/src/App.tsx`  

**Relação com outros artefactos**

- **`docs/prd/PRD-meu-mei-ui-ux-melhoria-2026-03-30.md`** + **`docs/specs/ux-spec-meu-mei-ui-2026-03-30.md`** — canónicos para **`/guias-mei`**. Esta especificação **complementa** o programa global; onde a mesma rota for tocada, **não contradizer** FR-UX-MEI-* / secções do spec da área Mei Infinito.
- **`docs/prd/PRD-meu-financeiro-produto-brownfield-2026-03-26.md`** — contexto de produto; sem alterar regras fiscais por este documento.

---

## 1. Objetivo deste documento

Servir de **contrato de experiência e implementação** para o programa em duas fases (auditoria + remediação): IA do produto, padrões de ecrã, estados de interface, microcopy, acessibilidade e **mapeamento explícito** aos IDs **FR-UX-GLOBAL-*** e **NFR-UX-GLOBAL-***.  

Não substitui o **relatório de auditoria** nem a **matriz de problemas** (Fase A); define **o que** a equipa deve auditar, **como** padronizar remediações e **onde** viverão os entregáveis. Alimenta checklist de aceite e *file list* das stories geradas em `docs/stories/`.

---

## 2. Mapeamento PRD → esta especificação

| ID PRD | Secção deste spec |
|--------|-------------------|
| FR-UX-GLOBAL-A01–A07 | §8 (artefactos), §3–7 (conteúdo mínimo do relatório/matriz) |
| FR-UX-GLOBAL-B01 | §3.3, §4.2, §6.1 |
| FR-UX-GLOBAL-B02 | §4.1, §6.2 |
| FR-UX-GLOBAL-B03 | §5 (design system leve) |
| FR-UX-GLOBAL-B04 | §5.2 |
| FR-UX-GLOBAL-B05 | §5.3, §4.4 |
| FR-UX-GLOBAL-B06 | §5.4, §4.5 |
| NFR-UX-GLOBAL-01 | §7 |
| NFR-UX-GLOBAL-02–04 | §9 |

---

## 3. Arquitetura de informação (global)

### 3.1 Mapa canónico de tarefas → entrada principal

Objetivo **FR-UX-GLOBAL-B01**: o utilizador em primeiro contacto associa **uma intenção** ao **caminho mais óbvio** (princípio do PRD).

| Intenção do utilizador | Entrada principal esperada (pós-remediação) | Rotas / áreas |
|------------------------|-------------------------------------------|---------------|
| Ver resumo financeiro | **Visão geral / Início** (rótulo consistente — ver §3.2) | `/` |
| Registar despesa ou receita | **Transações** + CTA primário na visão geral se aplicável | `/transacoes` |
| Planear orçamento | **Orçamentos** | `/orcamentos` |
| Organizar natureza dos gastos | **Categorias** | `/categorias` |
| Ver compromissos | **Agenda** | `/agenda` |
| Automatizar repetições | **Recorrências** | `/recorrencias` |
| Ajustar conta / aparência / dados | **Configurações** | `/settings`, subrotas |
| Operações MEI (guia fiscal) | **Mei Infinito** (sidebar ≥ md); mobile: **atalhos** + entrada desde contexto MEI | `/guias-mei` |
| Catálogo NFS-e (clientes / itens) | Dentro do fluxo MEI ou rotas dedicadas (já existentes) | `/mei-catalogo/clientes`, `/mei-catalogo/servicos-produtos` |

**Auditoria (Fase A):** documentar desvios (ex.: utilizador tenta “Mais” no *bottom* esperando MEI e só encontra *settings*).

### 3.2 Consistência de rótulos (shell)

**Estado atual (referência de código):**

- Sidebar (`Sidebar.tsx`): primeiro item **`Visão Geral`** para `/`.
- Bottom nav (`BottomNavigation.tsx`): primeiro item **`Inicio`** para `/`.

**Especificação de remediação (P0 quick win sugerido):**

- **Um único rótulo canónico** para a rota `/` em todos os pontos de navegação (sidebar, bottom, *breadcrumbs* se existirem). Preferência de produto: **“Início”** (curto, mobile-friendly) **ou** **“Visão geral”** — escolher uma e aplicar em `Sidebar` + `BottomNavigation` + título de página (`<title>` / H1 onde aplicável).
- **“Configurações”** (sidebar) vs **“Mais”** (bottom, mesmo destino `/settings`): ou alinhar rótulos, ou manter **“Mais”** apenas no bottom **desde que** a página de destino explique (“Conta, tema e opções”) — registar decisão na matriz (FR-UX-GLOBAL-A07).

### 3.3 Navegação híbrida: regras de auditoria

| Superfície | Viewport | Função especificada |
|------------|----------|---------------------|
| **Sidebar** | `md+` | Navegação principal do dia a dia + Mei Infinito (se elegível) + Configurações. |
| **Bottom navigation** | `< md` | Subconjunto de 5 destinos; **não** inclui Agenda, Recorrências, Mei Infinito diretamente. |
| **Atalhos rápidos** (flutuante) | `< md` | **Agenda**, **Mei Infinito** (se elegível) — `Layout.tsx`. |
| **Header** | todos | Contexto global, utilizador, tema, *toggle* sidebar. |

**Heurística Nielsen a aplicar na matriz:** *consistência e padrões* + *reconhecimento em vez de memorização* — utilizador mobile não deve precisar de “descobrir” que MEI só está nos atalhos.

**FR-UX-GLOBAL-A07:** se a auditoria concluir que a competição entre estes canais prejudica a tarefa, o entregável **proposta de navegação** deve recomendar **uma** das seguintes classes de solução (sem implementar neste doc): (a) reordenar/relabelar *bottom*; (b) adicionar entrada MEI no *bottom* com remoção de outro item; (c) *more sheet* com lista secundária; (d) manter com **onboarding de 1 ecrã** pós-login.

---

## 4. Fluxos prioritários (wireframes lógicos e critérios)

### 4.1 Cenários de teste moderado (alinhamento FR-UX-GLOBAL-A04, B02)

| # | Cenário (enunciado ao participante) | Sucesso mínimo | Métrica PRD |
|---|--------------------------------------|----------------|-------------|
| T1 | “Registaste um café de 15 € hoje.” | Encontra fluxo de nova transação e regista valor/data/categoria plausível | B02 |
| T2 | “Queres ver quanto gastaste este mês em alimentação.” | Chega a vista filtrada/agregada por categoria ou equivalente sem ajuda | B02 |
| T3 | (MEI habilitado) “Prepara dados para uma nota para um cliente que já está no catálogo.” | Chega a emissão/preparação e seleciona cliente existente | B02 + B06 |
| T4 | “Onde mudas o tema claro/escuro ou os teus dados?” | Abre Configurações relevantes em ≤ tempo acordado com PO | B02 |

**FR-UX-GLOBAL-B01:** tarefa guiada separada — cronómetro até identificar **Transações** e **Visão geral/Início** (≤ 30 s pós-remediação).

### 4.2 Wireframe lógico — primeiro contacto pós-login (desktop)

```text
┌──────────────────────────────────────────────────────────────────┐
│ [HEADER] Logo / área app    [user] [tema] [menu lateral]         │
├──┬───────────────────────────────────────────────────────────────┤
│S │ [MAIN] Página atual (H1 alinhado ao mapa §3.1)                  │
│I │                                                                 │
│D │ Opcional (P1): faixa ou cartão “Começar” com 2 CTAs:           │
│E │   [Registar movimento]  [Ver resumo]                          │
│B │                                                                 │
│A │ [Estado da página: conteúdo | loading | empty | erro] — §5.2   │
│R │                                                                 │
└──┴───────────────────────────────────────────────────────────────┘
│ FOOTER                                                          │
└──────────────────────────────────────────────────────────────────┘
```

### 4.3 Wireframe lógico — mobile (shell)

```text
┌─────────────────────────────┐
│ [HEADER]                    │
├─────────────────────────────┤
│                             │
│ [MAIN]                      │
│                             │
├─────────────────────────────┤
│ [BOTTOM NAV] 5 ícones       │
└─────────────────────────────┘
      [FAB Atalhos] opcional — já existe em Layout
```

### 4.4 Estados de permissão (FR-UX-GLOBAL-B05)

**Estrutura obrigatória de UI** quando o utilizador **não** pode ver uma rota ou ação:

1. **Título humano** (ex.: “Mei Infinito indisponível”) — evitar “403” ou “Forbidden” como única mensagem.  
2. **Explicação em uma frase** — *porquê* (ex.: “A tua conta ainda não tem o MEI ativado.” / “Esta área é só para administradores.”).  
3. **Próximo passo** — ligação ou instrução (ex.: “Fala com o administrador da conta.” / “Ativa o MEI nas configurações.” — conforme regra de negócio real).  
4. **CTA opcional** — um botão primário quando existir destino válido.

**Implementação típica:** páginas de *guard* ou redirecionamentos com *toast* devem ser revistos para cumprir os quatro pontos quando a matriz identificar *gap*.

### 4.5 MEI / fiscal (FR-UX-GLOBAL-B06)

Onde o backend exigir certificado, dados do emitente ou catálogo:

- **Bloco explicativo** antes ou junto ao formulário: *porquê* o passo existe (linguagem simples).  
- **Erro de API:** mapeamento para mensagem **acçãoável** (“Verifica o CNPJ”, “Completa o endereço”) — fallback: “Algo correu mal. Tenta de novo ou contacta o suporte” + código interno só em modo *dev* se política o permitir.  
- **Coordenação:** entradas na matriz com dono `backend` quando o payload não trouxer `code` ou mensagem traduzível.

---

## 5. Design system leve (padrões de remediação)

### 5.1 Inventário mínimo a auditar (FR-UX-GLOBAL-B03)

Documentar no relatório Fase A, para cada categoria:

| Categoria | O que inventariar | Exemplos de ficheiros a referenciar |
|-----------|-------------------|-------------------------------------|
| Botões | variantes primário/secundário/*ghost*, *compact* | classes `planner-button-*`, `admin-*` |
| Campos de formulário | label, erro, *hint*, estado disabled | páginas de auth, transações, settings |
| Tabelas / listas | cabeçalho, linha vazia, paginação | transações, catálogo MEI |
| Modais / *drawers* | foco, *escape*, *aria* | fluxos existentes |
| *Toasts* | sucesso/erro/info | `react-toastify` |
| Cartões / *cards* | hierarquia tipográfica | dashboard, Mei Infinito |

**Saída:** tabela **padrão canónico** + **desvios** (lista) — desvios ou são corrigidos na onda P1 ou **documentados** como exceção aceite com justificativa.

### 5.2 Estados de página (FR-UX-GLOBAL-B04)

Cada rota dos fluxos §4 do PRD deve definir, em implementação ou na matriz:

| Estado | Requisito de UX |
|--------|-----------------|
| **Loading** | *Skeleton* ou spinner **com** texto curto (“A carregar transações”) quando duração > 300 ms perceptível; evitar *layout shift* agressivo. |
| **Empty** | Ilustração opcional + **porquê está vazio** + **CTA** (ex.: “Ainda não há transações — Adicionar primeira”). |
| **Erro** | Mensagem humana + **repetir** / **voltar** / contacto; erros de campo ligados ao campo (`aria-describedby`). |
| **Bloqueado** | §4.4 |

### 5.3 Tipografia, espaçamento, dark mode (Fase A)

- Auditar **contraste** de texto e de estados *active* na sidebar e no bottom nav (NFR-UX-GLOBAL-01).  
- Auditar **focus visível** em links e botões (*keyboard*).  
- **Dark mode:** mesmos requisitos de contraste; estado selecionado do *bottom* distinto de *hover*.

### 5.4 Microcopy e glossário leve

- **Títulos H1** alinhados ao mapa §3.1 (sem jargão desnecessário na área financeira genérica).  
- **MEI / NFS-e / emitente:** onde o termo for obrigatório, oferecer **tooltip** ou **link “O que é isto?”** (modal curto) — máx. 2–3 frases.  
- **CTAs:** verbo + objeto (“Adicionar transação”, “Gerar guia”). Evitar “Submeter” isolado.

---

## 6. Critérios de aceite agregados (para stories)

### 6.1 Descoberta (FR-UX-GLOBAL-B01)

- [ ] Rótulo único para `/` em sidebar e bottom nav (§3.2).  
- [ ] Em teste com **n ≥ 5** utilizadores novos (ou amostra PO), **≥ alvo** identificam **Transações** e **Início/Visão geral** em ≤ 30 s após orientação mínima (“estás dentro da app”).  

### 6.2 Tarefas críticas (FR-UX-GLOBAL-B02)

- [ ] Cenários T1–T4 (§4.1) documentados com taxa de sucesso pós-onda.  
- [ ] Ajuste de métricas **calibrado com PO** antes do *go-live* da onda.

### 6.3 Consistência (FR-UX-GLOBAL-B03)

- [ ] Documento de inventário anexo ao relatório Fase A; desvios P1 resolvidos ou listados como exceção.

### 6.4 Dead ends (FR-UX-GLOBAL-B04)

- [ ] Nenhuma rota prioritária sem empty/erro/bloqueio conforme §5.2 e §4.4.

### 6.5 Papéis (FR-UX-GLOBAL-B05)

- [ ] Todas as vistas de *guard* revistas com os 4 pontos de §4.4.

### 6.6 Fiscal (FR-UX-GLOBAL-B06)

- [ ] Lista de códigos de erro → copy final aprovada por produto; UI sem *raw* JSON em mensagens ao utilizador.

---

## 7. Acessibilidade (NFR-UX-GLOBAL-01)

### 7.1 Checklist WCAG 2.2 AA — fluxos PRD §4.3

Preencher no relatório Fase A (FR-UX-GLOBAL-A05) com **Passou / Falhou / N/A** e nota:

| Critério (resumo) | Autenticação | Núcleo financeiro | Planeamento | Conta | MEI + catálogo | Shell |
|-------------------|--------------|-------------------|-------------|-------|----------------|-------|
| Contraste mínimo (texto/UI) | | | | | | |
| Foco visível | | | | | | |
| Ordem de foco lógica | | | | | | |
| Nome acessível (ícones só) | | | | | | |
| Erros associados a campos | | | | | | |
| Alvo tocável ≥ 24×24 CSS (mobile) | | | | | | |
| *Motion* / animações (preferência utilizador) | | | | | | |

**Referência de processo:** checklist detalhada em `.aiox-core/development/checklists/accessibility-wcag-checklist.md` (quando a equipa correr *a11y-check* no fluxo AIOX).

### 7.2 Testes assistivos

- Pelo menos um percurso **teclado** e um **leitor de ecrã** (VoiceOver ou NVDA) documentados por *release* de onda P0, nos fluxos T1 e T4.

---

## 8. Artefactos e localização (Fase A)

| Artefacto | ID PRD | Local sugerido |
|-----------|--------|----------------|
| Relatório de auditoria | A01 | `docs/ux-audit/relatorio-iu-ux-global-YYYY-MM-DD.md` (criar pasta se necessário) |
| Matriz de problemas | A02 | mesmo conjunto ou `docs/ux-audit/matriz-problemas-iu-ux-global-YYYY-MM-DD.md` |
| Backlog priorizado | A03 | secção no relatório ou CSV/Markdown anexo |
| Notas de testes moderados | A04 | anexo com consentimento e *insights* (sem dados pessoais reais) |
| Checklist WCAG | A05 | secção do relatório ou ficheiro dedicado |
| Handoff para stories | A06 | tabela com ID, rota, aceite, dono |
| Proposta de navegação | A07 | `docs/ux-audit/proposta-navegacao-global-YYYY-MM-DD.md` |

**NFR-UX-GLOBAL-03:** todos os ficheiros com data e ligação a este spec + PRD.

---

## 9. Qualidade e privacidade (NFR-UX-GLOBAL-02, 04)

- Gates: `npm run lint`, `npm run typecheck`, `npm test` nos pacotes alterados.  
- Testes existentes de rota/gates MEI (`App.mei-gate.test.tsx`, etc.) permanecem verdes quando *shell* ou guards forem tocados.  
- Testes com utilizadores: sem dados fiscais reais de terceiros; gravar só com consentimento.

---

## 10. Ondas de implementação (orientação para @dev)

| Onda | Foco técnico típico (*file list* orientador) |
|------|-----------------------------------------------|
| **P0** | `Sidebar.tsx`, `BottomNavigation.tsx`, `Layout.tsx`, páginas com empty states fracos, *copy* de guards |
| **P1** | Componentes partilhados em `frontend/src/components/`, alinhamento de classes de botão/cartão |
| **P2** | Refactor de IA (*shell*, roteamento de “Mais”, *sheet* secundário) — só após A07 aprovado |

---

## 11. Referências de código (brownfield)

- `frontend/src/App.tsx` — definição de rotas e guards.  
- `frontend/src/Layout/Layout.tsx` — *shell*, atalhos, *main* padding.  
- `frontend/src/Layout/Sidebar.tsx` — itens desktop.  
- `frontend/src/Layout/Header.tsx`, `Footer.tsx`.  
- `frontend/src/components/BottomNavigation.tsx` — *bottom* mobile.  
- Páginas: `frontend/src/pages/*` (auth, Dashboard, Transactions, …).  

---

## 12. Changelog deste spec

| Versão | Data | Notas |
|--------|------|-------|
| 1.0 | 2026-04-01 | Versão inicial a partir do PRD global. |

---

— *Especificação pronta para Fase A (preenchimento dos artefactos) e para desdobramento em stories de remediação (Fase B).*
