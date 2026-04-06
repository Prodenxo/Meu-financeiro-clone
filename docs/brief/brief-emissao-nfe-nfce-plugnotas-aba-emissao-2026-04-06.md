# Brief: emissão de **NF-e** e **NFC-e** via Plugnotas — aba de emissão com seletor por tipo

**Data:** 2026-04-06  
**Origem:** pedido de produto (persona Atlas — analista)  
**Produto:** Meu Financeiro — área fiscal / **Guia MEI** (ecrã com abas de certificado, DAS e **emissão**), com extensão coerente ao painel admin se o produto quiser paridade.

**Documentos relacionados (não substituídos por este brief):**

- `docs/prd/PRD-meu-financeiro-produto-brownfield-2026-03-26.md` — contexto NFS-e / Plugnotas / fonte de verdade.  
- `docs/brief/brief-user-mei-certificates-nfse-campos-supabase.md` — campos mínimos e espelhamento Supabase ↔ Plugnotas (foco NFS-e).  
- `docs/brief/brief-admin-nfse-selecionar-gerir-clientes-usuario-2026-04-02.md` — emissão admin (hoje rotulada como NFSe).  
- `docs/technical/catalogo-mei-persistencia-e-api-2026-03-30.md` — `mei-notas` e catálogos (predominantemente NFS-e).

**Próximos passos típicos:** `@pm` — PRD ou critérios de aceite e política MEI vs “também venda de mercadorias”; `@architect` — contrato de payload UI ↔ `POST …/emitir`, ativação `nfe`/`nfce` no cadastro Plugnotas; `@sm` — story com file list e gates.

---

## 1. Resumo executivo

Pretende-se que o utilizador (e, se aplicável, o admin em fluxos “em nome de”) possa **emitir notas eletrónicas de produto** — **NF-e** (modelo 55) e **NFC-e** (modelo 65) — **pelo mesmo integrador já usado (Plugnotas)**, a partir do **site**, na **aba de emissão** do fluxo fiscal.

A experiência mínima pedida inclui um **seletor explícito do tipo de documento** (pelo menos **NF-e** e **NFC-e**; manter **NFS-e** como opção existente se o ecrã continuar unificado), de forma a que o formulário, validações e chamada à API reflitam o **tipo escolhido**.

O **backend** já expõe emissão genérica (`mei-notas`) com ramos **NFE** / **NFCE** / **NFSE** e serviços Plugnotas dedicados; o **gap principal** está na **UI** (e possivelmente na **política de cadastro da empresa** no Plugnotas, hoje alinhada a “apenas NFS-e” em parte do cadastro MEI).

---

## 2. Problema / oportunidade

| Dimensão | Situação atual | Oportunidade |
|----------|----------------|--------------|
| **Cobertura fiscal na UI** | O Guia MEI centra a emissão em **NFS-e** (serviço); copy e formulário refletem esse caso. | MEIs que também **vendem mercadorias** podem precisar de **NFC-e** (venda ao consumidor) e, quando aplicável, **NF-e** (ex.: B2B ou operações que não cabem só em NFC-e), **no mesmo hub**. |
| **Descoberta** | Utilizador não vê, no ecrã de emissão, a distinção clara entre tipos de nota suportados pelo motor. | **Seletor por tipo** na aba de emissão reduz erro de expectativa e orienta campos obrigatórios. |
| **Integração** | Plugnotas já tem endpoints e serviços internos para NF-e e NFC-e; a lista de notas pode já misturar tipos no histórico. | **Unificar** a jornada “escolher tipo → preencher → emitir → acompanhar” sem novo provedor. |
| **Cadastro emitente** | O cadastro/atualização de empresa no Plugnotas, no modo MEI focado em NFS-e, pode **inativar** blocos `nfe`/`nfce` de propósito (evitar reativação indevida). | Decisão de produto: **quando** e **como** habilitar NF-e/NFC-e no cadastro da empresa (certificado, CSC, ambiente, IE, CFOP, etc.). |

---

## 3. Personas e cenários

| Persona | Cenário de validação |
|---------|----------------------|
| **MEI com venda presencial / consumidor final** | Na aba de emissão, escolhe **NFC-e**, preenche itens e destinatário conforme regras do modelo 65, emite e vê status/PDF na lista. |
| **MEI com necessidade de NF-e** | Seleciona **NF-e**, completa campos exigidos (destinatário, transporte, CFOP, etc., conforme especificação da story), emite e acompanha. |
| **MEI que só presta serviço** | Mantém ou escolhe **NFS-e**; nada quebra no fluxo atual. |
| **Admin / suporte** (se em escopo) | No modal ou fluxo de emissão em nome do utilizador, **mesmo seletor de tipo** e mensagens alinhadas ao Guia MEI (paridade opcional neste brief). |

---

## 4. Estado atual (brownfield) — referências de código

| Aspeto | Detalhe |
|--------|---------|
| **Emissão unificada (API utilizador)** | `POST …/mei-notas/emitir` (`mei-notas.routes.js` → `mei-notas.controller.js` → `meiNotasService.emitirNota`). O corpo aceita `documentType` / `document_type` normalizado para **NFSE**, **NFE**, **NFCE** (e CTE no conjunto suportado). |
| **Serviços Plugnotas** | `plugnotas/nfe.service.js` (`emitirNfe`), `plugnotas/nfce.service.js` (`emitirNfce`), `plugnotas/nfse.service.js` (`emitirNfse`). |
| **Validação de payload** | `mei-notas.service.js` — `validateNfeLikePayload` e regras por tipo (ex. modelo **55** vs **65**). |
| **UI principal (MEI)** | `frontend/src/pages/GuidesMei.tsx` — abas de workspace (certificado, DAS, emissão NFS-e); lista com filtro de tipo hoje orientado a **NFSE**. |
| **Cadastro empresa Plugnotas** | `plugnotas/empresa.service.js` — em fluxos “apenas NFS-e”, envio de `nfe`/`nfce` **inativos** sem `config`; **implicação:** emitir NF-e/NFC-e pode exigir **evolução de cadastro** e requisitos fiscais adicionais (CSC, IE, etc.). |
| **Admin** | `AdminUserData.tsx` — emissão descrita como NFSe; pode ser alvo de extensão numa story derivada. |

---

## 5. Objetivos de produto

1. **Seleção visível:** na **aba de emissão**, o utilizador escolhe o **tipo de nota** a emitir: no mínimo **NF-e** e **NFC-e**; **incluir NFS-e** na mesma UI se o produto mantiver um único ecrã de emissão fiscal.  
2. **Formulário contextual:** ao mudar o tipo, o ecrã apresenta **campos e ajudas** adequados (sem misturar validação de serviço com validação de produto).  
3. **Rastreio e histórico:** notas emitidas continuam **listáveis** com `document_type` correto; filtros da lista devem permitir ver **NFE** / **NFCE** / **NFSE** conforme já suportado pelo backend.  
4. **Mensagens de erro:** reutilizar padrões existentes de integração Plugnotas (`plugnotasIntegrationErrorMessage`, etc.), com texto que identifique o **tipo de documento** quando útil.  
5. **Não regressão:** quem só usa **NFS-e** não deve perder o fluxo atual; default do seletor pode ser **NFS-e** até haver decisão de produto em contrário.

---

## 6. Fora de âmbito ou fase 2 (sugerido, a validar com PO)

- Substituir Plugnotas ou implementar motor fiscal próprio.  
- **CT-e** na mesma aba (o backend menciona tipo CTE no conjunto; só entra se houver requisito explícito).  
- Emissão em massa, importação de XML de terceiros ou conciliação automática com estoque.  
- Alterações legais/tributárias além do que o integrador e o contador do utilizador exigem (o produto limita-se a **orquestrar** dados e chamadas).

---

## 7. Decisões em aberto (críticas antes da story)

1. **Habilitação no Plugnotas:** critérios para ativar `nfe` e/ou `nfce` no cadastro da empresa (campos obrigatórios, CSC/token NFC-e, regime, IE, etc.) e se isso é **automático** após toggle na UI ou **manual** via suporte.  
2. **Escopo MEI:** confirmar se **todos** os MEIs alvo podem legalmente usar NF-e/NFC-e nos cenários pretendidos, ou se o produto deve **restringir** por perfil, município ou feature flag.  
3. **Fonte de dados:** catálogo de **produtos** para NF-e/NFC-e — reutilizar `mei_nfse` produtos, criar entidade paralela, ou só formulário avulso no MVP.  
4. **Default do seletor:** NFS-e (compatibilidade) vs “último tipo usado” (persistido localmente).  
5. **Admin:** paridade imediata com o Guia MEI ou fase 2.

---

## 8. Proposta de experiência (UX) — aba de emissão

### 8.1 Seletor de tipo

- Controlo principal no **topo** do painel de emissão (segmented control, radio group ou select acessível): **NFS-e** | **NF-e** | **NFC-e** (rótulos canónicos alinhados ao utilizador brasileiro).  
- **ARIA:** `role="tablist"` apenas se o padrão for tabs; caso contrário, grupo de rádio com `fieldset`/`legend` ou `aria-label` explícito.  
- Ao trocar o tipo: **limpar ou isolar** estado do formulário para evitar enviar campos de serviço num payload de produto (comportamento exacto na UX spec — ex.: confirmar troca se houver dados não guardados).

### 8.2 Conteúdo por tipo

- **NFS-e:** manter blocos actuais (prestador, tomador, serviço, etc.).  
- **NF-e / NFC-e:** blocos alinhados ao que `mei-notas.service.js` e a documentação Plugnotas exigem (emitente, destinatário, itens, totais, pagamento, documentos referenciados — o detalhe fica para PRD/story).  
- **Ajuda contextual:** uma linha de texto por tipo (“NFC-e: venda ao consumidor…”, “NF-e: nota de produto modelo 55…”) para reduzir suporte.

### 8.3 Lista e filtros

- O filtro de documento na lista deve incluir **NFE** e **NFCE** (além de **NFSE**), coerente com `document_type` gravado e com o que o backend já aceita em consultas quando aplicável.

---

## 9. Critérios de aceite (rascunho para story)

- [ ] Na aba de emissão, o utilizador **seleciona** NF-e ou NFC-e (e NFS-e permanece disponível se unificado).  
- [ ] Submissão chama o endpoint de emissão com `documentType` **NFE** ou **NFCE** e payload válido; resposta de sucesso cria registo consultável na lista com tipo correcto.  
- [ ] Erros de validação (app ou Plugnotas) são **visíveis** e **acessíveis** (foco, `aria-live` onde já for padrão no ecrã).  
- [ ] Cadastro Plugnotas e certificado: se o tipo escolhido exigir configuração em falta, a UI **bloqueia** com mensagem clara (sem silêncio ou 500 opaco).  
- [ ] Testes automatizados: pelo menos cobertura de serviço/rotas já existente **estendida** ou e2e smoke definidos na story (alinhado a `AGENTS.md`).

---

## 10. Riscos e mitigação

| Risco | Mitigação |
|-------|-----------|
| Empresa no Plugnotas sem NF-e/NFC-e ativos | Fluxo de habilitação + validação pré-emissão; documentar na story. |
| Complexidade fiscal (CFOP, IE, CST) | MVP com campos mínimos validados com contador; tooltips e ligação a guias. |
| Utilizador confunde NFC-e com NFS-e | Seletor + copy + ícones/labels consistentes. |

---

— Atlas, investigando a verdade 🔎
