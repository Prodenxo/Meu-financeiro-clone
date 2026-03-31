# Story — FR-P-08: API Brasil — autopreenchimento de CNPJ em GuidesMei

**ID:** STORY-FR-P-08
**Status:** Ready for Review
**Prioridade (PRD):** Should
**Fonte:** `docs/brief-event1-1.md` §Feature 1, PRD §5.3 (FR-P-05 context)
**Relacionado:** `docs/prd/PRD-meu-financeiro-produto-brownfield-2026-03-26.md`

---

## User story

**Como** usuário MEI,
**quero** que ao informar o CNPJ nos formulários da página `/guias-mei` os campos da empresa sejam preenchidos automaticamente via API Brasil,
**para** evitar digitação manual repetitiva e reduzir erros de cadastro ao emitir NFS-e e configurar o certificado.

---

## Contexto técnico

### Campos CNPJ no escopo em `frontend/src/pages/GuidesMei.tsx`

| Campo | Estado React | Seção | Ação esperada |
|-------|-------------|-------|---------------|
| CNPJ do MEI | `contribuinteDoc` | Certificado (line ~1780) | Autopreenchimento de `nfEmissionCompanyForm` |
| CNPJ do prestador | `nfseForm.prestadorCpfCnpj` | Aba NFSe (line ~2201) | Autopreenchimento dos campos do prestador na nota |

### API Brasil

- **Endpoint:** `https://brasilapi.com.br/api/cnpj/v1/{cnpj}` (chamada direta do frontend, pública, sem proxy)
- **Resposta relevante:**
  ```json
  {
    "razao_social": "...",
    "nome_fantasia": "...",
    "cnpj": "...",
    "logradouro": "...",
    "numero": "...",
    "complemento": "...",
    "bairro": "...",
    "municipio": "...",
    "uf": "...",
    "cep": "...",
    "email": "...",
    "codigo_municipio": "3304557",
    "simples": { "optante_simples_nacional": true }
  }
  ```
- Tratar: CNPJ inválido (< 14 dígitos), empresa não encontrada (404), timeout/rede offline.
- Chamada deve ocorrer no evento `onBlur` do campo CNPJ quando o valor tiver 14 dígitos.
- **Não sobrescrever** campos que o usuário já preencheu manualmente (somente preencher se estiver vazio).

### Funções de utilitário já existentes

- `formatDocument` — formata CPF/CNPJ com máscara
- `normalizeDoc` — remove máscara (já importado em `GuidesMei.tsx`)
- `appendNfseEmitenteToFormData` — usado em upload de certificado

### Padrão de integração API Brasil (já documentado no projeto)

- `docs/brief-event1-1.md` §Feature 1 e §Dependência Técnica: API Brasil — descreve a mesma integração para o modal de empresa em `/settings` (FR-P-05).
- Este story reutiliza o mesmo padrão, aplicado ao contexto de `GuidesMei`.

---

## Critérios de aceite

### AC-1 — Autopreenchimento no campo "CNPJ do MEI" (contribuinteDoc)

- [ ] Ao sair do campo CNPJ do MEI (onBlur) com 14 dígitos, dispara chamada à API Brasil.
- [ ] Se a resposta for válida, preenche `nfEmissionCompanyForm` com: `razaoSocial`, `nomeFantasia`, `email`, `logradouro`, `numero`, `complemento`, `bairro`, `cep`, `descricaoCidade`, `codigoCidade` (código IBGE), `estado`, `simplesNacional`.
- [ ] Campos do `nfEmissionCompanyForm` **já preenchidos pelo usuário** não são sobrescritos.
- [ ] Se a chamada falhar (CNPJ inválido, 404, timeout), exibe mensagem de aviso inline (não bloqueia o fluxo).
- [ ] Indicador visual de "buscando..." exibido durante a chamada.

### AC-2 — Autopreenchimento no campo "CNPJ do prestador" (NFSe)

- [ ] Ao sair do campo `prestadorCpfCnpj` (onBlur) na aba NFSe com 14 dígitos, dispara chamada à API Brasil.
- [ ] Se a resposta for válida, preenche `nfseForm` com: `prestadorRazaoSocial`, `prestadorEmail`, e `prestadorEndereco` (logradouro, numero, complemento, bairro, cep, codigoCidade, descricaoCidade, estado).
- [ ] Campos do `nfseForm` **já preenchidos** não são sobrescritos.
- [ ] Erros tratados com mensagem inline sem bloquear o formulário.

### AC-3 — Utilitário reutilizável

- [ ] A lógica de chamada à API Brasil é extraída para uma função reutilizável (ex: `fetchBrasilApiCnpj` em `frontend/src/utils/brasilApi.ts`).
- [ ] A mesma função pode ser reaproveitada na FR-P-05 (modal de empresa em `/settings`).

### AC-4 — Qualidade

- [ ] `npm run lint` e `npm run typecheck` sem erros.
- [ ] Nenhuma regressão nos fluxos de certificado e NFSe existentes — incluindo `handleValidateBlur` que deve continuar sendo chamado no blur do campo CNPJ do MEI.
- [ ] API Brasil não é chamada quando CNPJ tiver menos de 14 dígitos.
- [ ] Sem credenciais ou tokens expostos (API Brasil é pública).

---

## Dependências

- `GuidesMei.tsx` — arquivo principal modificado
- Recomendado criar `frontend/src/utils/brasilApi.ts` para centralizar a integração

---

## Fora de escopo

- Integração API Brasil no modal de empresa em `/settings` (coberto por FR-P-05).
- Validação de CNPJ no backend para esta story (a API Brasil já valida indiretamente).
- Autopreenchimento para CPF (pessoa física) — API Brasil CNPJ não suporta.
- Cache de respostas da API Brasil entre sessões.

---

## Notas de implementação (Dev Notes)

### Mapeamento API Brasil → nfEmissionCompanyForm

| Campo API Brasil | Campo nfEmissionCompanyForm |
|-----------------|----------------------------|
| `razao_social` | `razaoSocial` |
| `nome_fantasia` | `nomeFantasia` |
| `email` | `email` |
| `logradouro` | `logradouro` |
| `numero` | `numero` |
| `complemento` | `complemento` |
| `bairro` | `bairro` |
| `cep` | `cep` (remover hífen: `cep.replace('-','')`) |
| `municipio` | `descricaoCidade` |
| `codigo_municipio` | `codigoCidade` |
| `uf` | `estado` |
| `simples.optante_simples_nacional` | `simplesNacional` |

### Mapeamento API Brasil → nfseForm (prestador)

| Campo API Brasil | Campo nfseForm |
|-----------------|----------------|
| `razao_social` | `prestadorRazaoSocial` |
| `email` | `prestadorEmail` |
| `logradouro` | `prestadorEndereco.logradouro` |
| `numero` | `prestadorEndereco.numero` |
| `complemento` | `prestadorEndereco.complemento` |
| `bairro` | `prestadorEndereco.bairro` |
| `cep` | `prestadorEndereco.cep` |
| `codigo_municipio` | `prestadorEndereco.codigoCidade` |
| `municipio` | `prestadorEndereco.descricaoCidade` |
| `uf` | `prestadorEndereco.estado` |

### Localização dos campos no arquivo

- `contribuinteDoc` input: linha ~1780 (seção certificado)
- `nfseForm.prestadorCpfCnpj` input: linha ~2201 (aba NFSe)
- `nfEmissionCompanyForm` state: linha ~453
- `updateNfEmissionCompanyForm` function: procurar no arquivo (já existe)
- `updateNfsePrestadorEndereco` function: procurar no arquivo (já existe)

### Padrão de não-sobrescrita sugerido

```typescript
// Preencher apenas campos vazios
const mergeIfEmpty = <T extends Record<string, unknown>>(
  current: T,
  incoming: Partial<T>
): T => {
  const result = { ...current };
  for (const key of Object.keys(incoming) as (keyof T)[]) {
    const val = incoming[key];
    if (val !== undefined && val !== null && String(val).trim() !== '' && !String(current[key] ?? '').trim()) {
      (result as Record<keyof T, unknown>)[key] = val;
    }
  }
  return result;
};
```

[Source: `docs/brief-event1-1.md` §Dependência Técnica: API Brasil]

---

## Tasks / Subtasks

- [x] **Task 1 — Criar utilitário de integração API Brasil**
  - [x] Criar `frontend/src/utils/brasilApi.ts` com função `fetchBrasilApiCnpj(cnpj: string): Promise<BrasilApiCnpjResponse>`
  - [x] Definir interface `BrasilApiCnpjResponse` com os campos utilizados
  - [x] Tratar erros: network failure, status 404, status 429, timeout (5s via AbortController)
  - [x] Não chamar se `cnpj.length !== 14`

- [x] **Task 2 — Autopreenchimento no campo CNPJ do MEI (contribuinteDoc)**
  - [x] Adicionar estado `brasilApiLoading` e `brasilApiError` para o campo certificado/contribuinte
  - [x] Criado handler combinado `handleCnpjMeiBlur` que chama `handleValidateBlur()` e em seguida `fetchBrasilApiCnpj()`, preservando o handler existente
  - [x] Aplicar mapeamento API Brasil → `nfEmissionCompanyForm` usando `mergeIfEmpty`
  - [x] Exibir indicador de loading e mensagem de erro inline

- [x] **Task 3 — Autopreenchimento no campo CNPJ do prestador (NFSe)**
  - [x] Adicionar estado `nfsePrestadorBrasilApiLoading` e `nfsePrestadorBrasilApiError`
  - [x] Adicionar `onBlur` handler `handlePrestadorCnpjBlur` no input `prestadorCpfCnpj`
  - [x] Aplicar mapeamento API Brasil → `nfseForm` usando `mergeIfEmpty`
  - [x] Exibir indicador de loading e mensagem de erro inline abaixo do campo CNPJ do prestador

- [x] **Task 4 — Testes e validação**
  - [x] `npm run lint` e `npm run typecheck` sem erros
  - [x] Verificar que fluxo existente de certificado e NFSe não é afetado
  - [x] Testes unitários: 7/7 passando (brasilApi.test.ts — CNPJ válido, inválido, 404, 429, AbortError, máscara)

---

## Definition of Done

- Todos os ACs acima verificados manualmente.
- `npm run lint` e `npm run typecheck` passando.
- Sem regressões nos fluxos de certificado e NFSe.
- File List atualizado no Dev Agent Record.

---

## Qualidade / CodeRabbit

### Story Type Analysis
- **Primary Type:** Frontend
- **Secondary Type:** Integration (API externa)
- **Complexity:** Low-Medium — arquivo único (`GuidesMei.tsx`) + novo utilitário; sem mudanças de backend ou banco

### Specialized Agent Assignment
- **Primary Agents:** @dev, @ux-design-expert
- **Supporting Agents:** nenhum

### Quality Gate Tasks
- [ ] Pre-Commit (@dev): Run `coderabbit --prompt-only -t uncommitted` antes de marcar completo
- [ ] Pre-PR (@devops): Run `coderabbit --prompt-only --base main` antes de criar PR

### CodeRabbit Focus Areas
- Nenhum segredo/token exposto (API Brasil é pública — verificar que não há key no código)
- Tratamento de erros de rede no fetch (sem crashes em offline)
- Não sobrescrever dados já preenchidos pelo usuário
- Tipagem TypeScript correta para a resposta da API Brasil

### Self-Healing Configuration
- **Primary Agent:** @dev (light mode)
- **Max Iterations:** 2
- **Severity Filter:** CRITICAL only
- **Behavior:** CRITICAL → auto_fix; HIGH → document_only

---

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Completion Notes
- Criado utilitário `brasilApi.ts` com `fetchBrasilApiCnpj`, interface `BrasilApiCnpjResponse`, timeout 5s via AbortController
- `handleCnpjMeiBlur` combina `handleValidateBlur` existente + chamada API Brasil (handler forward-ref resolvido posicionando após `handleValidateBlur`)
- `mergeIfEmpty` garante não-sobrescrita de campos já preenchidos pelo usuário
- Fix: check AbortError usa `(error as { name?: string }).name` em vez de `instanceof Error` para compatibilidade com DOMException no ambiente de testes

### Debug Log References
- Forward reference issue: handlers `mergeIfEmpty`, `handleCnpjMeiBlur`, `handlePrestadorCnpjBlur` devem ser declarados APÓS `handleValidateBlur`
- AbortError test fix: DOMException não estende Error em todos ambientes; remoção de `instanceof Error` da guarda

### File List
- `frontend/src/utils/brasilApi.ts` — novo utilitário API Brasil
- `frontend/src/utils/brasilApi.test.ts` — testes unitários (7/7)
- `frontend/src/pages/GuidesMei.tsx` — integração: estados, handlers, UI inline

### Change Log

| Data | Alteração | Agente |
|------|-----------|--------|
| 2026-03-30 | Story criada (Draft) | @sm (River) |
| 2026-03-30 | Removidas todas as referências à aba Parcelamentos — foco apenas nos 2 campos (certificado e NFSe) | @sm (River) |
| 2026-03-30 | Validação @po: adicionada nota crítica sobre `handleValidateBlur` existente no onBlur do contribuinteDoc; AC-4 atualizado; status → Ready | @po (Pax) |
| 2026-03-30 | Implementação completa: brasilApi.ts, brasilApi.test.ts (7/7), integração em GuidesMei.tsx; status → Ready for Review | @dev (Dex) |
