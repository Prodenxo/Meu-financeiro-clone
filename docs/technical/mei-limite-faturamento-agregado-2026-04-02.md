# Limite de faturamento MEI — agregado, configuração e decisão cliente vs servidor

**Versão:** 1.1  
**Data:** 2026-04-02  
**Story:** STORY-LIM-MEI-01  
**Consumidores:** LIM-MEI-02 (UI do bloco canónico), LIM-MEI-03 (refresco pós emitir/cancelar NFS-e)

---

## 1. Decisão: agregação no cliente vs endpoint dedicado

| Opção | Quando faz sentido |
|--------|-------------------|
| **Cálculo no cliente** a partir de `NfseRecord[]` já obtidos por `GET /api/mei-notas` (mesma fonte que a lista em `GuidesMei` → `listarNfse`) | **MVP / LIM-MEI-01:** volume típico por utilizador ainda gerível em memória; alinha ao PRD §5.3 (“reutilizar dados já carregados na página”). |
| **Endpoint dedicado** (ex.: `GET /api/mei/limit-progress`) | Lista paginada, agregados partilhados entre ecrãs sem carregar notas completas, ou regras de soma mais pesadas no servidor. |

**Decisão fechada para a fundação atual:** **agregação no cliente** com funções puras em `frontend/src/utils/meiLimiteFaturamento.ts`, operando sobre o **mesmo contrato** que `listarNfse` / `NfseRecord`.

**Justificativa (performance e invalidação — NFR-LIM-02, alinhado a FR-LIM-08 no desenho):**

- O custo de percorrer a lista em memória é aceitável para o MVP; evita ida extra ao servidor e duplicação de regras até haver necessidade real.
- **Ponto único de invalidação** quando o modo for “por notas no período”: após **emitir** ou **cancelar** NFS-e, **refrescar a lista** (`listarNfse`) invalida implicitamente o agregado; LIM-MEI-03 pode limitar-se a garantir esse refresco + `useMemo` sobre os dados já obtidos.
- **Evolução:** se no futuro o endpoint `GET /api/mei/limit-progress` for introduzido, LIM-MEI-02 pode consumir a **mesma forma de resultado** exportada pelos tipos (`MeiLimiteProgresso`), mudando apenas a origem dos dados (props vindas da API em vez do array local).

---

## 2. Modelo de configuração do limite de referência (FR-LIM-03, NFR-LIM-05)

- **Valor numérico por ano civil** (R$), em módulo versionado: `frontend/src/utils/meiLimiteFaturamentoConfig.ts`.
- **Vigência / etiqueta:** campo opcional `vigenciaLabel` (texto curto para UI, ex.: “vigência 2026” ou data de atualização da tabela) — pode ser preenchido quando o PO fechar cópia exacta.
- **Manutenção:** alterações ao teto devem ser feitas **só** nesse ficheiro (ou substituídas por env/Edge Config numa story futura, mantendo o mesmo contrato TypeScript).

Valores numéricos no repositório são **referência administrativa** para a app; não substituem legislação nem orientação oficial.

---

## 3. Limiares de proximidade (FR-LIM-04 — preparação)

Valores **configuráveis** por defeito (fecháveis com PO):

| Percentual (utilização do limite) | Estado |
|-----------------------------------|--------|
| **&lt; 80 %** | `seguro` |
| **≥ 80 % e &lt; 95 %** | `atencao` |
| **≥ 95 %** | `critico` |

Constantes: `DEFAULT_MEI_LIMITE_THRESHOLDS` no mesmo módulo de config.

---

## 4. Contrato de dados (para LIM-MEI-02 e LIM-MEI-03)

- **Entrada do somatório:** `NfseRecord[]` + ano civil alvo + opções (limiar, limite, regra de inclusão de linhas).
- **Somatório MVP:** soma dos valores de serviço (`payload_json.servico[].valor.servico`) das NFS-e **autorizadas** (`status` classificado como concluído), com **ano civil** derivado de `created_at` (mesma convenção de período que `toNfsePeriodKey` em `GuidesMei`: ano/mês no fuso local do browser).
- **PRD §5.3 — leitura de “NFS-e emitidas pela app”:** no MVP, para o **indicador de limite**, considera-se **emitida** a nota cuja emissão está **concluída/autorizada** face ao fluxo da app (inclui correspondência a status `concluido` / autorizado no cliente). **Não** entram envios ainda em **processamento**, nem **rejeitadas**, **canceladas** ou **interrompidas** — alinha o somatório a **receita reconhecida** na conta, não só ao pedido enviado ao provedor. Incluir outros estados seria **mudança de regra de produto** (story futura, com PO).
- **Tipo de documento:** apenas linhas com `document_type === 'NFSE'` entram no somatório; NF-e / NFC-e na mesma tabela são ignoradas.
- **Exclusões:** notas **canceladas**, **rejeitadas**, **interrompidas**, **em processamento** não entram no total de faturamento para o indicador (notas ainda não definitivas).
- **Percentagem:** `percentualUtilizado` pode **exceder 100** quando o utilizador ultrapassa o limite de referência (UX §5.4); a UI pode usar `percentualUtilizadoParaBarra` (máx. 100) para barras, mantendo o valor integral para cópia/alertas.

Tipos e funções expostos: ver `frontend/src/utils/meiLimiteFaturamento.ts`.

---

## 5. Referências de código

- Lista NFS-e: `frontend/src/services/meiNotasService.ts` (`listarNfse`, `NfseRecord`).
- Payload normalizado no backend: `backend/src/services/mei-notas.service.js` (`servico[].valor.servico`).

---

## 6. Revisão e conformidade (PRD §13)

- **Conteúdo técnico:** alinhado a `docs/prd/PRD-mei-infinito-acompanhar-limite-faturamento-2026-04-02.md` §5.3 e a `docs/specs/ux-spec-mei-infinito-limite-faturamento-2026-04-02.md` (NFR-LIM-02, NFR-LIM-05).
- **PRD §13 (revisão com @architect / dev):** a decisão e o contrato estão **documentados neste ADR** e **implementados** em `meiLimiteFaturamento.ts` na entrega LIM-MEI-01. A equipa deve **registar** revisão assíncrona do **@architect** (comentário no MR, registo de reunião ou equivalente) quando fechar o PR — não duplicamos esse registo aqui para evitar divergência; o MR é a fonte de evidência processual.

