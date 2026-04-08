# Especificação de front-end e UX — **Empresa Plugnotas orquestrada** no cadastro de certificado

**Versão:** 1.0  
**Data:** 2026-04-07  
**Autoria:** Uma (UX design expert / fluxo AIOX)  
**Requisitos de origem:** [`docs/prd/PRD-empresa-plugnotas-orquestrada-cadastro-certificado-2026-04-07.md`](../prd/PRD-empresa-plugnotas-orquestrada-cadastro-certificado-2026-04-07.md) (**FR-ORQ-CERT-***, **NFR-ORQ-CERT-***, **CR-ORQ-CERT-***)  
**Brief de apoio:** [`docs/brief/brief-empresa-plugnotas-orquestrada-no-cadastro-certificado-2026-04-07.md`](../brief/brief-empresa-plugnotas-orquestrada-no-cadastro-certificado-2026-04-07.md)

**Relação com specs e código de referência:**

- **Documentos ativos (cadastro):** [`docs/specs/ux-spec-cadastro-empresa-documentos-ativos-plugnotas-2026-04-07.md`](ux-spec-cadastro-empresa-documentos-ativos-plugnotas-2026-04-07.md) — validação mínima de tipos, `fieldset`, ordem vertical; **esta spec** assume que o utilizador **já cumpriu** essas regras **antes** de concluir o envio com certificado (**FR-ORQ-CERT-01** + **FR-CAD-DOC-03**).  
- **Atualização posterior documentos ativos:** [`docs/specs/ux-spec-atualizacao-posterior-documentos-ativos-plugnotas-supabase-2026-04-07.md`](ux-spec-atualizacao-posterior-documentos-ativos-plugnotas-supabase-2026-04-07.md) — não alterar fluxos **independentes** de atualização (**FR-ORQ-CERT-07**).  
- **Padrões Guia MEI:** [`docs/specs/ux-spec-meu-mei-ui-2026-03-30.md`](ux-spec-meu-mei-ui-2026-03-30.md) — workspace, tokens, hierarquia.  
- **Operação fiscal:** [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md) — erros 404/409, ambientes; texto de ajuda para utilizador **sem** jargão de método HTTP na UI.  
- **Implementação de referência (pré-mudança):** `frontend/src/pages/GuidesMei.tsx` — bloco de certificado + empresa; `frontend/src/services/meiNotasService.ts` — `cadastrarCertificadoEmissaoNf`, `cadastrarEmpresaEmissaoNf`; `frontend/src/utils/nfEmissionCompany.ts` — validação e payload.

**Nota:** não usar o carácter “§” em *strings* de UI. Em documentação interna, referir “secção” ou número do PRD.

---

## 1. Objetivo deste documento

Contrato de **experiência, hierarquia, comportamento, microcopy, estados (incluindo duas fases de submissão), erro parcial, retry e acessibilidade** para:

1. **Um CTA principal** que inicia a sequência certificado → empresa (**FR-ORQ-CERT-02**, PRD §6.5).  
2. **Bloqueio** da conclusão até emitente + (quando existir) documentos ativos válidos (**FR-ORQ-CERT-01**).  
3. **Progresso em duas fases** perceptível durante o *loading* (**FR-ORQ-CERT-03**).  
4. **Mensagem única de sucesso** quando ambas as fases terminam (**FR-ORQ-CERT-04**).  
5. **Erro na fase 2** com explicação honesta + **“Tentar registrar empresa novamente”** (**FR-ORQ-CERT-05**).  
6. **409** no certificado: continuação automática para empresa no mesmo marco, com copy coerente (**FR-ORQ-CERT-06**, PRD §6.4).  
7. **Não regressão** do fluxo “Atualizar cadastro (sem novo certificado)” (**FR-ORQ-CERT-07**).

Serve para critérios de aceite, *file list* e QA; **não** substitui contrato JSON de resposta do certificado nem ordem exata de campos no `POST` empresa (**@architect** / story).

---

## 2. Princípios de UX

| Princípio | Aplicação |
|-----------|-----------|
| **Uma intenção, duas operações** | O utilizador pensa em **“concluir configuração fiscal”**; a app executa duas chamadas mas **não** pede segundo clique oculto. |
| **Ordem mental = ordem de formulário** | Primeiro **dados do emitente** (e tipos ativos, se aplicável), **depois** ficheiro e senha do certificado — ou, se a ordem visual actual for certificado antes dos dados, **gating** no CTA final: nenhum envio até **tudo** válido (PRD §6.1). A spec **recomenda** validação global no **CTA único**, independentemente da ordem visual dos blocos. |
| **Transparência nas fases** | Durante o envio, texto explícito: envio do certificado → registro da empresa no emissor. |
| **Honestidade no erro parcial** | Se a empresa falhar, **não** esconder que o certificado pode já estar no Plugnotas; oferecer retry **sem** novo `.pfx` quando o ID for conhecido. |
| **Anti-duplo-clique** | CTA primário desabilitado durante `phase1` e `phase2`; *spinner* visível (**NFR-ORQ-CERT-03**). |
| **A11y** | Mudanças de fase e erros anunciados (`aria-live` — **NFR-ORQ-CERT-04**). |

---

## 3. Arquitetura de informação (IA)

### 3.1 Área afetada

**Workspace:** Guia MEI — tab/área onde hoje existem upload `.pfx`, senha, CNPJ, formulário de emitente, documentos ativos (se implementados), botões *Consultar* / *Atualizar* / *Enviar* / *Remover*.

### 3.2 Hierarquia de ações (MVP)

| Nível | Elemento | Comportamento |
|-------|----------|----------------|
| **ORQ-L0** | **CTA primário único** | Rótulo canónico sugerido: **“Concluir configuração fiscal”** (ou **“Enviar certificado e registrar empresa”** se PO preferir mais literal). **Substitui** ou **desloca** o significado exclusivo de *“Enviar certificado”* como único fim de fluxo no **primeiro cadastro** — ver §3.3. |
| **ORQ-L1** | Ações secundárias | *Consultar cadastro no emissor*, *Atualizar cadastro (sem novo certificado)*, *Remover certificado* — **inalteradas** em disponibilidade e estilo visual base; não podem exigir o novo CTA para funcionar (**FR-ORQ-CERT-07**). |
| **ORQ-L2** | *Upload* + campos | Permanecem no *scroll*; utilizador pode preencher em qualquer ordem, mas o **CTA primário** só activa quando §4.2 satisfeito. |

### 3.3 Relação com o botão “Enviar certificado” existente

**Decisão de UX (MVP):**

| Opção A (recomendada) | Renomear o botão principal para **“Concluir configuração fiscal”** e, no *tooltip* ou linha de apoio sob o botão, texto: *“Envia o certificado e registra os dados do emitente no serviço de emissão.”* |
| Opção B | Manter rótulo **“Enviar certificado”** mas acrescentar **subtítulo** visível acima da barra de ações com a mesma explicação de duas operações; risco: utilizador achar que só envia ficheiro. |

**Recomendação:** **Opção A** para alinhar à visão do PRD §2.

### 3.4 Ordem de leitura recomendada (conteúdo estático)

1. Avisos legais / certificado A1 (existentes).  
2. **Documentos ativos** (se na UI — spec cadastro).  
3. Dados mínimos do emitente (título dinâmico — spec cadastro).  
4. Upload `.pfx` + senha + email opcional.  
5. **Bloco de progresso** (só visível durante submissão — §5.2).  
6. Barra de ações (CTA primário + secundários).

*Nota:* se a ordem visual actual for diferente, o **gating** no CTA (§4.2) garante o requisito de produto; uma **iteração P1** pode reordenar blocos para coincidir com a ordem mental.

---

## 4. Estados da interface (máquina de experiência)

### 4.1 Estados resumidos

| ID | Estado | CTA primário | Fase anunciada |
|----|--------|--------------|----------------|
| **E0** | Formulário em edição | Habilitado **somente** se §4.2 OK; caso contrário desabilitado *ou* com *tooltip* “Preencha os campos obrigatórios” | — |
| **E1** | `phase1` — certificado em curso | Desabilitado | **1 de 2** — enviando certificado |
| **E2** | `phase2` — empresa em curso | Desabilitado | **2 de 2** — registrando empresa no emissor |
| **E3** | Sucesso completo | Volta a E0 ou mostra *toast* + ecrã de sucesso conforme padrão actual | Concluído |
| **E4** | Falha em `phase1` | Habilitado após limpar erro (dados intactos) | Erro fase 1 |
| **E5** | Falha em `phase2` (certificado OK) | **Substituído** por **“Tentar registrar empresa novamente”** (primário) + secundário *“Fechar”* / *“Editar dados”* se aplicável | Erro fase 2 |
| **E6** | Retry `phase2` em curso | Desabilitado | **2 de 2** — registrando empresa no emissor |

### 4.2 Pré-condições para habilitar o CTA (**FR-ORQ-CERT-01**)

| Verificação | Origem UX |
|-------------|-----------|
| Formulário emitente válido | Mesma regra que `getNfEmissionCompanyValidationMessage` / `buildNfEmissionEmpresaPayload` (ou sucessor) — lista exacta na story. |
| Ficheiro `.pfx` selecionado | Input de ficheiro não vazio. |
| Senha do certificado não vazia | Campo senha preenchido. |
| Documentos ativos | Se a secção existir: pelo menos um tipo (**FR-CAD-DOC-03**); mensagem alinhada à spec de cadastro. |
| CNPJ coerente | 14 dígitos quando exigido pelo fluxo actual. |

**Feedback quando CTA desabilitado:**

- Preferir **linha de ajuda** estática abaixo do botão: *“Preencha todos os campos obrigatórios e selecione o certificado para continuar.”*  
- Opcional: ao *hover* no botão desabilitado, *tooltip* com o **primeiro** bloqueio detectado (acessível também via mensagem visível para não depender só de *hover*).

### 4.3 Persistência do `certificadoId` no cliente (**FR-ORQ-CERT-05**)

| Momento | Armazenamento sugerido |
|---------|-------------------------|
| Após resposta **200** de `cadastrarCertificadoEmissaoNf` com `data.id` | Estado React (`useRef` + `useState`) **na montagem do fluxo**; **não** `localStorage` para o ID (reduz superfície; sessão basta para retry imediato). |
| Após **409** resolvido com ID recuperado | Mesmo estado; tratar como sucesso de fase 1 para efeitos de copy (**FR-ORQ-CERT-06**). |
| Utilizador navega para outra tab e volta | Se o produto **não** persistir ID, mostrar mensagem *“Para tentar novamente, pode ser necessário reenviar o certificado.”* — edge case na story (**PRD** risco ID inválido). |

---

## 5. Componentes e padrões visuais

### 5.1 Indicador de duas fases (**FR-ORQ-CERT-03**)

**Durante E1 e E2**, exibir **um** bloco compacto acima do CTA ou sob a barra de ações:

| Elemento | Especificação |
|----------|----------------|
| **Layout** | Linha horizontal: ícone de *loading* + texto da fase; opcional *stepper* textual “1/2” e “2/2” sem cores que dependam só de cor para significado. |
| **Fase 1 — copy** | **“Enviando certificado digital…”** |
| **Fase 2 — copy** | **“Registrando empresa no emissor fiscal…”** |
| **Transição** | Sem *flash* brusco: trocar só o texto; manter altura mínima fixa (~24–32px) para evitar *layout shift*. |

**Dark mode:** reutilizar tokens `text-slate-*` / `dark:` já usados no bloco fiscal do `GuidesMei.tsx`.

### 5.2 Sucesso completo (**FR-ORQ-CERT-04**)

| Aspecto | Especificação |
|---------|----------------|
| **Componente** | Reutilizar padrão actual de sucesso (*toast* `admin-*` ou *banner* verde existente no fluxo MEI). |
| **Copy sugerida** | **“Certificado e dados do emitente foram enviados ao serviço de emissão.”** |
| **Evitar** | “POST”, “API”, “Plugnotas” em destaque na primeira linha (pode aparecer em ajuda secundária: *“Você pode conferir no painel do emissor fiscal.”*). |
| **409 + sucesso** | Se o certificado **não** foi criado de novo mas apenas reutilizado: variante de copy: **“Seu certificado já estava no emissor; os dados do emitente foram registrados.”** — só quando o backend distinguir de forma fiável (**@architect**); caso contrário, usar mensagem única genérica de sucesso para não contradizer PRD §6.4. |

### 5.3 Erro na fase 1 (**E4**)

- Reutilizar componente de erro fiscal existente (`fiscalUserError` / *banner* vermelho).  
- Copy: manter mensagem **já mapeada** pelo backend; não inventar códigos novos na UI.  
- Foco: mover para a região `role="alert"` ou primeiro campo relacionado se o erro for de validação.

### 5.4 Erro na fase 2 — parcial (**E5**, **FR-ORQ-CERT-05**)

| Elemento | Especificação |
|----------|----------------|
| **Banner** | Tom **atenção** (âmbar) ou **erro** conforme gravidade; **título** curto: **“Não foi possível concluir o registro da empresa”**. |
| **Corpo** | **“O certificado pode já ter sido enviado ao emissor fiscal. Os dados do emitente não foram concluídos. Você pode tentar registrar a empresa novamente sem enviar o arquivo outra vez.”** |
| **CTA primário** | **“Tentar registrar empresa novamente”** — dispara **apenas** `cadastrarEmpresaEmissaoNf` com `certificado` = ID em memória + mesmo payload de empresa. |
| **CTA secundário** | **“Editar dados”** (opcional) — colapsa erro, foco no formulário. |
| **Ajuda terciária** | Link discreto: *“Ver guia de operação fiscal”* → rota interna ou `operacao-mei-nfse.md` renderizado como ajuda (sem obrigar leitura). |

### 5.5 Retry esgotado ou erro não recuperável

- Mensagem: *“Se o problema continuar, verifique se o CNPJ e o ambiente (sandbox/produção) coincidem com o painel do emissor ou fale com o suporte.”*  
- Não exigir novo `.pfx` **enquanto** o ID for considerado válido; se o backend devolver código específico de certificado inválido, mostrar caminho para **novo envio** (story).

---

## 6. Acessibilidade (**NFR-ORQ-CERT-04**)

| Requisito | Implementação |
|-----------|----------------|
| Anúncio de fase | Região `aria-live="polite"` com texto **completo** da fase atual (“Enviando certificado digital…”, depois “Registrando empresa…”). **Evitar** anunciar só “2” sem contexto. |
| Submissão | Botão primário com `aria-busy={true}` durante E1/E2/E6. |
| Erro fase 2 | `role="alert"` no banner; foco programático no título do alerta ou no primeiro botão do alerta (decisão única na story). |
| Progresso visual | Se usar *progressbar*, `aria-valuenow` / `max` coerentes com 50% fase 1 e 100% fase 2; senão, preferir texto + *spinner* com *live region*. |
| Contraste | Ícones e textos de fase cumprem WCAG AA no tema claro e escuro (ver *spot-check* do repo se existir). |

---

## 7. Microcopy — tabela de referência

| Contexto | Texto sugerido (pt-BR) |
|----------|-------------------------|
| Ajuda estática sob CTA (E0 desabilitado) | *“Preencha todos os campos obrigatórios e selecione o certificado para continuar.”* |
| Fase 1 | *“Enviando certificado digital…”* |
| Fase 2 | *“Registrando empresa no emissor fiscal…”* |
| Sucesso | *“Certificado e dados do emitente foram enviados ao serviço de emissão.”* |
| Erro parcial (título) | *“Não foi possível concluir o registro da empresa”* |
| Erro parcial (corpo) | *“O certificado pode já ter sido enviado ao emissor fiscal. Os dados do emitente não foram concluídos.”* |
| Retry | *“Tentar registrar empresa novamente”* |
| *Tooltip* CTA (opcional) | *“Envia o certificado e registra o emitente no serviço de emissão.”* |

*(PO pode afinar tom “você” vs “o seu”; manter frases curtas.)*

---

## 8. Integração front-end (orientação para @dev)

| Tópico | Orientação |
|--------|------------|
| **Sequência** | `await cadastrarCertificadoEmissaoNf(...)` → extrair `id` de `data` → `await cadastrarEmpresaEmissaoNf({ ...payload, certificado: id })`. |
| **Estado** | `submissionPhase: 'idle' \| 'cert' \| 'empresa' \| 'retry-empresa'` (exemplo); transições explícitas. |
| **Payload empresa** | Reutilizar `buildNfEmissionEmpresaPayload` + regras de documentos ativos já alinhadas ao PRD de cadastro. |
| **Erros** | Inspecionar corpo de erro; se existir `phase` ou `plugnotasCode` no futuro, mapear para E4 vs E5 (**NFR-ORQ-CERT-02**). |
| **Testes** | Cobrir E1→E3, E1→E5→E6→E3, E4, e *smoke* de *Atualizar sem certificado*. |

---

## 9. Rastreio PRD → UX

| ID PRD | Cobertura nesta spec |
|--------|----------------------|
| **FR-ORQ-CERT-01** | §4.2, §3.2 |
| **FR-ORQ-CERT-02** | §8, §4.1 |
| **FR-ORQ-CERT-03** | §5.1, §6 |
| **FR-ORQ-CERT-04** | §5.2 |
| **FR-ORQ-CERT-05** | §4.3, §5.4, §5.5 |
| **FR-ORQ-CERT-06** | §5.2 nota 409, §8 |
| **FR-ORQ-CERT-07** | §3.2, §8 *smoke* |
| **FR-ORQ-CERT-08** | Implícito (payload); sem mudança de UI além de garantir `documentosAtivos` no body quando a UI os expuser. |
| **NFR-ORQ-CERT-01** | §4.3 — não persistir senha/id sensível em `localStorage` além do já acordado. |
| **NFR-ORQ-CERT-04** | §6 |

---

## 10. Checklist de QA (UX)

1. CTA desabilitado com formulário incompleto; mensagem ou *tooltip* compreensível.  
2. Durante envio: duas fases anunciadas (visual + *screen reader*).  
3. Sucesso: uma mensagem, sem jargão técnico.  
4. Simular falha só na segunda chamada: banner + retry; segundo clique **não** reenvia ficheiro.  
5. 409 certificado: fluxo completo até sucesso sem segundo clique intermédio.  
6. “Atualizar cadastro (sem novo certificado)” inalterado para o utilizador.  
7. Duplo clique rápido no CTA: uma sequência (botão *busy*).  
8. Dark mode: bloco de fases e alertas legíveis.

---

## 11. Change log

| Versão | Data | Autor | Notas |
|--------|------|-------|-------|
| 1.0 | 2026-04-07 | Uma | Versão inicial a partir do PRD **ORQ-CERT**. |

---

*Handoff: **@dev** — `GuidesMei.tsx` + serviços; **@qa** — §10; **@architect** — shape de resposta certificado e códigos `phase` opcionais.*
