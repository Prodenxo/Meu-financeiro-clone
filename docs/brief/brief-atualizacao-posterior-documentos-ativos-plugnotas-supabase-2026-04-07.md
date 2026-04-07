# Brief: **atualização posterior** de documentos ativos (Plugnotas + Supabase)

**Data:** 2026-04-07  
**Origem:** pedido de produto (orquestração AIOX + análise)  
**Produto:** Meu Financeiro — fluxo fiscal **Guia MEI / cadastro emitente** com integração **Plugnotas** e espelho em **`user_mei_certificates.documentos_ativos`**.

**Documentos relacionados (não substituídos por este brief):**

- `docs/brief/brief-cadastro-empresa-documentos-ativos-plugnotas-2026-04-07.md` — escolha inicial de documentos ativos no cadastro.  
- `docs/stories/story-fr-cad-doc-p1-persistencia-documentos-ativos-supabase.md` — persistência P1 do espelho `jsonb`.  
- `supabase/migrations/20260407130000_add_documentos_ativos_user_mei_certificates.sql` — coluna `documentos_ativos`.  
- `docs/operacao-mei-nfse.md` — política de payload e operação MEI.

**Próximos passos típicos:** `@pm` — PRD com critérios de aceite e cenários de conflito; `@architect` — contrato API, ordem de escrita Plugnotas ↔ Supabase, e eventual job de reconciliação; `@dev` — UI e endpoints de “atualizar” / “sincronizar”.

---

## 1. Resumo executivo

Hoje, após **POST/PATCH empresa** bem-sucedido no Plugnotas, o backend pode gravar o espelho **`documentos_ativos`** no Supabase **quando o payload inclui `documentosAtivos`** (ver `persistDocumentosAtivosMirrorAfterEmpresa`). O utilizador, no entanto, pode **mudar mais tarde** a configuração de tipos de documento — seja **reabrindo o fluxo na app**, seja **diretamente no painel Plugnotas** — e espera que **o provedor e a base local** reflitam a mesma verdade, sem surpresas na pré-visualização da Guia MEI ou emissão.

Este brief pede uma evolução **explícita de produto e engenharia** para: (1) **atualização pelo utilizador na app** que garanta **PATCH** no Plugnotas **e** atualização do espelho Supabase; (2) **estratégia** quando a alteração ocorre **só no Plugnotas** (reconciliação com `GET empresa` ou ação “sincronizar”).

---

## 2. Problema / oportunidade

| Dimensão | Situação atual | Risco ou oportunidade |
|----------|----------------|------------------------|
| **Dois repositórios de estado** | Plugnotas (emissão) vs Supabase (espelho UX / hidratação). | **Deriva:** utilizador altera num lado e o outro fica desatualizado. |
| **Atualização na app** | PATCH já existe; espelho depende de `documentosAtivos` no body. | Se a UI de “editar depois” **omitir** o bloco ou usar fluxo diferente, o **banco não acompanha** o Plugnotas. |
| **Atualização fora da app** | Alteração no portal Plugnotas não dispara escrita no Supabase. | Guia MEI pode mostrar seleção **antiga** (prioridade UX documentada: remoto > espelho > default — validar implementação). |
| **Auditoria e suporte** | Espelho é útil para saber “o que o utilizador escolheu por último **na app**”. | Falta regra clara do que significa “por último” quando há edição externa. |

---

## 3. Objetivos

1. **Paridade Plugnotas ↔ Supabase após edição na app:** qualquer fluxo de utilizador que **altere** documentos ativos deve resultar em **`PATCH …/empresa` (ou equivalente canónico)** com payload válido **e** em **`saveDocumentosAtivosMirror`** com a mesma seleção normalizada (`{ nfse, nfe, nfce }`).  
2. **Descoberta e affordance:** o utilizador deve **perceber** que pode alterar a seleção **depois** do cadastro inicial (copy, botão “Alterar documentos ativos”, ou secção persistente na Guia MEI / cadastro).  
3. **Reconciliação quando o remoto muda fora da app:** definir comportamento (mínimo viável): por exemplo **sincronizar espelho a partir de `GET empresa`** ao abrir o ecrã, ou botão **“Atualizar do Plugnotas”**, ou job agendado — **uma opção** deve constar do PRD.  
4. **Consistência com pré-requisitos:** manter validação “pelo menos um tipo ativo” e mensagens alinhadas a `plugnotas-empresa-documentos-ativos` / políticas existentes.  
5. **Não quebrar RLS:** escritas no espelho continuam a **não** expor credenciais; preferir **backend com service role** para o espelho, como hoje.

---

## 4. Fora de âmbito (sugerido; validar com PO)

- Substituir o Plugnotas ou duplicar toda a gestão de empresa no app.  
- Emissão completa NF-e/NFC-e na UI se ainda estiver fora do roadmap (pode referenciar briefs de aba de emissão).  
- Webhook Plugnotas para cada mudança de configuração **a menos que** o PO priorize integração em tempo real.

---

## 5. Decisões em aberto (para PRD / arquitetura)

1. **Fonte de verdade em conflito:** se `GET empresa` ≠ `documentos_ativos` no Supabase, qual prevalece para **exibição** e qual para **próximo PATCH**? (Sugestão analítica: **remoto para exibição**; ao guardar na app, **sobrescrever espelho** com o que foi enviado com sucesso.)  
2. **Sincronização inbound:** obrigatória em cada carregamento da página vs opt-in vs pós-login. Impacto em chamadas ao Plugnotas e rate limits.  
3. **Payload mínimo no PATCH:** o corpo deve **sempre** incluir `documentosAtivos` na edição dedicada, ou reutilizar merge com dados já guardados no cliente?  
4. **Estado “só remoto”:** utilizador nunca usou espelho (coluna `null`) — default na UI e primeira escrita.  
5. **Métricas:** contar falhas silenciosas de `saveDocumentosAtivosMirror` (hoje engolidas) — opt-in de observabilidade.

---

## 6. Proposta de experiência (UX)

- **Secção persistente** “Documentos ativos” acessível após cadastro concluído (não só no wizard inicial), com estado derivado de **GET empresa** (quando disponível) e fallback **espelho Supabase**.  
- **Feedback** após salvar: confirmação de que **Plugnotas e o app** foram atualizados (mensagem única; evitar jargão “jsonb”).  
- Se o utilizador alterar só no **painel Plugnotas**, mostrar **aviso** opcional: “Detetámos diferença em relação à última sessão neste dispositivo” + CTA **sincronizar** (se o PRD adoptar reconciliação).

---

## 7. Notas técnicas (referência para implementação)

- **Escrita espelho:** `saveDocumentosAtivosMirror` em `backend/src/services/mei-certificate-store.js` — só `UPDATE` se existir linha em `user_mei_certificates`.  
- **Gatilho atual:** `persistDocumentosAtivosMirrorAfterEmpresa` em `cadastrarPlugNotasEmpresa` e `atualizarPlugNotasEmpresa` (`mei-notas.controller.js`) quando `payload.documentosAtivos` está presente.  
- **Leitura:** `getDocumentosAtivosMirror` / status do certificado para hidratação da UI.  
- **Evolução provável:** endpoint ou passo de serviço que execute **`GET empresa` → normalizar `documentosAtivos` → `saveDocumentosAtivosMirror`** para fechar o ciclo “editado no Plugnotas”.

---

## 8. Critérios de sucesso (proposta)

1. Utilador conclui **alteração** de documentos ativos **só pela app** e verifica no Supabase (ambiente de teste) que `documentos_ativos` coincide com o enviado após sucesso Plugnotas.  
2. Após definir estratégia de reconciliação, **cenário** “alteração só no Plugnotas” deixa de mostrar estado inconsistente na Guia MEI **ou** o utilizador tem caminho claro para alinhar.  
3. Documentação de produto (`PRD` / story) referencia este brief e fecha as decisões da secção 5.

---

*Documento de brief; não substitui ADR nem contratos de API. Ajustar datas e referências se o pacote for implementado em sprint posterior.*
