# ADR (spike): NFS-e Nacional no cadastro de empresa Plugnotas — descoberta de contrato API

**Status:** Spike NAT-01 + implementação NAT-02 — o payload de empresa inclui `nfse.nacional` conforme § *Campo adotado na implementação*; validação contra a API real em cada ambiente permanece responsabilidade de operação (**NFR-N04**).  
**Rastreabilidade:** [`docs/prd/PRD-nfse-nacional-default-cadastro-plugnotas.md`](../prd/PRD-nfse-nacional-default-cadastro-plugnotas.md) (**FR-NA01**, **FR-NA02**); épico [`docs/stories/epic-nfse-nacional-plugnotas-prd.md`](../stories/epic-nfse-nacional-plugnotas-prd.md).

## Contexto

O painel Plugnotas exibe o controle *“Ativar emissão de NFS-e Nacional”* (notas no ambiente nacional). O produto deseja refletir isso no **payload** de `POST /empresa` / `PATCH /empresa/:cnpj` enviado pelo Meu Financeiro. Até esta data o repositório **não** documentava qual chave JSON corresponde a esse toggle.

## Estado atual no código (referência)

- Frontend: `buildNfEmissionEmpresaPayload` em `frontend/src/utils/nfEmissionCompany.ts` envia, entre outros:

```json
"nfse": {
  "ativo": true,
  "tipoContrato": 0,
  "config": { "producao": true },
  "nacional": true
}
```

- Backend: `applyEmpresaPlugnotasApenasNfseForPost` / `applyEmpresaPlugnotasApenasNfseForPatch` em `backend/src/services/plugnotas/empresa.service.js` reforçam **nfe/nfce** inativos sem `config` e IE; aplicam ainda `applyNfseNacionalDefaultForPost` / `applyNfseNacionalDefaultForPatch` (**US-MEI-NAT-02**) conforme § *Campo adotado na implementação*.

## Metodologia do spike

1. **Busca na documentação pública** — consultas web (`site:docs.plugnotas.com.br`, termos “empresa”, “nfse”, “nacional”) e tentativa de fetch da raiz `https://docs.plugnotas.com.br/` (timeout na sessão de coleta).
2. **Inspeção do repositório** — ausência de schema OpenAPI versionado ou exemplos com “nacional” / “emissaoNacional” no cadastro de empresa.

## Resultado (2026-03-24)

| Item | Conclusão |
| --- | --- |
| **Nome oficial do campo** na API empresa | **Não confirmado** com evidência citável a partir das fontes públicas consultadas neste spike. |
| **Ausência total do recurso na API** | **Não demonstrada** — apenas a **indisponibilidade do detalhe** na documentação acessível sem portal autenticado ou resposta do suporte. |
| **Sandbox vs produção** | **Não documentado** aqui; depende do contrato oficial. |

Isso aciona o ramo cauteloso de **FR-NA02**: **não implementar** chave inventada no payload até uma das evidências abaixo.

## Evidências aceitáveis para fechar o contrato (pré-NAT-02)

1. Trecho da **documentação oficial Plugnotas** (Empresa / NFSe) com nome de propriedade, tipo e semântica; ou  
2. Resposta **escrita do suporte Tecnospeed/Plugnotas** com o mesmo nível de detalhe; ou  
3. **Experimento controlado em sandbox**: `POST /empresa` com CNPJ fictício/homologação, variando um candidato de campo e observando aceitação ou mensagem de validação (registrar request/response redigidos no ticket ou neste ADR como apêndice).

## Hipóteses **não validadas** (para experimento — não usar em produção)

Possíveis localizações comuns em APIs aninhadas (lista para **testar**, não para commitar como verdade):

- `nfse.nacional` (boolean)
- `nfse.emissaoNacional` (boolean)
- `nfse.config.nacional` ou `nfse.config.emissaoNacional`
- Nome em inglês na API (`national`, `nationalEmission`)

**Antes da NAT-02:** o código **não** deveria fixar uma dessas chaves sem uma das evidências listadas em § *Evidências aceitáveis*. **Após a NAT-02:** o contrato em produção segue § *Campo adotado na implementação* até confirmação oficial ou ajuste documentado.

## Campo adotado na implementação (US-MEI-NAT-02)

Documentação pública ainda **não** trouxe, neste repositório, trecho citável com o nome oficial. Para cumprir o default de produto (**D-N01**, **FR-N01**) sem bloquear a entrega, a **US-MEI-NAT-02** fixa o contrato abaixo **no código e nos testes**; se a API Plugnotas divergir, ajustar implementação e esta tabela e revalidar em sandbox/produção (**NFR-N04**).

| Item | Valor |
| --- | --- |
| **Caminho no JSON** | `nfse.nacional` |
| **Tipo** | `boolean` |
| **Semântica** | `true` = NFS-e Nacional ativa (alinhado ao toggle do painel) |
| **Base** | Primeira hipótese listada em § *Hipóteses **não validadas*** |
| **Evidência de desbloqueio** | Testes de contrato em `nfEmissionCompany.test.ts` e `plugnotas-empresa.test.js` + revisão de código NAT-02 |
| **Próximo passo (recomendado)** | Quando houver trecho de doc oficial, resposta de suporte ou log **redigido** de experimento em sandbox, anexar referência neste ADR (ou apêndice) para fechar o gap citado pelo QA (**NFR-N04** / gate CONCERNS). |

## Decisão de produto / integração: POST vs PATCH (**D-N03**, **FR-NA03**)

Proposta registrada para **US-MEI-NAT-02** (após campo confirmado):

1. **`POST` (criação):** incluir o parâmetro com valor **ON** por padrão, alinhado ao PRD (**D-N01**).
2. **`PATCH`:** **não** forçar nacional ON em atualizações parciais que **não** incluam o bloco `nfse` — evita sobrescrever configuração feita manualmente no painel. Se o cliente enviar `nfse` explícito no corpo, normalizar apenas o que for política acordada (detalhar na revisão de código da NAT-02).

## Consequências

- **NAT-02** passa a **alterar o payload** conforme § *Campo adotado na implementação*; confirmação oficial Plugnotas (doc/suporte/sandbox real) **continua recomendada** antes de tratar o contrato como fechado (**FR-NA02** — risco residual documentado).
- **Operação:** ver âncora [`#plugnotas-nfse-nacional-spike-nat01`](../operacao-mei-nfse.md#plugnotas-nfse-nacional-spike-nat01) em `docs/operacao-mei-nfse.md`.

## Change Log

| Data | Autor | Nota |
| --- | --- | --- |
| 2026-03-24 | @dev (spike NAT-01) | Versão inicial pós busca pública e revisão de código. |
| 2026-03-24 | @dev (NAT-02) | Seção *Campo adotado na implementação* (`nfse.nacional`); consequências atualizadas. |
| 2026-03-24 | @dev (pós-QA NAT-02) | § *Estado atual no código* alinhado à NAT-02; tabela *Campo adotado* com linha *Próximo passo*; nota sob hipóteses não validadas. |
