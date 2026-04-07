# Especificação de front-end e UX — Mensagens de erro ao utilizador final

**Versão:** 1.0  
**Data:** 2026-04-07  
**Autoria:** Uma (UX design expert / fluxo AIOX)  
**Requisitos de origem:** [`docs/prd/PRD-mensagens-erro-ux-usuario-final-2026-04-07.md`](../prd/PRD-mensagens-erro-ux-usuario-final-2026-04-07.md) (**FR-ERR-***, **NFR-ERR-***)  
**Brief de apoio:** [`docs/brief/brief-mensagens-erro-ux-usuario-final-2026-04-07.md`](../brief/brief-mensagens-erro-ux-usuario-final-2026-04-07.md)

**Relação com outras specs e código:**

- **Design system leve / tokens:** [`docs/specs/ux-spec-meu-mei-ui-2026-03-30.md`](ux-spec-meu-mei-ui-2026-03-30.md) — classes `admin-alert-*`, `planner-button*`, shells; **não** introduzir novo tema global.  
- **Workspace NFS-e:** [`docs/specs/ux-spec-mei-nfse-workspace-2026-04-01.md`](ux-spec-mei-nfse-workspace-2026-04-01.md) — ordem de alertas (§7 da spec irmã); erros fiscais **devem** consumir o contrato deste documento ou *wrapper* equivalente.  
- **Emissão NF-e / NFC-e / NFS-e:** [`docs/specs/ux-spec-guia-mei-emissao-nfe-nfce-2026-04-06.md`](ux-spec-guia-mei-emissao-nfe-nfce-2026-04-06.md) — pilha de feedback sob “Emitir”; alinhar hierarquia com **§4** abaixo.  
- **Revisão IU global:** [`docs/prd/PRD-revisao-iu-ux-global-intuitividade-2026-04-01.md`](../prd/PRD-revisao-iu-ux-global-intuitividade-2026-04-01.md) — reforço **FR-UX-GLOBAL-B05/B06**.  
- **Implementação de referência (pré-unificação):** `frontend/src/components/FiscalIntegrationErrorAlert.tsx` (`LongFiscalErrorMessage`, limiar `FISCAL_ERROR_LONG_THRESHOLD`), `FetchErrorBanner.tsx`, `frontend/src/lib/fiscalUserError.ts`, `frontend/src/utils/buildApiErrorMessage.ts`.

**Adendos às specs MEI:** em vez de duplicar parágrafos longos nos ficheiros irmãos, as secções **§10** e **§11** deste documento servem como **fonte canónica de exemplos**; as specs NFS-e e emissão fiscal podem acrescentar uma linha de remissão: *“Padrão de erro ao utilizador: `ux-spec-mensagens-erro-usuario-final-2026-04-07.md`”* (cumprimento espiritual de **FR-ERR-A04**).

**Inventário de *call sites*:** o documento **`docs/`** com matriz por rota/componente (**FR-ERR-A01**) é entregável à parte; esta spec define o **contrato visual e de comportamento** que o inventário deve referenciar na coluna *padrão alvo*.

---

## 1. Objetivo deste documento

1. Definir **anatomia** e **variantes** do bloco de erro ao utilizador (título, descrição, fonte, CTAs, detalhe técnico).  
2. Ligar **taxonomia** (`category`) a **severidade visual**, **tom de voz** e **obrigatoriedade de CTA**.  
3. Especificar **contrato TypeScript** e **requisitos de acessibilidade** alinhados a **NFR-ERR-01**.  
4. Publicar **copy canónica v1.0** por categoria (**FR-ERR-A02** — versão UX; aprovação final de PO mantém-se).  
5. Fornecir **wireframes lógicos** e **exemplos antes/depois** para implementação e QA.

Não substitui stories em `docs/stories/`; alimenta critérios de aceite, *file list* e revisão de legibilidade (**NFR-ERR-05**).

---

## 2. Princípios de UX e voz

| Princípio | Aplicação |
|-----------|-----------|
| **Escaneabilidade** | Título ≤ ~60 caracteres; descrição 1–3 frases; uma ideia por frase. |
| **Sem culpa** | Tom neutro; “Não foi possível…” / “Tente…” em vez de “Erro do utilizador”. |
| **Fonte explícita** | Se o texto longo vier do **serviço de notas** ou de **rede**, o utilizador **sabe** — evita culpar a app. |
| **Recuperação primeiro** | Se `recoverable`, o **primeiro** controlo focável após o título (quando aplicável) é a CTA primária. |
| **Detalhe por defeito oculto** | Texto bruto do provedor, HTTP, paths → **abaixo** do fold cognitivo ou atrás de “Ver detalhes” / painel rolável (reutilizar padrão `LongFiscalErrorMessage` onde fizer sentido). |
| **Consistência** | Mesma hierarquia em **banner**, **inline** e **modal**; só muda *layout* (largura, margens). |

**Checklist de legibilidade (NFR-ERR-05):** sem duplo negativo; imperativos consistentes (**Verifique**, **Tente**, **Confirme**, **Volte**); sem siglas opacas (HTTP, API, JSON) na **descrição** visível por defeito.

---

## 3. Taxonomia (`UserErrorCategory`)

Valores **estáveis** para analytics e mapeamento (máx. 8; ajustável após inventário **FR-ERR-A01**).

| `category` | Significado para o utilizador | `recoverable` típico | Severidade visual |
|------------|--------------------------------|----------------------|-------------------|
| `rede` | Ligação intermitente ou sem internet | Sim | `error` |
| `indisponivel` | Servidor ou serviço temporariamente indisponível | Sim | `error` |
| `sessao` | Sessão expirada ou credenciais inválidas | Sim* | `warning` ou `error` |
| `permissao` | Conta sem permissão para a operação | Parcial | `error` |
| `validacao_cliente` | Dados do formulário inválidos antes do envio | Sim | `warning` |
| `provedor_fiscal` | Resposta do emissor / SEFAZ / validação fiscal | Sim | `error` |
| `validacao_servidor` | Rejeição genérica do backend (422/400) | Sim | `error` |
| `desconhecido` | Não classificado | Sim | `error` |

\* *recoverable* para `sessao`: ação “Sair e entrar de novo” ou “Atualizar página” conforme fluxo.

### 3.1 Origem (`UserErrorSource`)

| Valor | *Label* opcional na UI (rodapé do bloco) |
|-------|------------------------------------------|
| `app` | *(omitir linha de fonte — erro tratado pela aplicação)* |
| `network` | “Isto costuma estar ligado à sua ligação à internet.” |
| `backend` | “O servidor não conseguiu concluir o pedido.” |
| `provedor_fiscal` | “Esta informação foi enviada pelo **serviço de emissão de notas** (emissor fiscal), não pelo Meu Financeiro.” |
| `third_party` | “Um serviço externo devolveu um aviso.” (usar só se não for fiscal) |

Copy do *label* pode ser uma única linha `text-xs` / `opacity-90` abaixo da descrição, antes das CTAs.

---

## 4. Anatomia do bloco (`UserFacingError`)

### 4.1 Ordem vertical obrigatória

1. **Título** — `h2` em *banner* de página; `h3` ou `p` com `font-semibold` em *inline* dentro de secção que já tem `h2` (evitar saltos de nível incorretos).  
2. **Descrição** — `p`, `text-sm`, `leading-relaxed`.  
3. **Linha de fonte** — opcional; ver §3.1.  
4. **Detalhe técnico / texto longo** — opcional; colapsável ou painel `max-h-* overflow-y-auto` (alinhado a `LongFiscalErrorMessage` / `scrollPanelClass`).  
5. **CTAs** — linha horizontal: primária (`planner-button` ou variante existente) + secundária (*ghost* / link sublinhado).  
6. **Ação terciária** — opcional: botão texto “Copiar informação para suporte” (conteúdo sanitizado — **NFR-ERR-03**).

### 4.2 Wireframe lógico — *inline* / *banner*

```text
┌─────────────────────────────────────────────────────────────┐
│ role="alert" aria-labelledby={titleId}                      │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ TÍTULO (humano, sem HTTP)                               │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ Descrição. Uma ou duas frases. Próximo passo claro.      │ │
│ │ (opcional) Fonte: serviço de notas / rede…               │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ ▶ Ver detalhes técnicos (collapsed por defeito)          │ │
│ │   [ painel rolável se texto > limiar ]                   │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ [ CTA primária ]   [ CTA secundária link ]               │ │
│ │ (opcional) Copiar para suporte                          │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Variantes de *layout* (`variant`)

| `variant` | Uso | Classes base sugeridas (brownfield) |
|-----------|-----|-------------------------------------|
| `inline` | Sob formulário, dentro de cartão | `admin-alert-danger` ou `admin-alert-warning`; `space-y-2` |
| `page_banner` | Topo de lista / falha de fetch | Mesmo padrão que `FetchErrorBanner` (borda arredondada, `mb-4`) |
| `modal_body` | Corpo de modal de confirmação/erro | Borda interna `rounded-lg border border-rose-300 bg-rose-50/…` (padrão `EmissaoFiscalErrorAlertModal`) |
| `toast` | *Não recomendado* para erros com detalhe longo | Se inevitável: só título + uma frase; *deep link* “Ver detalhes” abre *inline* ou modal |

**Regra:** erros `provedor_fiscal` com texto > **300** caracteres **não** devem ir só para *toast* sem superfície de detalhe.

### 4.4 Severidade visual (`severity`)

| `severity` | Cor / token | `role` |
|------------|-------------|--------|
| `error` | `rose` / `admin-alert-danger` | `alert` |
| `warning` | `amber` / `admin-alert-warning` | `alert` |
| `info` | `slate` / borda neutra (raro: manutenção programada) | `status` ou `alert` conforme contexto |

---

## 5. Contrato TypeScript (referência — FR-ERR-A03)

Nome do componente final é decisão de engenharia (`UserFacingErrorBlock`, `AppErrorCallout`, etc.). Props mínimas:

```typescript
type UserErrorCategory =
  | 'rede'
  | 'indisponivel'
  | 'sessao'
  | 'permissao'
  | 'validacao_cliente'
  | 'provedor_fiscal'
  | 'validacao_servidor'
  | 'desconhecido';

type UserErrorSource = 'app' | 'network' | 'backend' | 'provedor_fiscal' | 'third_party';

type UserErrorSeverity = 'error' | 'warning' | 'info';

type UserErrorVariant = 'inline' | 'page_banner' | 'modal_body' | 'toast';

type UserErrorAction = {
  label: string;
  onClick?: () => void;
  href?: string;
  /** se true, tratado como botão secundário (link style) */
  secondary?: boolean;
};

export type UserFacingErrorProps = {
  variant: UserErrorVariant;
  category: UserErrorCategory;
  source: UserErrorSource;
  severity: UserErrorSeverity;
  recoverable: boolean;
  title: string;
  description: string;
  /** Texto longo do provedor, JSON legível, ou stack sanitizado para suporte */
  technicalDetail?: string | null;
  primaryAction?: UserErrorAction | null;
  secondaryAction?: UserErrorAction | null;
  onCopySupportDetail?: (() => void) | null;
  /** id estável para testes e aria-labelledby */
  titleId?: string;
  className?: string;
};
```

**Mapeamento:** uma função `mapApiErrorToUserFacingError(...)` (ou extensão de `mapMeiFiscalErrorToCopy`) produz `UserFacingErrorProps` **antes** de renderizar — evita concatenar técnico no `title`.

---

## 6. Copy canónica v1.0 (por `category`)

Substituir *placeholders* `[ação]` / `[documento]` no código por rotas reais. Aprovação PO pode alterar *wording* sem mudar estrutura.

| `category` | Título | Descrição | CTA primária (se `recoverable`) | CTA secundária (opcional) |
|------------|--------|-----------|-----------------------------------|---------------------------|
| `rede` | **Ligação à internet instável** | Não foi possível comunicar com o servidor. Verifique se está ligado à internet e tente outra vez. | Tentar novamente | — |
| `indisponivel` | **Serviço temporariamente indisponível** | O serviço está a demorar mais do que o habitual ou não respondeu. Espere um momento e tente novamente. | Tentar novamente | Voltar ao início |
| `sessao` | **Sessão expirada ou inválida** | Por segurança, precisa de voltar a entrar na conta para continuar. | Entrar novamente | — |
| `permissao` | **Não tem permissão para esta ação** | A sua conta não pode executar esta operação. Se precisar de acesso, fale com o administrador da empresa. | Voltar | Contactar suporte |
| `validacao_cliente` | **Revise os dados indicados** | Alguns campos estão em falta ou incorretos. Corrija os valores assinalados e envie de novo. | — | — |
| `provedor_fiscal` | **A nota não foi aceite pelo serviço de emissão** | O emissor fiscal devolveu uma validação. Leia os detalhes abaixo, ajuste os dados conforme a mensagem e tente emitir novamente. | Rever dados / Tentar novamente | Abrir documentação MEI |
| `validacao_servidor` | **Não foi possível concluir o pedido** | Os dados enviados não foram aceites. Verifique as informações e tente outra vez. Se o problema continuar, contacte o suporte. | Tentar novamente | — |
| `desconhecido` | **Algo inesperado aconteceu** | Não conseguimos concluir esta operação. Tente novamente, verifique a ligação à internet ou contacte o suporte e diga o que estava a fazer. | Tentar novamente | Contactar suporte |

**Nota `provedor_fiscal`:** o **título** permanece genérico e estável; o **detalhe** específico (NCM, CFOP, rejeição SEFAZ) fica em `technicalDetail` ou no painel rolável.

---

## 7. Acessibilidade (NFR-ERR-01)

| Requisito | Especificação |
|-----------|----------------|
| Região viva | `role="alert"` para `severity` error/warning que interrompe tarefa; *info* pode usar `role="status"` se não for intrusivo. |
| Título | `id={titleId}` + `aria-labelledby` no contentor **ou** `aria-label` composto só se não houver heading visível. |
| Colapsável “Detalhes” | `button` com `aria-expanded`, `aria-controls={panelId}`; painel com `id={panelId}`. |
| Foco | Ao abrir **modal** de erro, foco no primeiro elemento focável (CTA primária ou “Fechar”); *trap* conforme padrão existente de modais. |
| Contraste | Texto e ícones em `rose`/`amber` sobre fundo claro/escuro: mínimo **WCAG 2.2 AA** (validar com ferramenta nos temas claro e escuro). |
| Toque | CTAs `min-h-[44px]` ou equivalente em *mobile* nos blocos P0. |

---

## 8. Interação com `buildApiErrorMessage` (orientação UX)

Hoje a string agregada **não** deve ser o `title` nem a `description` única.

| Camada | Conteúdo |
|--------|----------|
| `title` + `description` | Produzidos por `category` + mapeamento de códigos estáveis (`plugnotasCode`, etc.). |
| `technicalDetail` | Corpo legível: mensagem do servidor, `details`, resumo de tentativas Plugnotas **sem** prefixos agressivos tipo `GET /foo` na primeira linha do título; paths podem aparecer **dentro** do detalhe para suporte. |

Se o backend passar a expor `userMessage` / `supportDetail` separados (**decisão architect**), a UX mantém esta hierarquia.

---

## 9. Priorização visual (coexistência de múltiplos erros)

Quando vários blocos coexistem (ex.: Guia MEI — pré-requisitos + erro de emissão), manter ordem já alinhada a **FR-NFSE-UX-06** / pilha do Guia MEI:

1. **Bloqueio** (não pode prosseguir)  
2. **Validação cliente** (formulário)  
3. **Erro servidor / provedor**  
4. **Sucesso** (nunca acima de erro ativo)

Dentro de um único `provedor_fiscal`, **uma** instância do bloco unificado; evitar duplicar o mesmo erro em toast + banner sem necessidade.

---

## 10. Exemplos antes / depois (referência para QA e adendos MEI)

### 10.1 Rede / fetch (transações ou lista)

| Antes | Depois |
|-------|--------|
| “Erro ao carregar transações” (só) | **Título:** Ligação à internet instável — **Descrição:** Não foi possível obter as suas transações. Verifique a ligação e tente outra vez. — **CTA:** Tentar novamente |

### 10.2 `buildApiErrorMessage` genérico

| Antes | Depois |
|-------|--------|
| “Erro na requisição” | **Título:** Não foi possível concluir o pedido — **Descrição:** O servidor não aceitou o pedido. Verifique os dados e tente novamente. Se persistir, contacte o suporte. — **Detalhe:** *(mensagem técnica completa)* |

### 10.3 Provedor fiscal (emissão)

| Antes | Depois |
|-------|--------|
| Parágrafo longo do Plugnotas como único elemento visível | **Título:** A nota não foi aceite pelo serviço de emissão — **Descrição:** Ajuste os dados indicados pelo emissor e volte a tentar. — **Fonte:** serviço de emissão de notas — **Detalhe:** *(texto completo do provedor em painel rolável)* — **CTA:** Tentar novamente |

### 10.4 Sessão (401)

| Antes | Depois |
|-------|--------|
| “401 Unauthorized” ou mensagem em inglês | **Título:** Sessão expirada ou inválida — **Descrição:** Por segurança, saia e entre de novo na conta. — **CTA:** Entrar novamente |

---

## 11. Remissões para specs irmãs (FR-ERR-A04)

Para evitar deriva, recomenda-se **um parágrafo** no final das specs:

- **`ux-spec-mei-nfse-workspace-2026-04-01.md`** — após a secção de alertas/erros: *“Os erros visíveis ao utilizador seguem `ux-spec-mensagens-erro-usuario-final-2026-04-07.md` (bloco unificado, título humano + detalhe do provedor).”*  
- **`ux-spec-guia-mei-emissao-nfe-nfce-2026-04-06.md`** — na secção de feedback de emissão: mesma remissão + exemplo **§10.3** deste documento.

*(Implementação do adendo pode ser story separada de documentação.)*

---

## 12. Critérios de aceite UX (checklist)

- [ ] Todos os fluxos P0 do PRD §10 usam estrutura **§4.1** (título + descrição + fonte quando aplicável + detalhe opcional + CTA se recuperável).  
- [ ] Nenhum fluxo P0 mostra **apenas** “Erro na requisição” sem segunda frase orientadora.  
- [ ] `provedor_fiscal` com texto longo usa painel rolável ou colapsável; limiar alinhado a `FISCAL_ERROR_LONG_THRESHOLD` ou substituído por decisão única documentada no inventário.  
- [ ] Checklist **§7** verificada em tema claro e escuro nos componentes novos ou migrados.  
- [ ] Copy **§6** ou equivalente aprovado por PO refletida nos mapeadores centralizados (**NFR-ERR-04**).

---

## 13. Referências

- [`docs/prd/PRD-mensagens-erro-ux-usuario-final-2026-04-07.md`](../prd/PRD-mensagens-erro-ux-usuario-final-2026-04-07.md)  
- `frontend/src/components/FiscalIntegrationErrorAlert.tsx`  
- `frontend/src/components/FetchErrorBanner.tsx`  
- `frontend/src/lib/fiscalUserError.ts`  

---

— *Uma — especificação pronta para inventário (FR-ERR-A01), implementação do componente unificado (FR-ERR-B01) e migração por ondas.*
