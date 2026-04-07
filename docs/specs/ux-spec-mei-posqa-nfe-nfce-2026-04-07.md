# Especificação de front-end e UX — Guia MEI: **POSQA** (limite MEI, erros NF-e/NFC-e, bloqueios Plugnotas)

**Versão:** 1.0  
**Data:** 2026-04-07  
**Autoria:** Uma (UX design expert / fluxo AIOX)  
**Requisitos de origem:** [`docs/prd/PRD-melhorias-nfe-nfce-pos-testes-automatizados-2026-04-07.md`](../prd/PRD-melhorias-nfe-nfce-pos-testes-automatizados-2026-04-07.md) (**FR-POSQA-\***, **NFR-POSQA-\***)  
**Complementa (não substitui):** [`docs/specs/ux-spec-guia-mei-emissao-nfe-nfce-2026-04-06.md`](ux-spec-guia-mei-emissao-nfe-nfce-2026-04-06.md) — seletor, formulários, lista.

**Relação com código de referência:**

| Área | Ficheiros |
|------|-----------|
| Limite MEI | `frontend/src/components/MeiLimiteFaturamentoBlock.tsx`, `frontend/src/utils/meiLimiteFaturamento.ts` |
| Erros de emissão | `frontend/src/pages/GuidesMei.tsx` (`formatMeiFiscalErr`, estado `emissionNfseError`), `frontend/src/lib/fiscalUserError.ts`, `frontend/src/components/FiscalIntegrationErrorAlert.tsx` |
| Bloqueio modalidades | `frontend/src/components/mei/MeiFiscalCapabilityCallout.tsx`, `frontend/src/utils/plugnotasEmpresaCapabilities.ts` |
| Padrão visual global | [`docs/specs/ux-spec-meu-mei-ui-2026-03-30.md`](ux-spec-meu-mei-ui-2026-03-30.md) — `planner-card`, `admin-alert-*`, `admin-section-title` |

**Âmbito UX deste documento:** apenas o que impacta **interface e copy** para **FR-POSQA-05**, **FR-POSQA-06** e coerência com decisões **§8.1** do PRD (D1/D2/D3). Runbook E2E (**FR-POSQA-01/02**) e reconciliação de story (**FR-POSQA-04**) são **processo/docs**, não ecrãs novos — §11.

---

## 1. Objetivo deste documento

Contrato de **experiência, hierarquia, *copy*, componentes e acessibilidade** para:

1. **Transparência do limite de faturamento MEI** face a **NF-e** e **NFC-e** (**FR-POSQA-05**).  
2. **Mensagens de falha de emissão** NF-e/NFC-e **úteis e seguras** (detalhe de validação Plugnotas quando existir, sem stack trace nem segredos) (**FR-POSQA-06**, **NFR-POSQA-01**).  
3. **Continuidade** com bloqueios já especificados em **FR-GUIA-FISC-07** (`MeiFiscalCapabilityCallout`) quando a empresa não permite o tipo no integrador (**PRD §8.1**).

Serve para critérios de aceite, *file list* e QA visual; **não** altera contratos HTTP.

---

## 2. Princípios de UX (POSQA)

| Princípio | Aplicação |
|-----------|-----------|
| **Transparência sem alarmismo** | O utilizador entende **o que entra** no limite e **o que não entra**, sem texto jurídico longo no ecrã principal. |
| **Erro = próximo passo** | Mensagem de emissão falhada indica **corrigir campo**, **rever cadastro/certificado** ou **contactar suporte**, nunca só “Erro 400”. |
| **Segurança por omissão** | Não mostrar API keys, tokens completos, nem corpo bruto de request; campos podem aparecer **nomeados** (ex.: `itens[0].ncm`) como na resposta já sanitizada pelo backend. |
| **Uma voz por tipo** | Prefixo ou *badge* do documento (**NF-e** / **NFC-e**) visível junto ao erro, alinhado a `EmissaoFiscalErrorAlert` com `documentTypeLabel`. |
| **Brownfield** | Preferir **evoluir** `MeiLimiteFaturamentoBlock` e a pilha de erros existente em `GuidesMei.tsx` a criar padrões visuais novos. |

---

## 3. Mapeamento PRD → superfície de UI

| ID PRD | Superfície principal | Notas |
|--------|----------------------|--------|
| **FR-POSQA-05** | Bloco **Limite de faturamento (MEI)** + texto “Base (MVP)” e painel **Detalhe da base** | Copy a reforçar explicitamente exclusão de NF-e/NFC-e. |
| **FR-POSQA-06** | Região de erro sob/emissão (`emissionNfseError` + componente de alerta longo se aplicável) | Harmonizar `formatMeiFiscalErr` / `formatFiscalError` com mensagens Plugnotas agregadas. |
| **§8.1 D1** | `MeiFiscalCapabilityCallout` + CTAs “Rever configuração” | Reforçar alinhamento copy ↔ decisão “documentação + bloqueio honesto”. |
| **§8.1 D3** | (Se implementado) ocultação de segmentos NF-e/NFC-e no seletor | Fora deste spec até haver decisão; apenas requisito de não contradizer **FR-POSQA-05** na área limite. |

---

## 4. Limite de faturamento MEI (**FR-POSQA-05**)

### 4.1 Problema de utilizador

O utilizador pode assumir que **qualquer nota fiscal** emitida pela app (incluindo NF-e/NFC-e) **conta para o teto MEI** mostrado no cartão de limite. A regra de negócio actual agrega **essencialmente NFS-e** (e conforme implementação, linhas legacy).

### 4.2 Localização na página

Manter o cartão **Limite de faturamento (MEI)** na posição já definida no Guia MEI (tipicamente acima ou junto da área de emissão, conforme `GuidesMei.tsx` — **não** mover sem motivo de layout).

### 4.3 *Copy* obrigatória (incremento mínimo)

**A. Linha “Base (MVP)”** (já existe; **alterar** para incluir exclusão explícita):

| Estado | Texto recomendado (pt-BR) |
|--------|----------------------------|
| **Proposto** | **Base (MVP):** soma das **NFS-e** com emissão concluída nesta conta no ano civil {ano}. **Notas NF-e e NFC-e não entram neste total.** |

*Nota de implementação:* substituir a frase actual que só menciona NFS-e, mantendo **“Base (MVP)”** como etiqueta para gestão de expectativas.

**B. Painel expansível “Detalhe da base de cálculo”** (região já existente):

Acrescentar **um parágrafo** no painel (após o texto existente sobre processamento/canceladas), por exemplo:

- *“NF-e e NFC-e seguem regras de ICMS/SEFAZ e não são somadas neste indicador. Se no futuro o produto passar a incluí-las, será anunciado na app.”*

*Condicional:* se o PO decidir **nunca** mostrar a segunda frase, pode omitir a parte “Se no futuro…” e manter só a primeira oração.

**C. Estado vazio** (já existe: “Ainda não há NFS-e autorizadas…”)

Manter o foco em **NFS-e**; **não** mencionar NF-e/NFC-e aqui para não confundir “vazio porque só emitiu NFC-e” — o utilizador que só tem NFC-e deve ler a **Base (MVP)** (secção 4.3 A) para perceber por que o total pode ser zero.

### 4.4 Acessibilidade

- O `aria-live` existente no bloco deve continuar a resumir **apenas** o que o utilizador vê (totais, percentagem, banda) — **não** é necessário ler o parágrafo longo do painel fechado.  
- Ao expandir “Detalhe da base”, foco pode permanecer no botão ou mover para o painel (`role="region"`) — manter padrão actual se já testado.

### 4.5 Critério de aceite (UX)

- [ ] Utilizador consegue responder “NF-e conta para este número?” **sem** abrir ajuda externa: resposta **não**, no texto da base.  
- [ ] Contraste e hierarquia: a exclusão NF-e/NFC-e é legível em **texto normal** (não só `text-xs` de rodapé); preferir a linha **Base (MVP)** em `text-sm` já usada.

---

## 5. Erros de emissão NF-e e NFC-e (**FR-POSQA-06**)

### 5.1 Fluxo de feedback (ordem de leitura)

1. **Validação de formulário (cliente)** — mensagens inline por campo (já existentes no fluxo NF-e/NFC-e).  
2. **Resposta HTTP de erro** — uma **única** região principal de erro **abaixo** do bloco de emissão do tipo seleccionado (padrão actual `GuidesMei`).  
3. **Não** empilhar mais de **duas** faixas de erro simultâneas no mesmo submit (ex.: erro de rede + erro Plugnotas) sem hierarquia: **prioridade** = erro da última acção do utilizador.

### 5.2 Conteúdo da mensagem

| Tipo de falha | O utilizador deve ver | O utilizador **não** deve ver |
|---------------|----------------------|-------------------------------|
| Validação Plugnotas (400) com campos | Lista ou frase com **nomes de campo** compreensíveis (ex.: NCM, CFOP), alinhada ao que o backend já agrega | JSON completo, `x-api-key`, certificado em base64 |
| Empresa/modalidade | Mensagem de **bloqueio de configuração** + CTA para `MeiFiscalCapabilityCallout` ou aba Certificado | “Erro interno” genérico se a API devolve motivo conhecido |
| Rede / timeout | Texto de retry + contacto suporte se persistir | Stack trace |

### 5.3 Componentes

| Componente | Uso |
|------------|-----|
| **String** via `formatMeiFiscalErr` | Caminho único para normalizar `Error` da API para texto apresentável. |
| **`EmissaoFiscalErrorAlert`** (ou equivalente já usado na mesma página) | Quando a mensagem for **longa**, manter **título** com tipo de documento: “NF-e” / “NFC-e” (props `documentTypeLabel`). |
| **`LongFiscalErrorMessage`** (se já usado no Guia MEI para NFS-e) | **Paridade:** NF-e/NFC-e com mensagens > N caracteres devem usar o mesmo padrão de *truncate/expand* que NFS-e, para não quebrar layout mobile. |

### 5.4 *Copy* de prefixo contextual

Para erros devolvidos após `emitirNfe` / `emitirNfce`, o *fallback* genérico deve ser:

- *“Erro ao emitir NF-e.”* / *“Erro ao emitir NFC-e.”* (já alinhado a `docShort` no código).

Quando o corpo contiver detalhes Plugnotas, **prefixar** opcionalmente com uma linha curta:

- *“O emissor fiscal recusou o pedido. Detalhes:”* + mensagem agregada.

Evitar duplicar a palavra “erro” três vezes na mesma faixa.

### 5.5 Critério de aceite (UX)

- [ ] Cenário de teste (fixture ou QA manual): erro 400 com `errors` ou `error.details` mapeado — texto **legível** em pt-BR.  
- [ ] Nenhum *toast* exclusivo para o mesmo erro se a região principal já mostra o detalhe (evitar duplicar atenção), salvo decisão explícita de produto.

---

## 6. Bloqueio de modalidades (alinhamento **§8.1** e **FR-GUIA-FISC-07**)

### 6.1 `MeiFiscalCapabilityCallout`

Manter o comportamento actual (loading / fetch_error / blocked). Para **POSQA** e decisão **D1**:

- O texto de **blocked** deve continuar a **não** culpar a app por “bug”; usar linguagem de **configuração no emissor integrado**.  
- Lista de pré-requisitos: manter curta; se **D2** adicionar fluxo PATCH, acrescentar **um** bullet ou CTA “Concluir configuração” quando existir rota na UI (story futura).

### 6.2 Coerência com limite MEI

Quando o utilizador está **bloqueado** para NF-e mas vê o cartão de limite, não há contradição: o limite continua a refletir **NFS-e** apenas (**FR-POSQA-05**).

---

## 7. Estados e *wireframes* textuais

### 7.1 Cartão limite + emissão NF-e (referência)

```
[ Limite de faturamento (MEI) — ano civil 2026 · …        [ Atenção ] ]
[ barra / valores ]
Base (MVP): soma das NFS-e … **NF-e e NFC-e não entram neste total.**
[ Detalhe da base de cálculo ▼ ]
Aviso: indicador informativo…
---
[ Tipo: NFS-e | NF-e | NFC-e ]
[ MeiFiscalCapabilityCallout se NF-e bloqueado ]
[ Formulário NF-e ]
[ ▶ Erro emissão — alerta com título NF-e + detalhe Plugnotas ]
[ Botão Emitir ]
```

### 7.2 Densidade mobile

- Bloco de erro: largura total, `text-sm`, padding consistente com `admin-alert-danger` / variantes já usadas.  
- Evitar mensagens > ~600 caracteres sem *expand*; seguir componente longo existente.

---

## 8. Acessibilidade (consolidado)

| Requisito | Implementação |
|-----------|----------------|
| Erro de emissão | `role="alert"` na faixa principal de erro de submit (padrão actual). |
| Foco após falha | Foco pode ir para o resumo de erro **ou** primeiro campo com erro — preferir **região de erro** se mensagem for longa (leitor de ecrã lê primeiro o resumo). |
| Cores | Não depender só da cor vermelha; ícone ou texto “Erro” visível (padrão `admin-alert-danger`). |
| Capability | `aria-live="polite"` em loading; `role="alert"` em blocked/error já definidos em `MeiFiscalCapabilityCallout`. |

---

## 9. NFR e observabilidade (lado UI)

| NFR | Implementação UX |
|-----|-------------------|
| **NFR-POSQA-01** | Nunca renderizar variáveis de ambiente ou segredos em *debug panels* visíveis ao utilizador MEI. |
| **NFR-POSQA-02** | Comentário de implementação ou *changelog* da story referencia **FR-POSQA-05/06** e este spec. |
| **NFR-POSQA-03** | Pelo menos um teste de componente ou integração que simula erro NF-e e NFC-e **como o utilizador vê** (texto final). |

---

## 10. Critérios de aceite UX (checklist QA)

- [ ] **FR-POSQA-05:** Texto da base do limite menciona explicitamente que **NF-e e NFC-e não entram** no somatório.  
- [ ] **FR-POSQA-05:** Painel “Detalhe da base” reforça a exclusão ou decisão futura (conforme §4.3 B).  
- [ ] **FR-POSQA-06:** Emissão NF-e falhada mostra mensagem com contexto útil; sem stack trace.  
- [ ] **FR-POSQA-06:** Emissão NFC-e falhada — idem.  
- [ ] Bloqueio por modalidade (`MeiFiscalCapabilityCallout`) permanece compreensível e acionável.  
- [ ] Regressão visual: NFS-e continua com mesma hierarquia de erros que antes (salvo melhoria intencional documentada).

---

## 11. Fora do âmbito deste spec (UI)

- **Runbook E2E** (**FR-POSQA-01/02**): documentação interna; sem novo ecrã.  
- **Reconciliação de story** (**FR-POSQA-04**): processo PO/SM.  
- **Automação CI E2E** (**FR-POSQA-07**): pipeline, não layout.

---

## 12. Change log

| Versão | Data | Notas |
|--------|------|-------|
| 1.0 | 2026-04-07 | Versão inicial a partir do PRD POSQA. |

---

*Próximo passo canónico: **@dev** implementa copy e paridade de erro conforme §4–5; **@qa** valida checklist §10; **@architect** valida se mensagens Plugnotas no payload API já chegam sanitizadas ao cliente.*

— Uma, desenhando com clareza
