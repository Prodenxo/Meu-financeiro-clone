# Arquitetura Brownfield - Endurecimento de Seguranca e Qualidade de Release

## Status

Em elaboracao e execucao incremental (P0 -> P1 -> P2).

## Introducao

Este documento define a arquitetura tecnica para implementar o PRD de endurecimento de seguranca, integridade de dados e qualidade de release no `Meu-financeiro`, preservando compatibilidade com os fluxos existentes.

O foco e evoluir a plataforma sem reescrever o sistema, aplicando mudancas em etapas pequenas, com rollback simples e validacao de regressao orientada a risco.

## Estado Atual do Sistema

- **Frontend:** React + Vite (`frontend/src`), consumo via `apiClient`.
- **Backend:** Express (`backend/src`) com middlewares de auth/erro e rotas por dominio.
- **Dados:** Supabase (`@supabase/supabase-js`), incluindo tabela `mei_nfse`.
- **Integracoes externas:** provedor de NFSe/NFe/NFCe (adaptador no backend), Serpro (MEI), Google Calendar (proxy para Edge Function).
- **Build/Release:** scripts raiz para `dev`, `lint` e `build`; ausencia de `typecheck` e `test` na raiz.

## Drivers Arquiteturais

- **Seguranca:** impedir exposicao de segredos e rotas sensiveis sem autenticacao efetiva.
- **Integridade:** garantir processamento deterministico e idempotente de webhook.
- **Confiabilidade:** melhorar previsibilidade operacional em falhas de integracao.
- **Evolutividade:** reduzir debito tecnico que compromete release (gates e testes).

## Escopo Arquitetural

### Em escopo

- Endurecimento de webhook NFSe.
- Restricao de exposicao de token de integracoes.
- Endurecimento de proxy de integracao.
- Padronizacao de quality gates no workspace.
- Estrategia minima de testes de regressao para fluxos criticos.

### Fora de escopo

- Refatoracao ampla de UI/UX.
- Replatform ou migracao completa de stack.
- Novas features de negocio nao relacionadas ao PRD.

## Arquitetura Alvo (High-Level)

### Principios

1. **Backend como fronteira de seguranca:** tokens externos nunca saem para o cliente.
2. **Falha segura em producao:** configuracoes criticas ausentes bloqueiam inicializacao/operacao.
3. **Mutacoes deterministicas:** updates de webhook com alvo unico e tratamento explicito de ambiguidade.
4. **Release por evidencias:** gate tecnico so passa com sinais objetivos (`lint`, `typecheck`, `test`, `build`).

### Visao por Camadas

- **Camada de Apresentacao (Frontend)**
  - Continua consumindo APIs de negocio.
  - Remove dependencias de token bruto de integracao externa.

- **Camada de API (Express)**
  - Middlewares obrigatorios para rotas sensiveis.
  - Controllers com validacao de entrada e resposta padronizada.

- **Camada de Dominio/Servico**
  - Regras de seguranca e consistencia de processamento.
  - Orquestracao de integrações externas sem expor credenciais.

- **Camada de Persistencia (Supabase)**
  - Consultas direcionadas por identificador unico.
  - Reforco de unicidade para identificadores operacionais de webhook.

- **Camada de Integracao Externa**
  - Provedor fiscal e Serpro acessados apenas pelo backend.
  - Erros traduzidos para mensagens acionaveis sem vazar detalhes sensiveis.

## Decisoes Arquiteturais

### ADR-01 - Token de webhook obrigatorio em producao

- **Decisao:** `PLUGNOTAS_WEBHOOK_TOKEN` e obrigatorio em producao.
- **Motivo:** reduzir risco de webhook publico acidental.
- **Trade-off:** exige disciplina de configuracao por ambiente.

### ADR-02 - Webhook com resolucao de alvo unico

- **Decisao:** processar webhook em dois passos:
  1) resolver um unico registro por identificador;
  2) atualizar por chave primaria (`id`).
- **Motivo:** eliminar update em lote nao intencional.
- **Trade-off:** ligeiro custo de consulta adicional.

### ADR-03 - Nao expor token de integracao ao frontend

- **Decisao:** cliente nao recebe `access_token/jwt_token` de integracoes externas.
- **Motivo:** evitar vazamento de credenciais operacionais.
- **Trade-off:** backend concentra mais responsabilidade de orquestracao.

### ADR-04 - Proxy sensivel com auth explicita

- **Decisao:** rotas de proxy de integracao exigem autenticacao e whitelist de superficie.
- **Motivo:** reduzir abuso de endpoint generico.
- **Trade-off:** mais regras de roteamento e validacao no backend.

### ADR-05 - Quality gates obrigatorios na raiz

- **Decisao:** padronizar scripts `lint`, `typecheck`, `test`, `build` na raiz.
- **Motivo:** release confiavel e mensuravel.
- **Trade-off:** curto prazo com possiveis falhas devido a legado.

### ADR-06 - Cadastro Plugnotas (empresa): NFC-e com QR Code v1 no payload padrao

- **Decisao:** no fluxo Meu-financeiro que monta o JSON de **cadastro/atualizacao de empresa** para o Plugnotas (`POST/PATCH` empresa no provedor), a estrategia de produto vigente e **NFC-e com `nfce.config.versaoQrCode = 1`** no payload gerado pela aplicacao, **sem** obrigatoriedade de `nfce.config.sefaz` nesta fase.
- **Motivo:** o schema do Plugnotas associa **`sefaz` obrigatório** ao cenario em que **`versaoQrCode` e 2**; manter v1 evita bloqueio de integracao sem modelagem UX/backend de `sefaz` validada na doc oficial.
- **Fonte de requisitos:** `docs/prd/PRD-cadastro-empresa-plugnotas-nfce-qrcode-sefaz.md` (secao **Decisão de produto**); contrato API: [documentacao Plugnotas](https://docs.plugnotas.com.br/) (Empresa / NFC-e).
- **Trade-off:** se o provedor ou a SEFAZ passar a exigir QR v2 de forma inequivoca, sera necessario incremento (payload + possivel UI) para `nfce.config.sefaz` conforme especificacao atualizada.
- **Escopo Guia MEI apenas NFS-e:** para cadastro/atualizacao de empresa nesse produto, a decisao acima foi **substituida** por **`nfe`/`nfce` inativos sem `config`** (ver **ADR-07**). ADR-06 permanece como referencia historica e para fluxos que ainda modelem NFC-e ativa com QR v1.

<a id="arch-root-plugnotas-payload-nfse"></a>
### ADR-07 - Guia MEI apenas NFS-e: payload empresa Plugnotas (FR-A01)

- **Decisao:** no escopo **Guia MEI / apenas NFS-e**, o JSON de empresa para o Plugnotas usa `nfe` e `nfce` **inativos** (`ativo: false`, `tipoContrato: 0`) **sem** objeto `config`, e politica de `inscricaoEstadual` documentada no ADR dedicado.
- **Detalhamento normativo:** [`docs/adr/ADR-plugnotas-empresa-payload-apenas-nfse.md`](adr/ADR-plugnotas-empresa-payload-apenas-nfse.md).
- **Implementacao:** `backend/src/services/plugnotas/empresa.service.js`, `frontend/src/utils/nfEmissionCompany.ts` (payload alinhado), constante compartilhada por convencao em `plugnotas-mei-empresa-policy.js` + export no frontend.
- **Rastreio:** US-MEI-NFS-01 em `docs/stories/epic-guia-mei-apenas-nfse-prd.md`.
- **NFS-e Nacional (cadastro empresa):** [`docs/adr/ADR-plugnotas-nfse-nacional-empresa-spike.md`](adr/ADR-plugnotas-nfse-nacional-empresa-spike.md) — spike NAT-01 + **campo implementado** `nfse.nacional` (NAT-02); validação na API real em sandbox/produção permanece recomendada (**NFR-N04**, **FR-NA02** risco residual).

## Mudancas Estruturais por Dominio

### 1) Seguranca e Segredos

- Consolidar politica de ignore para `.env` e variantes.
- Definir rotina de rotacao de segredos quando houver risco de exposicao.
- Padronizar checklist de validacao de ambiente antes de deploy.

### 2) NFSe / Webhook

- Endurecer validacao de autenticacao no webhook.
- Garantir processamento por alvo unico.
- Tratar duplicidade de identificadores como erro operacional controlado.
- Reforcar unicidade no banco para chaves de correlacao de webhook.

### 3) Integracoes Externas

- Remover dependencias de endpoint que entrega token para cliente.
- Centralizar chamadas externas no backend.
- Melhorar mapeamento de erros de fornecedor para erros de dominio.

### 4) Proxy Google Calendar

- Exigir `requireAuth` no gateway Express.
- Definir lista de caminhos/metodos permitidos.
- Registrar tentativas invalidas sem dados sensiveis.

### 5) Qualidade e Testes

- Adicionar scripts de `typecheck` e `test` no workspace raiz.
- Manter `lint` global + estrategia incremental por modulo critico.
- Introduzir testes minimos para:
  - auth/session;
  - emissao NFSe;
  - webhook NFSe;
  - download PDF/XML.

## Estrategia de Dados

### Tabela `mei_nfse`

- Manter historico e contratos atuais.
- Reforcar restricoes de unicidade para identificadores de correlacao.
- Validar indice e consulta por id primario nas operacoes de mutacao por webhook.

### Tabelas `mei_nfse_clientes` e `mei_nfse_produtos`

- Catálogo por usuário para reutilizar tomador/destinatário e itens/serviços em novas emissões (NFSE, NFE, NFCE).
- Populadas após `emitirNota` em `mei-notas.service.js` (`upsertClienteCatalogo`, `upsertProdutosCatalogo`), com `document_type` alinhado ao tipo da nota.
- Consulta listada nos endpoints `GET /api/mei-notas/catalogo/clientes` e `GET /api/mei-notas/catalogo/produtos`.

## Estrategia de API

### Contratos preservados

- Manter endpoints de uso diario onde nao ha risco critico.

### Endpoints sensiveis

- Marcar endpoints com exposicao de token como internos/deprecados e migrar frontend para fluxo seguro.
- Documentar mudancas de contrato quando houver descontinuacao.

## Observabilidade e Operacao

- Padronizar logs com redaction de chaves e headers sensiveis.
- Correlacionar eventos de erro por contexto de requisicao.
- Registrar eventos de seguranca:
  - tentativa de webhook sem token;
  - duplicidade de identificador;
  - acesso negado em rotas de proxy.

## Plano de Rollout Arquitetural

### Fase A (P0.1 + P0.2)

- Segredos + webhook seguro/deterministico.
- Validacao: smoke NFSe + verificacao de regressao em `/guias-mei`.

### Fase B (P0.3 + P1 parcial)

- Remocao de exposicao de token + endurecimento de proxy.
- Validacao: fluxo de integracao sem token no cliente.

### Fase C (P1 restante)

- Scripts raiz + testes criticos.
- Validacao: gate de release executavel fim a fim.

### Fase D (P2)

- Hardening continuo (tipagem, observabilidade, performance).

## Riscos Arquiteturais e Mitigacoes

- **Risco:** quebra de fluxo existente ao remover endpoint sensivel.
  - **Mitigacao:** feature flag/deprecacao controlada + fallback temporario.
- **Risco:** gate novo aumentar falha de pipeline inicialmente.
  - **Mitigacao:** baseline incremental por dominio.
- **Risco:** rotacao de segredos com inconsistencias entre ambientes.
  - **Mitigacao:** checklist por ambiente + validacao pos-rotacao.

## Criterios de Prontidao Arquitetural

1. Nenhum token externo exposto ao frontend.
2. Webhook autenticado e com mutacao deterministica por alvo unico.
3. Politica de segredos aplicada e operacionalizada.
4. Gates obrigatorios disponiveis e executaveis na raiz.
5. Evidencias de regressao dos fluxos criticos anexadas ao QA.

## Handoff para Desenvolvimento

- Implementar por fase, com PRs pequenos e reversiveis.
- Cada PR deve incluir:
  - objetivo da fase;
  - risco mitigado;
  - evidencias de validacao;
  - impacto de compatibilidade.
- Nao iniciar fase seguinte sem criterio de saida da fase atual.
