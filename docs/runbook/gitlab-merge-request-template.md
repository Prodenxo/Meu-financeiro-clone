# GitLab — template de Merge Request (paridade com GitHub)

**Contexto (CORR-02, feedback QA):** o repositório usa `.github/pull_request_template.md` no GitHub. Em **GitLab**, o equivalente é um ficheiro em `.gitlab/merge_request_templates/`.

## Instalação

1. Criar no repositório: `.gitlab/merge_request_templates/Default.md` (ou outro nome; ver [documentação GitLab](https://docs.gitlab.com/ee/user/project/merge_requests/creating_merge_requests.html#merge-request-templates)).
2. Copiar o corpo abaixo para esse ficheiro (ajustar se a equipa usar outro fluxo).

## Corpo sugerido (copiar)

```markdown
## Descrição

<!-- O que mudou e porquê. -->

## Checklist

- [ ] `npm run lint`, `npm run typecheck` e `npm run test` conforme `AGENTS.md` (ajustar se o MR não tocar em código).
- [ ] **Base de dados:** se este MR altera `supabase/migrations/` ou o código passa a usar colunas/tabelas novas, confirmar que as migrações foram aplicadas (ou serão aplicadas na **mesma** janela de deploy) no ambiente alvo — ver `docs/runbook/supabase-ambientes-e-deploy.md`.
```

---

## Bitbucket

Em Bitbucket Cloud, usar **pull request description template** nas definições do repositório ou ficheiro `PULL_REQUEST_TEMPLATE.md` na raiz (conforme [documentação Atlassian](https://support.atlassian.com/bitbucket-cloud/docs/use-pull-request-description-templates/)). Reutilizar o mesmo checklist acima.
