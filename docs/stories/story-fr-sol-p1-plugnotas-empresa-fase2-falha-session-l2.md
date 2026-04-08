# Story — FR-SOL (P1): Marcador de sessão **fase 2 falhou** para estado **SOL-L2** (reload)

**ID:** STORY-FR-SOL-P1-FASE2-FAIL-SESSION-L2  
**Prioridade:** P1  
**Depende de:** [story-fr-sol-p0-plugnotas-encadeamento-post-404-get-empresa-ux.md](./story-fr-sol-p0-plugnotas-encadeamento-post-404-get-empresa-ux.md) (`resolvePlugnotasEmpresaCadastroSolUxState` e integração base em `GuidesMei`).  
**Bloqueia:** —  
**Fonte PRD:** [`docs/prd/PRD-solucao-400-prefeitura-404-get-empresa-mei-2026-04-08.md`](../prd/PRD-solucao-400-prefeitura-404-get-empresa-mei-2026-04-08.md) — **FR-SOL-404-01** (completo com reload), **FR-SOL-DIAG-02** (limpeza de estado após sucesso)  
**UX:** [`docs/specs/ux-spec-solucao-400-prefeitura-404-get-empresa-mei-2026-04-08.md`](../specs/ux-spec-solucao-400-prefeitura-404-get-empresa-mei-2026-04-08.md) — **SOL-L2** secção 3.2, microcopy **secção 5.1**, checklist QA item 2  
**Arquitetura:** [`docs/technical/architecture-solucao-400-prefeitura-404-get-empresa-mei-2026-04-08.md`](../technical/architecture-solucao-400-prefeitura-404-get-empresa-mei-2026-04-08.md) — §3 (estado persistente mínimo), §2 (`sessionPostFailedFlag`), §9 (sessionStorage cheio)

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @dev |
| **quality_gate** | @qa |
| **quality_gate_tools** | `npm run lint`, `npm run typecheck`, `npm test` |
| **revisão** | @architect — privacidade/TTL/chave storage; @architect — consistência com `guiaMeiEmpresaGetCache.ts` |

---

## User story

**Como** MEI que tentou registrar a empresa e viu um erro,  
**quando** **recarrego** a página ou navego de forma a **perder** o painel vermelho/âmbar do POST mas a **consulta** ainda devolve “não encontrado”,  
**quero** ver uma mensagem que lembre que o cadastro **não foi concluído** e que devo resolver o erro e tentar de novo,  
**para** não assumir que o sistema “esqueceu” o CNPJ ou que só a consulta falhou.

---

## Contexto

- **SOL-L2** exige `sessionPostFailedFlag === true` na função pura (arquitetura §2).  
- **Chave recomendada:** `mei:empresaFase2Fail:v1:${userId}:${cnpjDigits}`; **valor:** apenas `{ t: number }` ou boolean — **não** persistir texto de erro Plugnotas (privacidade; arquitetura §3).  
- **Escrever** marcador no *catch* / falha confirmada do submit **POST** empresa fase 2.  
- **Limpar** em **POST 2xx** empresa **ou** **GET 200** com cadastro existente para o mesmo CNPJ; alinhar com `invalidateMeiEmpresaGetCache` onde já existir.  
- **TTL:** expiração automática (ex.: 30 min) — se expirado, tratar como **SOL-L3** (arquitetura §3).  
- **Fallback:** `sessionStorage` indisponível → comportamento **SOL-L3** sem erro visível ao utilizador.

---

## Critérios de aceite

### Produto / UX

- [ ] Após **POST** fase 2 falhado, recarregar a página: com `GET` / UI ainda indicando *not found*, o utilizador vê copy **spec SOL secção 5.1 (SOL-L2)** — título *Registro da empresa ainda pendente* + corpo + CTAs/link guia conforme spec.  
- [ ] Após **POST 2xx** ou **GET** que confirme empresa criada, o marcador é **removido** e o estado deixa de ser L2 para aquele `userId`+CNPJ (**FR-SOL-DIAG-02**).  
- [ ] Após TTL expirado, utilizador vê **SOL-L3** (copy neutra), não L2 indefinidamente.  
- [ ] Não duplicar texto PREF/SOL já mostrado no mesmo ecrã sem necessidade (reutilizar componente da story P0).

### Técnico

- [ ] Helper dedicado (ex. `guiaMeiEmpresaFase2FailFlag.ts`) espelhando padrão de `guiaMeiEmpresaGetCache.ts` (try/catch em `sessionStorage`, chave namespaced).  
- [ ] `resolvePlugnotasEmpresaCadastroSolUxState` passa a receber `sessionPostFailedFlag` real (leitura do helper + TTL).  
- [ ] Testes unitários: TTL expirado → flag falso; escrita + leitura; limpeza em sucesso simulado.  
- [ ] Teste RTL: simular reload (remount + `sessionStorage` pré-preenchido) → copy L2 visível.  
- [ ] Gates: `npm run lint`, `npm run typecheck`, `npm test`.

### Documentação

- [ ] `docs/operacao-mei-nfse.md`: uma linha ou bullet a referir o marcador de sessão (opcional para utilizador final; orientação suporte) e ligação à âncora `#cadastro-post-404-get-empresa`.

---

## Tasks (indicativas)

1. [x] Implementar helper `sessionStorage` (set/clear/isActive com TTL) para fase 2 falha.  
2. [x] Ligar escrita ao fluxo de falha do POST empresa em `GuidesMei.tsx` (ou *hook* extraído).  
3. [x] Ligar limpeza a todos os caminhos de sucesso POST empresa e GET com dados.  
4. [x] Actualizar `resolvePlugnotasEmpresaCadastroSolUxState` + chamadas para passar `sessionPostFailedFlag`.  
5. [x] Renderizar **SOL-L2** quando estado resolvido for `L2`.  
6. [x] Testes + doc operação.  
7. [x] Gates; **File list**; **Dev Agent Record**.

---

## File list (indicativo)

- [x] `frontend/src/utils/guiaMeiEmpresaFase2FailFlag.ts` *(novo)*  
- [x] `frontend/src/utils/guiaMeiEmpresaFase2FailFlag.test.ts` *(novo)*  
- [ ] `frontend/src/utils/plugnotasEmpresaCadastroSolUx.ts` *(sem alteração — já suportava L2)*  
- [ ] `frontend/src/utils/plugnotasEmpresaCadastroSolUx.test.ts` *(sem alteração)*  
- [x] `frontend/src/pages/GuidesMei.tsx`  
- [ ] Componente banner SOL *(reutilizado `PlugnotasEmpresaCadastroSolContextPanel` da P0)*  
- [x] `frontend/src/pages/GuidesMei.fr-sol-p1-session-l2.test.tsx` *(RTL)*  
- [x] `docs/operacao-mei-nfse.md`

---

## CodeRabbit Integration

- Focar: não persistir mensagens de erro completas; TTL e limpeza em todos os caminhos de sucesso; evitar *race* entre cache GET e flag.

---

## Dev Agent Record

*(preencher por @dev)*

### Status

Ready for Review

### File list

- `frontend/src/utils/guiaMeiEmpresaFase2FailFlag.ts`
- `frontend/src/utils/guiaMeiEmpresaFase2FailFlag.test.ts`
- `frontend/src/pages/GuidesMei.tsx`
- `frontend/src/pages/GuidesMei.fr-sol-p1-session-l2.test.tsx`
- `docs/operacao-mei-nfse.md`

### Notes

- Chave `mei:empresaFase2Fail:v1:${userId}:${cnpj14}`; valor `{ t }`; TTL **30 min** (`MEI_EMPRESA_FASE2_FAIL_FLAG_TTL_MS`).
- **Set:** falha API fase empresa no upload certificado (retry âmbar) e falha no `handleRetryPlugnotasEmpresaRegistro` (não conectividade).
- **Clear:** `finalizePlugnotasEmpresaCadastroSuccess`; `loadCertificateStatus` quando `extractDocumentosAtivosFromEmpresaResponse` ≠ null; consulta manual com `map.kind === 'full'`; `atualizarEmpresaEmissaoNf` 2xx; remoção de certificado (CNPJ conhecido).
- `sessionPostFailedFlag` no resolver alinhado com `cnpjParaSolSessionFlag` + `isGuiaMeiEmpresaFase2FailFlagActive`.
- Gates: `npm run lint`, `npm run typecheck`, `npm test` — OK (2026-04-08).
- **Pós-QA (obs. TTL / re-render):** `solFase2SessionFlagRevalidateTick` em `GuidesMei.tsx` — `visibilitychange` quando o separador fica visível; `setInterval` 60s enquanto `nfEmissionCompanySyncError` for mensagem *not found*, para reavaliar TTL sem nova interacção do utilizador.

---

## Change log

| Data | Autor | Nota |
|------|-------|------|
| 2026-04-08 | @sm (River) | Story P1 para SOL-L2; depende de P0. |
| 2026-04-08 | @dev | Implementação: `guiaMeiEmpresaFase2FailFlag`, integração `GuidesMei`, RTL remount, doc operação. |
| 2026-04-08 | @dev | Follow-up QA: revalidação marcador sessão (`visibilitychange` + intervalo 60s com *not found*). |

---

## QA Results

### 2026-04-08 — Quinn (@qa) — revisão pós-implementação P1

**Decisão de gate:** **PASS**

**Evidência (CLI):** `npm run lint`, `npm run typecheck` e `npm test` na raiz do repositório — concluídos com sucesso nesta revisão.

**Rastreio aos critérios de aceite:**

| Critério | Resultado | Notas |
|----------|-----------|--------|
| SOL-L2 após reload + consulta *not found* | **PASS** | `sessionPostFailedFlag` derivado de `isGuiaMeiEmpresaFase2FailFlagActive` + `cnpjParaSolSessionFlag`; copy §5.1 via `PlugnotasEmpresaCadastroSolContextPanel` (estado `L2`). |
| FR-SOL-DIAG-02 — limpeza pós sucesso | **PASS** | `clearGuiaMeiEmpresaFase2FailFlag` em `finalizePlugnotasEmpresaCadastroSuccess`; `loadCertificateStatus` quando `extractDocumentosAtivosFromEmpresaResponse` ≠ null; consulta manual `map.kind === 'full'`; `atualizarEmpresaEmissaoNf` 2xx; remoção de certificado (CNPJ 14 dígitos). |
| TTL → SOL-L3 | **PASS** | `MEI_EMPRESA_FASE2_FAIL_FLAG_TTL_MS` (30 min); `isGuiaMeiEmpresaFase2FailFlagActive` remove entrada expirada e devolve `false`. |
| Sem duplicação PREF/SOL | **PASS** | Reutilização do painel SOL da P0; ordem existente PREF → erro → SOL mantida onde aplicável. |
| Helper + padrão `guiaMeiEmpresaGetCache` | **PASS** | `guiaMeiEmpresaFase2FailFlag.ts`: prefixo namespaced, `try/catch` em `sessionStorage`, `anon` se `userId` ausente. |
| `sessionPostFailedFlag` real no resolver | **PASS** | `GuidesMei.tsx` `useMemo` passa flag lida do helper (só ramo com mensagem *not found*). |
| Testes unitários | **PASS** | `guiaMeiEmpresaFase2FailFlag.test.ts`: TTL, set/get, clear, CNPJ inválido, `getItem` a lançar, chave `anon`. |
| Teste RTL remount | **PASS** | `GuidesMei.fr-sol-p1-session-l2.test.tsx`: `sessionStorage` + consulta 404 + título `PLUGNOTAS_SOL_L2_TITLE`; segundo ciclo após remount. |
| Documentação | **PASS** | `docs/operacao-mei-nfse.md` na âncora `#cadastro-post-404-get-empresa`, bullet marcador + TTL + ficheiro fonte. |

**Privacidade / dados em storage:** valor `{ t: number }` apenas; chave inclui `userId` e CNPJ (14 dígitos) — alinhado à story e ao padrão do cache GET empresa.

**Observações (não bloqueantes):**

1. **TTL e re-render:** após expiração só temporal, a UI só actualiza `sessionPostFailedFlag` quando dependências do `useMemo` mudam; o utilizador poderia ver L2 até à próxima interacção — aceitável para P1; mitigação futura opcional (ex. `visibilitychange` / intervalo curto, se produto exigir).
2. **GET “200” sem `documentos ativos` parseáveis:** a limpeza do marcador está ligada a `extractDocumentosAtivosFromEmpresaResponse` ≠ null (ou consulta `full`); respostas ambíguas podem não limpar a flag — coerente com o critério “cadastro existente” inferido pelo mesmo extract que o resto da Guia MEI.
3. **CodeRabbit (WSL):** não executado nesta sessão; recomendado antes do merge se for obrigatório no fluxo da equipa.

**Conclusão:** Implementação consistente com FR-SOL-404-01 (reload), FR-SOL-DIAG-02 e critérios técnicos da story. **Aprovado para próximo passo** (merge/PR via @github-devops), salvo política interna adicional.
