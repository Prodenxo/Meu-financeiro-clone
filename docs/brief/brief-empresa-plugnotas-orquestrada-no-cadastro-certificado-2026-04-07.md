# Brief: **criar empresa no Plugnotas** no mesmo fluxo do **cadastro de certificado** no site

**Data:** 2026-04-07  
**Origem:** pedido de produto (orquestração AIOX — alinhamento utilizador ↔ Plugnotas).  
**Produto:** Meu Financeiro — **Guia MEI / setup emissão fiscal** (certificado A1 + emitente no **Plugnotas**).

**Documentos relacionados (não substituídos por este brief):**

- `docs/operacao-mei-nfse.md` — fluxo atual (`POST /certificado` vs `POST /empresa`), erros 404/409 e checklist de ambiente.  
- `docs/brief/brief-cadastro-empresa-documentos-ativos-plugnotas-2026-04-07.md` — documentos ativos no cadastro da empresa.  
- `docs/brief/brief-atualizacao-posterior-documentos-ativos-plugnotas-supabase-2026-04-07.md` — espelho `documentos_ativos` no Supabase após empresa.  
- `backend/src/controllers/mei-notas.controller.js` — `cadastrarPlugNotasCertificado` e `cadastrarPlugNotasEmpresa` hoje **separados**.  
- `backend/src/services/plugnotas/empresa.service.js` — `cadastrarCertificadoPlugNotas`, `cadastrarEmpresaPlugNotas` (incl. conflito → `PATCH`).

**Próximos passos típicos:** `@pm` — PRD, critérios de aceite, cenários de falha parcial e rollback; `@architect` — contrato API (endpoint único vs orquestração em dois passos), idempotência e ordem Plugnotas; `@dev` — UI da Guia MEI e chamadas ao backend; `@qa` — testes de integração simulando 200/409/falha pós-certificado.

---

## 1. Resumo executivo

Hoje, no **site do produto**, o utilizador pode concluir o envio do **certificado digital** (`POST …/certificado` via API interna) **sem** que exista, na mesma ação, um cadastro de **empresa/emitente** correspondente no Plugnotas (`POST …/empresa`). No **painel web** do Plugnotas, **Certificados** e **Empresas** são áreas distintas; na **API**, também são recursos distintos. Isso gera expectativa quebrada: certificado visível no provedor, mas **sem emitente** pronto para emissão até o utilizador avançar (ou repetir) o passo de empresa.

Pretende-se que, **ao cadastrar o certificado no site** (fluxo da Guia MEI / setup fiscal), a **empresa no Plugnotas** seja **criada ou atualizada de forma orquestrada** no mesmo contexto de utilizador, de modo que, após sucesso, o estado remoto fique **coerente** (certificado referenciado no `POST /empresa` ou equivalente canónico) e o utilizador **não dependa** de um segundo momento “invisível” para existir linha em **Empresas** no app2.

**Nota de engenharia (não negociável na implementação):** o Plugnotas **não** cria empresa só com o ficheiro `.pfx`; `POST /empresa` exige **payload de emitente** (CNPJ, razão social, endereço, IM/IE conforme regras atuais, `certificado` com ID retornado do upload, etc.). Logo, “criar empresa ao cadastrar certificado” implica **reunir na mesma submissão (ou transação de UI)** os dados já necessários ao cadastro de empresa — ou **bloquear** o envio do certificado até esses dados estarem válidos, conforme decisão de UX abaixo.

---

## 2. Problema / oportunidade

| Dimensão | Situação atual | Risco ou oportunidade |
|----------|----------------|------------------------|
| **Estado remoto** | Certificado pode existir no Plugnotas **sem** empresa cadastrada para o mesmo CNPJ/conta. | Emissão e consultas (`GET /empresa/:cnpj`) falham ou confundem suporte (“já enviei o certificado”). |
| **Passos na UI** | Dois momentos explícitos no produto (certificado e empresa), com risco de abandono entre eles. | **Conversão** e **clareza**: um “marco” de conclusão alinhado ao que o painel Plugnotas mostra em **Empresas**. |
| **Paridade painel vs app** | Utilizador compara com **Empresas** no app2 e não vê o CNPJ até cadastrar empresa. | Reduzir **tickets** e dúvidas de “cadastrei só o certificado”. |
| **Falha parcial** | Se no futuro houver encadeamento automático, um passo pode falhar (rede, validação SEFAZ/prefeitura indireta, 409). | É necessária **política de erro** e mensagens acionáveis (retry, continuar depois, estado persistido). |

---

## 3. Objetivos

1. **Orquestração:** após **upload bem-sucedido** do certificado (obtenção do **ID** do certificado no Plugnotas), o backend deve **disparar** o cadastro de empresa com esse ID **no mesmo fluxo** iniciado pelo utilizador no site (sem exigir um segundo clique “mágico” não comunicado), respeitando a política atual de payload MEI/Plugnotas.  
2. **Pré-requisitos de dados:** o formulário (ou passo único) deve garantir que **todos os campos obrigatórios** para `POST /empresa` estejam disponíveis **antes** ou **junto** do upload — incluindo `documentosAtivos` se o produto já o expuser (ver briefs de documentos ativos).  
3. **Idempotência:** reutilizar comportamento existente de **conflito** (empresa já existe → tentativa de atualização / `PATCH` conforme `cadastrarEmpresaPlugNotas`).  
4. **Espelho Supabase:** manter (ou estender) `persistDocumentosAtivosMirrorAfterEmpresa` quando o payload de empresa incluir `documentosAtivos`, para não regredir a story de espelho local.  
5. **Observabilidade:** logs/métricas distinguindo falha em **certificado** vs **empresa** para diagnóstico em produção.

---

## 4. Fora de âmbito (sugerido; validar com PO)

- Alterar o modelo de negócio do Plugnotas (continua API REST com recursos separados).  
- **Garantir** emissão autorizada de nota no mesmo request (autorização depende de regras fiscais e do provedor).  
- Sincronização bidirecional em tempo real só via webhook (pode ser fase posterior; ver brief de reconciliação `GET empresa`).

---

## 5. Decisões em aberto (críticas antes do PRD)

1. **Modelo de UI:**  
   - **A)** Um único botão **“Concluir configuração fiscal”** que envia **multipart + JSON** (ou duas chamadas sequenciais no cliente com estado de loading único), **ou**  
   - **B)** Manter dois passos visuais mas **encadear automaticamente** ao terminar o passo 1 (certificado), desde que o passo 2 já esteja válido em memória.  
2. **Validação:** bloquear upload de `.pfx` até o formulário de empresa estar válido, ou permitir certificado primeiro e **fila** de “pendente de empresa” (estado local + retry).  
3. **Falha após certificado:** se `POST /empresa` falhar, política de **compensação** (mensagem + retry com mesmo certificado ID vs orientar painel Plugnotas vs rollback conceitual).  
4. **409 certificado:** manter fluxo atual de resolução de ID; garantir que a orquestração **não duplique** empresa nem deixe mensagens contraditórias.  
5. **Compatibilidade API pública interna:** novo endpoint composto (`…/setup/emissao-fiscal/emitente`?) **vs** apenas mudança de contrato no frontend chamando certificado + empresa em sequência — impacto em clientes/mobile futuros.

---

## 6. Proposta de experiência (UX)

- Copy clara: **“Ao concluir, o certificado e os dados do emitente serão enviados ao Plugnotas.”**  
- Indicador de progresso em **duas fases** (mesmo que transparentes): “Enviando certificado…” → “Registrando empresa…”.  
- Em sucesso: mensagem única confirmando **certificado + empresa** (evitar jargão `POST`).  
- Em erro na segunda fase: explicar que o certificado pode já estar no provedor e oferecer **“Tentar registrar empresa novamente”** com os mesmos dados.

---

## 7. Notas técnicas (referência)

- Rotas atuais: `POST …/setup/emissao-fiscal/certificado` e `POST …/setup/emissao-fiscal/empresa` (`mei-notas.routes.js`).  
- `cadastrarEmpresaPlugNotas` exige `certificado` no payload (`empresa.service.js`).  
- Documentação operacional: `docs/operacao-mei-nfse.md` (404 “empresa não localizada”, 409 certificado).

---

## 8. Critérios de sucesso (proposta)

1. Utilizador completa o fluxo **único** no site e verifica no **app2 Plugnotas** que o **CNPJ** aparece em **Empresas** com documentos/configuração esperados.  
2. Testes automatizados cobrem: sucesso completo; falha após certificado; empresa já existente (conflito); 409 no certificado com resolução de ID seguida de empresa.  
3. PRD/story referenciam este brief e fecham as decisões da secção 5.

---

*Documento de brief; não substitui ADR nem contratos finais de API. Ajustar datas e referências quando a story for priorizada.*
