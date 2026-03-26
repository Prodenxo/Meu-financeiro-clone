# PRD — Correção: schema Supabase alinhado ao emitente NFS-e (`tipo_logradouro`)

**Versão:** 1.0  
**Data:** 2026-03-26  
**Tipo:** Brownfield — correção operacional e de consistência DB ↔ código  
**Fontes:** `docs/brief/brief-correcao-supabase-tipo-logradouro-schema-cache.md`, `docs/brief/brief-user-mei-certificates-nfse-campos-supabase.md`, `docs/stories/story-fr-p-03-04-nfse-emitente-user-mei-certificates.md`

**Relação com PRD principal:** complementa `docs/prd/PRD-meu-financeiro-produto-brownfield-2026-03-26.md` (iniciativa NFS-e / FR-P-03–04). Não altera escopo de funcionalidade nova: **garante** que ambientes remotos suportam o que o código já implementa.

---

## 1. Resumo executivo

Utilizadores no fluxo **Guia MEI → dados mínimos para NFS-e** conseguem ver a empresa atualizada no **emissor fiscal (Plugnotas)** e, em seguida, falham ao **gravar na aplicação** com erro PostgREST: coluna `tipo_logradouro` inexistente no **schema cache** do projeto Supabase em uso.

O repositório já contém a migração e o backend já persiste `tipo_logradouro`. A falha indica **desalinhamento entre código implantado e base de dados** no ambiente (dev/staging/prod). Este PRD define o **problema de produto** (dados não ficam na app), a **solução esperada** (sincronizar schema + processo), **critérios de aceite** e **riscos**, para execução por Engenharia/DevOps com validação de QA.

---

## 2. Problema

### 2.1 Sintoma (utilizador)

- Mensagem do tipo: *«Empresa atualizada no emissor fiscal, mas os dados não foram gravados nesta aplicação»*, seguida do detalhe técnico sobre `tipo_logradouro` / schema cache.
- O utilizador perde **confiança**: parte do fluxo “funciona” (provedor) e parte “falha” (app), sem distinção clara na primeira leitura.

### 2.2 Sintoma (técnico)

- `PATCH` para `/api/mei-guide/certificate/emitente-nfse` retorna **400** com mensagem equivalente a: *Could not find the 'tipo_logradouro' column of 'user_mei_certificates' in the schema cache*.

### 2.3 Causa raiz (hipótese aceite)

- Migração `supabase/migrations/20260326150000_add_tipo_logradouro_user_mei_certificates.sql` **não aplicada** no projeto Supabase referenciado pelo `.env` do backend **ou** cache do API não atualizado após DDL.

### 2.4 Fora do âmbito deste PRD (problemas distintos)

- **502** ou indisponibilidade do Plugnotas na consulta à empresa — tratamento à parte (provedor/rede); não substitui a correção de schema local.
- Alteração de regras de negócio do formulário NFS-e — permanece na story FR-P-03/04 e no PRD brownfield; aqui só **habilitação** da coluna no DB.

---

## 3. Objetivos e métricas de sucesso

| Objetivo | Métrica / evidência |
|----------|---------------------|
| O utilizador consegue **persistir** emitente/endereço (incl. tipo de logradouro) na app após operação válida no emissor | `PATCH` emitente-nfse com payload válido → **2xx**; dados visíveis no GET de estado / formulário |
| Ambientes com código atual **não** ficam com schema atrasado | Checklist de deploy: migrações `20260326140000_*` e `20260326150000_*` aplicadas antes ou em conjunto com releases que referenciam `tipo_logradouro` |
| Reduzir tickets “dados não gravados” por erro de coluna | Regressão manual/automática documentada pós-correção |

---

## 4. Escopo

### 4.1 Dentro do escopo (must-have)

1. **Operação:** aplicar migrações pendentes no(s) projeto(s) Supabase usados pelos ambientes da aplicação (pelo menos o ambiente onde o erro foi reproduzido).
2. **Verificação:** confirmar existência da coluna `public.user_mei_certificates.tipo_logradouro` (query no SQL Editor ou equivalente).
3. **Se necessário:** recarregar schema do PostgREST no painel Supabase quando a coluna existir mas o erro persistir.
4. **Processo:** registar no runbook ou `PROJECT_MEMORY.md` a correspondência **projeto Supabase ↔ `.env` por ambiente**, para evitar repetir o desalinhamento.
5. **Validação:** retestar fluxo «Atualizar cadastro (sem novo certificado)» e leitura dos dados na UI.

### 4.2 Fora do escopo

- Reescrever `mei-certificate-store.js` ou contrato da API (já previstos na story se ainda em aberto).
- Novas colunas além das já definidas nos briefs/migrações existentes.
- Resolver instabilidade do Plugnotas (502) — pode ser referenciada em comunicação ao utilizador, mas não é entregável deste PRD.

---

## 5. Requisitos

### 5.1 Funcionais

| ID | Requisito |
|----|-----------|
| FR-CORR-01 | A tabela `public.user_mei_certificates` no projeto Supabase do ambiente expõe a coluna `tipo_logradouro` (tipo e nulabilidade conforme migração). |
| FR-CORR-02 | O endpoint `PATCH /api/mei-guide/certificate/emitente-nfse` completa com sucesso quando o payload é válido e não há outro erro de negócio, **sem** erro de schema PostgREST por coluna em falta. |
| FR-CORR-03 | Após gravação bem-sucedida, o utilizador vê os dados ao reabrir o fluxo (leitura via API de estado já definida na story). |

### 5.2 Não funcionais

| ID | Requisito |
|----|-----------|
| NFR-CORR-01 | **Segurança:** DDL não enfraquece RLS; políticas existentes continuam a aplicar-se às novas colunas como às demais da mesma tabela. |
| NFR-CORR-02 | **Rastreabilidade:** alteração em produção segue o processo de mudança da equipa (migração versionada, não SQL ad hoc não documentado). |
| NFR-CORR-03 | **Regressão:** após correção, executar gates do projeto nos componentes tocados se houver alteração de código (neste PRD o foco é DB/ops; gates mínimos conforme `AGENTS.md`). |

---

## 6. Critérios de aceite (produto + técnico)

- [ ] Query de catálogo confirma `tipo_logradouro` em `user_mei_certificates` no projeto correto.
- [ ] `PATCH` emitente-nfse deixa de retornar 400 pelo motivo «column … not found … schema cache» em cenário feliz.
- [ ] Dados persistidos aparecem na UI após refresh/reentrada no ecrã.
- [ ] Documentação interna atualizada: ponteiro para este PRD + brief de correção; checklist de migrações por ambiente (ou entrada em `PROJECT_MEMORY.md`).
- [ ] Story `story-fr-p-03-04-nfse-emitente-user-mei-certificates.md` referenciada; checklist da story atualizado se aplicável.

---

## 7. Riscos e dependências

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Confusão entre projeto Supabase de dev e prod | Correção no ambiente errado ou falha repetida em prod | Mapear URL/anon key por ambiente; validar com query antes de fechar o ticket |
| Código deployado antes do DB em próximo release | Recorrência do mesmo erro | Gate de release: migrações aplicadas ou bloqueio de deploy |
| Plugnotas 502 em paralelo | Utilizador culpa a app | Mensagens de UI já orientam; manter distinção provedor vs. persistência local (como no brief) |

**Dependências:** acesso ao painel Supabase e ao pipeline de migrações; credenciais `.env` do ambiente afetado.

---

## 8. Comunicação e suporte

- **Interno:** Engenharia aplica DDL/migrações; QA valida fluxo; Produto confirma critérios de aceite.
- **Utilizador (se necessário):** após correção, não é obrigatório comunicação externa; se houver FAQ/help, pode acrescentar linha «garantir app e base atualizadas» para erros de schema.

---

## 9. Referências

- Brief de correção: `docs/brief/brief-correcao-supabase-tipo-logradouro-schema-cache.md`
- Brief campos NFS-e: `docs/brief/brief-user-mei-certificates-nfse-campos-supabase.md`
- Migrações: `supabase/migrations/20260326140000_add_nfse_emitente_fields_to_user_mei_certificates.sql`, `supabase/migrations/20260326150000_add_tipo_logradouro_user_mei_certificates.sql`
- Story: `docs/stories/story-fr-p-03-04-nfse-emitente-user-mei-certificates.md`
- PRD brownfield (contexto): `docs/prd/PRD-meu-financeiro-produto-brownfield-2026-03-26.md`

---

**Aprovação (opcional):** Produto ______________ · Engenharia ______________ · Data ______________

— *Morgan (PM), alinhando correção a valor e rastreabilidade.*
