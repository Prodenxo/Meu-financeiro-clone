# Brief: Campos NFS-e (formulário Plugnotas / Guia MEI) → `user_mei_certificates` (Supabase)

**Data:** 2026-03-26  
**Origem:** Formulário “DADOS MÍNIMOS PARA EMISSÃO DE NFS-E” (certificado + dados fiscais/endereço).  
**Objetivo:** Persistir no Supabase os mesmos dados que o utilizador envia ao emissor, para cadastro local, auditoria e reenvio/atualização sem novo `.pfx` quando aplicável.

---

## 1. Mapeamento ecrã → colunas

| Campo no ecrã | Coluna Supabase | Notas |
|---------------|-----------------|--------|
| CNPJ do MEI | `cert_document` | Já existente; guardar só dígitos (normalização no backend). |
| Ficheiro certificado + senha | `pfx_base64`, `passphrase_enc`, `passphrase_iv` | Já existentes; senha **nunca** em texto plano — usar fluxo de encriptação atual (`mei-certificate-store.js`). |
| Razão social * | `razao_social` | Obrigatório no fluxo inicial. |
| Nome fantasia | `nome_fantasia` | Opcional. |
| Email fiscal | `fiscal_email` | Opcional. |
| Regime tributário | `regime_tributario` | Ex.: valor exibido `Simples Nacional (1)` — pode guardar código `"1"` ou texto; alinhar com payload Plugnotas. |
| Inscrição municipal * | `inscricao_municipal` | Exigida pelo emissor. |
| CEP * | `cep` | Com ou sem máscara; definir normalização (só dígitos recomendado). |
| Logradouro * | `logradouro` | |
| Número * | `numero` | |
| Complemento | `complemento` | Opcional. |
| Bairro * | `bairro` | |
| Código IBGE cidade * | `ibge_municipio` | Texto ou numérico conforme convenção da API. |
| Cidade * | `cidade` | |
| UF * | `uf` | 2 letras. |
| Optante Simples Nacional | `optante_simples_nacional` | Boolean; default sugerido `true` para MEI típico. |

**Texto de ajuda no ecrã (regra de negócio):** campos com * são obrigatórios na configuração inicial; IM exigida pelo Plugnotas; IE não solicitada neste fluxo (política MEI — apenas NFS-e).

---

## 2. Estado no repositório

- **Migração canónica:** `supabase/migrations/20260326140000_add_nfse_emitente_fields_to_user_mei_certificates.sql` — adiciona todas as colunas da secção fiscal/endereço acima (com `IF NOT EXISTS`).
- **Backend atual:** `saveCertificate` em `backend/src/services/mei-certificate-store.js` persiste certificado + `cert_document` + validades; **não** inclui ainda os novos campos NFS-e no `upsert` — implementação em story/tarefa separada se quiserem persistência automática a partir da API.

---

## 3. Como aplicar no Supabase

1. **CLI:** `supabase db push` ou `supabase migration up` (conforme o vosso fluxo), **ou**
2. **SQL Editor:** colar e executar o script completo da secção seguinte (equivalente à migração).

---

## 4. Critérios de aceitação (dados)

- [ ] Todas as colunas existem em `public.user_mei_certificates` após a migração.
- [ ] Comentários `COMMENT ON COLUMN` presentes para documentação no catálogo.
- [ ] Políticas RLS e permissões existentes para a tabela continuam coerentes (rever se novas colunas exigem ajuste de política — típico: mesma regra de leitura/escrita por `user_id`).

---

## 5. Riscos e próximos passos

| Risco | Mitigação |
|-------|-----------|
| Duplicação de CNPJ/endereço com outras tabelas | Definir fonte de verdade (só esta tabela vs. perfil empresa). |
| `regime_tributario` ambíguo | Documentar enum/códigos aceites pelo Plugnotas no código ou ADR. |
| PII em claro | Garantir que apenas utilizador autenticado acede às suas linhas (RLS). |

**Próximo passo técnico sugerido:** estender o contrato da API e o `upsert` no `mei-certificate-store` (ou serviço dedicado) para gravar estes campos quando o utilizador submete o formulário NFS-e.

---

## 6. Referências no repo

- `docs/brief/brief-guia-mei-apenas-nfse-sem-ie-nfce-nfe.md` — contexto MEI / apenas NFS-e.  
- `docs/brief/brief-plugnotas-certificado-409-sem-id.md` — erros Plugnotas / certificado.

---

## 7. Brief de alterações no código (persistência + API + UI)

**Objetivo:** gravar e reler os campos da secção «Dados mínimos para NFS-e» em `user_mei_certificates`, alinhados à migração `supabase/migrations/20260326140000_add_nfse_emitente_fields_to_user_mei_certificates.sql`, suportando **envio com certificado** e **atualização só de dados fiscais/endereço** sem novo `.pfx`.

### 7.1. Camada de dados (`backend/src/services/mei-certificate-store.js`)

| Alteração | Detalhe |
|-----------|---------|
| Estender `saveCertificate` | Incluir no `row` do `upsert` — quando existirem no payload — as colunas: `razao_social`, `nome_fantasia`, `fiscal_email`, `regime_tributario`, `inscricao_municipal`, `cep`, `logradouro`, `numero`, `complemento`, `bairro`, `ibge_municipio`, `cidade`, `uf`, `optante_simples_nacional`. Manter comportamento atual quando esses campos não forem enviados (não sobrescrever com `null` inadvertidamente em updates parciais — usar merge explícito ou função dedicada). |
| Função dedicada (recomendado) | `saveEmitenteNfseFields(userId, fields)` ou `patchEmitenteNfse(userId, partial)` que faz `update`/`upsert` **sem** exigir `pfx_base64` — para o botão «Atualizar cadastro (sem novo certificado)». |
| Estender `loadCertificate` ou novo getter | `select` deve incluir os novos campos para devolver ao frontend (ex.: `getEmitenteNfse` ou expandir retorno de `loadCertificate`). |
| Normalização | `cert_document` / CNPJ: só dígitos (já há padrão em `saveCertificateDocument`). `cep`: opcionalmente só dígitos. `uf`: maiúsculas, 2 caracteres. `ibge_municipio`: string normalizada (sem espaços estranhos). |

### 7.2. Fluxo Guia MEI (`backend/src/services/mei-guide.service.js` + rotas)

| Alteração | Detalhe |
|-----------|---------|
| `uploadCertificate` | Aceitar no corpo (multipart ou JSON adjacente) os campos NFS-e **ou** encadear chamada ao serviço de patch após `saveCertificate` bem-sucedido. |
| `getCertificateStatus` | Incluir no `return` os campos persistidos (para pré-preencher o formulário ao reabrir a página). |
| Nova rota (se necessário) | `PATCH` / `PUT` em `mei-guide.routes.js` (ex.: `/certificate/emitente-nfse` ou `/certificate/nfse-dados`) só com dados fiscais — autenticado, `requireMeiEnabled` — que chama `patchEmitenteNfse` sem tocar no `.pfx`. |

### 7.3. Fluxo emissão fiscal / Plugnotas (`mei-notas`)

| Alteração | Detalhe |
|-----------|---------|
| Pós-sucesso Plugnotas | Após `cadastrarEmpresaPlugNotas` / `atualizarEmpresaPlugNotas` (handlers em `mei-notas.controller.js` + serviços Plugnotas), **persistir** a mesma informação fiscal (payload já normalizado para o emissor) em `user_mei_certificates`, para evitar divergência «só no provedor». |
| Ordem de fonte de verdade | **Decisão de produto:** (A) Supabase é espelho do que foi enviado ao Plugnotas; (B) formulário grava só no Supabase e o backend monta o payload Plugnotas a partir daí. Documentar a opção na story. |

### 7.4. Frontend

| Ficheiro / área | Alteração |
|-----------------|-----------|
| `frontend/src/pages/GuidesMei.tsx` (ou componente do formulário NFS-e) | Estado para todos os campos; envio no mesmo `FormData`/request que o certificado ou request separado para «atualizar sem certificado». |
| `frontend/src/services/meiNotasService.ts` / `guidesMeiService.ts` | Tipos e chamadas alinhados ao contrato da API (campos opcionais vs obrigatórios no primeiro envio). |
| **UI «Rua» vs «Logradouro»** | A migração **não** tem coluna `rua` separada — só `logradouro` (comentário: logradouro/rua). Se o ecrã tiver dois campos, **unificar** numa única coluna `logradouro` ou concatenar no cliente antes de gravar. |

### 7.5. Segurança e qualidade

- **RLS:** confirmar que políticas existentes em `user_mei_certificates` cobrem `UPDATE`/`SELECT` das novas colunas pelo `user_id` dono da linha.
- **Testes:** estender testes de rotas MEI (`backend/tests/`) para payload com campos NFS-e e para patch sem novo ficheiro.
- **Tipos Supabase:** se o projeto usar `supabase gen types`, regenerar após aplicar a migração.

### 7.6. Critérios de aceitação (código)

- [ ] `saveCertificate` e/ou `patchEmitenteNfse` persistem os campos listados na secção 1.
- [ ] GET de estado do certificado (ou endpoint dedicado) devolve os campos para edição.
- [ ] Fluxo «atualizar só dados fiscais» não exige reenvio de `.pfx` nem apaga `pfx_base64` existente.
- [ ] CNPJ e CEP normalizados conforme convenção definida no backend.
- [ ] `npm run lint` / `npm run typecheck` / `npm test` no backend (e frontend se aplicável) passam.

---

**Última atualização desta secção:** 2026-03-26 — brief de alterações de código (secção 7).
