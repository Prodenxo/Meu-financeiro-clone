# PRD — Rebranding de naming: **Mei Infinito** (área MEI na aplicação)

**Versão:** 1.0  
**Data:** 2026-04-02  
**Tipo:** Brownfield — alteração de copy e documentação (sem mudança de rotas nem de regras de negócio MEI)  
**Fonte canónica:** [`docs/brief/brief-rebrand-meu-mei-para-mei-infinito-2026-04-02.md`](../brief/brief-rebrand-meu-mei-para-mei-infinito-2026-04-02.md)

**Relação com outros PRDs:** complementa e **não substitui** [`PRD-meu-mei-ui-ux-melhoria-2026-03-30.md`](PRD-meu-mei-ui-ux-melhoria-2026-03-30.md) (FR-UX-MEI-*): este PRD trata apenas do **nome comercial da área** e da **consistência textual**; os requisitos de layout, KPIs e fluxo permanecem regidos pelo PRD UI/UX existente. Relação com [`PRD-meu-financeiro-produto-brownfield-2026-03-26.md`](PRD-meu-financeiro-produto-brownfield-2026-03-26.md): **Meu Financeiro** continua a ser o nome da aplicação; **Mei Infinito** designa a **subárea** dedicada ao microempreendedor (guia, certificado, DAS, NFS-e, catálogo quando aplicável).

---

## 1. Resumo executivo

A área da aplicação hoje apresentada ao utilizador como **«Meu MEI»** deve passar a ser identificada de forma uniforme como **«Mei Infinito»**, alinhando marca, navegação e documentação interna, **sem** alterar URLs (`/guias-mei`, `/mei-catalogo/...`), **sem** alterar a sigla **MEI** quando se refere ao regime jurídico, e **sem** alterar identificadores técnicos de requisitos existentes (ex.: `FR-UX-MEI-*`) na **v1** — recomendação do brief (Opção A).

Este PRD fixa **requisitos de nomeação**, **âmbito**, **critérios de aceite**, **gates de qualidade** e **decisões de produto** (capitalização e fórmulas de frase) para desdobramento em story(s) e implementação.

---

## 2. Visão de produto

O utilizador MEI e os administradores que acompanham conteúdo MEI devem **reconhecer imediatamente** o destino «Mei Infinito» em sidebar, atalhos, cabeçalhos e mensagens de permissão, **sem ambiguidade** com o nome da app «Meu Financeiro» nem com a palavra «MEI» isolada como regime.

---

## 3. Problema e oportunidade

| Dimensão | Problema | Oportunidade |
|----------|----------|--------------|
| Marca | «Meu MEI» mistura possessivo genérico com a sigla do regime. | Nome próprio **Mei Infinito** reforça posicionamento e memorização. |
| Consistência | Risco de cópia mista após alterações parciais. | Um único *cutover* de strings de produto + verificação por grep. |
| Documentação | PRDs/specs/stories referem ainda o nome antigo como nome de área. | Atualização narrativa (v1) com Opção A para nomes de ficheiro. |

---

## 4. Personas e cenários

| Persona | Necessidade | Cenário de validação |
|---------|-------------|----------------------|
| MEI autónomo | Ver na navegação o mesmo nome que vê no hero da área. | Abrir `/guias-mei`: rótulo sidebar = título hero = **Mei Infinito**. |
| Utilizador sem permissão MEI | Mensagem de bloqueio clara e alinhada à marca da área. | `mei=false`: título de bloqueio reflete **Mei Infinito**, não «Meu MEI». |
| Admin | Copy em ecrãs de dados de cliente coerente com o novo naming. | `AdminUserData`: texto «… (cliente)» alinhado ao PRD (secção 6). |

**Stakeholders:** Produto (este PRD), Marketing (validação opcional de capitalização), Engenharia frontend, QA (regressão + a11y), SM (story e *file list*).

---

## 5. Escopo

### 5.1 Dentro do escopo

- **UI:** todas as strings em que **«Meu MEI»** (ou variantes listadas no brief) designa o **nome da área produto**, incluindo: `GuidesMei.tsx` (hero, «Voltar ao…»), `Sidebar.tsx`, `Layout.tsx` (atalhos), páginas de catálogo, `AdminUserData.tsx`, `accessBlockPresets.ts`, comentários de código que descrevem a feature pelo nome antigo (recomendado).
- **Testes automatizados:** asserções e `getByRole` / texto esperado atualizados para o novo nome acessível.
- **Documentação:** atualização do **texto legível** em PRDs, specs, stories e briefs satélites onde o nome comercial da área apareça; inventário inicial no brief §3.3 (ampliar com grep em implementação).

### 5.2 Fora do escopo (v1 deste PRD)

- **Rotas e paths** (`/guias-mei`, `mei-catalogo`, etc.).
- **Renomeação de ficheiros** em `docs/` (`PRD-meu-mei-*`, `ux-spec-meu-mei-*`) — **Opção B**, fase futura, com atualização de todas as referências cruzadas.
- **Renomeação de IDs** de requisitos (`FR-UX-MEI-*`, `FR-CAT-*` quando apenas citam «Meu MEI» como texto narrativo: atualizar texto; **não** renomear IDs).
- Alteração de regras fiscais, contratos de API, ou conteúdo educativo onde **MEI** é exclusivamente a sigla do regime (manter **MEI** em maiúsculas).

---

## 6. Decisões de produto (copy)

| Decisão | Valor no âmbito deste PRD |
|---------|---------------------------|
| Nome da área (marca) | **Mei Infinito** — M e I maiúsculos em «Infinito». |
| Link / botão de retorno | **«Voltar ao Mei Infinito»** (fórmula única em toda a app em PT). |
| Mensagem de área indisponível | **«Área Mei Infinito não disponível»** (paridade com bloqueio atual; preferir consistência com leitores de ecrã). |
| Admin — secção cliente | **«Mei Infinito (cliente)»** em substituição de «Meu MEI (cliente)». |

*Se Marketing vier a impor grafia alternativa (ex.: «Mei infinito»), esta secção deve ser revista numa versão 1.1 do PRD antes de *cutover*.*

---

## 7. Requisitos funcionais (naming)

| ID | Requisito | Prioridade |
|----|-----------|------------|
| FR-BRAND-01 | Nenhuma string de **produto** visível ao utilizador na área MEI (navegação, hero, retornos, bloqueios, admin) apresenta **«Meu MEI»** como nome da área; substituir por **Mei Infinito** conforme secção 6. | P0 |
| FR-BRAND-02 | O item de navegação principal para `/guias-mei` exibe o rótulo **Mei Infinito** e o **nome acessível** (quando aplicável) é coerente com o texto visível. | P0 |
| FR-BRAND-03 | Atalhos rápidos (ex.: FAB em `Layout.tsx`) usam a mesma fórmula de naming que a sidebar para o destino `/guias-mei`. | P0 |
| FR-BRAND-04 | Documentação canónica da página `/guias-mei` ([`PRD-meu-mei-ui-ux-melhoria-2026-03-30.md`](PRD-meu-mei-ui-ux-melhoria-2026-03-30.md), [`ux-spec-meu-mei-ui-2026-03-30.md`](../specs/ux-spec-meu-mei-ui-2026-03-30.md)) tem **texto narrativo** atualizado para **Mei Infinito** onde se referia o nome da área; **referências a ficheiros** podem manter nomes antigos (Opção A) com nota de rodapé ou linha em «Notas de versão» deste PRD. | P0 |
| FR-BRAND-05 | PRDs/specs/stories satélites (NFS-e, catálogo, revisão UX global) que citam «Voltar ao Meu MEI» ou nome da área são atualizados para **«Voltar ao Mei Infinito»** / **Mei Infinito** conforme contexto. | P1 |
| FR-BRAND-06 | Comentários em CSS/código que identificam a feature apenas como «Meu MEI» são atualizados para **Mei Infinito** quando descrevem o nome do produto (opcional P2 se não bloquear release). | P2 |

---

## 8. Requisitos não funcionais

| ID | Requisito | Notas |
|----|-----------|--------|
| NFR-BRAND-01 | Acessibilidade | Nomes acessíveis de links e botões alinhados ao novo texto; sem regressão de `aria-*` onde exista. |
| NFR-BRAND-02 | Rastreabilidade | Manter IDs `FR-UX-MEI-*` e nomes de ficheiro `*meu-mei*` em docs na v1; referenciar este PRD nas stories de implementação. |
| NFR-BRAND-03 | Qualidade | `npm run lint`, `npm run typecheck`, `npm test` verdes nos pacotes tocados. |
| NFR-BRAND-04 | Verificabilidade | Lista de verificação final: pesquisa no repositório por `Meu MEI` com revisão manual para excluir falsos positivos (sigla MEI, histórico intencional). |

---

## 9. Métricas de sucesso

| Objetivo | Métrica / evidência |
|----------|---------------------|
| Consistência | 0 ocorrências de **«Meu MEI»** como nome de área em UI após *cutover* (validação por grep + smoke manual). |
| Qualidade | Gates do repositório verdes; testes que asserem copy atualizados. |
| Documentação | PRD + spec principais de `/guias-mei` com narrativa **Mei Infinito**; demais docs P1 conforme FR-BRAND-05. |

---

## 10. Riscos e mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Confundir **Mei Infinito** (área) com **Meu Financeiro** (app) | Navegação ou suporte confusos | Copy em mensagens globais da app não deve substituir «Meu Financeiro» por «Mei Infinito»; escopo estrito à área MEI. |
| Falsos positivos na grep («MEI» regime) | Alteração indevida de texto legal | Revisão humana de cada match; brief §4. |
| Docs com nomes de ficheiro antigos | Confusão em links internos | Opção A: manter nomes; este PRD e stories referem caminhos existentes. |

---

## 11. Priorização

| Onda | Conteúdo | IDs |
|------|----------|-----|
| **P0** | UI + testes + PRD/spec canónicos `/guias-mei` | FR-BRAND-01–04 |
| **P1** | Docs satélites | FR-BRAND-05 |
| **P2** | Comentários de código não bloqueantes | FR-BRAND-06 |

---

## 12. Critérios de release

1. FR-BRAND-01 a FR-BRAND-04 cumpridos e demonstrados em ambiente de revisão.
2. Testes automatizados relevantes atualizados e a passar.
3. Verificação grep/documentada (evidência na story ou nota de release) para «Meu MEI» em contexto de nome de área.
4. NFR-BRAND-01 a NFR-BRAND-03 cumpridos.

---

## 13. Dependências e próximos passos

- **@sm:** opcional — story única «Rebrand Mei Infinito (P0–P1)» com *file list* e grep de verificação.
- **@dev:** implementação conforme FR-BRAND-*; não alterar rotas sem novo PRD.
- **@qa:** regressão sidebar, `/guias-mei`, catálogo, gate `mei=false`, leitor de ecrã nos links renomeados.
- **Marketing:** validação pontual da capitalização **Mei Infinito** (secção 6).

---

## 14. Referências

- [`docs/brief/brief-rebrand-meu-mei-para-mei-infinito-2026-04-02.md`](../brief/brief-rebrand-meu-mei-para-mei-infinito-2026-04-02.md) — brief de origem  
- [`docs/prd/PRD-meu-mei-ui-ux-melhoria-2026-03-30.md`](PRD-meu-mei-ui-ux-melhoria-2026-03-30.md) — UI/UX da rota `/guias-mei`  
- [`docs/specs/ux-spec-meu-mei-ui-2026-03-30.md`](../specs/ux-spec-meu-mei-ui-2026-03-30.md) — spec UX  
- `frontend/src/pages/GuidesMei.tsx`, `frontend/src/Layout/Sidebar.tsx`, `frontend/src/Layout/Layout.tsx` — pontos de entrada UI  

---

— *PRD pronto para desdobramento em backlog e stories.*
