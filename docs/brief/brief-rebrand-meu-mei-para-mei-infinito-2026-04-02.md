# Brief — Rebranding da área **Meu MEI** para **Mei Infinito**

**Data:** 2026-04-02  
**Tipo:** mudança de naming (produto / área MEI na app)  
**Solicitante:** produto  
**Elaboração:** Atlas (@analyst)

---

## 1. Resumo executivo

Substituir, de forma consistente, o nome exposto **«Meu MEI»** (e variantes de copy associadas à mesma área de produto) por **«Mei Infinito»**, mantendo o significado funcional: a zona da aplicação dedicada ao microempreendedor (guia fiscal, certificado, DAS, NFS-e, catálogo, etc.).

**Não** se pretende alterar o regime jurídico **MEI** (sigla) nem confundir com o nome da app mãe **Meu Financeiro**, salvo decisão explícita noutro brief.

---

## 2. Objetivo

| # | Objetivo |
|---|----------|
| O1 | Alinhar marca e mensagem: o utilizador identifica a área como **Mei Infinito** em toda a UI e documentação canónica. |
| O2 | Evitar cópia mista («Meu MEI» num ecrã, «Mei Infinito» noutro) após o *cutover*. |
| O3 | Preservar rotas (`/guias-mei`, `/mei-catalogo/...`) e requisitos funcionais existentes, salvo história dedicada. |

---

## 3. Âmbito

### 3.1 Dentro do âmbito (conteúdo e copy)

- **Rótulos de navegação:** item da sidebar, FAB / atalhos rápidos no `Layout`, cabeçalhos de página.
- **Microcopy:** «Voltar ao Meu MEI», «Área Meu MEI não disponível», títulos em `GuidesMei`, `AdminUserData` («Meu MEI (cliente)» quando for o nome da área vista pelo admin).
- **Comentários de código** que descrevem a feature como «Meu MEI» (opcional mas recomendado para manutenção).
- **Documentação:** PRDs, specs, stories, briefs e auditorias onde **«Meu MEI»** designa o **nome da área produto** (não a sigla MEI em contexto legal).

### 3.2 Fora do âmbito (a não mudar sem decisão explícita)

- **Sigla MEI** em texto explicativo («enquadramento MEI», «Fluxo do MEI», requisitos fiscais): manter **MEI** como abreviatura do regime.
- **URLs e segmentos de path** (`/guias-mei`, `mei-catalogo`, etc.): *out-of-scope* neste brief (mudança de URL implica redirects, SEO, bookmarks — história própria).
- **IDs técnicos** (`FR-UX-MEI-*`, `activeWorkspace`, nomes de ficheiros `*meu-mei*` em `docs/`):  
  - **Opção A (recomendada para v1):** apenas atualizar **texto legível** e referências narrativas; manter nomes de ficheiro e IDs de requisito para não invalidar rastreabilidade.  
  - **Opção B (fase 2):** renomear ficheiros `PRD-meu-mei-*` / `ux-spec-meu-mei-*` e atualizar todas as referências cruzadas — esforço maior, risco de links partidos.

### 3.3 Inventário (repo) — estado após P0 e alinhamento P1

**Frontend (referência pós-P0 — copy em Mei Infinito)**

| Ficheiro | Estado atual (nome da área / retornos) |
|----------|----------------------------------------|
| `frontend/src/pages/GuidesMei.tsx` | Hero **Mei Infinito**; **Voltar ao Mei Infinito** |
| `frontend/src/Layout/Sidebar.tsx` | `label` **Mei Infinito** |
| `frontend/src/Layout/Layout.tsx` | Atalho **Mei Infinito** |
| `frontend/src/pages/MeiCatalogoClientes.tsx`, `MeiCatalogoServicosProdutos.tsx` | **Voltar ao Mei Infinito** |
| `frontend/src/pages/AdminUserData.tsx` | **Mei Infinito (cliente)** |
| `frontend/src/lib/accessBlockPresets.ts` | **Área Mei Infinito não disponível** |
| `frontend/src/index.css` | Comentário de feature (P2 pode alinhar redação; ver story-brand P2) |
| Testes RTL / gate | Asserções alinhadas ao nome acessível **Mei Infinito** |

**Documentação**

- PRD + spec canónicos `/guias-mei` atualizados em P0 (`PRD-meu-mei-ui-ux-melhoria-*`, `ux-spec-meu-mei-ui-*`).
- **P1 (esta onda):** PRDs/specs/briefs satélites e stories — alinhar narrativa a **Mei Infinito** e **Voltar ao Mei Infinito** onde designavam o nome comercial antigo.

*Nota:* pesquisa por `Meu MEI` após P0+P1 deve tender a zero para **copy de produto** em `docs/` e `frontend/`; referências residuais em **IDs** (`FR-UX-MEI-*`), **tabelas «de → para»** em artefactos de rebrand, ou **nomes de ficheiro** `*meu-mei*` seguem Opção A até fase futura.

---

## 4. Princípios de redação

1. **Marca:** usar **Mei Infinito** com capitalização fixa (M e I maiúsculos em «Infinito» conforme identidade final — validar com marketing se for «Mei infinito»).
2. **Regime:** manter **MEI** em maiúsculas quando for a sigla oficial.
3. **Frases compostas:** exemplos  
   - Antes: «Voltar ao Meu MEI» → Depois: «Voltar ao Mei Infinito» ou «Voltar para o Mei Infinito» (escolher uma fórmula e repetir).  
   - Antes: «Área Meu MEI não disponível» → Depois: «Área Mei Infinito não disponível» ou «O Mei Infinito não está disponível» (preferir clareza para leitores de ecrã).

---

## 5. Critérios de aceite

- [ ] Todas as strings de UI listadas na secção 3.3 (e equivalentes encontrados em grep) refletem **Mei Infinito** onde antes dizia **Meu MEI** como nome da área.
- [ ] Testes automatizados atualizados; `npm run test` / suites relevantes a verde.
- [ ] Documentação canónica (pelo menos PRD + spec principais da rota `/guias-mei`) atualizada para o novo nome **ou** documentado *defer* explícito (Opção A) com lista de ficheiros não renomeados.
- [ ] Nenhuma regressão de a11y: `aria-label` / nome acessível dos links da sidebar e atalhos coerente com o novo texto.

---

## 6. Riscos e mitigação

| Risco | Mitigação |
|-------|-----------|
| Inconsistência MEI (regime) vs Mei Infinito (produto) | Revisão de copy por alguém familiarizado com linguagem fiscal. |
| Renomear ficheiros `docs` sem atualizar links | Opção A na v1; se Opção B, grep de caminhos e checklist de PR. |
| Utilizadores habituados a «Meu MEI» | Comunicação em release notes (fora deste brief técnico). |

---

## 7. Próximos passos sugeridos

1. **@pm** — validar capitalização final («Mei Infinito») e tom em mensagens de erro/bloqueio.  
2. **@sm** — opcional: story única «Rebrand Meu MEI → Mei Infinito (copy + docs v1)» com *file list* e grep de verificação.  
3. **@dev** — implementação + testes; evitar alterar rotas neste entregável.  
4. **@qa** — regressão visual rápida (sidebar, guias, catálogo, gate `mei=false`).

---

## 8. Referências no repositório

- Rota principal da área: `/guias-mei` (`GuidesMei.tsx`).
- PRD histórico da área: `docs/prd/PRD-meu-mei-ui-ux-melhoria-2026-03-30.md`.
- Spec UX: `docs/specs/ux-spec-meu-mei-ui-2026-03-30.md`.

---

**Última atualização:** 2026-04-02 — Brief inicial com inventário por grep.
