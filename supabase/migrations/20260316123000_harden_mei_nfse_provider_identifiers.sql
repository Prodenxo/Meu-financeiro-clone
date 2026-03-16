do $$
begin
  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and indexname = 'mei_nfse_user_doc_type_plugnotas_id_uq'
  ) then
    if not exists (
      select 1
      from (
        select user_id, document_type, plugnotas_id, count(*) as total
        from public.mei_nfse
        where plugnotas_id is not null
        group by user_id, document_type, plugnotas_id
        having count(*) > 1
      ) duplicated
    ) then
      create unique index mei_nfse_user_doc_type_plugnotas_id_uq
        on public.mei_nfse(user_id, document_type, plugnotas_id)
        where plugnotas_id is not null;
    else
      create index mei_nfse_user_doc_type_plugnotas_id_idx
        on public.mei_nfse(user_id, document_type, plugnotas_id)
        where plugnotas_id is not null;
    end if;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and indexname = 'mei_nfse_user_doc_type_protocol_uq'
  ) then
    if not exists (
      select 1
      from (
        select user_id, document_type, protocol, count(*) as total
        from public.mei_nfse
        where protocol is not null
        group by user_id, document_type, protocol
        having count(*) > 1
      ) duplicated
    ) then
      create unique index mei_nfse_user_doc_type_protocol_uq
        on public.mei_nfse(user_id, document_type, protocol)
        where protocol is not null;
    else
      create index mei_nfse_user_doc_type_protocol_idx
        on public.mei_nfse(user_id, document_type, protocol)
        where protocol is not null;
    end if;
  end if;
end
$$;
