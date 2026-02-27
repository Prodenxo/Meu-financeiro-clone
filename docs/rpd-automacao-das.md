# Meu-financeiro Brownfield Enhancement PRD

## Intro Project Analysis and Context

### Existing Project Overview

#### Analysis Source

- IDE-based fresh analysis + base no brief existente em `docs/brief.md`.

#### Current Project State

O projeto `Meu-financeiro` ja possui backend e frontend para operacoes financeiras, incluindo modulo MEI com geracao/download de DAS e fluxos administrativos para visualizacao de dados por usuario. O estado atual possui a capacidade tecnica para baixar DAS e interpretar status por competencia, mas sem automacao mensal e sem consolidacao de pendencias no painel do contador.

### Available Documentation Analysis

#### Available Documentation

- [x] Tech Stack Documentation
- [x] Source Tree/Architecture
- [x] API Documentation
- [x] External API Documentation
- [x] Technical Debt Documentation
- [ ] UX/UI Guidelines
- [x] Other: `docs/brief.md`

### Enhancement Scope Definition

#### Enhancement Type

- [x] New Feature Addition
- [x] Major Feature Modification
- [x] Integration with New Systems
- [ ] Performance/Scalability Improvements
- [x] UI/UX Overhaul
- [ ] Technology Stack Upgrade
- [ ] Bug Fix and Stability Improvements

#### Enhancement Description

Adicionar automacao mensal para download do DAS de todos os usuarios da empresa do admin, persistindo o PDF por cliente e competencia. Expandir o painel administrativo para exibir status de pagamento e pendencias de DAS de forma consolidada para o contador.

#### Impact Assessment

- [ ] Minimal Impact (isolated additions)
- [ ] Moderate Impact (some existing code changes)
- [x] Significant Impact (substantial existing code changes)
- [ ] Major Impact (architectural changes required)

### Goals and Background Context

#### Goals

- Automatizar a rotina mensal de DAS sem acao manual por cliente.
- Exibir status `pago` ou `pendente` por cliente/competencia no contexto admin.
- Permitir priorizacao operacional de pendencias em uma unica visao.
- Persistir PDF do DAS para rastreabilidade e acesso posterior.

#### Background Context

O fluxo atual de DAS atende operacoes pontuais, mas nao resolve a necessidade recorrente de acompanhamento em escala por carteira de clientes. A ausencia de automacao e de painel consolidado aumenta risco de atraso e reduz previsibilidade operacional para o contador.

Com base no brief aprovado, a evolucao deve preservar a arquitetura existente e ampliar capacidades de orquestracao mensal, persistencia de documentos e observabilidade de status, com foco em entrega incremental e baixa regressao nos fluxos atuais.

#### Change Log

| Change | Date | Version | Description | Author |
| --- | --- | --- | --- | --- |
| Initial draft | 2026-02-23 | 0.1 | RPD criado a partir do brief de automacao DAS | Morgan (PM) |

## Requirements

### Functional

1. FR1: O sistema deve executar automaticamente um job mensal no dia 1 as 08:00 (America/Sao_Paulo) para processar DAS dos clientes elegiveis.
2. FR2: O escopo do job deve incluir todos os usuarios vinculados a empresa do admin solicitante.
3. FR3: O sistema deve usar `cert_document` como fonte primaria de documento fiscal para identificar o cliente no processamento do DAS.
4. FR4: Para cada cliente e competencia processada, o sistema deve gerar/baixar o DAS e armazenar o PDF em storage persistente.
5. FR5: O sistema deve persistir metadados por processamento (cliente, competencia, status, caminho do arquivo, timestamps, erros).
6. FR6: O sistema deve classificar e expor status de DAS por cliente/competencia como `pago` ou `pendente`.
7. FR7: O painel do contador deve listar todos os clientes pendentes de pagamento DAS na competencia selecionada (ou corrente por padrao).
8. FR8: O painel deve permitir filtro minimo por competencia e busca por cliente para acelerar triagem operacional.
9. FR9: O sistema deve permitir reprocessamento manual de cliente/competencia em caso de falha de execucao automatica.
10. FR10: O sistema deve registrar logs de execucao do job e eventos de falha com informacoes suficientes para auditoria tecnica.

### Non Functional

1. NFR1: A implementacao deve preservar os fluxos existentes de MEI/NFSe sem regressao funcional perceptivel.
2. NFR2: O job mensal deve operar com taxa de sucesso minima de 99% em execucoes validas.
3. NFR3: O processamento deve ser resiliente a falhas parciais, mantendo continuidade para demais clientes mesmo quando ocorrer erro individual.
4. NFR4: O acesso a status e PDFs deve respeitar isolamento por empresa e papeis de permissao existentes.
5. NFR5: O armazenamento de PDF deve seguir convencao de naming e rastreabilidade por cliente/competencia.
6. NFR6: O tempo de carregamento da visao de pendencias no painel admin deve permanecer adequado para uso operacional (<2 minutos para triagem completa).
7. NFR7: Logs nao devem expor segredos, tokens ou dados sensiveis alem do minimo necessario para diagnostico.
8. NFR8: A entrega deve incluir cobertura minima de testes para fluxo mensal, persistencia e consulta de pendencias.

### Compatibility Requirements

1. CR1: Rotas existentes de `mei-guide` e fluxos de download manual devem continuar compativeis.
2. CR2: Estruturas de dados ja usadas no frontend admin nao devem ser quebradas sem versionamento/ajuste coordenado.
3. CR3: A experiencia visual deve manter consistencia com padroes atuais de `AdminUserData`.
4. CR4: Integracoes externas de DAS devem manter contrato atual, com adaptacoes encapsuladas na camada de servico.

## User Interface Enhancement Goals

### Integration with Existing UI

A nova visao de pendencias deve ser incorporada ao painel admin existente, reaproveitando componentes e padroes de feedback (loading, erro, vazio e sucesso) ja usados em accordions e tabelas.

### Modified/New Screens and Views

- `AdminUserData`: novo bloco de "Pendencias DAS" com lista consolidada.
- Possivel adicao de detalhes de DAS por usuario no fluxo administrativo (sem criar tela separada no MVP).

### UI Consistency Requirements

- Manter tema claro/escuro e padrao visual vigente.
- Manter linguagem de status em portugues (`pago`/`pendente`).
- Garantir navegacao e filtros consistentes com demais secoes admin.

## Technical Constraints and Integration Requirements

### Existing Technology Stack

**Languages**: JavaScript (backend), TypeScript/TSX (frontend)  
**Frameworks**: Express (backend), React (frontend)  
**Database**: Supabase (dados operacionais)  
**Infrastructure**: Node runtime + servicos externos MEI  
**External Dependencies**: Integracao Serpro/MEI ja existente

### Integration Approach

**Database Integration Strategy**: criar/estender tabela de historico DAS por usuario e competencia com status e referencia de arquivo.  
**API Integration Strategy**: adicionar endpoints admin para consulta consolidada de pendencias e, quando necessario, reprocessamento.  
**Frontend Integration Strategy**: ampliar servicos admin e pagina `AdminUserData` para consumir novos dados de DAS.  
**Testing Integration Strategy**: incluir testes de servico/controle para processamento mensal e cobertura frontend do bloco de pendencias.

### Code Organization and Standards

**File Structure Approach**: manter padrao atual de controllers/services/routes por dominio.  
**Naming Conventions**: seguir naming em portugues/ingles ja vigente no modulo admin/MEI.  
**Coding Standards**: aderir lint/typecheck/test atuais do workspace.  
**Documentation Standards**: atualizar docs de operacao e story vinculada antes de concluir.

### Deployment and Operations

**Build Process Integration**: sem mudanca estrutural no pipeline; incluir validacao dos novos testes.  
**Deployment Strategy**: rollout incremental por backend (job + endpoints) e frontend (painel).  
**Monitoring and Logging**: logs de execucao por competencia, contagem processada, falhas e reprocessos.  
**Configuration Management**: variaveis para cron, timezone, bucket/path e regras de retencao.

### Risk Assessment and Mitigation

**Technical Risks**: falha de integracao externa no dia da rotina; ausencia de `cert_document` para parte da base.  
**Integration Risks**: sobrecarga no job mensal e inconsistencias de status em dados parcialmente processados.  
**Deployment Risks**: falta de observabilidade inicial e dificuldade de suporte em primeiro ciclo mensal.  
**Mitigation Strategies**: retry com backoff, idempotencia por cliente/competencia, logs estruturados, reprocessamento manual e metricas de cobertura.

## Epic and Story Structure

### Epic Approach

**Epic Structure Decision**: single epic, pois a entrega e um enhancement coeso (automacao DAS + persistencia + painel admin) com dependencias diretas entre backend e frontend.

## Epic 1: Automacao Mensal do DAS e Gestao de Pendencias no Painel Admin

**Epic Goal**: entregar automacao mensal confiavel para processamento de DAS com persistencia do PDF e visibilidade operacional de pendencias no painel do contador.  
**Integration Requirements**: manter compatibilidade com fluxos atuais MEI/admin e respeitar isolamento por empresa.

### Story 1.1 Base de dados e persistencia de DAS

As a admin/contador,  
I want que o sistema registre historico de DAS por cliente e competencia,  
so that eu tenha rastreabilidade e acesso confiavel ao documento.

#### Acceptance Criteria

1. A estrutura de dados armazena cliente, competencia, status, caminho PDF e timestamps.
2. O PDF e salvo em storage com convencao deterministica por cliente/competencia.
3. A persistencia e idempotente para evitar duplicidade no mesmo periodo.

#### Integration Verification

1. IV1: Fluxos existentes de download manual continuam funcionando.
2. IV2: Nenhuma rota admin atual e quebrada.
3. IV3: Sem degradacao relevante no tempo de resposta de consultas existentes.

### Story 1.2 Job mensal automatizado

As a contador,  
I want que o DAS seja processado automaticamente todo mes,  
so that eu nao dependa de operacao manual cliente a cliente.

#### Acceptance Criteria

1. Job agenda execucao no dia 1 as 08:00 (America/Sao_Paulo).
2. O job processa todos os users da empresa do admin elegiveis.
3. Falhas individuais nao interrompem o lote completo.
4. O resultado de cada cliente/competencia e persistido com status final.

#### Integration Verification

1. IV1: Integracao MEI existente permanece compativel.
2. IV2: Tokens/credenciais nao sao expostos em logs.
3. IV3: Job pode ser reexecutado sem inconsistencias.

### Story 1.3 API administrativa de pendencias DAS

As a admin,  
I want consultar pendencias DAS por competencia e cliente,  
so that eu possa priorizar cobranca e regularizacao.

#### Acceptance Criteria

1. Endpoint admin retorna lista consolidada com status `pago`/`pendente`.
2. Consulta suporta filtro por competencia e busca por cliente.
3. Endpoint respeita escopo por empresa e autorizacao.

#### Integration Verification

1. IV1: Politica de permissao atual continua valida.
2. IV2: Endpoint nao interfere em rotas admin existentes.
3. IV3: Payload e consistente para consumo frontend.

### Story 1.4 Painel do contador com pendencias

As a contador,  
I want visualizar clientes pendentes em uma unica secao no painel,  
so that eu tenha acao operacional imediata.

#### Acceptance Criteria

1. `AdminUserData` exibe secao "Pendencias DAS" com dados consolidados.
2. Interface apresenta estado vazio/loading/erro de forma consistente.
3. Filtro por competencia e busca por cliente estao disponiveis no bloco.

#### Integration Verification

1. IV1: Layout e tema atual (claro/escuro) sao preservados.
2. IV2: Fluxos atuais de dados do painel continuam operando.
3. IV3: Nao ha regressao de performance perceptivel na tela.

### Story 1.5 Observabilidade, qualidade e operacao

As a equipe de produto/engenharia,  
I want metricas e testes para o fluxo DAS mensal,  
so that a operacao seja confiavel e auditavel em producao.

#### Acceptance Criteria

1. Logs estruturados cobrem inicio, fim, sucesso e erro por cliente/competencia.
2. Testes automatizados cobrem servico de processamento e consulta de pendencias.
3. Documentacao operacional minima e atualizada (execucao, retry, troubleshooting).

#### Integration Verification

1. IV1: Gates de qualidade do projeto continuam executaveis.
2. IV2: Sem novos vazamentos de segredo em logs/respostas.
3. IV3: Procedimento de suporte para reprocessamento esta documentado.

## Next Steps

### Immediate Actions

1. Validar este RPD com stakeholders de operacao e engenharia.
2. Converter as stories em artefatos de sprint no padrao `docs/stories/`.
3. Definir migration/tabela e bucket de storage para PDFs.
4. Priorizar implementacao Story 1.1 e 1.2 como base do restante.

### PM Handoff

Este RPD foi gerado a partir do `docs/brief.md` e esta pronto para detalhamento em stories executaveis.
