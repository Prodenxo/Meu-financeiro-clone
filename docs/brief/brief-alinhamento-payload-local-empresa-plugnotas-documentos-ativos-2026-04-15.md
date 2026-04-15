# Brief: alinhamento do payload local de empresa PlugNotas com documentos ativos, NFS-e Nacional e opção de fallback municipal

**Data:** 2026-04-15  
**Origem:** brainstorm técnico a partir do erro observado no cadastro de empresa (`POST /api/mei-notas/setup/emissao-fiscal/empresa`), agora consolidando dois eixos: coerência do payload local no browser e opção de fallback municipal quando o município não aceitar `nfseNacional`.  
**Produto:** Meu Financeiro — Guia MEI / setup de emissão fiscal PlugNotas.  
**Natureza:** follow-up brownfield de coerência contratual entre UI, payload local, contrato oficial do fornecedor e expansão controlada para o trilho municipal com credenciais da prefeitura.

**Referências relacionadas:**

- [PlugNotas — Empresa / addCompany](https://docs.plugnotas.com.br/#tag/Empresa/operation/addCompany)
- [PlugNotas — OpenAPI oficial (`api.json`)](https://docs.plugnotas.com.br/api.json)
- [PlugNotas — coleção Postman / Empresa](https://documenter.getpostman.com/view/3720339/2sB3WpSh1R?version=latest#54bcc736-6cd3-4e96-bc51-cab153c2f976)
- [`docs/brief/brief-nfse-nacional-padrao-com-excecao-credenciais-prefeitura-plugnotas-2026-04-09.md`](./brief-nfse-nacional-padrao-com-excecao-credenciais-prefeitura-plugnotas-2026-04-09.md)
- [`docs/stories/story-fr-cad-doc-p0-frontend-documentos-ativos-guidesmei.md`](../stories/story-fr-cad-doc-p0-frontend-documentos-ativos-guidesmei.md)
- [`docs/stories/story-fr-rtcad-p0-contrato-runtime-nacional-plugnotas.md`](../stories/story-fr-rtcad-p0-contrato-runtime-nacional-plugnotas.md)
- [`docs/stories/story-fr-plogin-backlog-dp01-credenciais-portal-prefeitura.md`](../stories/story-fr-plogin-backlog-dp01-credenciais-portal-prefeitura.md)
- [`frontend/src/utils/nfEmissionCompany.ts`](../../frontend/src/utils/nfEmissionCompany.ts)
- [`frontend/src/pages/GuidesMei.tsx`](../../frontend/src/pages/GuidesMei.tsx)
- [`backend/src/services/plugnotas/plugnotas-empresa-documentos-ativos.js`](../../backend/src/services/plugnotas/plugnotas-empresa-documentos-ativos.js)

---

## 1. Resumo executivo

O brainstorm fechou dois pontos diferentes do mesmo problema:

1. o payload local do browser precisava espelhar corretamente os checkboxes de **Documentos ativos**;
2. o produto precisava prever um **trilho municipal opcional** quando o município ou o emissor não aceitarem `NFS-e Nacional`.

O primeiro ponto já foi corrigido no builder frontend. O segundo passa a ser uma decisão explícita deste brief:

- o fluxo continua **nacional por padrão**;
- se o município não aceitar `nfseNacional=true` e isso causar erro de cadastro, o site deve abrir a opção de preencher `login` e `senha` da prefeitura;
- nesse segundo passo, o cadastro deve poder seguir com `nfse.config.nfseNacional=false`, preservando a causalidade do erro anterior e sem transformar toda a jornada em municipal-first.

---

## 2. Problema observado

O produto já permitia selecionar:

- `NFS-e`
- `NF-e`
- `NFC-e`

Mas o builder frontend mantinha, localmente, o seguinte comportamento:

- `nfse` sempre ativo com `nfseNacional` ligado;
- `nfe` e `nfce` sempre inativos;
- a seleção real ficava só em `documentosAtivos`.

Além disso, quando o município/conta não aceitavam o trilho nacional, o fluxo acabava em bloqueio, mesmo havendo contrato oficial do PlugNotas para `prefeitura.login` e `prefeitura.senha`.

Na prática, havia dois desalinhamentos:

1. a UI dizia uma coisa e o payload local dizia outra;
2. quando o trilho nacional falhava, o produto não abria uma continuação municipal controlada.

---

## 3. Achados do brainstorm

### 3.1 Contrato oficial do fornecedor

O `api.json` oficial do PlugNotas documenta:

- `nfse.config.nfseNacional` como booleano que indica emissão pelo ambiente Nacional;
- `nfse.config.consultaNfseNacional` como booleano para consulta automática;
- `nfse.config.prefeitura.login` e `nfse.config.prefeitura.senha` como campos dinâmicos para municípios que exigem autenticação municipal;
- `nfe.ativo` e `nfce.ativo` como flags explícitas de ativação das modalidades.

Conclusão: o contrato oficial cobre tanto o caminho nacional quanto o caminho municipal. O produto não precisa escolher entre “só nacional” ou “só municipal”; ele pode ser nacional-first com fallback municipal.

### 3.2 Estado atual do produto antes deste follow-up

- O backend já sabia reconstruir os blocos finais a partir de `documentosAtivos`.
- O frontend já enviava `documentosAtivos` coerente com os checkboxes.
- O desvio do browser já foi atacado no shape raiz do payload.
- O backlog do repositório já rastreia o trilho municipal em [`story-fr-plogin-backlog-dp01-credenciais-portal-prefeitura.md`](../stories/story-fr-plogin-backlog-dp01-credenciais-portal-prefeitura.md).

### 3.3 Conclusão técnica

O sistema precisa agora de duas garantias complementares:

- **coerência de fronteira browser -> BFF**: o payload local deve espelhar o que a UI mostra;
- **continuidade municipal controlada**: quando o município não aceitar `nfseNacional`, a jornada deve oferecer um segundo passo com credenciais da prefeitura e retry com `nfseNacional=false`.

---

## 4. Decisão recomendada

O brief passa a recomendar o seguinte comportamento:

1. `nfse/nfe/nfce.ativo` refletem exatamente a seleção do site;
2. `nfse.config.nfseNacional` e `nfse.config.consultaNfseNacional` permanecem `true` apenas quando `NFS-e` estiver ativa no trilho nacional;
3. o fluxo começa sempre no modo nacional;
4. se o município não aceitar `nfseNacional=true` ou se o emissor devolver erro compatível com exigência municipal, a UI abre a opção de `login` e `senha` da prefeitura;
5. no retry municipal, o payload passa a usar `nfse.config.nfseNacional=false` e, por coerência com a política atual, `consultaNfseNacional=false`, além de `nfse.config.prefeitura.login` / `senha`;
6. este segundo passo continua a passar pelo BFF, com redaction e validação centralizadas.

---

## 5. Estado atual e extensão proposta

### 5.1 Já aplicado

- `buildNfEmissionEmpresaPayload` passou a derivar `nfse`, `nfe` e `nfce` a partir de `documentosAtivos`.
- O default continua `NFS-e on / NF-e off / NFC-e off` quando a seleção explícita não existe.
- Quando `NFS-e` está desligada, o payload local não mantém `config.nfseNacional`.

### 5.2 Opção municipal que o brief passa a comportar

O brief agora passa a prever explicitamente este fluxo:

1. tentativa inicial com `nfseNacional=true`;
2. erro classificado como município/conta incompatível com o trilho nacional;
3. abertura condicional do bloco de `login` e `senha` da prefeitura no site;
4. novo envio de cadastro com:
   - `nfse.config.nfseNacional=false`
   - `nfse.config.consultaNfseNacional=false`
   - `nfse.config.prefeitura.login`
   - `nfse.config.prefeitura.senha`
5. conclusão do cadastro da empresa pelo trilho municipal, sem mudar o facto de que a jornada principal continua nacional-first.

---

## 6. Impacto esperado

- o payload inspecionado no browser passa a refletir o que o utilizador escolheu;
- a trilha operacional fica mais legível;
- o frontend deixa de depender do backend para corrigir um shape local contraditório;
- o produto deixa de encerrar a jornada imediatamente quando o município não aceitar `nfseNacional`;
- a UI passa a oferecer uma continuação municipal explícita e contextual, em vez de exigir esse caminho como padrão.

---

## 7. Riscos e guardrails

- O fallback municipal não deve aparecer por padrão; só após erro/classificação compatível.
- `login` e `senha` da prefeitura continuam sendo dados sensíveis: logs, traces e mensagens precisam de redaction.
- O BFF deve continuar como camada de verdade para:
  - validação;
  - retry;
  - política de preflight;
  - distinção entre trilho nacional e trilho municipal.
- O produto não deve misturar os dois caminhos no mesmo payload de forma ambígua: se o retry for municipal, `nfseNacional` deve sair `false`.

---

## 8. Critérios de sucesso

- [ ] Payload local do browser espelha os checkboxes de `Documentos ativos`.
- [ ] `nfse.config.nfseNacional` só sai `true` quando `NFS-e` está ativa no trilho nacional.
- [ ] Quando o município não aceitar `NFS-e Nacional`, a UI abre a opção de `login` e `senha` da prefeitura.
- [ ] O retry municipal envia `nfse.config.nfseNacional=false` e credenciais da prefeitura pelo BFF.
- [ ] Testes cobrem o builder local, a abertura condicional da UI municipal e o retry de cadastro.
- [ ] Gates do repositório permanecem verdes.

---

## 9. Próximos passos sugeridos

1. Atualizar PRD/spec/arquitetura do trilho `DP-PLOGIN-01` para refletir explicitamente o retry com `nfseNacional=false`.
2. Derivar story(s) de frontend para abrir o bloco de `login` / `senha` apenas após erro/classificação municipal.
3. Derivar story(s) de backend para aceitar o retry municipal e montar o payload PlugNotas com `nfseNacional=false`.
4. Atualizar runbook/QA para distinguir:
   - nacional puro;
   - município incompatível com nacional;
   - retry municipal concluído com sucesso.

---

## Change log

| Data | Nota |
| --- | --- |
| 2026-04-15 | Versão inicial do brief para consolidar a correção de coerência entre checkboxes do site, payload local e contrato oficial `nfseNacional`. |
| 2026-04-15 | Brief ampliado para comportar o trilho municipal opcional: quando o município não aceitar `nfseNacional`, a UI abre `login`/`senha` da prefeitura e o retry de cadastro passa a usar `nfseNacional=false`. |
