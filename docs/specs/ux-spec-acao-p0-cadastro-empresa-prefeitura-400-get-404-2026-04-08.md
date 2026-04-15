# Especificação de front-end e UX — Acção **P0**: fechar cadastro empresa (400 `prefeitura` + cadeia 404)

**Versão:** 1.0  
**Data:** 2026-04-08  
**Autoria:** Uma (UX design expert, fluxo AIOX)  
**Requisitos de origem:** [`docs/prd/PRD-acao-p0-cadastro-empresa-prefeitura-400-get-404-2026-04-08.md`](../prd/PRD-acao-p0-cadastro-empresa-prefeitura-400-get-404-2026-04-08.md) (**FR-P0-OUT-01**, **FR-P0-OUT-02**; alinhamento **FR-P0-SPIKE-01**, **FR-P0-DEC-01**, **FR-P0-DOC-01**; **NFR-P0-REG-01**, **NFR-P0-EV-01**)

**Brief de apoio:** [`docs/brief/brief-acao-p0-cadastro-empresa-prefeitura-400-e-get-404-2026-04-08.md`](../brief/brief-acao-p0-cadastro-empresa-prefeitura-400-e-get-404-2026-04-08.md)

**Relação com outras specs (esta spec não as substitui):**

| Spec | Conteúdo que permanece canónico |
|------|-----------------------------------|
| [`ux-spec-solucao-400-prefeitura-404-get-empresa-mei-2026-04-08.md`](ux-spec-solucao-400-prefeitura-404-get-empresa-mei-2026-04-08.md) | Encadeamento 400→404, estados **SOL-L1–L3**, microcopy causal (**FR-SOL-***) |
| [`ux-spec-plugnotas-nfse-config-prefeitura-payload-2026-04-08.md`](ux-spec-plugnotas-nfse-config-prefeitura-payload-2026-04-08.md) | Variante **PREF-L1**, painel `prefeitura-config`, hints IM (**FR-PREF-UX-01**) |
| [`ux-spec-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md`](ux-spec-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md) | Modo nacional no formulário (**FR-NAT-***) |
| [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md) | Runbook; **FR-P0-DOC-01** pode apontar para âncoras aqui |

**Implementação de referência:** `frontend/src/pages/GuidesMei.tsx`, `guiaMeiEmpresaGetCache.ts`, `frontend/src/services/meiNotasService.ts`, `frontend/src/components/FiscalIntegrationErrorAlert.tsx`, `frontend/src/components/PlugnotasMunicipalRequirementOperacaoCopy.tsx`, `frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts`, `frontend/src/utils/nfEmissionCompany.ts`.

**Nota:** não usar o carácter “§” em *strings* de UI. Em documentação interna, usar “secção”.

---

## 1. Objetivo deste documento

Contrato de **experiência, estados de interface, microcopy condicional e acessibilidade** para cumprir a camada **P0** do PRD:

1. **Resultado honesto:** se o cadastro **não** puder ser concluído pelo app (conta/ambiente/contrato), a UI **não** sugere que basta “tentar de novo” no mesmo fluxo sem acção externa (**FR-P0-OUT-01** — ramo “impossibilidade documentada”).  
2. **Sucesso perceptível:** quando **POST** e **GET** passam a refletir cadastro criado, o utilizador **reconhece** conclusão da fase relevante e o passo seguinte é claro (**FR-P0-OUT-02**).  
3. **Trilhos A–D:** definir **matriz UX** por trilho (PO **FR-P0-DEC-01**) para o @dev não improvisar campos ou promessas.  
4. **Sem regressão de contas nacionais válidas:** fluxos que já funcionam **sem** `nfse.config.prefeitura` mantêm paridade visual e de passos (**NFR-P0-REG-01**).

Não define **schema JSON** nem substitui o spike (**FR-P0-SPIKE-01**); apenas lista **o que a UI precisa** quando o spike fechar cada trilho.

---

## 2. Princípios de UX (P0)

| Princípio | Aplicação |
|-----------|-----------|
| **Promessa alinhada à engenharia** | Se o produto não consegue enviar payload aceite, o texto **não** diz “complete o cadastro aqui em poucos cliques” como única mensagem. |
| **Trilho visível só o necessário** | Utilizador final **não** precisa saber “trilho B”; vê **passos** e **motivos** em linguagem de negócio. |
| **Composição com SOL + PREF** | Erro 400 com `prefeitura`: manter hierarquia **PREF** (bloco principal) + **SOL** (404 causal) conforme regras já escritas nas specs citadas; esta spec acrescenta **P0-L*** abaixo. |
| **PII na UI** | Continua a política do app: não ecoar CNPJ completo em mensagens de erro genéricas se já existir regra de mascaramento; **NFR-P0-EV-01** refere-se a docs/tickets, não a alterar necessariamente a UI. |
| **A11y** | Novos painéis P0: uma **região** com `aria-label` ou título associado; foco não saltar de forma imprevisível após `POST` falhar; evitar **dois** `role="alert"` com texto quase idêntico. |

---

## 3. Gatilhos de interface **P0** (camada adicional)

Usar estes IDs em critérios de aceite / QA junto com **SOL-L*** e **PREF-L1**.

| ID | Condição (lógica de produto; validar com @dev / PO) | Comportamento UX |
|----|------------------------------------------------------|------------------|
| **P0-L1** | PO activou ramo **FR-P0-OUT-01** “impossibilidade”: cadastro automático **não** disponível para este cenário na conta documentada | Mostrar **secção 6** (bloqueio honesto); **desactivar** ou esconder CTAs que impliquem “vai funcionar se só clicar aqui de novo” sem checklist externo; manter link para doc de operação. |
| **P0-L2** | **POST** passou a **2xx** e **GET** retorna dados (cadastro existe) | Mostrar **secção 7** (confirmação de fase); limpar painéis de erro persistentes da tentativa anterior; atualizar cache/estado para **SOL-L0** equivalente. |
| **P0-L3** | Trilho **C** activo: spike definiu campos mínimos de `nfse.config.prefeitura` para UI | Mostrar **secção 8.2** (formulário ou passo guiado); labels e hints **não** contradizem spec PREF (IM ≠ prefeitura config). |
| **P0-L4** | Trilho **D** activo: após 400 PREF-L1, subfluxo guiado (B ou C) | Mostrar **secção 8.3** (entrada no subfluxo sem perder contexto do erro original); um único caminho primário por ecrã. |
| **P0-L0** | Trilho **A** apenas: sem mudança de formulário; problema resolvido no painel/conta | Nenhum bloco P0-L1; copy **PREF + SOL** suficiente; opcional *badge* ou linha “Última tentativa bem-sucedida” desnecessário — não acrescentar ruído (**NFR-P0-REG-01**). |

---

## 4. Matriz UX por trilho (PO **FR-P0-DEC-01**)

| Trilho | Mudança visual esperada | CTA principal | Risco UX se omitido |
|--------|-------------------------|---------------|----------------------|
| **A** — Conta Plugnotas | Mínima: reforçar na copy PREF que o **painel** e o **ambiente** são o primeiro passo obrigatório | Link “guia de operação” + instruções painel (já previstas PREF) | Utilizador em loop infinito de retry no site |
| **B** — Payload derivado | Nenhum campo novo **se** derivação for 100% server-side; opcional *toast* “Dados enviados ao emissor” após sucesso | **Tentar registrar empresa novamente** até 2xx | Expectativa de “escolher prefeitura” quando não há UI |
| **C** — UI explícita | Novos campos ou selector conforme spike (**P0-L3**) | **Salvar e registrar** (rótulo claro) | Conflito com PRD NAT — exigir **nota** no NAT e callout “O emissor exigiu estes dados” |
| **D** — Híbrido | Após 400 PREF-L1, *step* ou *drawer* com opções: verificar painel **ou** preencher dados (**P0-L4**) | Primário conforme subpasso | Dois CTAs competindo — ver secção 8.3 |

---

## 5. Composição com specs **SOL** e **PREF** (regras)

1. **Ordem de leitura no ecrã (PREF-L1 + 404):**  
   - Primeiro: corpo de erro / painel **PREF** (configuração prefeitura NFS-e).  
   - Segundo (se 404 visível): bloco causal **SOL** (secção 4.1 da spec SOL) **ou** linha compacta SOL — **sem** duplicar o parágrafo PREF.  
2. **P0-L1 (impossibilidade)** coloca-se **abaixo** dos blocos acima **ou** substitui CTAs de retry por variantes **secção 6** — nunca **acima** do erro 400 sem o utilizador perceber a causa.  
3. **Regressão:** se **não** há 400 e **GET** 200, **não** mostrar blocos SOL/P0 de “cadastro pendente”.

---

## 6. Microcopy — bloqueio honesto (**P0-L1**, **FR-P0-OUT-01**)

**Quando:** PO aprovou que, para o cenário documentado (conta/ambiente), o app **não** consegue completar o cadastro sem acção fora do produto.

**Título sugerido** (`text-sm font-semibold`):  
*Não foi possível concluir o cadastro automaticamente*

**Corpo** (2–3 frases, tom neutro, sem culpar o utilizador):  
*Neste momento, o emissor fiscal não aceita concluir o registro da empresa só pelos dados que enviamos pelo site. Isso pode depender da configuração da sua conta ou do plano no painel do emissor.*  
*Siga o guia de operação fiscal ou fale com o suporte do emissor antes de tentar de novo.*

**CTAs:**

- Primário: link **Ver guia de operação fiscal** (mesmo *href* que `getNfseNacionalOperacaoHelpHref` / regra existente, se aplicável).  
- Secundário: **Entendi** (fecha ou minimiza o painel) — **não** rotular como “Tentar registrar de novo” se o PRD proibir retry cego.

**O que evitar:** *“Erro no servidor, tente mais tarde”* sem contexto; *“CNPJ inválido”* sem evidência.

**A11y:** `role="region"` com `aria-label` do tipo *Cadastro no emissor fiscal indisponível neste cenário*.

---

## 7. Microcopy e estado — sucesso (**P0-L2**, **FR-P0-OUT-02**)

**Quando:** `POST` empresa com sucesso **e** consulta confirma cadastro (ex.: **GET** com dados).

**Objetivo:** reforçar **fecho da fase** e reduzir cliques repetidos em “registrar novamente”.

| Elemento | Especificação |
|----------|----------------|
| **Feedback** | *Toast* ou *banner* sucinto de sucesso (se ainda não existir): *“Empresa registrada no emissor fiscal.”* — uma vez por transição de estado, não a cada *poll*. |
| **Limpeza visual** | Retirar painel âmbar de retry e painel vermelho de erro da tentativa anterior; estados **SOL-L1/L2** deixam de aplicar. |
| **Próximo passo** | Manter coerência com o Guia MEI (passo seguinte do *wizard* ou secção já existente); **não** inventar novo *celebration* full-page salvo story separada. |

**A11y:** sucesso pode usar `role="status"` com texto curto; **não** usar `alert` para mensagem positiva se já houver padrão de *toast* não intrusivo.

---

## 8. Wireframes textuais (trilhos **C** e **D**)

### 8.1 Estrutura geral (fase 2 — registro empresa)

```
[ Cabeçalho do passo / progresso existente ]

[ Callout modo NFS-e Nacional — spec NAT, se aplicável ]

[ Formulário emitente existente ]

  --- P0-L3: bloco opcional “Dados pedidos pelo emissor” ---
  [ Campos definidos pelo spike: labels + hints + validação local mínima ]
  -------------------------------------------------------------

[ CTA primário: Registrar / Salvar e registrar ]

[ Painel erro POST — PREF / genérico ]

[ Painel encadeamento 404 — SOL, se aplicável ]

[ Painel P0-L1 impossibilidade — secção 6, se aplicável ]
```

### 8.2 Trilho **C** (campos explícitos)

- Bloco **“Dados pedidos pelo emissor”** **acima** do CTA de envio, **abaixo** do callout nacional.  
- *Hint* do bloco (1 linha): *“O emissor pediu estes dados além do endereço e do CNPJ. Eles são diferentes da inscrição municipal opcional acima.”*  
- Campos: placeholders e validação **definidos pelo spike** (não preencher nesta spec).

### 8.3 Trilho **D** (híbrido)

- Após **400** PREF-L1, inserir **card** ou **passo** com duas colunas lógicas (mobile: empilhado):  
  1. *“Verificar no painel do emissor”* (bullet curto + link doc).  
  2. *“Se o painel estiver certo, preencha os dados abaixo”* → revela bloco 8.2.  
- **Um** CTA primário por vista: ou “Continuar para painel” (*link* externo) ou “Preencher dados do emissor” (*scroll* para bloco), conforme PO — evitar dois botões primários com peso visual igual.

---

## 9. Requisitos de front-end mapeados (aceite UX)

| PRD | Critério verificável na UI |
|-----|----------------------------|
| **FR-P0-OUT-01** | Existe estado **P0-L1** com copy **secção 6** **ou** fluxo completo até sucesso sem promessa falsa. |
| **FR-P0-OUT-02** | Estado **P0-L2** com feedback **secção 7** e ausência de mensagens de “não encontrado” indevidas. |
| **FR-SOL-DIAG-01**, **FR-SOL-404-01** | Mantidos via spec **SOL**; P0 não os enfraquece. |
| **FR-PREF-UX-01** | Mantido via spec **PREF**; trilho **C** acrescenta campos **sem** dizer que IM resolve `prefeitura`. |
| **NFR-P0-REG-01** | Cenário “só nacional” sem campos novos: paridade com **P0-L0**; *screenshot* ou checklist QA antes/depois. |

---

## 10. Acessibilidade e componentes

| Tópico | Especificação |
|--------|----------------|
| **Componentes** | Reutilizar `FiscalIntegrationErrorAlert`, painéis existentes em `GuidesMei.tsx`; **P0-L1** pode ser variante nova ou *slot* no painel de retry — decisão @dev com menor duplicação. |
| **Foco** | Ao falhar **POST**, foco vai para o resumo de erro (padrão actual); **P0-L1** não deve roubar foco do erro 400 na primeira pintura. |
| **Contraste** | Bloco impossibilidade: mesmo sistema de cores de *warning* / *neutral* já usado no Guia MEI (âmbar vs vermelho para erro validação). |

---

## 11. Entregáveis para @dev / @qa

1. Lista de estados **P0-L0–L4** com condições no *code* ou *feature flag* alinhadas a **FR-P0-DEC-01**.  
2. *Strings* finais em PT-BR revisadas com PO para **secção 6** e **7** (ajustes de tom).  
3. Casos de teste QA: (a) PREF-L1 + 404 + sem P0-L1; (b) P0-L1 activo; (c) P0-L2 após sucesso; (d) trilho C com campos vazios / válidos; (e) regressão NFR-P0-REG-01.

---

## 12. Rastreabilidade PRD → spec

| PRD | Secções desta spec |
|-----|-------------------|
| **FR-P0-OUT-01** | 1, 3 **P0-L1**, 6, 9 |
| **FR-P0-OUT-02** | 1, 3 **P0-L2**, 7, 9 |
| **FR-P0-DEC-01** | 4, 8, 11 |
| **FR-P0-DOC-01** | Links operação / guia (6) |
| **NFR-P0-REG-01** | 2, 3 **P0-L0**, 4 trilho **A**, 9 |

---

## 13. Change log

| Data | Nota |
|------|------|
| 2026-04-08 | Versão inicial a partir do **PRD P0**; complementa **ux-spec SOL** e **ux-spec PREF** com estados **P0-L***, trilhos A–D, bloqueio honesto e sucesso de fase. |
