# Especificação de front-end e UX — Cadastro do emitente: **Documentos ativos** (Plugnotas)

**Versão:** 1.0  
**Data:** 2026-04-07  
**Autoria:** Uma (UX design expert / fluxo AIOX)  
**Requisitos de origem:** [`docs/prd/PRD-cadastro-empresa-documentos-ativos-plugnotas-2026-04-07.md`](../prd/PRD-cadastro-empresa-documentos-ativos-plugnotas-2026-04-07.md) (**FR-CAD-DOC-***, **NFR-CAD-DOC-***, **CR-CAD-DOC-***)  
**Brief de apoio:** [`docs/brief/brief-cadastro-empresa-documentos-ativos-plugnotas-2026-04-07.md`](../brief/brief-cadastro-empresa-documentos-ativos-plugnotas-2026-04-07.md)

**Relação com specs e código de referência:**

- **Padrões globais Guia MEI:** [`docs/specs/ux-spec-meu-mei-ui-2026-03-30.md`](ux-spec-meu-mei-ui-2026-03-30.md) — hero, tabs do workspace, tokens `admin-*` / `planner-*`.  
- **Emissão multi-tipo (contexto irmão):** [`docs/specs/ux-spec-guia-mei-emissao-nfe-nfce-2026-04-06.md`](ux-spec-guia-mei-emissao-nfe-nfce-2026-04-06.md) — nomenclatura NFS-e / NF-e / NFC-e alinhada ao utilizador; este documento trata **cadastro**, não a aba de emissão.  
- **Implementação de referência (pré-mudança):** `frontend/src/pages/GuidesMei.tsx` — bloco *"Dados mínimos para emissão de NFS-e"* (~L2593+), certificado, botões consultar/atualizar/enviar; `frontend/src/utils/nfEmissionCompany.ts` — construção do payload `nfse` / `nfe` / `nfce` (valores por omissão atuais).

**Nota de nomenclatura:** copy em português (Brasil) para labels de UI; valores canónicos para API (`NFSE`, `NFE`, `NFCE`) ficam na story / contrato com **@architect**.

---

## 1. Objetivo deste documento

Contrato de **experiência, hierarquia visual, comportamento, *copy*, estados e acessibilidade** para:

1. Secção **Documentos ativos** com selecção múltipla (**FR-CAD-DOC-01**, **FR-CAD-DOC-02**).  
2. Validação de **pelo menos um tipo** e fluxo de **desmarcar NFS-e** (**FR-CAD-DOC-03**, PRD §6.4).  
3. **Copy dinâmica** de títulos quando só NFS-e vs múltiplos tipos (**FR-CAD-DOC-07**, **FR-CAD-DOC-08**).  
4. **Ajuda** quando NF-e/NFC-e estão activos mas a emissão multi-tipo ainda não existir na UI (**FR-CAD-DOC-10**, PRD §6.1).  
5. Coerência de **Consultar cadastro** / feedback de estado remoto (**FR-CAD-DOC-06**).  
6. **Campos condicionais** por tipo activo — orientação de UX; lista exacta de campos fica na story + backend (**FR-CAD-DOC-09**).

Serve para critérios de aceite, *file list* e QA; **não** substitui o contrato de payload nem decisões de `PATCH` (PRD §6.5).

---

## 2. Princípios de UX

| Princípio | Aplicação |
|-----------|-----------|
| **Transparência** | O utilizador vê **antes** dos dados mínimos **quais** canais ficarão activos no Plugnotas; reduz desalinhamento com o painel web. |
| **Seleção múltipla ≠ emissão** | Ativar NF-e/NFC-e no cadastro **prepara** o emissor; a **emissão** de produto pode ser outra entrega — **honestidade** na microcopy (**FR-CAD-DOC-10**). |
| **Default seguro** | Novo fluxo: **NFS-e** ligado, **NF-e** e **NFC-e** desligados (PRD §6.2) — caminho familiar para MEI prestador. |
| **Não punir o fluxo NFS-e-only** | Com só NFS-e ativo, títulos e densidade permanecem próximos do estado atual (**CR-CAD-DOC-01**). |
| **Um padrão acessível** | `fieldset` + checkboxes nomeados; erros associados com `aria-describedby` / região ao vivo onde já for padrão fiscal (**NFR-CAD-DOC-01**). |

---

## 3. Arquitetura de informação (IA)

### 3.1 Área afetada

**Workspace:** tab onde hoje vive o cadastro fiscal (certificado CNPJ + ficheiro + senha + formulário de empresa). Em código: mesmo *shell* que contém o bloco *"Dados mínimos para emissão de NFS-e"* em `GuidesMei.tsx`.

**Decisão de layout (recomendada — P0):**

| Nível | Nome canónico | Conteúdo |
|-------|----------------|----------|
| **CAD-L0** | Fluxo certificado + empresa | Ordem vertical existente (aviso amarelo, upload, senha, CNPJ…). |
| **CAD-L1-NEW** | **Documentos ativos** | **Nova** secção, **imediatamente acima** do bloco *"Dados mínimos…"* para que a escolha de tipos **contextualize** o que se segue. |
| **CAD-L2** | Dados mínimos / endereço | Formulário atual (com título dinâmico — §5). |
| **CAD-L3** | Ações secundárias + primárias | *Consultar cadastro no emissor*, *Atualizar cadastro (sem novo certificado)*, *Enviar certificado*, *Remover certificado* — ordem e estilos **mantidos**; apenas enriquecer feedback de consulta (§8). |

**Alternativa (P1 / se o ecrã ficar longo demais):** sub-tabs *Detalhes | Endereço | Contato | Documentos ativos* como na referência de produto. **Só** usar se o time validar extração de campos em tabs; para MVP, **bloco único acima dos dados mínimos** minimiza refactor e cumpre **FR-CAD-DOC-01**.

### 3.2 Ordem de leitura (RTL / LTR)

1. Pré-requisitos de certificado (inalterados).  
2. **Documentos ativos** (novo).  
3. Título + hints do bloco de dados (dinâmicos — §5).  
4. Campos do formulário (com possíveis secções condicionais — §7).  
5. Barra de ações.

---

## 4. Componente: Documentos ativos (**FR-CAD-DOC-01** / **02**)

### 4.1 Padrão de controlo: **checkboxes** (selecção múltipla)

| Opção | Label visível | Valor interno sugerido |
|-------|----------------|-------------------------|
| 1 | **NFS-e** (nota de serviço) | `nfse` / `NFSE` |
| 2 | **NF-e** (modelo 55, produto) | `nfe` / `NFE` |
| 3 | **NFC-e** (venda ao consumidor) | `nfce` / `NFCE` |

**Visual:**

- Três checkboxes **empilhados** em mobile; em `md+` pode ser **uma linha** (`flex flex-wrap gap-4`) desde que o toque mínimo (~44px) seja respeitado.  
- Cada linha: checkbox + label + **uma frase curta** de ajuda em `text-xs text-slate-500` (§4.2).  
- **Não** usar *segmented control* de um só valor — aqui o utilizador pode combinar tipos.

### 4.2 Microcopy por opção (linha de apoio)

| Tipo | Texto de apoio (máx. ~120 caracteres) |
|------|----------------------------------------|
| NFS-e | *Serviços prestados; padrão para MEI na área de emissão da app.* |
| NF-e | *Produtos e operações que exigem NF-e (modelo 55).* |
| NFC-e | *Venda presencial ou ao consumidor final com NFC-e.* |

(Ajustar tom com PO; manter **factual**, sem promessa legal.)

### 4.3 Acessibilidade (**NFR-CAD-DOC-01**)

| Requisito | Implementação |
|-----------|----------------|
| Agrupamento | `<fieldset>` com `<legend className="text-sm font-semibold">Documentos ativos no Plugnotas</legend>` (ou título visual equivalente **visível**, não só *sr-only*). |
| Cada checkbox | `id` estável + `label` com `htmlFor`; se usar componente design system, garantir o mesmo mapeamento. |
| Descrição do grupo | Opcional: `aria-describedby` apontando para o parágrafo introdutório abaixo. |
| Erro “zero tipos” | Associar mensagem ao `fieldset` via `aria-describedby` no primeiro checkbox ou região `role="alert"` após tentativa de envio. |

**Não** reutilizar o padrão *radiogroup* da spec de emissão: aqui é **múltipla escolha**.

---

## 5. Copy dinâmica: títulos e bloco de dados (**FR-CAD-DOC-07** / **08**)

### 5.1 Título do bloco de dados mínimos

| Estado (selecção) | Título do bloco (substitui *"Dados mínimos para emissão de NFS-e"* quando aplicável) |
|-------------------|----------------------------------------------------------------------------------------|
| **Só NFS-e** activo | **Dados mínimos para emissão de NFS-e** *(manter ou equivalente — não regredir clareza)* |
| **Dois ou mais** tipos activos | **Configuração fiscal do emitente** *ou* **Dados para emissão no Plugnotas** (escolher uma variante canónica na story) |

**Subtítulo / hint** (linha abaixo do título):

- Só NFS-e: manter texto atual sobre campos obrigatórios e IE (MEI).  
- Múltiplos tipos: *"Preencha os campos obrigatórios para os documentos selecionados. Campos com * são obrigatórios onde indicado."*

### 5.2 Banner opcional (P1)

Quando **NF-e** ou **NFC-e** está activo **e** a feature de emissão desses tipos **não** estiver disponível na UI (PRD §6.1):

- **Componente:** `admin-alert` ou faixa informativa (tom **info**, não erro) **entre** Documentos ativos e o formulário de dados.  
- **Copy sugerida:** *"Você ativou NF-e ou NFC-e no emissor. A emissão dessas notas na app pode exigir passos adicionais (ex.: dados de produto, CSC). Consulte o guia fiscal ou o seu contador."*  
- **Link:** texto curto para *guia interno* / `docs/operacao-mei-nfse.md` ou página estática já usada no produto (**FR-CAD-DOC-10**).

---

## 6. Estados e comportamentos

### 6.1 Defaults e hidratação (PRD §6.2)

| Origem | Comportamento UX |
|--------|-------------------|
| Primeiro uso | NFS-e ✓ · NF-e ✗ · NFC-e ✗ |
| Após **Consultar cadastro** com sucesso | Espelhar tipos activos na UI quando a resposta for mapeável; **skeleton** ou *disabled* nos checkboxes durante o pedido. |
| Snapshot local (futuro) | Pré-marcar conforme persistência — sem flicker perceptível (preferir hidratação antes de *paint* se possível). |

### 6.2 Validação: zero tipos (**FR-CAD-DOC-03**)

- Ao clicar **Enviar certificado** / acção equivalente que dispara cadastro: se **nenhum** checkbox estiver marcado, **bloquear** submit.  
- Mensagem visível: **"Selecione pelo menos um tipo de documento."** (`role="alert"` ou `aria-live="polite"` na primeira tentativa).  
- Foco: mover para o primeiro checkbox do grupo.

### 6.3 Desmarcar NFS-e (**PRD §6.4**)

- Ao desmarcar **NFS-e** (de estado anterior com NFS-e activo): abrir **modal de confirmação** (ou *dialog* acessível com `role="alertdialog"`).  
- **Título:** *"Desativar NFS-e?"*  
- **Corpo:** *"A Guia MEI usa NFS-e para serviços. Sem NFS-e ativo no emissor, a emissão de serviços nesta app pode ficar bloqueada ou inconsistente com o Plugnotas."*  
- **Ações:** **Manter NFS-e** (secundário / *cancel*) · **Desativar mesmo assim** (primário destrutivo ou *outline* perigoso).  
- Se o utilizador confirmar desativação, fechar modal e permitir estado sem NFS-e (se o produto permitir — alinhar com backend).

### 6.4 Ativar NF-e / NFC-e sem pré-requisitos (**FR-CAD-DOC-09**)

- Se o backend / UI exigir campos extra (ex.: CSC, IE) quando um tipo está activo: **mostrar** campos ou blocos **abaixo** dos dados mínimos gerais ou dentro de *acordeão* "Dados para NF-e / NFC-e".  
- Estado de erro inline por campo (borda + texto) **antes** do submit quando detectável no cliente.

---

## 7. Campos condicionais (orientação UX — **FR-CAD-DOC-09**)

**Não prescrever lista fiscal fechada aqui** — depende do contrato Plugnotas.

| Direcção UX | Recomendação |
|-------------|--------------|
| **Progressão** | Quando o utilizador marca NF-e ou NFC-e, expandir ou revelar secção **"Dados adicionais para produto"** com título claro. |
| **Vazio** | Se ainda não houver campos no MVP, mostrar apenas o aviso §5.2 até a story definir campos. |
| **Densidade** | Evitar formulário interminável numa só vista: *acordeão* por tipo (NFS-e base vs NF-e vs NFC-e) se o número de campos crescer. |

---

## 8. Consultar cadastro no emissor (**FR-CAD-DOC-06**)

### 8.1 Após resposta bem-sucedida

- Atualizar checkboxes **Documentos ativos** para refletir o estado remoto **quando** o *mapping* existir.  
- Opcional (P1): linha de texto *"Última sincronização com o emissor: …"* se o produto já tiver *timestamp*.

### 8.2 Quando a API não expõe simetria

- Mostrar **toast** ou *inline message* neutra: *"Não foi possível determinar todos os tipos activos a partir da resposta do emissor. Verifique no painel Plugnotas."*  
- **Não** inventar ticks nos checkboxes.

---

## 9. Responsividade e densidade

- **Mobile:** checkboxes em coluna única; legenda do `fieldset` com `text-base` mínimo.  
- **Desktop:** pode usar `grid` de duas colunas **só** para o bloco de dados mínimos existente; **Documentos ativos** preferencialmente **largura total** para leitura linear.  
- **Toque:** área clicável do checkbox + label ≥ recomendações já usadas noutros formulários `planner-input-compact`.

---

## 10. Wireframes lógicos (baixa fidelidade)

### 10.1 Inserção recomendada (desktop)

```text
┌─────────────────────────────────────────────────────────────┐
│ [Aviso certificado A1]                                       │
│ CNPJ | Escolher ficheiro | Senha                             │
├─────────────────────────────────────────────────────────────┤
│ Documentos ativos no Plugnotas                               │
│ ☐ NFS-e    Serviços…                                         │
│ ☐ NF-e     Produto…                                          │
│ ☐ NFC-e    Consumidor…                                       │
│ (banner info se NF-e/NFC-e e sem emissão na app — §5.2)      │
├─────────────────────────────────────────────────────────────┤
│ [Título dinâmico §5.1]                                       │
│ hint…                                                        │
│ [campos razão social, email, regime, endereço…]              │
├─────────────────────────────────────────────────────────────┤
│ [Consultar] [Atualizar sem certificado]                       │
│ [Enviar certificado]  [Remover certificado]                 │
└─────────────────────────────────────────────────────────────┘
```

### 10.2 Erro zero tipos

```text
┌─────────────────────────────────────────────────────────────┐
│ Documentos ativos …                                          │
│ ☐ ☐ ☐   ← todos desmarcados                                  │
│ ⚠ Selecione pelo menos um tipo de documento.                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 11. Mapeamento PRD → UX (rastreio)

| ID | Entrega UX nesta spec |
|----|------------------------|
| FR-CAD-DOC-01 | §3.1, §4 — secção e três opções |
| FR-CAD-DOC-02 | §4.1 — independência dos checkboxes |
| FR-CAD-DOC-03 | §6.2 |
| FR-CAD-DOC-04 | Story + payload (referência `nfEmissionCompany.ts`) |
| FR-CAD-DOC-05 | Sem mudança de *label* dos botões; estado dos checkboxes no PATCH |
| FR-CAD-DOC-06 | §8 |
| FR-CAD-DOC-07 | §5.1 primeira linha da tabela |
| FR-CAD-DOC-08 | §5.1 segunda linha da tabela |
| FR-CAD-DOC-09 | §7 |
| FR-CAD-DOC-10 | §5.2 |
| NFR-CAD-DOC-01 | §4.3 |

---

## 12. Critérios de aceite UX (para QA)

1. Leitor de ecrã anuncia **legenda** "Documentos ativos" e o estado de cada checkbox.  
2. Utilizador não consegue submeter cadastro com zero tipos sem mensagem explícita.  
3. Desmarcar NFS-e dispara confirmação §6.3 antes de persistir.  
4. Com só NFS-e, o título do bloco de dados mantém ênfase NFS-e (§5.1).  
5. Com dois+ tipos, título neutro visível sem regressão de contraste (*dark mode*).  
6. Consultar cadastro atualiza checkboxes ou mostra limitação honesta (§8.2).

---

## 13. Change log

| Versão | Data | Notas |
|--------|------|-------|
| 1.0 | 2026-04-07 | Versão inicial a partir do PRD de cadastro — documentos ativos. |

---

— Uma · especificação para implementação alinhada a **AGENTS.md** e quality gates do projeto.
