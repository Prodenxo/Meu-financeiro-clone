alter table if exists public.mei_nfse
  add column if not exists document_type text not null default 'NFSE';

update public.mei_nfse
set document_type = 'NFSE'
where document_type is null;

drop index if exists mei_nfse_user_id_id_integracao_uq;

create unique index if not exists mei_nfse_user_doc_type_id_integracao_uq
  on public.mei_nfse(user_id, document_type, id_integracao)
  where id_integracao is not null;
