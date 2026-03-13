# Operacao de Migrations Supabase em Producao

Este guia descreve como aplicar migrations em producao com guardrails.

## Pre requisitos

- Supabase CLI instalada (`supabase --version`).
- Sessao autenticada na CLI (`supabase login`).
- Variaveis de ambiente configuradas:
  - `SUPABASE_PROD_PROJECT_REF`
  - `SUPABASE_PROD_DB_HOST`
- Migrations versionadas em `supabase/migrations`.

## Checklist pre execucao

- Confirmar que a migration foi revisada em PR.
- Confirmar janela de deploy e plano de rollback.
- Confirmar que `SUPABASE_PROD_PROJECT_REF` aponta para o projeto correto.
- Confirmar que `SUPABASE_PROD_DB_HOST` corresponde ao host de producao.

## Comandos

### 1) Check seguro (sem aplicar)

```bash
npm run db:migrate:prod:check
```

Esse comando valida ambiente, autenticacao, link do projeto e lista migrations pendentes.

### 2) Apply em producao (com confirmacao explicita)

```bash
npm run db:migrate:prod -- --yes --confirm-ref=<SUPABASE_PROD_PROJECT_REF>
```

Exemplo PowerShell:

```powershell
npm run db:migrate:prod -- --yes --confirm-ref=$env:SUPABASE_PROD_PROJECT_REF
```

Sem `--yes` e `--confirm-ref` o script aborta.

## Guardrails implementados

- Falha se Supabase CLI nao estiver instalada.
- Falha se a sessao da CLI nao estiver autenticada.
- Falha se `SUPABASE_PROD_PROJECT_REF` estiver ausente ou invalido.
- Falha se `SUPABASE_PROD_DB_HOST` estiver ausente, localhost ou divergente do projeto.
- Forca uso de `--workdir supabase`.
- Executa `supabase link --project-ref` e valida `.temp/project-ref`.
- Executa `supabase migration list --linked` antes do `supabase db push --linked`.

## Troubleshooting

- **Erro de autenticacao**
  - Rode `supabase login` e tente novamente.

- **Project ref nao encontrado**
  - Verifique se `SUPABASE_PROD_PROJECT_REF` esta correto e se sua conta possui acesso ao projeto.

- **Link divergente**
  - Reexecute o comando de check para relink e validacao.

- **Falha no db push**
  - Inspecione o erro SQL retornado pela CLI.
  - Corrija a migration e execute novamente o check antes de novo apply.

## Rollback operacional

- Nao usar remocao manual de schema em producao.
- Em caso de problema, criar migration corretiva/rollback em `supabase/migrations`.
- Validar localmente e aplicar via mesmo fluxo (`check` -> `apply`).

