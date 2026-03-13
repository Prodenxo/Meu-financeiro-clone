# Checklist QA - PlugNotas Multi-tipo

## Objetivo
Validar o fluxo de notas fiscais multi-documento (`NFSE`, `NFE`, `NFCE`) com evidências mínimas para homologação/release.

## Pré-condições
- Backend ativo.
- Frontend ativo.
- Variáveis PlugNotas configuradas para o ambiente alvo.
- Empresa e certificado A1 válidos no ambiente.
- Webhook configurado e acessível.

## Matriz de validação

| Cenário | NFSE | NFE | NFCE | Evidência |
| --- | --- | --- | --- | --- |
| Emissão assíncrona retorna `id/id_integracao/status/protocol` | [ ] | [ ] | [ ] | JSON de resposta |
| Consulta/sync atualiza status final | [ ] | [ ] | [ ] | JSON consulta antes/depois |
| Webhook atualiza nota por `plugnotas_id` | [ ] | [ ] | [ ] | Log + payload webhook |
| Webhook atualiza nota por `id_integracao` | [ ] | [ ] | [ ] | Log + payload webhook |
| Download PDF disponível após conclusão | [ ] | [ ] | [ ] | Arquivo PDF |
| Download XML disponível após conclusão | [ ] | [ ] | [ ] | Arquivo XML |
| Cancelamento processado | [ ] | [ ] | [ ] | Status/retorno cancelamento |
| Catálogo de clientes/produtos por tipo | [ ] | [ ] | [ ] | `GET /catalogo/*?documentType=` |
| Filtro por tipo na listagem (`documentType`) | [ ] | [ ] | [ ] | `GET /api/mei-notas?documentType=` |

## Rejeições e schema (NF-e/NFC-e)
- Validar pelo menos 1 cenário de rejeição controlada (ex.: schema/tributação).
- Confirmar mensagem retornada para operador.
- Registrar correção aplicada e novo envio com sucesso.

## Segurança operacional
- [ ] `PLUGNOTAS_WEBHOOK_REQUIRE_TOKEN` ativo no ambiente alvo.
- [ ] Query token desabilitada (`PLUGNOTAS_WEBHOOK_ALLOW_QUERY_TOKEN=false`) salvo exceção justificada.
- [ ] Token não exposto em logs/evidências.

## Testes automatizados mínimos
- Backend:
  - `npm test --workspace backend -- tests/mei-notas-core.test.js tests/mei-notas-routes.test.js tests/plugnotas-nfse.test.js tests/plugnotas-nfe.test.js tests/plugnotas-nfce.test.js`
- Frontend:
  - `npm test --workspace frontend -- src/services/meiNotasService.test.ts`
  - `npm run typecheck --workspace frontend`

## Resultado final
- [ ] Aprovado para homologação
- [ ] Aprovado para produção
- [ ] Reprovado (informar bloqueadores)

## Bloqueadores encontrados
- TBD
