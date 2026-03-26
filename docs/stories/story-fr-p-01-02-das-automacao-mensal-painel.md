# Story — FR-P-01 / FR-P-02: Automação mensal DAS + painel de pendências

**ID:** STORY-FR-P-01-02  
**Prioridade (PRD):** Could (depende de infra/cron)  
**Fonte:** `docs/brief.md`, PRD §5.1  
**Relacionado:** `docs/prd/PRD-meu-financeiro-produto-brownfield-2026-03-26.md`

## User stories

**FR-P-01 — Como** sistema operado pelo admin da empresa,  
**quero** um job mensal que gere/armazene o DAS para utilizadores elegíveis (documento via `cert_document`),  
**para** reduzir trabalho manual repetido por competência.

**FR-P-02 — Como** contador/admin,  
**quero** um painel consolidado de pendências DAS por cliente e competência,  
**para** priorizar quem precisa de ação.

## Contexto técnico

- **Arquitetura:** backend Express; persistência Supabase; agendamento conforme stack (cron Vercel, job interno, n8n — referência `docs/ops/n8n-zapi-das-mei.md` se relevante).
- **Dados:** PDF DAS + metadados; estado **pago** / **pendente**; escopo «todos os users da empresa do admin» conforme brief.
- **Horário sugerido (brief):** dia 1 de cada mês, 08:00 `America/Sao_Paulo` (confirmar com produto).
- **Integração:** reutilizar fluxos Serpro/DAS existentes onde possível (`mei-das.service.js` e documentação associada).

## Critérios de aceite

- [ ] Job executa no schedule definido (ou mecanismo equivalente documentado) com idempotência segura por cliente/competência.
- [ ] PDF armazenado e associado ao utilizador/competência; falhas individuais não impedem processamento dos restantes (com logs/alertas).
- [ ] Painel admin/contador lista pendências de forma consolidada conforme mock/requisitos do brief.
- [ ] Observabilidade: registos suficientes para diagnosticar falhas sem expor PII em excesso.
- [ ] Gates de qualidade no código entregue.

## Fora de escopo (MVP do brief)

- Mensageria automática (WhatsApp/e-mail) para cobrança; regras complexas de parcelamento.

## Dependências

- Definição de «elegível» e tratamento de ausência de `cert_document`; capacidade de armazenamento de PDFs (Supabase Storage ou existente).

## Definition of Done

- Runbook curto: como reprocessar competência; métricas do PRD (taxa de execução, cobertura) monitorizáveis ou exportáveis.

## Qualidade / CodeRabbit

- Concorrência e retries; limites de taxa nas APIs externas; secrets apenas no servidor.
