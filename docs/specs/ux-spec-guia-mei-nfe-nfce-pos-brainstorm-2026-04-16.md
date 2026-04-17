# Especificação de front-end e UX — Guia MEI: incrementos **pós-brainstorm** (capacidade, catálogo, limite, retry, pós-emissão)

**Versão:** 1.0  
**Data:** 2026-04-16  
**Autoria:** Uma (UX design expert / fluxo AIOX)  
**Requisitos de origem:** [`docs/prd/PRD-implementacao-nfe-nfce-pos-brainstorm-2026-04-16.md`](../prd/PRD-implementacao-nfe-nfce-pos-brainstorm-2026-04-16.md) (**FR-GUIA-FISC-11** a **17**, **NFR-POST-01** a **03**)  
**Baseline de UX (não substituído):** [`docs/specs/ux-spec-guia-mei-emissao-nfe-nfce-2026-04-06.md`](ux-spec-guia-mei-emissao-nfe-nfce-2026-04-06.md) — seletor, formulários NFS-e / NF-e / NFC-e, lista, erros, callout D1 (**FR-GUIA-FISC-01** a **10**).

**Mensagens de erro (paridade):** [`docs/specs/ux-spec-mensagens-erro-usuario-final-2026-04-07.md`](ux-spec-mensagens-erro-usuario-final-2026-04-07.md) quando aplicável.

**Princípio:** copy em português do Brasil para o utilizador; `documentType` técnico **NFSE** / **NFE** / **NFCE** alinhado ao backend.

---

## 1. Objetivo deste documento

Contrato de **experiência, hierarquia, comportamento, copy e acessibilidade** para os incrementos **após** o baseline de 2026-04-06:

| Área | FR principal |
|------|----------------|
| Sincronização do estado de **capacidade fiscal** após cadastro | **FR-GUIA-FISC-11** |
| **Catálogo de produtos** → linhas de NF-e / NFC-e | **FR-GUIA-FISC-12** |
| **Submissão / retry** sem duplo envio opaco | **FR-GUIA-FISC-13** |
| **Fluxo guiado D2** (se PO aprovar) | **FR-GUIA-FISC-14** |
| **Pós-emissão** (ondas) | **FR-GUIA-FISC-15** |
| **Feature flag D3** (visibilidade de tipos) | **FR-GUIA-FISC-16** |
| **Limite MEI** — exclusão explícita de NF-e / NFC-e | **FR-GUIA-FISC-17** |
| Telemetria **sem PII** no cliente | **NFR-POST-01** a **03** |

Serve para critérios de aceite, *file list* e QA; **não** substitui contrato de payload com **@architect** nem stories em `docs/stories/`.

---

## 2. Relação com a spec baseline

| Tópico | Onde está definido |
|--------|---------------------|
| Seletor de tipo, troca de tipo com *dirty*, formulário NF-e/NFC-e, lista e filtros, callout D1 estático | [`ux-spec-guia-mei-emissao-nfe-nfce-2026-04-06.md`](ux-spec-guia-mei-emissao-nfe-nfce-2026-04-06.md) |
| **Actualização** do callout após guardar empresa / refresh de capacidade | **§3** deste documento (**FR-GUIA-FISC-11**) |
| Padrão visual global (shell, botões, badges) | [`ux-spec-meu-mei-ui-2026-03-30.md`](ux-spec-meu-mei-ui-2026-03-30.md) |

---

## 3. Capacidade fiscal sincronizada (**FR-GUIA-FISC-11**)

### 3.1 Problema de utilizador

Após **guardar** dados de empresa ou concluir um passo de cadastro fiscal, o utilizador vê um *callout* desactualizado (ex.: ainda “não disponível”) até recarregar a página manualmente.

### 3.2 Comportamento especificado

| Evento | Comportamento UX |
|--------|-------------------|
| Utilizador completa acção que altera cadastro Plugnotas / empresa (ex.: guardar formulário de empresa, upload certificado quando a story ligar refetch) | Disparar **revalidação** dos dados de capacidade usados pelo `MeiFiscalCapabilityCallout` (ou equivalente): *loading* discreto no próprio callout ou *spinner* inline **sem** bloquear a página inteira, salvo primeira carga. |
| Durante refetch | Callout mostra estado **"A actualizar…"** com `aria-busy="true"` no contentor ou texto temporário acessível. |
| Sucesso — modalidade agora disponível | Transição do callout de **aviso** para **sucesso** ou **remoção** do bloqueio; **focar** o primeiro campo editável do formulário NF-e/NFC-e se o bloqueio era total (**paridade** com baseline §9.3). |
| Sucesso — ainda indisponível | Manter copy de bloqueio; **não** mostrar toast de sucesso genérico que contradiga o callout. |
| Erro de rede ao refetch | Mensagem **no** callout ou *inline* abaixo: *"Não foi possível confirmar a configuração. Tente de novo."* + botão **"Tentar de novo"** (acção idempotente de leitura). |

### 3.3 Acessibilidade

- Anunciar mudança de estado do callout com `aria-live="polite"` **apenas** quando o resultado final mudar (disponível ↔ indisponível), evitando *spam* a cada *poll*.
- Manter hierarquia: callout continua **acima** do formulário contextual (baseline §3.2).

### 3.4 Copy

- *Loading:* *"A verificar se a emissão de [NF-e|NFC-e] está disponível…"*  
- *Retry:* *"Não foi possível confirmar a configuração no emissor fiscal integrado."*

---

## 4. Catálogo de produtos → linhas NF-e / NFC-e (**FR-GUIA-FISC-12**)

### 4.1 Pré-condição

Catálogo de produtos MEI já acessível (ex.: modal ou página alinhada a `MeiCatalogoProdutoModal` / listagens existentes). **NFS-e** não regredir: fluxos de serviço continuam a usar apenas dados relevantes a NFS-e.

### 4.2 Ponto de entrada na secção **Itens**

Por linha (ou na primeira linha com *pattern* “adicionar do catálogo”):

| Elemento | Comportamento |
|----------|----------------|
| Botão secundário **"Adicionar do catálogo"** ou ícone + texto | Abre selector de produto (modal *drawer* ou modal centrado — reutilizar padrão do catálogo actual). |
| Após selecção | Pré-preenche **código**, **descrição**, **NCM**, **CFOP** (e unidade se existir no catálogo), **sem** apagar tributos se a story definir defaults seguros; campos permanecem **editáveis**. |
| Conflito NFS-e vs NFE | Se o item de catálogo for só para NFS-e na BD, **não** listar ou mostrar *tooltip*: *"Este item não tem dados para nota de produto."* — critério técnico na story. |

### 4.3 *Empty state*

Se o catálogo estiver vazio: botão **"Adicionar do catálogo"** desactivado com *hint*: *"Cadastre produtos no catálogo MEI primeiro."* + link **"Ir ao catálogo"** se a navegação existir.

### 4.4 Acessibilidade

- Modal de catálogo com foco preso, `aria-modal="true"`, *return focus* ao botão de abertura ao fechar.
- Ao inserir linha, anunciar *live region*: *"Item do catálogo adicionado. Revise NCM e tributos."*

---

## 5. Submissão, *idIntegração* e retry (**FR-GUIA-FISC-13**)

### 5.1 Princípio para o utilizador

O utilizador **não** vê `idIntegração`; vê **um envio = uma tentativa**, com *feedback* claro e **sem** duplicar notas por duplo clique.

### 5.2 Comportamento

| Situação | UX |
|----------|-----|
| Clique em **Emitir** | Botão passa a estado **loading** com texto *"A emitir…"*; **desactivar** o botão e o seletor de tipo até resposta ou erro recuperável. |
| Erro **transitório** (definido na story com backend) | Mostrar mensagem na pilha de feedback + botão **"Tentar novamente"** que repete **uma** tentativa com o **mesmo** preenchimento (o servidor gera novo `idIntegração` — invisível). |
| Erro **definitivo** | Sem retry automático; copy clara; não mostrar *"Tentar novamente"* se a story marcar como não-retryable. |
| Duplo clique / tecla Enter repetida | Botão desactivado durante *pending* impede segundo *submit*. |

### 5.3 Copy sugerida

- *Loading:* *"A enviar para o emissor fiscal integrado…"*  
- *Retry disponível:* *"A ligação falhou momentaneamente. Pode tentar novamente sem alterar os dados."*

---

## 6. Fluxo guiado **D2** — habilitação no emissor (**FR-GUIA-FISC-14**, opcional)

### 6.1 Gatilho

Utilizador com **NF-e** ou **NFC-e** seleccionados e sistema a indicar indisponibilidade **e** PO a aprovar incremento D2: CTA **"Configurar emissão de [NF-e|NFC-e]"** no callout (além de **"Rever configuração"**).

### 6.2 Estrutura recomendada (*wizard* ou painel passo-a-passo)

1. **Introdução** — o que será configurado; estimativa de tempo (*"cerca de X minutos"* se conhecido).  
2. **Checklist** — itens obrigatórios (certificado, dados cadastrais, CSC/token NFC-e se aplicável) com *checkbox* **informativos** ou estado real se API expuser.  
3. **Confirmação** — botão **"Solicitar activação"** ou **"Guardar e activar"** conforme backend.  
4. **Resultado** — sucesso: *"Configuração enviada. A verificar…"* seguido de **§3** (refetch capacidade). Insucesso: mensagem humana + próximo passo (suporte, corrigir campo X).

### 6.3 Acessibilidade

- Títulos de passo em `h2`/`h3` coerentes; foco no título ao mudar de passo.
- Erros por campo com `aria-describedby`.

---

## 7. Pós-emissão — ondas (**FR-GUIA-FISC-15**)

### 7.1 Princípio

Funcionalidades entregues em **ondas**; a spec baseline já cobre **lista + filtro**. Este incremento adiciona **acções por linha** quando a story as incluir.

### 7.2 Onda mínima sugerida (exemplo)

| Acção | Superfície | Notas |
|-------|------------|--------|
| Ver **estado** (autorizada / rejeitada / processamento) | Coluna **Status** com *badge* + *tooltip* com data/hora se disponível | Cores consistentes com lista actual. |
| **Actualizar** status | Ícone *refresh* na linha ou botão na *toolbar* da lista | Após clique, *skeleton* na linha ou *spinner* inline. |

### 7.3 Ondas posteriores (quando existirem APIs)

| Acção | UX |
|-------|-----|
| Download **PDF** / **XML** | Ícones com `aria-label` explícito; *dropdown* **"Transferir"** se múltiplos formatos. |
| **Cancelar** nota | Fluxo de confirmação modal (*destructive*); texto lembrando irreversibilidade conforme regra fiscal apresentada pelo produto. |

### 7.4 Estados

- **Em processamento:** *badge* neutro + texto *"Em processamento"*; desactivar acções que exijam nota autorizada.  
- **Falha:** linha com realce suave + link **"Detalhes"** abrindo painel com mensagem Plugnotas já formatada (baseline §8).

---

## 8. Feature flag **D3** (**FR-GUIA-FISC-16**)

### 8.1 Quando desligada (defeito PRD)

- Opções **NF-e** e **NFC-e** **não** aparecem no seletor; utilizador vê apenas fluxo **NFS-e** (ou o mínimo acordado).  
- **Sem** espaços vazios ou *placeholders* que sugiram funcionalidade oculta.

### 8.2 Quando ligada

- Comportamento idêntico ao baseline §4 (três segmentos).  
- Se o *flag* for por utilizador, falha *graceful*: mensagem genérica se o utilizador aceder a URL profunda obsoleta (se aplicável).

---

## 9. Limite de faturamento MEI (**FR-GUIA-FISC-17**)

### 9.1 Regra de produto (UI)

**NF-e** e **NFC-e** **não** entram no **valor acumulado** nem no **gráfico** de limite MEI até decisão futura.

### 9.2 Superfícies a rever

| Superfície | Comportamento |
|------------|----------------|
| **Card / barra de progresso** de limite | Incluir *footnote* ou *tooltip* no ícone de informação: *"O limite anual do MEI considera apenas as receitas indicadas pela regra actual. Notas NF-e e NFC-e não são somadas aqui."* — ajustar *wording* legal com PO. |
| **Lista de notas** | Não mostrar valor de NF-e/NFC-e dentro do *widget* de limite; valores podem continuar na tabela de notas. |
| **Relatórios** (se existirem no mesmo ecrã) | Mesma exclusão; evitar dupla contagem na *copy*. |

### 9.3 Acessibilidade

- O *tooltip* deve ter equivalente para teclado (botão **"Como calculamos"** abrindo *popover* focável).

---

## 10. Observabilidade e privacidade no cliente (**NFR-POST-01** a **03**)

| NFR | Implicação UX / front-end |
|-----|---------------------------|
| **NFR-POST-01** | Se existirem eventos analíticos no cliente (ex.: *emit_submitted*), enviar apenas **tipo de documento** agregado e resultado (*success*/*error*), **sem** CPF/CNPJ, número de nota ou payload. |
| **NFR-POST-02** | Não registar *console.log* de payload em produção; *devtools* apenas em modo debug explícito. |
| **NFR-POST-03** | Sem requisito visual adicional; segue gates do `AGENTS.md`. |

---

## 11. Mapeamento FR → superfície UI (incrementos)

| ID | Superfície |
|----|------------|
| **FR-GUIA-FISC-11** | Estados *loading* / *retry* / *success* no callout de capacidade; refetch após cadastro. |
| **FR-GUIA-FISC-12** | Botão **Adicionar do catálogo** na secção Itens; modal de produto; mensagens de conflito de tipo. |
| **FR-GUIA-FISC-13** | Botão Emitir *loading* + *disabled*; mensagem de retry transitório; sem segundo *submit*. |
| **FR-GUIA-FISC-14** | *Wizard* ou painel multi-passo a partir do CTA no callout. |
| **FR-GUIA-FISC-15** | Coluna estado; *refresh*; *downloads*; cancelamento modal. |
| **FR-GUIA-FISC-16** | Seletor com 1 vs 3 opções conforme *flag*. |
| **FR-GUIA-FISC-17** | *Footnote* / *tooltip* no bloco de limite MEI; exclusão de NFE/NFCE do agregado mostrado. |

---

## 12. Critérios de aceite UX (checklist QA — incrementos)

- [ ] Após guardar empresa (ou fluxo equivalente), o callout de capacidade **actualiza** sem F5, ou mostra erro de leitura com **Tentar de novo** (**§3**).  
- [ ] Adicionar item do catálogo **preenche** campos editáveis e **não** mistura dados de NFS-e indevidos (**§4**).  
- [ ] **Emitir** não permite duplo envio acidental; retry transitório é **compreensível** (**§5**).  
- [ ] Limite MEI **não** inclui NFE/NFCE no número principal; *footnote* explica (**§9**).  
- [ ] Se D2 existir, *wizard* completa com feedback de sucesso/insucesso (**§6**).  
- [ ] Se D3 desligado, **não** há segmentos NF-e/NFC-e visíveis (**§8**).  
- [ ] Eventos de analytics (se houver) **sem** PII (**§10**).

---

## 13. Wireframe textual — refetch de capacidade (suplemento)

```
[ Callout âmbar — NF-e indisponível ]
"Emissão de NF-e não disponível…"
[ Rever configuração ]

  → (utilizador guarda empresa noutro bloco)

[ Callout — linha de estado ]
"A verificar se a emissão de NF-e está disponível…"   ← loading

  → (sucesso)

[ Callout verde ou desaparece ]
"Emissão de NF-e disponível."   ← opcional, breve

▼ Emitente   (campos activados)
```

---

## 14. Change log

| Versão | Data | Notas |
|--------|------|--------|
| 1.0 | 2026-04-16 | Versão inicial a partir do PRD **PRD-implementacao-nfe-nfce-pos-brainstorm-2026-04-16.md**; complementa **ux-spec-guia-mei-emissao-nfe-nfce-2026-04-06.md**. |

---

*Próximo passo AIOX:* stories em `docs/stories/` com referência a **FR-GUIA-FISC-11+** e a esta spec; **@architect** para contratos de refetch, catálogo e retry; **@dev** com *file list* e gates do `AGENTS.md`.

— Uma, UX AIOX
