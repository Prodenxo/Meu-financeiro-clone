# Especificação de front-end e UX — Workspace **NFS-e** (Guia MEI)

**Versão:** 1.0  
**Data:** 2026-04-01  
**Autoria:** Uma (UX design expert / fluxo AIOX)  
**Requisitos de origem:** `docs/prd/PRD-mei-nfse-workspace-ui-ux-melhoria-2026-04-01.md`  
**Implementação de referência:** `frontend/src/pages/GuidesMei.tsx` (painel `id="mei-panel-nfse"`, `role="tabpanel"`), tokens em `frontend/src/index.css`  

**Relação com specs irmãs:** complementa `docs/specs/ux-spec-meu-mei-ui-2026-03-30.md` (L0–L2: hero, tabs Fluxo do MEI). Esta spec detalha **apenas L3 quando `activeWorkspace === 'nfse'`**. Em caso de conflito de tokens ou padrões globais, prevalece a spec da área Mei Infinito (`ux-spec-meu-mei-ui-2026-03-30.md`); o workspace NFS-e **não** introduz tema novo.

---

## 1. Objetivo deste documento

Contrato de **experiência e implementação** para o separador NFS-e: hierarquia de secções, comportamento de colapsáveis, *copy* dinâmica, lista de notas com ações primárias/secundárias, *empty states*, ordem de alertas e acessibilidade. Mapeamento explícito a **FR-NFSE-UX-*** e reforço de **NFR-NFSE-05** / **FR-UX-MEI-01**.

Não substitui stories em `docs/stories/`; alimenta checklist de aceite e *file list*.

---

## 2. Arquitetura de informação (IA) — dentro de `nfse`

### 2.1 Níveis dentro do painel

| Nível | Nome canónico | Função |
|-------|----------------|--------|
| **NFS-L0** | *Shell* do painel | `role="tabpanel"` `aria-labelledby="mei-tab-nfse"`; espaçamento `space-y-4 md:space-y-6` (ou equivalente mantido). |
| **NFS-L1** | Secções principais (ordem fixa) | Três blocos cognitivos: **A — Antes de emitir** → **B — Dados da nota e emissão** → **C — Notas emitidas**. |
| **NFS-L2** | Subsecções em B | Prestador \| Tomador \| Serviço \| Opcionais (+ bloco Ajuda fiscal). |
| **NFS-L3** | Linha de nota (lista) | Cartão `admin-user-card`: identidade + status + ações. |

### 2.2 Navegação interna (FR-NFSE-UX-01)

**Recomendação implementável (P0):** secções **tituladas** com `h2`/`h3` visíveis e `id` estáveis para âncoras opcionais (`#mei-nfse-pre`, `#mei-nfse-emit`, `#mei-nfse-list`). Não é obrigatório *sticky sub-nav* na v1; se o produto quiser, um único conjunto de links “Ir para…” no topo do painel (texto pequeno, `planner-button-secondary-compact` ou links sublinhados) basta.

Ordem de leitura **sempre** A → B → C em **RTL** e LTR; não inverter em mobile.

---

## 3. Wireframes lógicos (baixa fidelidade)

### 3.1 Desktop (≥ md)

```text
┌────────────────────────────────────────────────────────────────────────┐
│ [Link] Voltar ao Mei Infinito                                            │
├────────────────────────────────────────────────────────────────────────┤
│ NFS-L1-A  ANTES DE EMITIR                                              │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ Cabeçalho: título emitir NFS-e (existente)                         │ │
│ │ Linha orientação dinâmica (FR-NFSE-UX-07) — 1 frase + opcional CTA  │ │
│ │ ─────────────────────────────────────────────────────────────────  │ │
│ │ (1) Bloqueios: admin-alert-warning empresa/certificado se aplicável  │ │
│ │ (2) Faixa emitente + [Salvar dados do emitente]                     │ │
│ │ (3) Atalhos catálogo + links Gerir clientes / serviços            │ │
│ │     Loading catálogo / erros catálogo / banner pré-prestador        │ │
│ └────────────────────────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────────────────────┤
│ NFS-L1-B  DADOS DA NOTA                                                │
│ ┌─ Prestador ─────────────────────────────── [colapsar ▼]  ●●○        │ │
│ │  CNPJ, razão, email, endereço mínimo, CEP, IBGE…                    │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│ ┌─ Tomador ───────────────────────────────── [colapsar ▼]  ●●○        │ │
│ │  doc, razão, email, id integração                                    │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│ ┌─ Serviço ────────────────────────────────── [colapsar ▼]  ●●○        │ │
│ │  código, CNAE, valor, discriminação                                   │ │
│ │  [Resumo: valor + tomador + válido/inválido]                         │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│ ┌─ Opcionais ──────────────────────────────── [colapsar ▼]             │ │
│ │  Cidade prestação (3 campos), checkbox email                        │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│ ▶ Ajuda fiscal (MEI / ISS) — expansível único                          │ │
│ [Emitir NFS-e]  + validação / erros emissão abaixo (ordem §7)          │ │
├────────────────────────────────────────────────────────────────────────┤
│ NFS-L1-C  NOTAS EMITIDAS                                               │
│ │ Subtítulo + toolbar filtros (labels explícitos §5)                   │ │
│ │ [sem repetir N do hero — §3.3]                                       │ │
│ │ lista cartões OU (fase 2) tabela desktop                             │ │
└────────────────────────────────────────────────────────────────────────┘
```

`*●●○`* = indicador opcional de completude (ex.: segmentos ou texto “Incompleto” / “Completo”); não obrigatório P0 — pode ser P1 visual mínimo.

### 3.2 Mobile (< md)

- Mesma ordem A → B → C; **sem** colunas lado a lado largas; *grid* `md:grid-cols-2` mantém 1 coluna.  
- **Botões primários** da linha de nota: largura total ou `min-h-[44px]` área de toque.  
- Menu **Mais:** nativo `button` + painel; evitar *hover-only*.

### 3.3 Contagens e hero (NFR-NFSE-05 / FR-UX-MEI-01)

- O **hero** (quando visível na mesma vista) continua fonte canónica do número de notas exibidas no KPI, conforme spec da área Mei Infinito (`ux-spec-meu-mei-ui-2026-03-30.md`).  
- No cabeçalho da secção **Notas emitidas**, **não** mostrar `filteredNfseList.length` como grande destaque se isso **duplicar** o mesmo inteiro do hero **sem** novo contexto.  
- **Permitido:** texto neutro — “Lista filtrada”, “Acompanhe as notas abaixo”, ou subtítulo fixo já existente.  
- **Permitido:** número **diferente** do hero (ex.: “12 arquivadas” se o KPI do hero for só não arquivadas — só se o produto definir essa regra; caso contrário manter neutro).

---

## 4. Cabeçalho do workspace e *copy* dinâmica (FR-NFSE-UX-07)

### 4.1 Estrutura

1. Título da secção emissão (manter *label* canónico do documento, ex.: `Emitir ${GUIA_MEI_NFSE_DOCUMENT_LABEL}`).  
2. Subtítulo estático curto (pode reduzir-se uma linha se a linha dinâmica absorver orientação).  
3. **Linha dinâmica** (`<p class="text-sm …">` ou `role="status"` quando mudar com fetch): **uma única** mensagem principal por estado; estados abaixo são **mutuamente excludentes** por prioridade (mais restritivo primeiro).

### 4.2 Matriz de estados → *copy* (ligação a dados existentes)

Prioridade de avaliação **de cima para baixo** (primeiro verdadeiro ganha):

| # | Condição (referência lógica) | Mensagem (exemplo) | CTA |
|---|------------------------------|--------------------|-----|
| 1 | Emitente/remoto não pronto para emissão (ex.: `nfEmissionCompanyForm` sem razão ou política de produto equivalente) | “Configure o emitente na aba **Certificado e DAS** ou guarde os dados do emitente abaixo.” | Botão/linke `setActiveWorkspace('das')` ou foco na faixa “Salvar dados do emitente” |
| 2 | Catálogo carregado e **ambos** `nfseCatalogClientes.length === 0` e `nfseCatalogProdutos.length === 0` | “Cadastre clientes e serviços para usar atalhos, ou preencha o formulário manualmente.” | Links “Gerir clientes” / “Gerir serviços e produtos” |
| 3 | `nfseCatalogLoading` | “A atualizar catálogo…” | — |
| 4 | *Fallback* pronto | “Use os atalhos acima ou preencha tomador e serviço para emitir.” | — |

*Regra:* não inventar flags; se um estado não for distinguível no código atual, usar *fallback* 4 até *spike* de produto.

---

## 5. Zona “Antes de emitir” (consolidação visual)

### 5.1 Ordem vertical obrigatória

1. **Bloqueios** — `admin-alert-warning` genérico empresa/certificado (existente).  
2. **Emitente** — faixa cinza + botão salvar + mensagens sync (sucesso/erro).  
3. **Atalhos** — *grid* selects cliente/serviço + links gestão + `nfseCatalogLoading` / `nfseCatalogError`.  
4. **Pré-prestador** — *spinner* + `admin-alert-warning` banner (existente).

Entre 1–4, **no máximo um** `admin-alert-warning` “genérico” seguido de erros específicos (`admin-alert-danger`) do catálogo; se dois avisos coexistirem, o de **bloqueio de emissão** fica acima (ver §7).

### 5.2 *Hint* obrigatório de campos

O parágrafo `admin-field-hint` (MEI / ISS / campos obrigatórios) **move-se** para dentro do bloco **Ajuda fiscal** expansível (§6.4) **ou** permanece logo abaixo da zona 4 **uma única vez**, para não repetir entre secções. Recomendação: **Ajuda fiscal** para limpar o topo.

---

## 6. Formulário de emissão — agrupamento e colapsáveis (FR-NFSE-UX-04)

### 6.1 Mapeamento campo → secção

| Secção | Campos (referência `nfseForm`) |
|--------|--------------------------------|
| **Prestador** | `prestadorCpfCnpj`, `prestadorRazaoSocial`, `prestadorEmail`, `prestadorEndereco.*` (logradouro, número, codigoCidade, cep), mensagens Brasil API |
| **Tomador** | `tomadorCpfCnpj`, `tomadorRazaoSocial`, `tomadorEmail`, `idIntegracao` |
| **Serviço** | `servico.codigo`, `servico.cnae`, `servico.valorServico`, `servico.discriminacao` |
| **Opcionais** | `cidadePrestacao.*`, `enviarEmail` |

### 6.2 Comportamento do colapsável

- **Cabeçalho da secção:** `button` com `aria-expanded`, `aria-controls` → `id` do painel; ícone chevron; estilo `text-sm font-semibold` alinhado a blocos “Serviço” atuais.  
- **Estado inicial (recomendação UX):** todas **expandidas** até **primeira emissão com sucesso** na sessão ou `localStorage` chave opcional `mei-nfse-sections-collapsed=1` (P2 — só se produto aprovar). **MVP:** todas expandidas sempre **ou** Prestador colapsado após primeiro preenchimento completo (escolha engenharia com menor risco: **todas expandidas** no P1).  
- **Validação (FR-NFSE-UX-04):** ao clicar “Emitir” com `nfseValidationMessage` não vazio, **expandir** a secção que contém o primeiro campo inválido (regra: ordem Prestador → Tomador → Serviço → Opcionais). Scroll suave opcional até o cabeçalho da secção.  
- **Teclado:** `Space`/`Enter` no cabeçalho alterna; foco não preso dentro de painel fechado.

### 6.3 Resumo (valor / tomador / validação)

Colocar **no rodapé da secção Serviço** (sempre visível quando Serviço expandido) ou **barra sticky** no fundo do viewport desktop (altura fixa pequena):

- Texto: “Tomador: {nome ou doc} · Valor: {valor formatado ou bruto conforme UI atual} · {Válido para enviar | Ajuste os campos indicados}”.  
- Se inválido, link “Ver erros” opcional que faz *scroll* à primeira secção com erro.

### 6.4 Bloco “Ajuda fiscal” (único)

- Controlo: `button` “Ajuda fiscal e campos obrigatórios” `aria-expanded` + painel com o texto legal atual (MEI Simples, ISS, lista de obrigatórios).  
- **Uma** instância no painel B; remover duplicações do mesmo conteúdo noutros sítios.

---

## 7. Ordem de alertas e feedback (FR-NFSE-UX-06, P2)

Quando várias regiões podem mostrar mensagem em simultâneo, **renderizar nesta ordem** (de cima para baixo dentro da zona B / imediatamente abaixo do formulário):

1. **Bloqueio** — impede ou desaconselha emissão (emitente/certificado / alerta crítico).  
2. **Validação cliente** — `nfseValidationMessage` + `LongFiscalErrorMessage` *tone warning*.  
3. **Erro servidor / provedor** — `EmissaoFiscalErrorAlert` ou `FiscalProviderErrorAlert`.  
4. **Sucesso** — `admin-alert-success`.

Dentro da lista (zona C), mensagens de lista (`nfseLoading`, erros de lista) **não** misturar com pilha de emissão; manter C autónomo.

**Padrão transversal de erro ao utilizador:** mensagens de falha visíveis ao utilizador final (título em linguagem simples, descrição, indicação de **fonte** quando o aviso vem do emissor fiscal, detalhe técnico ou texto longo do provedor em painel secundário ou colapsável, CTAs de recuperação) seguem o contrato de [`ux-spec-mensagens-erro-usuario-final-2026-04-07.md`](ux-spec-mensagens-erro-usuario-final-2026-04-07.md), nas stories **FR-ERR-P0-***. No código, o módulo é **`frontend/src/components/FiscalIntegrationErrorAlert.tsx`**, que exporta entre outros `EmissaoFiscalErrorAlert`, `PlugnotasIntegrationErrorAlert` e `LongFiscalErrorMessage`; na documentação use o **caminho do ficheiro** quando a equipa precisar de localizar a implementação, e o **nome do export** quando for o identificador React. Os componentes actuais e o *banner* de lista devem **convergir** para esse modelo **sem** alterar a **ordem de prioridade** definida acima (bloqueio → validação cliente → erro servidor/provedor → sucesso).

---

## 8. Lista “Notas emitidas”

### 8.1 Toolbar de filtros (FR-NFSE-UX-05)

| Controlo | Label visível (`<label for=…>`) | Ordem tab |
|-----------|----------------------------------|-----------|
| Tipo documento | “Tipo” ou “Tipo de documento” | 1 |
| Status | “Status” | 2 |
| Período | “Período” | 3 |
| Checkbox arquivadas | “Mostrar arquivadas” (já existe; garantir `id`+`htmlFor`) | 4 |
| Botão atualizar | “Atualizar lista” | 5 |

*Layout:* manter `grid` responsivo; em mobile, ordem visual = ordem de tabulação.

### 8.2 *Empty states* (FR-NFSE-UX-02)

| Condição | *Copy* título/corpo | CTA |
|----------|---------------------|-----|
| `nfseList.length === 0` **e** não é erro de API | “Ainda não há notas emitidas.” | Botão secundário “Preencher e emitir” (*scroll* a zona B) ou foco no primeiro campo |
| `nfseList.length > 0` **e** `filteredNfseList.length === 0` | “Nenhuma nota corresponde aos filtros atuais.” | “Limpar filtros” (`nfseStatusFilter`, `nfsePeriodFilter`, `nfseDocumentTypeFilter` → `all`; opcional desmarcar arquivadas) |
| Erro de carregamento | Manter `admin-alert-danger` existente | “Tentar novamente” → `loadNfseList` |

### 8.3 Ações por linha (FR-NFSE-UX-03)

**Primárias visíveis por defeito (recomendação UX v1):**

1. **Atualizar status** — necessário quando nota em `processando`.  
2. **Baixar PDF** — prova mais pedida pelo tomador.

**Secundárias** (menu **“Mais ações”** por linha):

- Baixar XML  
- Marcar revisão / Remover revisão  
- Cancelar nota  
- Arquivar / Desarquivar  

**Implementação a11y (NFR-NFSE-01):**

- Botão “Mais ações” por linha: `aria-haspopup="menu"` ou `true` + `aria-expanded`; com teclado, `ArrowDown` abre e foca primeiro item (padrão *disclosure* ou *menu button* mínimo).  
- Cada item do menu: `role="menuitem"` ou botões num painel com foco gerido.  
- Quando `statusKey === 'processando'`, PDF/XML primários/secundários **disabled** com `aria-disabled="true"` e *tooltip* ou texto “Disponível após conclusão”.

**Paridade:** todas as seis operações atuais permanecem; apenas a **descoberta** muda.

### 8.4 Vista tabela (fase 2, opcional)

- **Breakpoint:** `lg:` apenas.  
- Colunas sugeridas: ID / integração, Data, Status, Ações (primárias + Mais).  
- Mobile: **só** cartão; não esconder ações críticas só na tabela.

---

## 9. Design tokens e CSS (NFR-NFSE-04)

**Reutilizar** (proibido novo tema):

- Secções: `admin-section-card`, `admin-section-header`, `admin-section-title`, `admin-section-subtitle`.  
- Formulário: `planner-input-compact`, `admin-field-hint`, `admin-required-mark`.  
- Alertas: `admin-alert-warning`, `admin-alert-danger`, `admin-alert-success`.  
- Botões: `planner-button`, `planner-button-secondary-compact`.  
- Linha de nota: `admin-user-card`, `admin-actions`, `admin-actions-grid` → substituir *grid* de 6 por **flex** *wrap* com 2 botões + 1 `Mais` ou `dropdown`.  
- Colapsável: pode usar `border border-slate-200/70 rounded-lg` já visto na página; se necessário, classe utilitária única `.mei-nfse-disclosure` em `index.css` (sem novas cores de marca).

---

## 10. Dados e *props* (sem novos endpoints)

Mapeamento UX → estado já presente em `GuidesMei.tsx` (referência para aceite):

| Conteúdo UX | Fonte |
|-------------|--------|
| Lista / filtros | `nfseList`, `filteredNfseList`, `nfseStatusFilter`, `nfsePeriodFilter`, `nfseDocumentTypeFilter`, `nfseShowArchived`, `nfseLoading` |
| Catálogo | `nfseCatalogClientes`, `nfseCatalogProdutos`, `nfseCatalogLoading`, `nfseCatalogError` |
| Emitente | `nfEmissionCompanyForm`, `nfEmissionCompanySyncLoading`, erros/sucesso sync |
| Validação / erros emissão | `nfseValidationMessage`, `nfseError`, `nfseErrorKind`, `nfseSuccess`, `nfseSubmitting` |
| Ações linha | `nfseActionMap`, handlers existentes |

---

## 11. Responsividade

- Largura máxima do painel: herda do contentor da área Mei Infinito.  
- Secções colapsáveis: cabeçalho com `min-height` ≥ 44 px área tocável.  
- Menu “Mais” em mobile: painel full-width sob o cartão ou *bottom sheet* simplificado (lista de botões); evitar *popover* cortado.

---

## 12. Matriz de rastreio PRD ↔ esta spec

| ID PRD | Secções desta spec |
|--------|-------------------|
| FR-NFSE-UX-01 | §2, §3 |
| FR-NFSE-UX-02 | §8.2 |
| FR-NFSE-UX-03 | §8.3 |
| FR-NFSE-UX-04 | §6 |
| FR-NFSE-UX-05 | §8.1 |
| FR-NFSE-UX-06 | §7 |
| FR-NFSE-UX-07 | §4 |
| NFR-NFSE-01 | §8.3, §6.2 |
| NFR-NFSE-04 | §9 |
| NFR-NFSE-05 | §3.3 |

---

## 13. Checklist de aceite (réplica para story)

- [ ] Ordem A → B → C com títulos/`id` estáveis (FR-NFSE-UX-01).  
- [ ] Linha dinâmica no cabeçalho conforme §4.2 (FR-NFSE-UX-07).  
- [ ] Zona “Antes de emitir” na ordem §5.1.  
- [ ] Quatro secções de formulário + Ajuda fiscal; expansão automática em erro de validação (FR-NFSE-UX-04).  
- [ ] Dois *empty states* distintos + CTAs §8.2 (FR-NFSE-UX-02).  
- [ ] Filtros com label/`aria-label` e tab order §8.1 (FR-NFSE-UX-05).  
- [ ] Duas primárias + “Mais ações” com paridade das 6 operações (FR-NFSE-UX-03).  
- [ ] Pilha de alertas emissão §7 quando P2 aplicável (FR-NFSE-UX-06).  
- [ ] Cabeçalho lista sem duplicar KPI do hero §3.3 (NFR-NFSE-05).  
- [ ] `npm run lint`, `npm run typecheck`, `npm test` no `frontend`; testes `GuidesMei` / `App.mei-gate` atualizados se *copy* estrutural mudar.

---

## 14. Referências

- `docs/prd/PRD-mei-nfse-workspace-ui-ux-melhoria-2026-04-01.md`  
- `docs/brief/brief-mei-nfse-ui-ux-melhoria-2026-04-01.md`  
- `docs/specs/ux-spec-meu-mei-ui-2026-03-30.md`  
- `docs/operacao-mei-nfse.md`  
- `frontend/src/pages/GuidesMei.tsx`  

---

— *Especificação pronta para story e implementação incremental (P0 → P1 → P2).*
