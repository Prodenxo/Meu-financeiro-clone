# Especificação de front-end e UX — **Atualização posterior** de documentos ativos (Plugnotas + Supabase)

**Versão:** 1.0  
**Data:** 2026-04-07  
**Autoria:** Uma (UX design expert / fluxo AIOX)  
**Requisitos de origem:** [`docs/prd/PRD-atualizacao-posterior-documentos-ativos-plugnotas-supabase-2026-04-07.md`](../prd/PRD-atualizacao-posterior-documentos-ativos-plugnotas-supabase-2026-04-07.md) (**FR-UPD-DOC-***, **NFR-UPD-DOC-***, **CR-UPD-DOC-***)  
**Brief de apoio:** [`docs/brief/brief-atualizacao-posterior-documentos-ativos-plugnotas-supabase-2026-04-07.md`](../brief/brief-atualizacao-posterior-documentos-ativos-plugnotas-supabase-2026-04-07.md)

**Relação com specs e código de referência:**

- **Secção “Documentos ativos” (cadastro inicial):** [`docs/specs/ux-spec-cadastro-empresa-documentos-ativos-plugnotas-2026-04-07.md`](ux-spec-cadastro-empresa-documentos-ativos-plugnotas-2026-04-07.md) — checkboxes, `fieldset`, validação mínima, desmarcar NFS-e. **Esta spec estende** o ciclo de vida: **reentrada**, **hidratação** e **reconciliação**.  
- **Padrões Guia MEI:** [`docs/specs/ux-spec-meu-mei-ui-2026-03-30.md`](ux-spec-meu-mei-ui-2026-03-30.md) — tokens, tabs, hierarquia.  
- **Implementação de referência:** `frontend/src/pages/GuidesMei.tsx`; serviços `guidesMeiService.ts`; utilitários `guiaMeiCadastroDocumentosAtivos.ts`, `nfEmissionCompany.ts`.

**Nota:** não usar o carácter “§” em strings de UI do produto (renderização frágil). Usar “secção” ou numeração em documentação apenas.

---

## 1. Objetivo deste documento

Contrato de **experiência, hierarquia, comportamento, copy, estados de carregamento/erro e acessibilidade** para:

1. **Descoberta** de que documentos ativos podem ser **alterados depois** do primeiro cadastro (**FR-UPD-DOC-01**).  
2. **Hidratação** da UI segundo precedência **remoto → espelho → default** (**FR-UPD-DOC-04**).  
3. **Reconciliação no carregamento** (uma consulta ao emissor por visita/sessão, com UI não bloqueante) (**FR-UPD-DOC-05**, **FR-UPD-DOC-06**).  
4. **Confirmação pós-guardar** focada no **emissor** (Plugnotas), sem jargão de base de dados (**FR-UPD-DOC-07**, P1).  
5. **P1:** aviso de deriva espelho/remoto + CTA opcional “Sincronizar” / “Atualizar vista” (**FR-UPD-DOC-08**).  
6. **Performance percetível:** evitar sensação de “página a piscar” ou múltiplos spinners em cascata (**NFR-UPD-DOC-01**).

Serve para critérios de aceite, *file list* e QA; **não** substitui contratos de API nem merge de `PATCH` (`operacao-mei-nfse.md`).

---

## 2. Princípios de UX

| Princípio | Aplicação |
|-----------|-----------|
| **Uma verdade mental** | O utilizador não distingue “app vs Plugnotas vs Supabase”; vê **“o que está ativo no emissor”**. Copy evita nomes de tabelas ou espelho. |
| **Honestidade em falha** | Se o estado remoto não for obtido, a app **não finge** precisão: mensagem discreta + fallback (espelho ou default). |
| **Não bloquear o ecrã** | Falha de `GET empresa` **não** deve impedir uso do restante Guia MEI (FR-UPD-DOC-06). |
| **Edição explícita** | Alteração guardada na app **inclui** `documentosAtivos` no pedido — o utilizador percebe que **confirmou** uma seleção (botão “Salvar alterações” ou ação equivalente no fluxo de atualizar cadastro). |
| **Continuidade com cadastro** | Reutilizar o **mesmo** padrão visual da secção Documentos ativos da spec de cadastro (checkboxes, legenda, ajudas por linha). |

---

## 3. Arquitetura de informação (IA)

### 3.1 Onde vive a funcionalidade

**Contexto:** workspace Guia MEI — mesma área que o cadastro fiscal (certificado + empresa). Não introduzir nova tab de topo só para este PRD salvo decisão PO; **reforçar** a secção já existente ou o seu acesso pós-cadastro.

**Decisão de IA (MVP — P0):**

| Elemento | Comportamento |
|----------|----------------|
| **Secção “Documentos ativos”** | Permanece **visível** sempre que o utilizador tiver completado pré-requisitos mínimos para “ter empresa no emissor” (ex.: certificado enviado / CNPJ associado — alinhar com story). **Não esconder** após o primeiro sucesso só para “libertar espaço”; se a densidade for problema, usar **acordeão fechado por omissão** com **sumário** da seleção actual visível na *trigger* (ver §3.2). |
| **Atalho textual** | Opcional: link curto *“Alterar quais documentos estão ativos no emissor”* no fim do bloco de sucesso de cadastro (one-shot), que faz *scroll* até à secção ou abre acordeão. |

### 3.2 Variante: acordeão (se o ecrã for longo)

| Estado do acordeão | Conteúdo visível na *trigger* |
|--------------------|-------------------------------|
| Fechado | Texto: *“Documentos ativos: NFS-e, NFC-e”* (listar só os **sim**; se nenhum parseável, *“Em sincronização…”* ou *“Não confirmado”*). |
| Aberto | Checkboxes completos + textos de apoio (reutilizar spec de cadastro). |

**Critério:** o utilizador **sempre** vê, pelo menos numa linha, **que** há tipos configurados (descoberta FR-UPD-DOC-01).

### 3.3 Ordem de leitura após implementação

1. Avisos globais do workspace (inalterados).  
2. Certificado / CNPJ (inalterados).  
3. **Documentos ativos** (com indicador de sincronização — §4).  
4. Dados mínimos / título dinâmico (spec cadastro).  
5. Acções: Consultar / Atualizar / Enviar / Remover.

---

## 4. Estados da UI: sincronização e carregamento

### 4.1 Máquina de estados (lógica de experiência)

| Estado interno | O que o utilizador vê | Notas |
|----------------|------------------------|-------|
| **S0 — Inicial** | Checkboxes **desabilitados** ou *skeleton* de três linhas **até** primeira resolução de fonte (remoto ou espelho). Duração alvo &lt; 300 ms se dados em cache de sessão. | Evitar mostrar defaults errados antes de hidratar. |
| **S1 — Remoto OK** | Checkboxes reflectem **GET empresa** normalizado. Opcional: ícone ou texto *“Confirmado no emissor”* (tom neutro, não verde agressivo). | Prioridade FR-UPD-DOC-04. |
| **S2 — Fallback espelho** | Sem remoto: valores de `documentosAtivos` do status/backend. Texto auxiliar: *“Última configuração guardada neste dispositivo.”* | Não implicar que é o painel Plugnotas. |
| **S3 — Fallback default** | Sem remoto nem espelho: defaults do PRD de cadastro (NFS-e ligado, outros off). | |
| **S4 — GET falhou** | Mesma selecção que S2 ou S3; **banner discreto** ou *inline* abaixo do título da secção (**FR-UPD-DOC-06**). | Ver §4.3. |
| **S5 — Dirty edit** | Utilizador alterou checkbox; **não** disparar novo GET automático até gravar ou cancelar. | Botão primário de “Aplicar” ou inclusão no fluxo **Atualizar cadastro**. |

### 4.2 Indicador de “sincronização” (MVP)

| Componente | Uso |
|------------|-----|
| **Spinner inline** | Ao lado do título da secção **“Documentos ativos”** apenas durante **S0** em direcção a **S1** (primeira carga). **Uma** instância; não repetir por checkbox. |
| **Progressive enhancement** | Se a resposta GET for instantânea (cache), não mostrar spinner (evitar flash). |

### 4.3 Mensagem quando GET falha (**FR-UPD-DOC-06**)

- **Tom:** informativo, não erro crítico.  
- **Posição:** imediatamente **abaixo** do `legend` / título da secção, `role="status"` ou `aria-live="polite"`.  
- **Copy sugerida:** *“Não foi possível confirmar agora o estado no emissor fiscal. Mostramos a última informação disponível aqui. Tente de novo mais tarde ou consulte o cadastro no emissor.”*  
- **Ícone:** opcional `info` (não `alert-triangle` como erro de validação).

### 4.4 Uma chamada por visita (**NFR-UPD-DOC-01**)

- **Não** repetir GET ao mudar de tab interna do workspace se o *cache* de sessão ainda válido (TTL definido na story).  
- **Não** disparar GET em cada `onChange` de checkbox.  
- **Re-fetch** explícito: só botão P1 “Sincronizar com Plugnotas” ou nova visita à rota após TTL.

---

## 5. Affordance de edição posterior (**FR-UPD-DOC-01**)

### 5.1 Microcopy de secção (título persistente)

- **Título:** *“Documentos ativos no Plugnotas”* (igual à spec de cadastro para continuidade).  
- **Subtítulo (linha opcional, P0 recomendado):** *“Você pode alterar esta configuração depois do primeiro cadastro. As mudanças são enviadas ao emissor fiscal ao salvar.”*

### 5.2 Fluxo de guardar (alinhado a “Atualizar cadastro”)

| Cenário | Comportamento UX |
|---------|------------------|
| Utilizador altera checkboxes e clica **Atualizar cadastro (sem novo certificado)** | O pedido **deve** incluir `documentosAtivos` reflectindo a selecção actual (**FR-UPD-DOC-02**). Se o produto usar *modal* de confirmação, o texto menciona **“tipos de documento”** quando houve alteração só nessa secção. |
| Utilizador altera checkboxes mas não clica guardar | Estado **dirty**; opcional *badge* “Alterações não salvas” na secção (P1). |

### 5.3 Confirmação pós-sucesso (**FR-UPD-DOC-07**, P1)

Após resposta **bem-sucedida** do backend (Plugnotas OK):

- **Toast** ou *banner* de sucesso **dismissible**: *“Configuração atualizada no emissor fiscal.”*  
- **Evitar:** “Salvo na base de dados”, “JSONB”, “Supabase”.  
- Se o produto já usa toast fiscal genérico, **estender** a mensagem para mencionar **emissor** quando `documentosAtivos` foi enviado.

---

## 6. P1 — Deriva espelho vs remoto (**FR-UPD-DOC-08**)

**Pré-condição:** sistema detectou divergência **após** um GET bem-sucedido e comparação com espelho local (lógica na story).

| Elemento | Especificação |
|----------|----------------|
| **Banner** | Tom **aviso** (amarelo suave / `admin-alert` variant warning), **não** bloqueante, **entre** o subtítulo da secção e os checkboxes. |
| **Copy sugerida** | *“A configuração guardada aqui differe do que encontramos no emissor. Mostramos o estado do emissor.”* |
| **CTA primário** | *“Atualizar vista”* — apenas recarrega estado da UI a partir do último GET (sem novo pedido se cache válido) **ou** força novo GET conforme story. |
| **CTA secundário** | *“Sincronizar com Plugnotas”* — **opcional** se o mesmo PRD aprovar botão explícito além do carregamento automático; dispara GET + persistência espelho. |

**Acessibilidade:** banner com `role="region"` + `aria-label` “Aviso de diferença de configuração”.

---

## 7. Acessibilidade

| Requisito | Implementação |
|-----------|----------------|
| **Estado de carregamento** | `aria-busy="true"` no `fieldset` ou contentor da secção durante **S0**; `aria-busy="false"` após hidratar. |
| **Mensagem GET falhou** | `aria-live="polite"` (§4.3). |
| **Checkboxes** | Manter §4.3 da spec de cadastro (`fieldset`, `legend`, labels). |
| **Dirty state** | Se “Alterações não salvas” existir, associar ao grupo via `aria-describedby`. |

---

## 8. Responsividade e densidade

- **Mobile:** spinner inline ao lado do título não empurra checkboxes para fora do *viewport*; manter *scroll* mínimo.  
- **Desktop:** secção em largura total; banner P1 em linha única com CTA à direita se couber (`flex justify-between gap-4`).  
- **Dark mode:** banners e estados *disabled* mantêm contraste WCAG AA (alinhado a **NFR-CAD-DOC-01** implícito em design system).

---

## 9. Wireframes lógicos (baixa fidelidade)

### 9.1 Carregamento inicial (S0 → S1)

```text
┌─────────────────────────────────────────────────────────────┐
│ Documentos ativos no Plugnotas  [spinner]                    │
│ Você pode alterar esta configuração depois do primeiro...     │
│ ┌─────────────────────────────────────────────────────────┐  │
│ │ ░░░░░░░░░░░░░  (skeleton 3 linhas)                       │  │
│ └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 9.2 Remoto OK (S1)

```text
┌─────────────────────────────────────────────────────────────┐
│ Documentos ativos no Plugnotas                                │
│ subtítulo opcional…                                          │
│ ☑ NFS-e   …                                                  │
│ ☐ NF-e    …                                                  │
│ ☑ NFC-e   …                                                  │
└─────────────────────────────────────────────────────────────┘
```

### 9.3 GET falhou (S4)

```text
┌─────────────────────────────────────────────────────────────┐
│ Documentos ativos no Plugnotas                                │
│ ⓘ Não foi possível confirmar agora o estado no emissor…     │
│ ☑ NFS-e  …  (espelho ou default)                             │
└─────────────────────────────────────────────────────────────┘
```

### 9.4 P1 — Banner de deriva

```text
┌─────────────────────────────────────────────────────────────┐
│ Documentos ativos no Plugnotas                                │
│ ⚠ A configuração guardada aqui differe do emissor…          │
│   [Atualizar vista]  [Sincronizar com Plugnotas]             │
│ ☑ …  ☑ …                                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Mapeamento PRD → UX (rastreio)

| ID | Entrega UX nesta spec |
|----|------------------------|
| FR-UPD-DOC-01 | §3, §5 — secção persistente, subtítulo, acordeão opcional |
| FR-UPD-DOC-02 | §5.2 — inclusão no fluxo Atualizar cadastro |
| FR-UPD-DOC-03 | Backend; UX confirma feedback pós-sucesso §5.3 |
| FR-UPD-DOC-04 | §4.1 S1–S3 |
| FR-UPD-DOC-05 | §4.2, §4.4 — spinner único, cache |
| FR-UPD-DOC-06 | §4.3 |
| FR-UPD-DOC-07 | §5.3 |
| FR-UPD-DOC-08 | §6 |
| FR-UPD-DOC-09 | P2 — não UX |
| NFR-UPD-DOC-01 | §4.4, §8 |
| NFR-UPD-DOC-05 | Sem mudança de superfície Supabase no cliente |

---

## 11. Critérios de aceite UX (para QA)

1. Após abrir o Guia MEI com emitente configurado, a secção Documentos ativos **hidrata** sem mostrar defaults incorrectos por mais de um *frame* perceptível (salvo *slow 3G* test).  
2. Falha de GET **não** bloqueia interacção com restantes áreas do workspace.  
3. Mensagem de falha de GET é **legível**, **não** alarmista, e anunciada a tecnologias assistivas.  
4. Após sucesso de atualização com alteração de tipos, o utilizador vê confirmação que menciona **emissor fiscal** (§5.3).  
5. Duas visitas consecutivas à mesma rota **não** disparam dois GETs visíveis sem invalidação (ver rede — alinhado PRD §15 QA).  
6. (P1) Se implementado, banner de deriva tem CTAs claros e foco gerível por teclado.

---

## 12. Change log

| Versão | Data | Notas |
|--------|------|-------|
| 1.0 | 2026-04-07 | Versão inicial a partir do PRD de atualização posterior. |

---

— Uma · especificação para implementação alinhada a **AGENTS.md** e quality gates do projeto.
