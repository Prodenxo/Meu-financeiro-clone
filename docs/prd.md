# PRD Brownfield - Endurecimento de Seguranca e Qualidade de Release

## Status

Em elaboracao para execucao incremental (P0 -> P1 -> P2).

## Contexto

O aplicativo `Meu-financeiro` evoluiu o modulo MEI/NFSe com integracao externa, webhook e novos fluxos de operacao. A analise de QA identificou riscos de seguranca e integridade que precisam ser tratados antes de novos incrementos funcionais.

Este PRD consolida o plano de produto para corrigir os gaps priorizados por severidade, mantendo compatibilidade com os fluxos existentes de autenticacao, transacoes, categorias, admin e MEI/NFSe.

## Problema

Hoje existem riscos que elevam chance de incidente em producao:

- Possivel atualizacao cruzada de registros no webhook NFSe quando identificadores nao forem estritamente unicos.
- Dependencia de configuracao opcional de token de webhook em cenario de producao.
- Exposicao de token de integracao externa para cliente web.
- Fragilidade de gates de release (sem `typecheck`/`test` na raiz, lint global com debito tecnico alto).
- Exposicao potencial de segredos por politica incompleta de ignore de arquivos de ambiente.

## Objetivos

1. Eliminar vetores criticos de seguranca e integridade (P0).
2. Restabelecer qualidade minima de release com gates executaveis e verificaveis (P1).
3. Reduzir divida tecnica que aumenta custo de manutencao e risco de regressao (P2).

## Nao Objetivos

- Reescrever arquitetura completa de frontend/backend.
- Redesenhar UX ampla fora dos fluxos afetados por seguranca/qualidade.
- Introduzir novas features de negocio no escopo deste PRD.

## Escopo

### Em escopo

- Backend: rotas e servicos MEI/NFSe, webhook, proxy de integracoes, validacoes de ambiente.
- Frontend: ajustes necessarios para remover dependencia de token sensivel exposto por API.
- DevEx/Qualidade: scripts de qualidade raiz, estrategia de lint incremental, testes minimos de regressao.
- Operacao: politica de segredos, padrao de rollout e checklist de validacao.

### Fora de escopo

- Mudancas de produto sem relacao com seguranca/integridade/qualidade.
- Refactors amplos de paginas legacy sem impacto direto no risco mapeado.

## Stakeholders

- Produto: dono de priorizacao e criterio de go/no-go.
- Engenharia Backend e Frontend: implementacao por etapas.
- QA: definicao de gate e evidencias de validacao.
- Operacao/DevOps: rotacao de segredos e validacao de ambiente.

## Requisitos Funcionais

### FR-01 - Webhook seguro e deterministico

- O webhook NFSe deve exigir autenticacao valida em producao.
- O processamento deve atualizar apenas um registro alvo por evento.
- Em caso de duplicidade de identificador, o sistema deve falhar de forma explicita e auditavel.

### FR-02 - Segredos nao expostos para cliente

- Nenhum endpoint de backend deve retornar token de integracao externa para o frontend.
- O frontend deve operar sem acesso direto a credenciais externas.

### FR-03 - Politica de segredos no repositorio

- Arquivos de ambiente de backend/frontend devem ser ignorados por padrao.
- Processo de rotacao deve ser disparado quando houver suspeita de exposicao.

### FR-04 - Gates minimos de release

- Workspace raiz deve possuir scripts executaveis para `lint`, `typecheck`, `test` e `build`.
- Pipeline deve reportar sucesso/falha de forma consistente.

### FR-05 - Cobertura basica de regressao

- Fluxos criticos devem ter testes automatizados minimos:
  - Auth/session;
  - Emissao NFSe;
  - Webhook NFSe;
  - Download PDF/XML.

## Requisitos Nao Funcionais

### NFR-01 Seguranca

- Producao deve falhar em bootstrap se variavel critica obrigatoria estiver ausente.
- Segredos nao podem aparecer em resposta HTTP nem logs de aplicacao.

### NFR-02 Confiabilidade

- Processamento de webhook deve ser idempotente e previsivel.
- Erros de integracao externa devem retornar mensagens acionaveis sem vazar detalhes sensiveis.

### NFR-03 Observabilidade

- Erros de webhook e integracao devem ser rastreaveis por contexto de requisicao.
- Logs devem conter apenas metadados necessarios para diagnostico.

### NFR-04 Manutenibilidade

- Mudancas devem ser aplicadas em etapas pequenas e revisaveis.
- Cada etapa deve ter criterio de entrada/saida claro.

## Criticos de Compatibilidade

### CR-01 API

- Contratos existentes de rotas de uso diario devem permanecer compativeis, salvo endpoint explicitamente descontinuado por risco de seguranca.

### CR-02 Dados

- Estruturas e consultas de `mei_nfse` devem manter integridade de historico.

### CR-03 UX

- Fluxos principais do usuario final devem continuar funcionais sem regressao perceptivel.

### CR-04 Integracoes

- Integracoes Serpro/PlugNotas devem manter comportamento operacional apos endurecimentos.

## Plano por Prioridade

### P0 - Bloqueadores de seguranca e integridade

1. Politica de segredos (`.gitignore` + saneamento de risco de `.env` versionado).
2. Webhook com token obrigatorio em producao.
3. Atualizacao webhook com alvo unico garantido.
4. Remocao/restricao de exposicao de token de integracao para cliente.

### P1 - Estabilizacao de qualidade

1. Criar scripts raiz de `typecheck` e `test`.
2. Definir estrategia de lint incremental para reduzir debito sem travar entrega.
3. Endurecer rotas/proxy sensiveis com autenticacao e validacao de superficie.
4. Cobrir fluxos criticos com testes automatizados minimos.

### P2 - Hardening continuo

1. Melhorar observabilidade com redacao de dados sensiveis.
2. Reduzir `any` e hotspots de manutencao em modulos criticos.
3. Tratar warnings de build/chunking com plano de performance.

## Criterios de Aceite (Release Readiness)

1. Nenhum token de integracao externa exposto a frontend.
2. Webhook protegido e sem possibilidade de update multiplo inadvertido.
3. Segredos protegidos por politica de repositorio e operacao.
4. Gates `lint`, `typecheck`, `test`, `build` definidos e executaveis.
5. Evidencias de regressao dos fluxos criticos anexadas em QA.

## Metricas de Sucesso

- Zero incidentes de seguranca relacionados a webhook/segredos no ciclo apos deploy.
- 100% de execucao dos gates obrigatorios na pipeline da release.
- Reducao progressiva do backlog de lint em arquivos ativos do produto.
- Tempo medio de diagnostico de erro de integracao reduzido via logs melhores.

## Riscos e Mitigacoes

- Risco: remover endpoint sensivel quebrar fluxo existente.
  - Mitigacao: rollout em duas fases com fallback controlado e validacao funcional.
- Risco: introduzir gates novos aumentar falha de pipeline no curto prazo.
  - Mitigacao: adotar faseamento e baseline inicial por modulo critico.
- Risco: rotacao de segredos impactar ambientes.
  - Mitigacao: checklist de rotacao e validacao por ambiente.

## Plano de Implementacao por Etapas

### Etapa A (P0.1 + P0.2)

- Segredos + webhook seguro/deterministico.
- Saida esperada: risco critico reduzido, sem regressao funcional em NFSe.

### Etapa B (P0.3 + P1 parcial)

- Remocao de exposicao de token + endurecimento de proxy.
- Saida esperada: superficie de ataque reduzida.

### Etapa C (P1 restante)

- Scripts raiz + testes criticos.
- Saida esperada: gate de release confiavel.

### Etapa D (P2)

- Hardening continuo e reducao de divida.
- Saida esperada: estabilidade e manutencao mais previsiveis.

## Dependencias

- Disponibilidade de credenciais validas apos rotacao.
- Janela de deploy para mudancas de seguranca.
- Capacidade de QA para executar regressao dirigida por risco.

## Evidencias Esperadas

- Checklist de seguranca preenchido.
- Resultado de gates em pipeline.
- Registro de testes de regressao dos fluxos criticos.
- Relatorio QA final com decisao de gate (PASS/CONCERNS/FAIL/WAIVED).
