# Project Brief: Automacao Mensal do DAS e Painel de Pendencias

## Executive Summary

O projeto adiciona automacao mensal de download do DAS para todos os usuarios da empresa do admin, com persistencia do PDF e exibicao do status de pagamento (pago ou pendente). A solucao tambem expande o painel do contador para listar, de forma consolidada, clientes com pendencias de DAS.

## Problem Statement

Hoje o acompanhamento de DAS depende de acao manual por cliente e por competencia, aumentando risco operacional de atrasos, retrabalho e falta de visibilidade do status real de pagamento.

Principais dores:
- Ausencia de rotina automatica mensal para gerar e baixar DAS.
- Falta de visibilidade centralizada de quem esta pendente.
- Dificuldade do contador em priorizar clientes em atraso.

## Proposed Solution

Implementar um fluxo automatizado mensal no backend que:
- identifica todos os usuarios da empresa do admin;
- resolve o CNPJ do cliente (fonte principal: `cert_document`);
- executa a geracao/download do DAS por competencia;
- armazena o PDF do DAS;
- registra metadados e status para consumo no frontend.

No frontend/admin:
- incluir visao consolidada de status DAS por cliente e competencia;
- destacar pendencias para acao prioritaria do contador.

## Target Users

### Primary User Segment: Contador/Admin

- Perfil: usuarios com papel administrativo responsavel por multiplos clientes.
- Necessidade: visao unica de pendencias DAS por carteira de clientes.
- Objetivo: reduzir atraso e melhorar previsibilidade operacional mensal.

### Secondary User Segment: Cliente final (MEI)

- Perfil: usuario final vinculado a empresa do admin.
- Necessidade: ter DAS disponivel e status claro de pagamento.
- Objetivo: cumprir obrigacoes fiscais no prazo.

## Goals and Success Metrics

### Business Objectives

- Automatizar download mensal do DAS para 100% dos usuarios elegiveis da empresa do admin.
- Reduzir o esforco manual de acompanhamento mensal de DAS no fluxo do contador.
- Diminuir o volume de clientes pendentes apos a primeira semana de cada competencia.

### User Success Metrics

- Tempo para identificar clientes pendentes no painel < 2 minutos.
- Disponibilidade do PDF do DAS por cliente/competencia sem acao manual do contador.
- Clareza de status pago/pendente para cada cliente e competencia.

### KPIs

- Taxa de execucao do job mensal de DAS: >= 99%.
- Cobertura de geracao/download por clientes elegiveis: >= 95%.
- Percentual de clientes pendentes apos D+7 da competencia.
- Tempo medio de resolucao de pendencias DAS por carteira.

## MVP Scope

### Core Features (Must Have)

- **Job mensal automatizado:** execucao no dia 1 de cada mes as 08:00 (America/Sao_Paulo).
- **Escopo de clientes:** todos os users da empresa do admin.
- **Fonte de documento fiscal:** uso de `cert_document` como documento primario.
- **Persistencia de arquivo:** armazenamento do PDF do DAS por cliente/competencia.
- **Status DAS:** classificacao e exibicao como `pago` ou `pendente`.
- **Painel do contador:** lista consolidada de clientes com pendencia DAS.

### Out of Scope for MVP

- Cobranca automatica ao cliente (mensageria/WhatsApp/email).
- Regras avancadas de parcelamento/renegociacao fiscal.
- Dashboards analiticos historicos complexos (tendencias anuais, previsao etc.).

### MVP Success Criteria

O MVP e considerado bem-sucedido quando o job mensal executar automaticamente no horario definido, armazenar os PDFs de DAS dos clientes elegiveis e o painel do contador exibir pendencias de forma confiavel para acao operacional.

## Post-MVP Vision

### Phase 2 Features

- Alertas proativos de pendencia (email, push, mensageria).
- Reprocessamento seletivo por cliente/competencia.
- Indicadores de SLA operacional por empresa/admin.

### Long-term Vision

Tornar o modulo DAS um centro operacional fiscal com automacao fim a fim, rastreabilidade e reducao continua de inadimplencia.

### Expansion Opportunities

- Integração com canais de cobranca e CRM.
- Recomendacoes automaticas de priorizacao por risco.
- Automacoes adicionais para obrigacoes fiscais recorrentes.

## Technical Considerations

### Platform Requirements

- **Target Platforms:** backend Node.js/Express e frontend React ja existentes.
- **Browser/OS Support:** manter compatibilidade atual do produto.
- **Performance Requirements:** processamento mensal com resiliencia e logs auditaveis.

### Technology Preferences

- **Frontend:** React + camada de servicos existente.
- **Backend:** Node.js + Express + servicos atuais do modulo MEI.
- **Database:** Supabase (persistencia de metadados/status).
- **Storage:** Supabase Storage (persistencia de PDF DAS).

### Architecture Considerations

- **Repository Structure:** manter padrao atual sem refatoracao estrutural ampla.
- **Service Architecture:** reaproveitar fluxo existente de MEI/DAS e adicionar orquestracao mensal.
- **Integration Requirements:** integracao com servicos ja existentes de emissao/download de guia.
- **Security/Compliance:** controle de acesso por empresa/admin e trilha de auditoria.

## Constraints and Assumptions

### Constraints

- **Budget:** sem nova plataforma externa obrigatoria no MVP.
- **Timeline:** entrega incremental com prioridade em automacao + painel de pendencias.
- **Resources:** evolucao sobre base existente, evitando refatoracoes amplas.
- **Technical:** dependencia da disponibilidade das integracoes externas de DAS.

### Key Assumptions

- `cert_document` esta disponivel e consistente para clientes elegiveis.
- O ambiente suporta agendamento mensal confiavel no backend.
- O storage tem capacidade e politicas adequadas para armazenar PDF mensal por cliente.
- O contador utiliza prioritariamente o painel admin para gestao de pendencias.

## Risks and Open Questions

### Key Risks

- **Falha de integracao externa no dia da execucao:** pode reduzir cobertura mensal de downloads.
- **Ausencia/inconsistencia de documento fiscal em parte da base:** pode bloquear geracao para alguns clientes.
- **Crescimento de volume de PDFs:** risco de custo e governanca de armazenamento.
- **Permissao e visibilidade incorretas no painel:** risco de exposicao indevida de dados entre empresas.

### Open Questions

- Politica de retencao dos PDFs (prazo e ciclo de limpeza/arquivamento).
- Estrategia de retry e janela de reprocessamento do job mensal.
- Regras de classificacao de "pendente" em casos de status intermediario.
- Necessidade de filtro por competencia no painel admin.

### Areas Needing Further Research

- Melhor politica de versionamento e naming para arquivos PDF no storage.
- Estrategia de observabilidade (logs, metricas, alertas) para job mensal.
- Definicao de SLA operacional para monitoramento de pendencias.

## Next Steps

### Immediate Actions

1. Criar story tecnica para backend (agendamento mensal, persistencia de PDF e status DAS).
2. Criar story tecnica para frontend admin (bloco de pendencias DAS por cliente).
3. Definir schema de dados para historico DAS por competencia e vinculacao ao usuario.
4. Definir bucket e convencao de armazenamento do PDF no Supabase Storage.
5. Implementar testes de regressao do fluxo DAS e validacao de permissao no painel admin.

### PM Handoff

Este Project Brief esta pronto para evolucao em PRD e stories de implementacao. O foco aprovado e: todos os users da empresa do admin, uso de `cert_document`, agendamento mensal validado e armazenamento de PDF do DAS.
