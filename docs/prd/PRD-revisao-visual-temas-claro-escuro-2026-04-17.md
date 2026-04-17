# PRD — Revisão visual: temas claro e escuro (ícones e divisórias)

**Versão:** 1.0  
**Data:** 2026-04-17  
**Tipo:** Brownfield — melhoria contínua de IU (tokens CSS, shell, superfícies partilhadas; extensão a páginas e modais)  
**Fontes:** `docs/brief/brief-revisao-visual-temas-claro-escuro-2026-04-17.md`

**Relação com outros documentos**

- **`docs/prd/PRD-revisao-iu-ux-global-intuitividade-2026-04-01.md`** — programa transversal de auditoria e remediação IU/UX. O presente PRD é **complementar**: foca **legibilidade visual, contraste e consistência de bordas/ícones** nos temas claro e escuro, sem substituir requisitos de copy, navegação ou fluxos desse PRD.
- **`docs/brief/brief-revisao-iu-ux-intuitividade-site.md`** — brief de intuitividade; este trabalho cobre a frente **visual/tema** referida no backlog do brief de 2026-04-17.
- **`docs/prd/PRD-meu-mei-ui-ux-melhoria-2026-03-30.md`** — escopo da rota `/guias-mei`. Alterações em `GuidesMei.tsx` para bordas/modais devem **respeitar** regras já canónicas dessa área quando sobrepostas.

---

## 1. Resumo executivo

Utilizadores do Meu Financeiro utilizam a aplicação em **tema claro e escuro**; relatos e revisão técnica identificaram **ícones pouco visíveis** (especialmente navegação móvel e botões de ícone) e **divisórias fracas** (bordas com baixa opacidade sobre fundos semelhantes), degradando **legibilidade e percepção de hierarquia** sem alterar regras de negócio.

Uma **primeira onda** já reforçou tokens em `frontend/src/index.css` e o **shell** (`Header`, `Sidebar`, `BottomNavigation`). Este PRD formaliza **objetivos**, **requisitos**, **critérios de aceite**, **métricas** e **backlog** para concluir a consistência no restante frontend (páginas longas, modais) e para **validação de regressão visual e acessibilidade**.

---

## 2. Visão de produto (experiência visual)

Em qualquer tema, o utilizador deve **distinguir claramente** superfícies, separadores e ícones interativos **sem esforço visual excessivo**; bordas e estados inativos não devem “desaparecer” no fundo. O trabalho permanece no **design system leve** do repositório (Tailwind + classes em `index.css`), evitando one-off desnecessários quando um padrão reutilizável for possível.

**Princípio:** *contraste perceptível e consistente* — preferir tokens e classes partilhadas a duplicar tons ad hoc em cada página.

---

## 3. Problema e oportunidade

| Dimensão | Problema | Oportunidade |
|----------|----------|--------------|
| **Contraste de ícones** | `currentColor` em Lucide segue texto fraco (`text-slate-400`, etc.) | Padronizar tons para estados default/hover em shell, admin e modais |
| **Divisórias** | Bordas com `/70` ou `slate-800` semelhantes ao fundo escuro | Tokens e utilitários estáveis (`slate-200` / `slate-600`–`700` conforme contexto) |
| **Fragmentação** | Páginas muito grandes (ex.: `GuidesMei.tsx`) com classes inline variadas | Varredura incremental alinhada ao brief; opcional extrair utilitário comum |
| **Confiança / acessibilidade** | Risco de não conformidade com critérios de contraste em componentes tocáveis | Verificação pontual com ferramenta de contraste nos fluxos prioritários |

---

## 4. Personas e fluxos prioritários para validação

### 4.1 Personas (herdadas do contexto global)

| Persona | Implicação para este PRD |
|---------|---------------------------|
| Mobile-first | Barra inferior e alvos tocáveis com ícones sempre legíveis no escuro |
| Utilizador MEI | Fluxos longos em Guias MEI: divisórias e cabeçalhos de secção perceptíveis |
| Administrador | Tabelas e toolbars admin: linhas e contornos estáveis nos dois temas |

### 4.2 Fluxos prioritários para checklist de regressão visual (tema claro ↔ escuro)

1. **Shell:** header, sidebar (desktop), bottom nav (mobile), alternância de tema se existir em Settings.  
2. **Núcleo:** Dashboard, Transações, Definições (ou rota equivalente de tema/conta).  
3. **MEI:** `/guias-mei` (scroll em secções representativas), pelo menos um modal de catálogo se aplicável.  

---

## 5. Escopo

### 5.1 Dentro do escopo

- Manter e **estender** a consistência de **bordas e cores de ícone** alinhada ao brief e às alterações já feitas em `index.css` e shell.
- **Varredura controlada** em TSX de alta superfície (prioridade: `GuidesMei.tsx`, modais de catálogo, padrões `border-slate-*/*` e fechos de modal).
- **Regressão visual manual** documentada (checklist do brief, secção 6 deste PRD).
- Verificação **pontual** de contraste (WCAG 2.2) nos componentes alterados ou novamente auditados, com registo passou/falhou.

### 5.2 Fora do escopo

- Novo design system completo ou mudança de marca/paleta primária.  
- Refatoração funcional de fluxos MEI/NFS-e além do necessário para aplicar classes visuais.  
- Testes E2E automatizados de screenshot (opcional futuro; não exigido neste PRD).

---

## 6. Fases e estado

| Fase | Conteúdo | Estado |
|------|-----------|--------|
| **Onda 0** | Tokens `--color-surface-border`; classes `.planner-*`, admin; `.admin-icon-button`; `Header`, `Sidebar`, `BottomNavigation` | **Entregue** (ver brief secção 4) |
| **Onda 1** | Modais (fechos), páginas com muitas bordas ad hoc; documentação cruzada opcional com brief de intuitividade | **Planeada** (backlog) |

---

## 7. Requisitos funcionais

| ID | Requisito | Prioridade |
|----|-----------|------------|
| FR-VIS-THEME-01 | Completar alinhamento de **bordas** em componentes/páginas identificados no backlog do brief (mínimo: padrão documentado para `GuidesMei.tsx` ou substituição por classe reutilizável equivalente à intenção do token). | P1 |
| FR-VIS-THEME-02 | Garantir **ícones de fecho/ação secundária** em modais com contraste adequado em tema claro e escuro (sem `text-slate-400` como único estado em fundos escuros quando o contraste for insuficiente). | P1 |
| FR-VIS-THEME-03 | Executar **checklist de regressão visual** (secção 4.2) nos dois temas e registar resultado em evidência de QA ou comentário de release. | P0 |
| FR-VIS-THEME-04 | Manter **paridade visual** entre superfícies que usam as mesmas classes base (`.planner-card`, `.admin-table-shell`, etc.) após edições locais — sem regressão intencional de “cartão invisível”. | P0 |

---

## 8. Requisitos não funcionais

| ID | Requisito | Prioridade |
|----|-----------|------------|
| NFR-VIS-THEME-01 | Onde alterado o contraste de texto/ícone em componentes interativos, **verificar** relação de contraste (ferramenta) nos pares **fundo + primeiro plano** representativos; corrigir se falhar **AA** para texto normal em tamanhos típicos de UI. | P0 |
| NFR-VIS-THEME-02 | **Não** degradar legibilidade no tema claro ao reforçar bordas (evitar “peso” excessivo; ajuste fino permitido). | P0 |
| NFR-VIS-THEME-03 | Alterações **localizadas**; evitar diff massivo não relacionado em ficheiros partilhados. | P1 |

---

## 9. Métricas de sucesso

| Métrica | Alvo | Notas |
|---------|------|--------|
| Checklist QA do brief (secção 6) | **100%** itens verificados antes de considerar a Onda 1 concluída | Evidência em QA ou notas de versão |
| Itens backlog brief (modais + varredura TSX) | **≥ 1** entrega por item ou decisão explícita “won’t do” com justificativa | PO/eng. |
| Regressões visuais reportadas pós-release | **0** críticas (bloqueio de leitura) nos fluxos 4.2 | Triagem em suporte ou QA |

---

## 10. Critérios de aceite globais (release da Onda 1)

- [ ] Navegação inferior: ícones inativos distinguem-se do fundo no **tema escuro** (mantido após quaisquer alterações adicionais).  
- [ ] Sidebar: borda direita visível e equilibrada no **tema claro**.  
- [ ] Cartões e tabelas que usam classes admin/planner: contornos e linhas **perceptíveis** nos dois temas.  
- [ ] Modais auditados: controles de fechar/ação não dependem só de cinza demasiado claro no escuro.  
- [ ] Documentação: este PRD e o brief permanecem **referenciados** como fonte; stories em `docs/stories/` ligam a estes artefatos.

---

## 11. Riscos e dependências

| Risco | Mitigação |
|-------|-----------|
| Diff grande em `GuidesMei.tsx` | Quebrar em PRs por secção ou por padrão de classe |
| Subjetividade “borda pesada” no claro | Revisão de produto/UX em screenshot ou ambiente de pré-visualização |
| Sobreposição com PRD Mei Infinito | Coordenação: alterações só visuais; regras funcionais permanecem no PRD MEI |

---

## 12. Epics e delegação (Gate 1)

| Epic sugerido | Descrição | Dono sugerido |
|---------------|-----------|----------------|
| **E-VIS-THEME-1** | Extensão de tokens/classes a modais e fechos (catálogo MEI + padrão reutilizável) | Frontend |
| **E-VIS-THEME-2** | Varredura `GuidesMei.tsx` / páginas longas — alinhamento de bordas ao padrão do brief | Frontend |
| **E-VIS-THEME-3** | QA: checklist de regressão visual + registo de contraste (amostragem) | QA + Frontend |

**Delegação:** o **PM** mantém este PRD; a criação de **user stories** com critérios de aceite testáveis fica a cargo do **@sm** (Scrum Master), com base nas secções 7–10.

---

## 13. Histórico de documento

| Versão | Data | Autor | Notas |
|--------|------|-------|-------|
| 1.0 | 2026-04-17 | Morgan (PM) | Versão inicial a partir do project brief |

---

## 14. Referências

- `docs/brief/brief-revisao-visual-temas-claro-escuro-2026-04-17.md`
- `docs/brief/brief-revisao-iu-ux-intuitividade-site.md`
- `docs/ux-audit/matriz-problemas-iu-ux-global-2026-04-01.md`
- `docs/prd/PRD-revisao-iu-ux-global-intuitividade-2026-04-01.md`
