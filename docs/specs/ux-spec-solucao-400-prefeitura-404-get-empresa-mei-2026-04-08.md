# Especificação de front-end e UX — Encadeamento **400** (`prefeitura`) → **404** (`GET` empresa) no setup Plugnotas

**Versão:** 1.0  
**Data:** 2026-04-08  
**Autoria:** Uma (UX design expert, fluxo AIOX)  
**Requisitos de origem:** [`docs/prd/PRD-solucao-400-prefeitura-404-get-empresa-mei-2026-04-08.md`](../prd/PRD-solucao-400-prefeitura-404-get-empresa-mei-2026-04-08.md) (**FR-SOL-DIAG-01**, **FR-SOL-DIAG-02**, **FR-SOL-404-01**, **FR-SOL-ANT-01**, **FR-SOL-PLAY-01**; alinhamento a **FR-PREF-*** via spec PREF)

**Brief de apoio:** [`docs/brief/brief-solucao-400-prefeitura-e-404-get-empresa-2026-04-08.md`](../brief/brief-solucao-400-prefeitura-e-404-get-empresa-2026-04-08.md)

**Relação com outras specs e código:**

- **Erro `nfse.config.prefeitura` / variante PREF-L1:** [`docs/specs/ux-spec-plugnotas-nfse-config-prefeitura-payload-2026-04-08.md`](ux-spec-plugnotas-nfse-config-prefeitura-payload-2026-04-08.md) — copy principal do 400 municipal/config (**FR-PREF-UX-01**), hint IM, secção 5.4 (404 após falha). **Esta spec** aprofunda a **narrativa causal** entre os dois HTTP, **estados distintos de 404** e **antipadrões de linguagem** (**FR-SOL-ANT-01**), sem duplicar o bloco §5.1 da spec PREF.  
- **NFS-e Nacional / erros genéricos:** [`docs/specs/ux-spec-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md`](ux-spec-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md).  
- **Orquestração certificado + empresa:** [`docs/specs/ux-spec-empresa-plugnotas-orquestrada-cadastro-certificado-2026-04-07.md`](ux-spec-empresa-plugnotas-orquestrada-cadastro-certificado-2026-04-07.md).  
- **Operação:** [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md) — **FR-SOL-DIAG-01** / **FR-SOL-ANT-01** (entrega documental; esta spec define copy e estados espelhados na UI).  
- **Implementação de referência:** `frontend/src/pages/GuidesMei.tsx`, *hooks* de fetch empresa + painéis de erro; `apiClient` / camada que trata 404 em `GET …/emissao-fiscal/empresa`.

**Nota:** não usar o carácter “§” em *strings* de UI. Em documentação interna, usar “secção” ou número do PRD/spec.

---

## 1. Objetivo deste documento

Contrato de **experiência, microcopy, estados de interface e acessibilidade** para:

1. O utilizador **não** interpretar o **404** no `GET` empresa como “falha só da consulta” **quando** o contexto é setup pós-tentativa de cadastro — ligar mentalmente ao **POST** que pode ter falhado (**FR-SOL-DIAG-01**, **FR-SOL-404-01**).  
2. Equipa e QA terem **gatilhos nomeados** (SOL-L1, SOL-L2, SOL-L3) para combinar mensagem de erro **400**, estado de **404** e *empty state* **frio**.  
3. **Antipadrões** de texto na UI alinhados ao brief/PRD (**FR-SOL-ANT-01**) — o que **não** dizer ao utilizador.  
4. **Playbook** visível ao utilizador **só** ao nível de “primeiro passo” (painel, ambiente, suporte), sem substituir o runbook longo (**FR-SOL-PLAY-01**); detalhe técnico B/C/D permanece no **PRD PREF** e na spec PREF secção 7.

Serve para critérios de aceite de story, *file list* e QA de conteúdo; **não** define schema JSON.

---

## 2. Princípios de UX

| Princípio | Aplicação |
|-----------|-----------|
| **Uma causa, dois sintomas** | Explicar em linguagem simples: sem cadastro criado no emissor, a **consulta** pode responder “não encontrado” — **não** culpar o CNPJ sem contexto. |
| **Ordem cognitiva** | Primeiro: resolver o **erro de envio** (400 ou outro) **ou** concluir o envio com sucesso; **depois** esperar que a **consulta** mostre dados. |
| **Sem jargão HTTP na linha de frente** | Títulos para o utilizador falam em “cadastro”, “registro da empresa”, “emissor”; detalhe técnico opcional em bloco colapsável (já padrão no Guia MEI). |
| **Coexistência com PREF** | Se a mensagem citar `nfse.config.prefeitura`, o **corpo principal** do 400 continua a spec PREF **secção 5.1**; esta spec acrescenta **framing** de sequência e **404** quando aplicável. |
| **A11y** | 404 contextual: `role="status"` ou região com `aria-label` se não for `role="alert"`; evitar dois `alert` com o mesmo texto. |

---

## 3. Arquitetura de informação — gatilhos SOL

### 3.1 Área afetada (MVP)

**Workspace:** Guia MEI — fluxo **fase 2** (registro da empresa no emissor), incluindo:

- Estados após **`POST` empresa** falhado (400 ou outro 4xx/5xx).  
- Estados após **`GET` empresa** com **404** (cadastro ainda inexistente na conta Plugnotas).  
- *Empty state* quando ainda **não** houve tentativa de `POST` nesta sessão (primeira visita à secção).

### 3.2 Matriz de estados (prioridade para copy)

| ID | Condição (lógica de produto; validar com @dev) | Comportamento UX |
|----|--------------------------------------------------|------------------|
| **SOL-L1** | Último resultado relevante na fase 2: **`POST` falhou** (ex.: 400 com `prefeitura` ou outra validação) **e** UI faz ou refaz **`GET` 404** | Mostrar **secção 5.1** (encadeamento) **em conjunto** com o painel de erro do POST; **não** mostrar só “empresa não encontrada” como única mensagem. |
| **SOL-L2** | **`POST` falhou** (qualquer erro), utilizador navega para estado que mostra 404 **sem** painel de erro visível (ex.: recarregar página, outro passo) | *Banner* ou *empty state* **secção 5.2** — recordar que o cadastro **não foi concluído** e que houve ou pode haver erro a tratar. |
| **SOL-L3** | **`GET` 404** e **não** há registo de tentativa de `POST` falhado neste fluxo (primeira vez, ou sessão limpa) | Copy **neutra** **secção 5.3** — convite a concluir o registro; **sem** afirmar que “houve erro” sem evidência. |
| **SOL-L0** | **`POST` 2xx** e **`GET` 200** | Estado de sucesso existente; sem alteração desta spec além de consistência de labels. |

**Nota:** a detecção de “último POST falhou” vs “sessão limpa” é **critério técnico** (estado global, *query cache*, *timestamp*); a spec exige **comportamento** por estado, não implementação.

---

## 4. Microcopy — encadeamento **POST** → **GET** (**FR-SOL-DIAG-01**)

**Objetivo:** uma frase curta que ligue **causa** (cadastro não criado) e **efeito** (consulta vazia/404).

### 4.1 Bloco auxiliar “Por que aparece ‘não encontrado’?” (SOL-L1)

**Quando:** painel de erro do **POST** ainda visível **e** UI mostra mensagem derivada do **404** (ou *empty* de consulta).

**Título sugerido** (`text-sm font-semibold`):  
*Cadastro ainda não foi criado no emissor*

**Corpo** (1–2 frases, `text-sm text-slate-600 dark:text-slate-300`):  
*Enquanto o registro da empresa não for concluído com sucesso, a consulta pode mostrar que a empresa não foi encontrada. Isso não indica problema com o seu CNPJ em si — indica que o passo anterior precisa ser corrigido ou tentado de novo.*

**O que evitar neste bloco:** explicar `nfse.config.prefeitura` em detalhe (isso fica na spec PREF §5.1 quando a mensagem do servidor citar esse campo).

### 4.2 Versão curta (linha única sob o título de erro 404, SOL-L1 compacto)

*O cadastro no emissor ainda não foi concluído. Veja a mensagem de erro acima e tente registrar de novo.*

---

## 5. Microcopy — **404** no setup (**FR-SOL-404-01**)

### 5.1 SOL-L2 — 404 sem painel de erro visível (sessão / navegação)

**Título sugerido:**  
*Registro da empresa ainda pendente*

**Corpo:**  
*A consulta não encontrou a empresa no emissor fiscal. Se você já tentou enviar os dados e viu uma mensagem de erro, resolva esse ponto primeiro e use “Tentar registrar empresa novamente”. Só depois a consulta deve mostrar os dados.*

**CTA:** reutilizar **Tentar registrar empresa novamente** e **Editar dados** conforme spec orquestrada; link **Ver guia de operação fiscal** quando `shouldOfferNfseNacionalOperacaoDocHint` ou equivalente for verdadeiro.

### 5.2 SOL-L3 — 404 “frio” (sem histórico de falha conhecido)

**Título sugerido:**  
*Conclua o registro da empresa*

**Corpo:**  
*Para aparecer aqui, a empresa precisa ser registrada no emissor fiscal com os dados que você informar abaixo. Preencha o formulário e envie.*

**Evitar:** *“Empresa não encontrada — verifique o CNPJ”* como única mensagem **neste** fluxo de setup.

### 5.3 Coexistência com spec PREF secção 5.4

A spec PREF já propõe microcopy para 404 após POST falhado. **Regra de composição:**

- Se **PREF-L1** (erro `prefeitura`) estiver activo, mostrar **primeiro** o bloco PREF **§5.1**, **depois** (se necessário) **secção 4.1 desta spec** ou **5.1 compacto** para reforçar o 404 — **sem** repetir o mesmo parágrafo duas vezes.  
- Se o erro **não** for PREF-L1 mas houver **POST** falhado + 404, usar **PREF §5.4** **ou** **secção 5.1/5.2 desta spec**, consoante o que o @dev unificar num único componente.

---

## 6. Antipadrões de linguagem na UI (**FR-SOL-ANT-01**)

Não usar como **única** ou **principal** linha para o utilizador final:

| Antipadrão | Porquê |
|------------|--------|
| *“A API de consulta falhou”* / *“Erro 404”* | Desvia foco do **cadastro**; reservar detalhe HTTP a bloco técnico colapsável. |
| *“CNPJ inválido”* ou *“CNPJ não encontrado”* **sem** contexto de setup | No fluxo MEI o CNPJ costuma ser o do utilizador; o 404 indica **ausência de registro**, não necessariamente dígito errado. |
| *“Preencha a inscrição municipal para resolver”* quando o erro do servidor citar **`nfse.config.prefeitura`** | Contradiz **FR-PREF-UX-01** e **FR-SOL-ANT-01** do PRD. |
| *“Ative NFS-e Nacional e o erro desaparece”* como promessa absoluta | **NFR-N04**: não garantir para todas as contas; usar linguagem condicional (“em muitos casos”, “confira no painel”) como na spec PREF. |
| *“Só atualize a página”* como única acção | Não cria empresa; pode mascarar o **POST** falhado. |

---

## 7. Playbook utilizador — primeiro passo (**FR-SOL-PLAY-01**)

**Objetivo:** uma **lista curta** (máx. 3 itens) opcional em *tooltip*, *details* ou link “O que fazer agora?” **sem** duplicar o runbook completo.

**Conteúdo sugerido (ordem fixa):**

1. *No painel Plugnotas, confira se NFS-e Nacional está ativo para este CNPJ e se o ambiente (produção ou homologação) corresponde ao que o site usa.*  
2. *Se apareceu mensagem de erro ao enviar, leia o texto da mensagem — ele indica o que o emissor pediu.*  
3. *Se tudo parecer correto, use o suporte Plugnotas ou o guia de operação fiscal.*

**Não** incluir neste bloco passos técnicos de trilho **B/C/D** até o PO activar **FR-PREF-API-01** (ver spec PREF secção 7).

---

## 8. Rastreabilidade PRD SOL → UX

| ID PRD | Entrega UX (esta spec) |
|--------|-------------------------|
| **FR-SOL-DIAG-01** | Secções **4**, **5**, link operação; doc operacional espelha a mesma narrativa. |
| **FR-SOL-DIAG-02** | Estado **SOL-L0** (sucesso); QA **secção 11**. |
| **FR-SOL-404-01** | Secções **3.2** (SOL-L1–L3), **5** |
| **FR-SOL-ANT-01** | Secção **6** |
| **FR-SOL-PLAY-01** | Secção **7** |
| **FR-PREF-UX-01** | Mantém spec PREF **§5.1**; esta spec **compõe** com **§4–5** aqui. |

---

## 9. Wireframes textuais

### 9.1 SOL-L1 — POST 400 (PREF-L1) + área de consulta com 404

```
[ Painel erro POST — detalhe técnico colapsável ]

[ ▶ Cadastro ainda não foi criado no emissor ]     ← §4.1 desta spec
[   1–2 frases encadeamento                         ]

[ Bloco PREF §5.1 — configuração prefeitura NFS-e ]  ← spec PREF

[ … campos … ]

[ Editar dados ] [ Tentar registrar empresa novamente ]
[ Link guia operação fiscal ]
```

### 9.2 SOL-L2 — só 404 (utilizador perdeu o painel de erro)

```
[ Registro da empresa ainda pendente ]            ← §5.1 SOL-L2
[ Corpo + CTAs + link guia ]

[ … campos … ou estado mínimo … ]
```

### 9.3 SOL-L3 — primeiro acesso, 404

```
[ Conclua o registro da empresa ]                 ← §5.2 SOL-L3
[ Corpo convite ]

[ Formulário ]
```

---

## 10. Checklist de QA (conteúdo e estados)

1. **SOL-L1:** Simular POST 400 `fields.nfse.config.prefeitura` + GET 404 → utilizador vê PREF **§5.1** **e** encadeamento **secção 4.1** (ou linha compacta **4.2**) **sem** “CNPJ não encontrado” sozinho.  
2. **SOL-L2:** Após POST falhado, navegar de forma a esconder o painel vermelho → *empty* ou banner **secção 5.1 SOL-L2** com CTA de retry.  
3. **SOL-L3:** Limpar estado / primeira visita com GET 404 → copy **5.2 SOL-L3**, **sem** “houve erro” sem evidência.  
4. **FR-SOL-ANT-01:** Nenhum dos antipadrões da **secção 6** como mensagem principal.  
5. **Playbook secção 7:** Se visível, três passos na ordem A → mensagem → suporte/guia.  
6. Tema escuro e leitor de ecrã: uma hierarquia clara (título de região + corpo); não triplicar o mesmo texto em três `alert`.

---

## 11. Lista de ficheiros prováveis (@dev)

1. `frontend/src/pages/GuidesMei.tsx` (ou componente extraído do fluxo empresa) — ramificação **SOL-L1 / L2 / L3** na renderização pós-`GET` 404.  
2. Estado global ou *hook* que preserve “último POST fase 2 falhou” vs “nunca tentou POST” (**critério 3.2**).  
3. Testes RTL ou unitários: 404 após POST falhado → texto de encadeamento presente; 404 frio → copy **5.2**.  
4. `docs/operacao-mei-nfse.md` — âncora nova opcional `#cadastro-post-404-get-empresa` alinhada a **FR-SOL-DIAG-01** (entrega doc; conteúdo mínimo em parágrafos espelhando **secção 4**).

---

## Change log

| Data | Autor | Nota |
|------|-------|------|
| 2026-04-08 | Uma | Spec inicial a partir do PRD `PRD-solucao-400-prefeitura-404-get-empresa-mei-2026-04-08.md`; complementa `ux-spec-plugnotas-nfse-config-prefeitura-payload-2026-04-08.md` (PREF §5.4). |
