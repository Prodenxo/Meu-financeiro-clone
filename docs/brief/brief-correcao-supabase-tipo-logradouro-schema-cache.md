# Brief: correção — coluna `tipo_logradouro` ausente no Supabase (schema cache)

**Data:** 2026-03-26  
**Persona / origem:** Atlas (análise pós-incidente) — falha ao gravar emitente NFS-e após sucesso no emissor fiscal.

---

## 1. Sintoma observado

- **UI:** «Empresa atualizada no emissor fiscal, mas os dados não foram gravados nesta aplicação» seguido da mensagem técnica do PostgREST/Supabase.
- **Rede:** `PATCH` para `http://localhost:3000/api/mei-guide/certificate/emitente-nfse` responde **400 Bad Request** com corpo semelhante a:

```json
{
  "success": false,
  "data": null,
  "message": "Could not find the 'tipo_logradouro' column of 'user_mei_certificates' in the schema cache"
}
```

- **Nota:** um **502** em `GET` para o serviço Plugnotas (`/empresa/...`) é problema distinto (disponibilidade/API do provedor). O bloqueio à **persistência local** é o erro **400** acima: a aplicação tenta escrever uma coluna que o **projeto Supabase ligado ao ambiente** ainda não expõe.

---

## 2. Causa raiz (provável)

O backend já envia `tipo_logradouro` no `update`/`upsert` para `public.user_mei_certificates` (ver `backend/src/services/mei-certificate-store.js`). No repositório existe migração que cria essa coluna:

- `supabase/migrations/20260326150000_add_tipo_logradouro_user_mei_certificates.sql`

Se essa migração **não foi aplicada** no **mesmo** projeto Supabase que o `.env` do backend utiliza (dev/staging/prod), o PostgREST devolve exatamente o erro «Could not find the 'tipo_logradouro' column … in the **schema cache**».

Menos comum: coluna criada manualmente mas cache do API ainda antigo — nesse caso basta recarregar o schema no painel Supabase ou aguardar/atualizar.

---

## 3. Correção recomendada (operacional)

1. **Confirmar ambiente:** qual URL/anon key do Supabase está em `backend/.env` (ou variáveis equivalentes) ao reproduzir o erro.
2. **Aplicar migrações pendentes** nesse projeto, na ordem cronológica, pelo fluxo habitual da equipa:
   - `supabase db push` / `supabase migration up` / **SQL Editor** com o conteúdo das migrações `20260326140000_*` e `20260326150000_*` se ainda não estiverem aplicadas.
3. **Verificar no SQL Editor** (projeto correto):

   ```sql
   select column_name
   from information_schema.columns
   where table_schema = 'public'
     and table_name = 'user_mei_certificates'
     and column_name = 'tipo_logradouro';
   ```

   Deve devolver uma linha.

4. **Se a coluna existir mas o erro persistir:** no Supabase, usar **Settings → API → Reload schema** (ou equivalente na versão atual do painel) para forçar o PostgREST a atualizar o cache.
5. **Retestar:** submeter de novo «Atualizar cadastro (sem novo certificado)» e confirmar **200** no `PATCH` e dados visíveis no `GET` de estado do certificado / formulário.

---

## 4. Critérios de aceitação

- [ ] Coluna `tipo_logradouro` existe em `public.user_mei_certificates` no projeto Supabase usado pelo backend.
- [ ] `PATCH /api/mei-guide/certificate/emitente-nfse` conclui com sucesso quando os dados são válidos (sem erro de schema).
- [ ] Documentação interna: manter alinhamento com `docs/brief/brief-user-mei-certificates-nfse-campos-supabase.md` e story `docs/stories/story-fr-p-03-04-nfse-emitente-user-mei-certificates.md` (checklist de migrações aplicadas em cada ambiente).

---

## 5. Riscos e notas

| Risco | Mitigação |
|-------|-----------|
| Migração aplicada só em local, não no projeto cloud | Checklist de deploy: marcar migrações como obrigatórias antes de subir código que referencia `tipo_logradouro`. |
| Vários projetos Supabase (dev vs prod) | Registar em `PROJECT_MEMORY.md` ou runbook qual projeto corresponde a qual `.env`. |

**Observação de produto:** enquanto o Plugnotas devolver 502, o utilizador pode ver aviso de falha na «consulta» ao emissor; isso não substitui a necessidade de o Supabase estar em sync com o código.

---

## 6. Referências no repositório

- Migração da coluna: `supabase/migrations/20260326150000_add_tipo_logradouro_user_mei_certificates.sql`
- Campos NFS-e (contexto amplo): `supabase/migrations/20260326140000_add_nfse_emitente_fields_to_user_mei_certificates.sql`
- Brief campos + código: `docs/brief/brief-user-mei-certificates-nfse-campos-supabase.md`
- Story: `docs/stories/story-fr-p-03-04-nfse-emitente-user-mei-certificates.md`
