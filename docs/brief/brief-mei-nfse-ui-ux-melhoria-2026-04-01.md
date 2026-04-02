# Brief: melhoria de UI/UX — área **NFS-e** (notas fiscais MEI)

**Data:** 2026-04-01  
**Origem:** pedido de produto (Atlas / analista)  
**Produto:** Meu Financeiro — Guia MEI (`/guias-mei`, workspace `nfse`)  
**Implementação de referência:** `frontend/src/pages/GuidesMei.tsx` (painéis `mei-panel-nfse`)

**Documentos relacionados (não substituídos por este brief):**

- `docs/prd/PRD-meu-mei-ui-ux-melhoria-2026-03-30.md` — objetivos transversais da área Mei Infinito (hero, tabs, visão geral).  
- `docs/specs/ux-spec-meu-mei-ui-2026-03-30.md` — contrato UX da página inteira.  
- `docs/operacao-mei-nfse.md` — escopo fiscal (apenas NFS-e na UI; política emitente).  
- Stories de catálogo / guards: `docs/stories/story-cat-mei-*.md`, `story-cat-mei-05-navegacao-guards-integracao-emissao-nfse.md`.

---

## 1. Resumo executivo

O separador **NFS-e** concentra **emissão** (formulário extenso), **alertas de emitente/catálogo** e **lista de notas** com **múltiplas ações por linha**, tudo num **fluxo vertical único**. O utilizador MEI tende a **perder o fio** entre “preparar dados”, “emitir” e “acompanhar notas”; em mobile a densidade de botões por nota **sobrecarrega** a interface. Este brief propõe **reorganizar hierarquia, passos e affordances** dentro do workspace NFS-e, **reutilizando dados e APIs já existentes**, e alinhando-se ao PRD da área Mei Infinito onde houver sobreposição (métricas canónicas, a11y de tabs, empty states).

---

## 2. Problema / oportunidade

| Dimensão | Problema observável | Oportunidade |
|----------|---------------------|--------------|
| **Hierarquia** | Um único scroll longo mistura pré-requisitos (emitente, avisos), atalhos de catálogo, bloco completo do prestador/tomador/serviço e, em seguida, a lista histórica. | Separar mentalmente em **subáreas** (ex.: “Antes de emitir” → “Dados da nota” → “Emitir” → “Notas emitidas”) com âncoras ou acordeão/seções numeradas. |
| **Carga cognitiva** | Muitos campos obrigatórios aparecem de uma vez; código IBGE, CEP e regras fiscais exigem *copy* de apoio que já existe mas se perde no meio do formulário. | **Agrupar** em cartões colapsáveis (Prestador / Tomador / Serviço / Opcionais) com resumo de preenchimento ou indicadores “incompleto”. |
| **Lista de notas** | Seis ações de igual peso visual por cartão (`admin-actions-grid`) dificultam priorizar “o que faço agora?” (ex.: rejeitada vs concluída). | **Ações primárias** (atualizar status, PDF/XML) vs **secundárias** (menu “Mais”, ou agrupamento por estado da nota). |
| **Empty state** | Mensagem genérica quando o filtro não devolve notas. | Diferenciar **“sem notas no sistema”** vs **“nenhum resultado para o filtro”** com CTAs distintos (“Emitir primeira NFS-e” vs “Limpar filtros”). |
| **Coerência com o resto da página** | Badges/tab “N notas” vs hero podem duplicar números (já coberto por FR-UX-MEI-01). | No slice NFS-e, **não reintroduzir** contadores duplicados; usar texto de orientação no tab ou no cabeçalho da secção lista. |

---

## 3. Estado atual (brownfield)

| Aspeto | Situação |
|--------|----------|
| **Rota / gating** | Workspace `nfse` só com `canViewNfse`; painel com `role="tabpanel"` e `aria-labelledby` coerente com tab. |
| **Emissão** | Formulário `nfseForm`: prestador (CNPJ com Brasil API, endereço mínimo), tomador, serviço (código, CNAE, valor, discriminação), cidade de prestação opcional, checkbox e-mail. Validação inline (`nfseValidationMessage`). |
| **Integrações de contexto** | Barra “Emitente configurado” + `Salvar dados do emitente`; links para `/mei-catalogo/clientes` e `/mei-catalogo/servicos-produtos`; selects de atalho; banners de catálogo e pré-preenchimento prestador. |
| **Lista** | Filtros: tipo documento, status, período; checkbox arquivadas; botão atualizar. Linhas com ID/protocolo, data, badges de status/arquivo/revisão; seis botões por nota. |
| **Erros** | `EmissaoFiscalErrorAlert`, `FiscalProviderErrorAlert`, `LongFiscalErrorMessage` — já padronizados; risco de **múltiplas faixas** empilhadas sem ordem explícita de leitura. |

**Lacuna de UX:** falta um **roteiro visual** explícito para o primeiro uso e para o uso recorrente; a **densidade de ações** na lista não escala bem com muitas notas.

---

## 4. Objetivos (produto / UX)

1. O utilizador identifica em **≤ 30 s** onde **emitir** uma nova NFS-e e onde **ver o histórico**, sem confundir com configuração de emitente (DAS/certificado), salvo quando o estado bloqueia a emissão — aí a mensagem deve ser **única e acionável**.  
2. Reduzir **sobrecarga por linha** na lista de notas mantendo **paridade funcional** (todas as operações hoje disponíveis permanecem acessíveis).  
3. Melhorar **empty states** e **estados de carregamento** do catálogo e da lista para orientar o próximo passo.  
4. **Acessibilidade:** ordem de foco lógica em subsecções; rótulos visíveis nos filtros; ações críticas não escondidas só atrás de gestos obscuros (se usar menu, manter teclado e `aria-expanded`).  
5. **Consistência** com `docs/specs/ux-spec-meu-mei-ui-2026-03-30.md` (tokens `planner-*`, `admin-*`, sem novo tema global).

---

## 5. Fora de âmbito (sugerido; validar com PO)

- Novos endpoints ou tipos de documento na Guia MEI (permanece **só NFS-e** na UI).  
- Alteração das regras de validação fiscal negociais (apenas **apresentação** e fluxo).  
- Redesign completo do emissor ou troca de provedor.  
- Funcionalidades novas (ex.: lote, modelo de nota, agendamento) sem story própria.

---

## 6. Proposta de experiência

### 6.1 Cabeçalho do workspace NFS-e

- Título + **uma linha** de orientação dinâmica conforme estado: emitente não configurado → CTA para aba DAS/certificado; catálogo vazio → CTA para “Gerir clientes / serviços”; pronto → “Preencha tomador e serviço ou use os atalhos salvos.”  
- Manter “Voltar ao Mei Infinito” com o mesmo padrão visual dos outros workspaces.

### 6.2 Zona “Pronto para emitir” (pré-formulário)

- Consolidar **alerta de empresa/certificate**, **barra do emitente** e **atalhos de catálogo + links** num único cartão ou faixa com **ordem fixa**: (1) bloqueios, (2) atalhos, (3) links de gestão.  
- Evitar três níveis de aviso amarelo sucessivos sem título de secção.

### 6.3 Formulário de emissão

- **Secções colapsáveis** ou **passos** (máx. 3–4 blocos visíveis no primeiro ecrã em desktop): Prestador | Tomador | Serviço | Opcionais (cidade, ID integração, e-mail).  
- **Resumo fixo** (sticky em desktop) ou linha no fim do bloco Serviço: valor + tomador + status de validação.  
- Manter *hints* legais (MEI / alíquota ISS) num **único** bloco “Ajuda fiscal” expansível para não competir com labels.

### 6.4 Lista “Notas emitidas”

- **Toolbar** de filtros com labels explícitos (“Status”, “Período”, “Tipo”) alinhados ao PRD de a11y.  
- Por linha: destacar **status** + **data**; ações **primárias** em linha (ex.: PDF, XML ou “Ver detalhes” que expande); **Cancelar / Arquivar / Revisão** em menu “Mais” **ou** botões compactos agrupados com `aria-label` completos.  
- Empty state **condicional** ao `nfseList.length` vs `filteredNfseList.length`.  
- Opcional (fase 2): vista **tabela** em desktop para utilizadores com muitas notas (sem remover vista cartão em mobile).

### 6.5 Alinhamento com PRD da área Mei Infinito

- Onde o hero já mostra contagem de notas, o cabeçalho da lista pode mostrar **“X notas (filtro atual)”** apenas se for a **fonte canónica** naquele viewport — caso contrário, texto neutro (“Lista filtrada”) conforme matriz FR-UX-MEI-01.

---

## 7. Requisitos sugeridos (rastreáveis)

| ID | Requisito | Prioridade |
|----|-----------|------------|
| **FR-NFSE-UX-01** | O workspace NFS-e apresenta **secções tituladas** (ou passos) entre pré-requisitos, formulário e lista, com ordem de leitura estável. | P0 |
| **FR-NFSE-UX-02** | Empty states da lista **diferenciam** “sem dados” de “filtro sem resultado” e oferecem CTA coerente. | P0 |
| **FR-NFSE-UX-03** | Na lista, **no máximo duas** ações primárias visíveis por defeito por linha; as restantes permanecem acessíveis sem perda de funcionalidade. | P1 |
| **FR-NFSE-UX-04** | Formulário: agrupamento Prestador / Tomador / Serviço / Opcionais com possibilidade de **colapsar** secções já válidas (estado em UI ou sempre expandido em primeira visita — decisão UX). | P1 |
| **FR-NFSE-UX-05** | Filtros da lista com **`<label>`** associado ou `aria-label` e ordem de tabulação `filtros → atualizar → primeira linha`. | P1 |
| **FR-NFSE-UX-06** | Empilhamento de alertas (emitente, catálogo, validação, erro de emissão) segue **hierarquia**: bloqueio > validação cliente > erro servidor > sucesso. | P2 |

**NFR:** manter `npm run lint`, `npm run typecheck`, `npm test`; atualizar testes em `GuidesMei.permissions.test.tsx` / afins se *copy* ou estrutura de tabs internas mudarem.

---

## 8. Métricas / evidência de sucesso

- Teste moderado ou painel interno: ≥ **80%** dos participantes localizam “emitir nova nota” e “baixar PDF de uma nota concluída” em **≤ 45 s** no workspace NFS-e (incluindo scroll em mobile).  
- Redução qualitativa de feedback do tipo “demasiados botões na nota” / “não sei por onde começar”.  
- Sem regressão nos fluxos já cobertos por testes automatizados da rota MEI.

---

## 9. Riscos e mitigações

| Risco | Mitigação |
|-------|-----------|
| Menu “Mais” esconde ação crítica | Manter PDF/XML ou “Atualizar status” sempre visíveis; testar com teclado e leitor de ecrã. |
| Acordeão esconde erros de campo | Secção com erro **expande automaticamente** ao falhar validação ou ao clicar “Emitir”. |
| Refactor grande em `GuidesMei.tsx` | Extrair subcomponentes `MeiNfseEmitSection` / `MeiNfseListSection` em PRs incrementais. |

---

## 10. Próximos passos recomendados

1. **PO / UX:** validar prioridades P0–P2 e decisão “acordeão vs passos vs página única com âncoras”.  
2. **UX (opcional):** wireframe de baixa fidelidade só do workspace NFS-e, anexado ou referenciado em `docs/specs/`.  
3. **Engenharia:** *spike* de 0,5–1 d para medir impacto de extração de componentes e de menu de ações na lista.  
4. **SM:** fatiar em story(ies) com checklist e *file list*; referenciar este brief e o PRD da área Mei Infinito para evitar conflito de requisitos.

---

*Brief preparado para handoff a @pm / UX / @dev — Atlas (analyst).*
