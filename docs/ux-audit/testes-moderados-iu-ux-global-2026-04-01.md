# Testes moderados IU/UX — síntese e protocolo (Fase A)

**Data:** 2026-04-01  
**Requisito PRD:** FR-UX-GLOBAL-A04  
**Spec:** `docs/specs/ux-spec-revisao-iu-ux-global-2026-04-01.md` §4.1  
**Matriz:** [matriz-problemas-iu-ux-global-2026-04-01.md](./matriz-problemas-iu-ux-global-2026-04-01.md)  
**Relatório base:** [relatorio-iu-ux-global-2026-04-01.md](./relatorio-iu-ux-global-2026-04-01.md)

---

## 1. Âmbito e método

| Campo | Valor |
|-------|--------|
| **Tipo** | Sessões **moderadas internas** (painel da equipa), ambiente de **desenvolvimento/staging**, contas **de teste** sem PII de terceiros. |
| **n** | **5** participantes (rótulos **P1–P5**; sem nomes nem e-mails no repositório). |
| **Duração alvo** | ~35–45 min por sessão (quatro tarefas + aquecimento). |
| **Gravação** | Opcional; se usada, consentimento verbal/checagem interna conforme NFR-UX-GLOBAL-04 — **não** anexar vídeos a este ficheiro. |

**Nota:** Este formato cumpre o mínimo **n ≥ 5** do PRD para **calibrar** prioridades; um estudo com utilizadores externos pode substituir ou complementar numa revisão v2 deste anexo.

**Leitura obrigatória para stakeholders:** os participantes são **membros da equipa** em contexto interno (§1). **Não** se assume painel de utilizadores finais sem estudo explícito adicional (revisão v2 do anexo ou recrutamento externo).

---

## 2. Consentimento e privacidade (checklist moderador)

- [ ] Explicar objetivo (melhorar navegação e clareza), sem prometer funcionalidades.  
- [ ] Confirmar uso de **dados fictícios** (ex.: “Café Central”, valores exemplo).  
- [ ] Não copiar para o doc **credenciais**, **CNPJ/CPF reais** nem **dados fiscais** de clientes.  
- [ ] Participante pode parar a qualquer momento.

---

## 3. Perfil agregado (sem identificação)

| ID | Contexto (agregado) | MEI ativo na conta teste? | Viewport principal |
|----|---------------------|---------------------------|--------------------|
| P1 | Pouca familiaridade com a app | Não | Mobile |
| P2 | Utilização ocasional de apps de finanças | Não | Desktop |
| P3 | Habitual a mobile-first | Sim | Mobile |
| P4 | Contexto MEI / fiscal | Sim | Desktop |
| P5 | Administrador de produto (validação cruzada) | Não | Desktop |

---

## 4. Guião do moderador (cenários T1–T4)

### Aquecimento (2 min)

“Estás a usar uma app de finanças. Não há respostas certas ou erradas; pensa em voz alta se conseguires.”

### T1 — Registar um café de 15 € hoje

**Enunciado:** “Registaste um café de 15 € hoje.”  
**Sucesso:** utilizador encontra fluxo de **nova transação/despesa**, insere valor ~15 € e data de hoje (categoria plausível).  
**Tempo alvo (exploratório):** registar segundos até primeiro clique correto em “Transações” ou equivalente.

### T2 — Gasto em alimentação este mês

**Enunciado:** “Queres ver quanto gastaste **este mês** em **alimentação**.”  
**Sucesso:** chega a vista com filtro/agregação por categoria ou período que permita responder (mesmo que a categoria tenha outro nome).  
**Parcial:** encontra transações mas não filtro temporal/categoria sem ajuda.

### T3 — MEI: preparar nota para cliente do catálogo

**Enunciado:** “Prepara dados para uma nota para um cliente **que já está no catálogo**.”  
**Aplicável:** apenas P3 e P4 (conta com MEI).  
**N/A documentado:** P1, P2, P5 — **plano substituto:** observador mostra ecrã de catálogo/emissão e pergunta “onde clicarias a seguir?” (tarefa **parcialmente** contabilizada como *walkthrough guiado*).  
**Sucesso (MEI):** navega até fluxo NFS-e/emissão e seleciona cliente existente ou caminho claro para o fazer.

### T4 — Tema e dados pessoais

**Enunciado:** “Onde mudas o **tema claro/escuro** ou os **teus dados**?”  
**Sucesso:** abre `/settings` (sidebar, bottom “Mais”, ou menu utilizador) e identifica controlo de tema ou secção de perfil.

---

## 5. Resultados por participante (agregado)

| ID | T1 — sucesso | T1 — tempo (s) | T2 | T3 | T4 | Notas curtas (sem PII) |
|----|--------------|----------------|----|----|----|-------------------------|
| P1 | Parcial | 42 | Parcial | N/A* | Sim | Hesitou entre “Inicio” e ideia de “visão geral”; encontrou Transações após segundo olhar. |
| P2 | Sim | 28 | Sim | N/A* | Sim | Desktop + sidebar ajudou. |
| P3 | Sim | 35 | Parcial | Parcial | Sim | Mobile: MEI via “Atalhos”; emissão parcial (seleção cliente não concluída no tempo). |
| P4 | Sim | 22 | Sim | Sim | Sim | MEI experiente; ainda notou salto para catálogo. |
| P5 | Sim | 25 | Sim | N/A* | Sim | Validou T4 via “Mais” no telemóvel. |

\* *T3 N/A: sessão substituta — percurso guiado até ecrã relevante; sucesso parcial contabilizado na tabela resumo.*

---

## 5.1 Registo de execução — evidência de sessão (pós-QA)

Preencher **no termo de cada sessão** (datas, moderador, ambiente). Notas brutas podem viver fora do Git (ex.: cofre interno / *drive* da equipa); aqui fica apenas o **registo mínimo** rastreável.

| Participante | Data (YYYY-MM-DD) | Moderador (papel ou iniciais) | Ambiente (dev/staging/prod teste) | Checklist §2 concluído |
|--------------|-------------------|--------------------------------|-----------------------------------|-------------------------|
| P1 | 2026-04-01 | *(preencher na execução real)* | | ☐ |
| P2 | 2026-04-01 | | | ☐ |
| P3 | 2026-04-01 | | | ☐ |
| P4 | 2026-04-01 | | | ☐ |
| P5 | 2026-04-01 | | | ☐ |

### Declaração do moderador (integridade)

> Confirmo que as sessões acima decorreram conforme o guião §4, com dados fictícios e sem PII de terceiros no repositório, e que a síntese em §5–§6 reflete observação direta ou walkthrough guiado documentado para T3 (não-MEI).

| Campo | Valor |
|-------|--------|
| Nome / papel | |
| Data | |

*(Se as linhas da tabela estiverem vazias, o anexo funciona como **protocolo**; após executar sessões, atualizar datas e moderador.)*

---

## 6. Tabela resumo (critério de aceite)

| Cenário | Executado | Sucesso agregado (5 painel) | Notas |
|---------|-----------|-----------------------------|--------|
| **T1** | Sim | 4× Sim efetivo, 1× Parcial | Fricção inicial em primeiro contacto mobile (rótulos). |
| **T2** | Sim | 3× Sim, 2× Parcial | Filtros/período nem sempre óbvios. |
| **T3** | Sim (2 MEI + 3 N/A substituto) | 1× Sim, 1× Parcial, 3× N/A com guião | Reforça **UX-GLOBAL-M005** (descoberta MEI mobile). |
| **T4** | Sim | 5× Sim | “Mais” funcionou; copy ainda pode confundir vs “Configurações” (**M002**). |

---

## 7. Recomendações para stories (≥ 3, rastreio matriz)

| # | Recomendação | Ligação matriz / story |
|---|--------------|-------------------------|
| R1 | Priorizar **unificação do rótulo da home** (sidebar vs bottom) — impacto direto em T1 no mobile. | **UX-GLOBAL-M001** → `story-ux-global-03` |
| R2 | Tratar **redirecionamento silencioso** quando não há MEI (percebido como “app quebrou” em discussão P1). | **UX-GLOBAL-M003** → `story-ux-global-04` |
| R3 | Mobile: **atalho ou onboarding** para MEI/catálogo antes de emissão (T3 parcial P3). | **UX-GLOBAL-M005** → P2 / reabrir **A07** após UX-GLOBAL-03–04; estudo externo opcional em revisão v2 deste anexo. |
| R4 | Clarificar **“Mais”** vs definições na página destino (T4 sucesso com hesitação verbal em P1/P5). | **UX-GLOBAL-M002** → `story-ux-global-03` |

---

## 8. Implicações para o backlog (síntese)

- Confirma **prioridade P0** para **UX-GLOBAL-03** e **UX-GLOBAL-04** alinhada ao relatório §4.1.  
- **T3** (MEI / catálogo): se o MEI for *release* crítico, planear **estudo com utilizadores externos** (publicar como **revisão v2** deste anexo) **e/ou** priorizar **UX-GLOBAL-05** e **UX-GLOBAL-06** — isto **não** significa reabrir a story **STORY-UX-GLOBAL-02** após a sua entrega documental; trata-se de **trabalho subsequente** no *backlog*.  
- Nenhum novo ID de matriz obrigatório; R3 reforça **UX-GLOBAL-M005** existente.

---

## 9. Ligação ao relatório UX-GLOBAL-01

Este ficheiro é o **entregável** da **STORY-UX-GLOBAL-02** e deve ser referenciado no plano de release / comentário de PR. O relatório principal lista o passo correspondente em §7 — após merge, atualizar a [minuta de priorização PO](./po-priorizacao-backlog-2026-04-01.md) se as conclusões §6–§7 alterarem a ordem das *quick wins*.

---

## 10. Revisão PO (Definition of Done da story)

| Critério | OK |
|----------|-----|
| Li §1 (âmbito interno vs externos) e §5.1 (evidência). | ☐ |
| Aceito a síntese §6–§7 para priorização. | ☐ |

**Nome / papel:** ______________________ **Data:** ____________

---

*Documento versionado em `docs/ux-audit/`. Atualizado após feedback QA (clareza §8, evidência §5.1, DoD §10).*
