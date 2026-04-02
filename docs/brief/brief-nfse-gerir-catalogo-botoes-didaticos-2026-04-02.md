# Brief: ações **Gerir clientes** e **Gerir serviços e produtos** — mais didáticas e visíveis (workspace NFS-e)

**Data:** 2026-04-02  
**Origem:** pedido de produto / UX (persona Atlas — analista)  
**Produto:** Meu Financeiro — Guia MEI (`/guias-mei`, workspace **NFS-e**, secção **“Antes de emitir”**)  
**Implementação de referência:** `frontend/src/pages/GuidesMei.tsx` (links com classe `catalogoClientesLinkClass`; blocos repetidos para router vs `<a>`)

**Documentos relacionados (não substituídos por este brief):**

- `docs/prd/PRD-mei-nfse-workspace-ui-ux-melhoria-2026-04-01.md` — zona pré-formulário, **FR-NFSE-UX-07** (orientação dinâmica), **NFR-NFSE-04** (tokens existentes).  
- `docs/brief/brief-mei-nfse-ui-ux-melhoria-2026-04-01.md` — consolidação de atalhos + links de gestão.  
- `docs/specs/ux-spec-mei-nfse-workspace-2026-04-01.md` — wireframe da área de atalhos e copy por estado.  
- `docs/stories/story-cat-mei-05-navegacao-guards-integracao-emissao-nfse.md` — links contextuais §3.3 (hoje “discretos”).  
- `docs/specs/ux-spec-catalogo-mei-clientes-produtos-2026-03-30.md` — rotas `/mei-catalogo/clientes` e `/mei-catalogo/servicos-produtos`.

---

## 1. Resumo executivo

Na emissão de NFS-e, os atalhos **“Cliente salvo”** e **“Serviço salvo”** são controlos grandes e claros; logo abaixo, **“Gerir clientes”** e **“Gerir serviços e produtos”** aparecem como **hiperligações pequenas** (texto azul sublinhado, separadas por um ponto médio), com **pouco peso visual** face aos selects e ao botão **“Salvar dados do emitente”**. Utilizadores novos **não percebem de imediato** que aí é que se **cadastram** clientes e serviços para os atalhos — ou confundem com “opcional”.

Este brief pede uma evolução **localizada**: tornar essas duas entradas **mais visíveis**, **mais didáticas** (o *porquê* e o *para quê*) e **coerentes** com o resto dos controlos da zona, **sem** alterar rotas, guards nem contratos de API.

---

## 2. Problema / oportunidade

| Dimensão | Situação atual | Oportunidade |
|----------|----------------|--------------|
| **Salience (destaque)** | Links em `text-xs`, estilo link padrão (`font-medium text-blue-600 underline` …), abaixo dos selects. | Tratar como **ações secundárias mas reconhecíveis** (botão outline, `Button` variant ghost/outline, ou “chip” com ícone), alinhadas à hierarquia do PRD (atalhos → gestão). |
| **Didática** | Rótulos só verbos (“Gerir …”) — não explicam relação com os selects acima. | Microcopy curta opcional (linha de apoio ou `aria-describedby`) do tipo: *“Cadastre ou edite itens para aparecerem nos atalhos.”* |
| **Consistência** | “Salvar dados do emitente” parece ação primária; os links parecem rodapé de página. | Mesma “família” de controlos que outros CTAs secundários da área (`planner-*` / `admin-*`), sem competir com **Emitir**. |
| **Acessibilidade** | Links são focáveis; falta **nome acessível** que ligue ação ↔ atalhos se a UI mudar para botões. | Manter destinos; garantir `aria-label` ou texto visível suficiente em botões com ícone só. |

---

## 3. Estado atual (brownfield)

| Aspeto | Detalhe |
|--------|---------|
| **Localização** | Imediatamente abaixo da grelha dos selects “Cliente salvo (atalho)” e “Serviço salvo (atalho)”, dentro do bloco “Antes de emitir”. |
| **Markup** | `<p>` com `flex flex-wrap`, dois `Link` ou `<a>` (consoante `inRouter`), separador `·` decorativo (`aria-hidden`). |
| **Estilo** | Constante `catalogoClientesLinkClass` em `GuidesMei.tsx` — hiperligação azul sublinhada (tema claro/escuro). |
| **Duplicação** | O mesmo padrão repete-se em **vários** blocos do ficheiro (hero/contexto e painel NFS-e); qualquer mudança deverá **centralizar** estilo e copy num único sítio (componente ou constantes partilhadas) para evitar drift. |
| **Rotas** | `/mei-catalogo/clientes`, `/mei-catalogo/servicos-produtos` — **inalteradas** neste brief. |

---

## 4. Objetivos

1. **Visibilidade:** os utilizadores identificam **sem esforço** onde gerir o catálogo **a partir da emissão**, em desktop e mobile (área de toque adequada, contraste, não “sumir” no fundo do cartão).  
2. **Didática:** ficar explícito que **cadastrar/editar** clientes e serviços **alimenta os atalhos** (e opcionalmente que também é possível preencher manualmente o formulário — só se couber numa linha e não duplicar o cabeçalho dinâmico **FR-NFSE-UX-07**).  
3. **Consistência:** reutilizar **tokens/classes** já previstos (`planner-*`, `admin-*`, variantes de botão existentes no projeto), sem novo tema global (**NFR-NFSE-04**).  
4. **Não regressão:** manter **paridade** com `Link` vs `<a>` fora do router; teclado e leitores de ecrã **operacionais**.

---

## 5. Proposta de experiência (recomendação)

### 5.1 Padrão visual (preferência única para implementação)

- Substituir o par de hiperligações em linha por **dois controlos do tipo botão secundário** (ex.: `variant="outline"` ou equivalente do design system em uso), **empilhados em mobile** (`flex-col gap-2`) e **lado a lado em desktop** quando a largura permitir (`sm:flex-row`), com **ícone** leve à esquerda (ex.: utilizadores / pacote ou “lista” — alinhar ao pacote de ícones já usado na app).  
- **Texto principal** (linha 1): manter ou ligeiramente encurtar — *“Gerir clientes”* e *“Gerir serviços e produtos”* (ou *“Serviços e produtos”* se o layout apertar).  
- **Subtítulo opcional** (linha 2, `text-xs` neutro): *“Atualiza os atalhos acima.”* ou *“Cadastro usado nos atalhos.”* — **uma** frase partilhada entre os dois botões **ou** uma única linha de apoio **acima** do grupo de botões (evita repetir duas vezes).

### 5.2 Alternativa mais leve (se PO preferir menor mudança visual)

- Manter hiperligações mas **aumentar tamanho de texto** (`text-sm`), **remover sublinhado** por defeito (só no hover), **padding** clicável tipo `inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 border border-slate-300/…` — “chip” clicável. Menos didático que botão + linha de apoio, mas melhor que o estado atual.

### 5.3 Copy dinâmica (opcional, alinhada a FR-NFSE-UX-07)

- Quando **catálogo vazio** (já previsto no PRD no cabeçalho): reforçar no **grupo** de ações ou na linha de apoio: *“Sem atalhos ainda — cadastre clientes e serviços.”*  
- Evitar **três** mensagens redundantes (cabeçalho + banner + linha local); preferir **uma** fonte canónica no cabeçalho e **uma** linha curta junto aos botões.

---

## 6. Requisitos de aceite (sugeridos para story)

| ID | Critério |
|----|----------|
| **AC-GCAT-01** | Na zona NFS-e “Antes de emitir”, as entradas para `/mei-catalogo/clientes` e `/mei-catalogo/servicos-produtos` têm **área clicável** e **peso visual** claramente superiores ao estado atual (hiperligação `text-xs` isolada). |
| **AC-GCAT-02** | Existe **texto de apoio didático** (subtítulo, `aria-describedby`, ou tooltip no primeiro foco — a definir em UX) que liga **gestão do catálogo** ↔ **atalhos**. |
| **AC-GCAT-03** | **Contraste** e **foco visível** em foco por teclado cumprem o objetivo WCAG do projeto para controlos novos ou alterados (**NFR-NFSE-01**). |
| **AC-GCAT-04** | Comportamento **idêntico** em SPA (`Link`) e fora do router (`<a href>`), sem quebra de navegação. |
| **AC-GCAT-05** | Estilos centralizados (um componente ou constantes partilhadas) para **todos** os sítios em `GuidesMei.tsx` que hoje usam `catalogoClientesLinkClass` para estas duas rotas — **evitar** cópias divergentes. |

---

## 7. Métricas / validação (leves)

- **Qualitativo:** primeira impressão em teste rápido — “Onde adiciono um cliente para o atalho?” — **≤ 15 s** com scroll mínimo na secção “Antes de emitir”.  
- **Suporte:** menos pedidos de suporte do tipo “não encontrei onde cadastrar cliente na nota” (se houver canal de feedback).

---

## 8. Riscos e mitigações

| Risco | Mitigação |
|-------|-----------|
| Botões “pesados” demais competem com **Emitir** | Manter **secundário** (outline/ghost); posicionar só na zona de catálogo, não junto ao botão de emissão. |
| Texto didático longo empurra o formulário | Uma linha; cabeçalho dinâmico leva a parte da mensagem (**FR-NFSE-UX-07**). |
| Regressão em múltiplos blocos duplicados | Refactor mínimo: extrair **`<CatalogoMeiLinks />`** (nome ilustrativo) com props `inRouter`. |

---

## 9. Próximos passos

| Responsável | Ação |
|-------------|------|
| **PO / UX** | Escolher entre **5.1** (botões + apoio) e **5.2** (chips); fechar ícones e texto exato da linha didática. |
| **@sm** | Story em `docs/stories/` com **AC-GCAT-*** e *file list* (`GuidesMei.tsx` + componente novo se aplicável). |
| **@dev** | Implementação + `npm run lint`, `npm run typecheck`, `npm test` nos pacotes tocados. |
| **@qa** | Regressão: rotas catálogo, guards CAT-MEI-05, teclado e viewport mobile. |

---

## 10. Referências rápidas de código

- Classe atual dos links: `catalogoClientesLinkClass` em `frontend/src/pages/GuidesMei.tsx` (aprox. linhas 500–501).  
- Exemplo de bloco na área NFS-e: aprox. linhas 2771–2797 (parágrafo com `Link` / `<a>` e separador `·`).

---

— *Brief pronto para decisão de UX/PO e desdobramento em story; não substitui PRD nem altera escopo fiscal.*
