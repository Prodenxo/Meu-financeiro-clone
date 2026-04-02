# PRD — Melhoria de UI/UX: workspace **NFS-e** (Guia MEI)

**Versão:** 1.0  
**Data:** 2026-04-01  
**Tipo:** Brownfield — evolução de experiência (frontend)  
**Fontes:** `docs/brief/brief-mei-nfse-ui-ux-melhoria-2026-04-01.md`; implementação atual em `frontend/src/pages/GuidesMei.tsx` (painel `mei-panel-nfse`)

**Relação com outros artefatos:**

- **Complementa** `docs/prd/PRD-meu-mei-ui-ux-melhoria-2026-03-30.md` (hero, tabs “Fluxo do MEI”, visão geral) — este PRD restringe-se ao **conteúdo do separador NFS-e** após seleção do workspace `nfse`.  
- **Alinha-se** a `docs/specs/ux-spec-meu-mei-ui-2026-03-30.md` para tokens e padrões (`planner-*`, `admin-*`); pode ser detalhado num adendo de spec só NFS-e quando UX fechar wireframes.  
- **Respeita** `docs/operacao-mei-nfse.md` (apenas NFS-e na UI da Guia MEI; sem NF-e/NFC-e na emissão).  
- **Relação com PRD principal:** complementa `docs/prd/PRD-meu-financeiro-produto-brownfield-2026-03-26.md` na camada de apresentação. **Não** altera regras fiscais nem contratos de API por si só.

---

## 1. Resumo executivo

No separador **NFS-e**, emissão (formulário extenso), alertas de emitente/catálogo e histórico de notas coexistem num **único fluxo vertical**, com **seis ações por linha** na lista. O MEI perde o fio entre preparar dados, emitir e acompanhar notas; em **mobile** a densidade de controlos por nota sobrecarrega a interface.

Este PRD define **objetivos de experiência**, **escopo**, **requisitos funcionais rastreáveis (FR-NFSE-UX-*)**, **requisitos não funcionais**, **métricas**, **ondas P0–P2** e **critérios de release**, para execução principalmente em `GuidesMei.tsx` (extração opcional para subcomponentes), **sem novos endpoints** nem novos tipos de documento na Guia MEI.

---

## 2. Visão de produto (experiência)

Dentro do workspace NFS-e, o utilizador deve **orientar-se em poucos segundos**: distinguir **pré-requisitos** (emitente, catálogo), **dados da nota** e **histórico**; concluir emissão com **menos carga cognitiva** (agrupamento claro de campos); e na lista, executar **ações frequentes** (PDF, XML, atualizar status) **sem competir visualmente** com ações menos frequentes. Mensagens de bloqueio devem ser **únicas e acionáveis** (ex.: redirecionar ao fluxo certificado/DAS quando aplicável).

A experiência deve **respeitar FR-UX-MEI-01**: não duplicar contagem de notas no cabeçalho da lista se o hero já for fonte canónica para essa métrica na mesma viewport — preferir texto neutro ou informação não redundante.

---

## 3. Problema e oportunidade

| Dimensão | Problema | Oportunidade |
|----------|----------|--------------|
| **Hierarquia** | Scroll longo mistura pré-requisitos, atalhos de catálogo, prestador/tomador/serviço e lista histórica. | **Subáreas tituladas** ou passos estáveis: “Antes de emitir” → “Dados da nota” → “Emitir” → “Notas emitidas” (âncoras, acordeão ou secções numeradas). |
| **Carga cognitiva** | Muitos campos obrigatórios visíveis de uma vez; *copy* de apoio diluída. | Cartões **colapsáveis** (Prestador / Tomador / Serviço / Opcionais) com indicador de completude; bloco **“Ajuda fiscal”** único e expansível para MEI/alíquota ISS. |
| **Lista** | Seis ações com peso visual semelhante por nota. | **Até duas ações primárias** visíveis por defeito; restantes acessíveis (menu “Mais”, agrupamento secundário) com **paridade funcional** total. |
| **Empty state** | Mensagem genérica quando o filtro não devolve linhas. | Distinguir **sem notas no sistema** vs **filtro sem resultado** com CTAs distintos. |
| **Alertas** | Várias faixas de aviso/erro empilhadas sem ordem clara. | **Hierarquia de leitura**: bloqueio > validação cliente > erro servidor > sucesso (FR-NFSE-UX-06). |

---

## 4. Personas e cenários

| Persona | Necessidade | Cenário de validação |
|---------|-------------|----------------------|
| MEI autónomo (primeira emissão) | Saber por onde começar e o que é obrigatório. | Completar primeira emissão guiado por secções; localizar “Emitir NFS-e” em ≤ 30 s após abrir o separador. |
| MEI recorrente | Preencher rápido com atalhos de catálogo e rever histórico. | Selecionar cliente/serviço salvos; baixar PDF de nota concluída em ≤ 45 s (incl. mobile). |
| Utilizador com emitente pendente | Entender bloqueio sem mensagens contraditórias. | Uma mensagem acionável leva ao separador Certificado/DAS ou à ação “Salvar emitente” conforme estado real. |

**Stakeholders:** Produto (priorização), UX (decisão acordeão vs passos vs âncoras; wireframe opcional), Engenharia frontend, QA (a11y, regressão NFS-e).

---

## 5. Escopo

### 5.1 Dentro do escopo

- Reestruturação de **layout, hierarquia e *copy*** no painel `mei-panel-nfse` (`activeWorkspace === 'nfse'`).  
- **Cabeçalho** do workspace: título + linha de orientação **dinâmica** conforme estado (emitente, catálogo vazio, pronto para emitir).  
- **Zona pré-formulário:** consolidar alertas de empresa/certificado, barra do emitente, atalhos de catálogo e links “Gerir clientes / serviços” com **ordem fixa** (bloqueios → atalhos → gestão).  
- **Formulário de emissão:** agrupamento Prestador / Tomador / Serviço / Opcionais; opção de **colapsar** secções (comportamento na primeira visita definido em implementação/UX: ex. expandir tudo até primeira emissão bem-sucedida).  
- **Resumo** de valor/tomador/estado de validação (sticky em desktop ou bloco ao fim do Serviço).  
- **Lista “Notas emitidas”:** toolbar de filtros com labels acessíveis; **empty states** condicionais; redução de ações primárias visíveis por linha mantendo todas as operações atuais acessíveis.  
- **Empilhamento ordenado** de alertas de emissão/validação/erro.  
- **Opcional (P2 / fase 2):** vista tabela em desktop para alta densidade de notas, sem remover vista cartão em mobile.

### 5.2 Fora do escopo

- Novos **endpoints** ou tipos de documento na Guia MEI (permanece **só NFS-e** na UI).  
- Alteração das **regras de validação fiscal** de negócio (apenas apresentação e fluxo).  
- Redesign global do *design system* ou troca de tema.  
- Troca de provedor fiscal ou funcionalidades novas (lote, modelos, agendamento) **sem** story própria.

---

## 6. Requisitos funcionais (UI/UX)

| ID | Requisito | Prioridade |
|----|-----------|------------|
| **FR-NFSE-UX-01** | O workspace NFS-e apresenta **secções tituladas** (ou passos numerados) que separam claramente: pré-requisitos / formulário de emissão / lista de notas, com **ordem de leitura estável** em desktop e mobile. | P0 |
| **FR-NFSE-UX-02** | Os *empty states* da lista **diferenciam** (a) **nenhuma nota no sistema** de (b) **nenhum resultado para o filtro atual**; cada caso oferece **CTA coerente** (ex.: “Emitir primeira NFS-e” vs “Limpar filtros” / “Mostrar arquivadas”). | P0 |
| **FR-NFSE-UX-03** | Na lista, **no máximo duas** ações **primárias** visíveis por defeito por linha (ex.: combinação a definir em UX: “Atualizar status” + “Baixar PDF”, ou PDF + XML); **todas** as ações atuais (sync, PDF, XML, revisão, cancelar, arquivar) permanecem **acessíveis** sem regressão funcional. | P1 |
| **FR-NFSE-UX-04** | O formulário agrupa campos em **Prestador**, **Tomador**, **Serviço** e **Opcionais** (cidade de prestação, ID integração, e-mail, checkbox enviar e-mail), com possibilidade de **colapsar** secções quando a UX assim o definir; **secção com erro de validação expande automaticamente** ao tentar emitir com dados inválidos. | P1 |
| **FR-NFSE-UX-05** | Os filtros da lista têm **`<label>`** visível associado ou `aria-label` inequívoco; a ordem de tabulação é **filtros → atualizar lista → primeira linha** (ou equivalente lógico). | P1 |
| **FR-NFSE-UX-06** | Quando múltiplas mensagens coexistem (emitente, catálogo, validação de formulário, erro de emissão, sucesso), a **prioridade de apresentação** é: **bloqueio** > **validação cliente** > **erro servidor/provedor** > **sucesso**. | P2 |
| **FR-NFSE-UX-07** | O cabeçalho do workspace inclui **uma linha de orientação dinâmica** condicionada a estado real (emitente não configurado → CTA para fluxo certificado/DAS; catálogo vazio → CTA para gerir clientes/serviços; pronto → orientação para tomador/serviço/atalhos). **Sem** inventar estados não suportados pelo backend. | P0 |

---

## 7. Requisitos não funcionais

| ID | Requisito | Notas |
|----|-----------|-------|
| **NFR-NFSE-01** | Acessibilidade | Menu “Mais” ou ações secundárias: teclado e `aria-expanded` / foco visível; contraste WCAG 2.1 AA objetivo nos controlos novos ou alterados. |
| **NFR-NFSE-02** | Performance | Colapsáveis e reordenação de layout não devem degradar perceptivelmente interação na lista (ex.: evitar re-render completo desnecessário por linha). |
| **NFR-NFSE-03** | Qualidade | `npm run lint`, `npm run typecheck`, `npm test` nos pacotes tocados; testes existentes da rota `/guias-mei` e `GuidesMei.permissions.test.tsx` (e afins) **permanecem verdes** ou atualizados de forma explícita. |
| **NFR-NFSE-04** | Consistência visual | Reutilizar tokens/classes existentes (`planner-*`, `admin-*`); sem novo tema global. |
| **NFR-NFSE-05** | Coerência com Mei Infinito | Cumprir **FR-UX-MEI-01** no que diz respeito a **contagens de notas** no cabeçalho da lista vs hero (uma fonte canónica por viewport lógica). |

---

## 8. Métricas de sucesso

| Objetivo | Métrica / evidência |
|----------|---------------------|
| Clareza no workspace NFS-e | Teste moderado ou painel interno: ≥ **80%** localizam “emitir nova nota” e “baixar PDF de nota concluída” em **≤ 45 s** (incl. scroll em mobile). |
| Redução de fricção | Menos feedback qualitativo do tipo “demasiados botões” / “não sei por onde começar”. |
| Regressão | Zero regressão nos fluxos críticos de emissão, listagem, filtros e ações por nota cobertos por testes automatizados. |
| Acessibilidade | Filtros e ações primárias/secundárias operáveis por teclado; sem quebra de leitores de ecrã nos fluxos principais NFS-e. |

---

## 9. Riscos e mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Menu “Mais” esconde ação crítica | Utilizador não encontra cancelar ou XML | FR-NFSE-UX-03: manter nas primárias as ações de maior frequência; QA valida paridade com lista atual. |
| Acordeão oculta erros | Falha silenciosa na emissão | FR-NFSE-UX-04: expansão automática da secção com erro ao validar/emitir. |
| Refactor monolítico | Merge e regressões | Extrair `MeiNfseEmitSection` / `MeiNfseListSection` (ou nomes equivalentes) em **PRs incrementais**; coordenar com outras stories em `GuidesMei.tsx`. |
| Conflito com PRD da área Mei Infinito (`PRD-meu-mei-ui-ux-melhoria-2026-03-30.md`) | KPIs duplicados | NFR-NFSE-05 + revisão conjunta com dono de FR-UX-MEI-01. |

---

## 10. Priorização (ondas)

| Onda | Conteúdo | IDs |
|------|----------|-----|
| **P0** | Secções estáveis; empty states diferenciados; cabeçalho dinâmico; base hierárquica pré-formulário | FR-NFSE-UX-01, 02, 07 |
| **P1** | Ações primárias limitadas; agrupamento/colapso formulário; filtros acessíveis | FR-NFSE-UX-03, 04, 05 |
| **P2** | Hierarquia de alertas; vista tabela desktop (opcional) | FR-NFSE-UX-06; fase 2 UX |

---

## 11. Critérios de release

1. Todos os requisitos **P0** cumpritos e revistos em ambiente de revisão ou *staging*.  
2. **P1** cumpridos ou explicitamente deferidos com registo no backlog (sem ambiguidade para “MVP” do slice NFS-e).  
3. Gates do repositório verdes nos ficheiros alterados.  
4. Nenhuma regressão nos fluxos: `canViewNfse`, emissão, listagem, filtros, PDF/XML, cancelar, arquivar, revisão, sync de status.  
5. Checklist mínimo de acessibilidade (teclado, labels de filtros, foco visível em ações novas).

---

## 12. Dependências e próximos passos

- **@sm:** criar **story(ies)** em `docs/stories/` com aceite ligado a FR-NFSE-UX-* e *file list* (`GuidesMei.tsx`, possíveis novos componentes em `frontend/src/components/` ou `pages/`, estilos em `index.css` se necessário).  
- **UX (opcional):** wireframe ou adendo `docs/specs/ux-spec-mei-nfse-workspace-*.md` para fechar combinação de ações primárias e padrão colapsável.  
- **@dev:** *spike* curto (0,5–1 d) se útil para menu de ações e extração de componentes.  
- **@qa:** plano de regressão focado no painel NFS-e e *smoke* mobile.

---

## 13. Referências

- `docs/brief/brief-mei-nfse-ui-ux-melhoria-2026-04-01.md` — origem e racional  
- `docs/prd/PRD-meu-mei-ui-ux-melhoria-2026-03-30.md` — contexto da página Mei Infinito (`/guias-mei`)  
- `docs/specs/ux-spec-meu-mei-ui-2026-03-30.md` — tokens e padrões globais  
- `docs/operacao-mei-nfse.md` — escopo fiscal NFS-e na Guia MEI  
- `frontend/src/pages/GuidesMei.tsx` — implementação alvo (`mei-panel-nfse`)  
- Stories de catálogo / integração: `docs/stories/story-cat-mei-*.md`, `story-cat-mei-05-navegacao-guards-integracao-emissao-nfse.md`

---

— *PRD pronto para desdobramento em backlog e stories.*
