# PRD — fix cadastro de empresa Plugnotas no endpoint canónico `POST /empresa`

**Versão:** 1.0  
**Data:** 2026-04-09  
**Tipo:** Brownfield — Guia MEI / integração BFF → Plugnotas  
**Fonte do briefing:** [docs/brief/brief-fix-cadastro-empresa-plugnotas-endpoint-canonico-2026-04-09.md](../brief/brief-fix-cadastro-empresa-plugnotas-endpoint-canonico-2026-04-09.md)

**Referência externa:** [Documentação Plugnotas (Postman) — Empresa](https://documenter.getpostman.com/view/3720339/2sB3WpSh1R?version=latest#54bcc736-6cd3-4e96-bc51-cab153c2f976)

---

## 1. Resumo executivo

O cadastro de empresa no Plugnotas deve continuar usando o endpoint canónico **`POST /empresa`** no host do ambiente configurado. No Meu Financeiro, esse fluxo é mediado pelo BFF via **`POST /api/mei-notas/setup/emissao-fiscal/empresa`**; o frontend não deve falar diretamente com o Plugnotas.

Este PRD formaliza a correção brownfield para eliminar o falso diagnóstico de “rota errada” e garantir que:

1. a configuração do ambiente aponte para o host correto do Plugnotas;
2. o backend invoque **`POST /empresa`** como operação principal;
3. o payload enviado esteja coerente com o contrato oficial e com o modo de operação vigente;
4. o fallback de atualização e a consulta posterior permaneçam consistentes com o resultado real do cadastro.

---

## 2. Problema

Durante a triagem do incidente de cadastro de empresa não concluído no emissor, surgiu a hipótese de que a aplicação poderia estar usando a rota errada para criar empresas no Plugnotas.

A análise do brief e do código mostrou que o desenho correto já é:

- **rota interna da aplicação:** `POST /api/mei-notas/setup/emissao-fiscal/empresa`
- **rota externa do provedor:** `POST /empresa`

Logo, o problema a resolver não é “inventar nova rota”, e sim assegurar que o fluxo em produção/desenvolvimento esteja alinhado ao contrato canónico do Plugnotas e não falhe por:

- `PLUGNOTAS_API_BASE_URL` incorreta;
- `PLUGNOTAS_API_PATH_PREFIX` indevido;
- mistura de sandbox e produção;
- payload incompatível com a conta/município;
- fallback de conflito/consulta mal interpretado.

---

## 3. Objetivos

1. Confirmar e manter `POST /empresa` como endpoint upstream canónico para cadastro de empresa.
2. Preservar o BFF como única fronteira entre frontend e Plugnotas.
3. Tornar a triagem objetiva entre problema de endpoint/configuração e problema de payload/contrato.
4. Reduzir regressões onde o `GET` posterior acusa ausência da empresa por falha prévia no `POST`.

---

## 4. Fora de escopo

- Criar nova UI separada “addCompany”.
- Permitir chamada browser → Plugnotas.
- Redefinir a arquitetura atual da Guia MEI.
- Tratar todos os erros de cadastro como se fossem exclusivamente de endpoint.
- Introduzir novos requisitos de credenciais municipais além do que já consta em artefatos existentes.

---

## 5. Contexto atual

| Camada | Operação | Papel |
|--------|----------|-------|
| Frontend → BFF | `POST /api/mei-notas/setup/emissao-fiscal/empresa` | enviar dados de cadastro do emitente |
| Backend → Plugnotas | `POST /empresa` | criar empresa no Plugnotas |
| Backend → Plugnotas | `PATCH /empresa/:cnpj` | fallback quando empresa já existe |
| Frontend/BFF | `GET /api/mei-notas/setup/emissao-fiscal/empresa?cpfCnpj=...` | verificar presença do cadastro |
| Backend → Plugnotas | `GET /empresa/:cnpj` | consultar empresa upstream |

Referências no repositório:

- `backend/src/services/plugnotas/empresa.service.js`
- `frontend/src/services/meiNotasService.ts`
- `frontend/src/utils/plugnotasEmitenteSetup.ts`
- `docs/technical/architecture-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md`

---

## 6. Personas

| Persona | Necessidade |
|---------|-------------|
| MEI | cadastrar empresa no emissor sem erro estrutural de integração |
| Suporte/operação | distinguir erro de endpoint/configuração vs erro de payload |
| Dev | validar que o BFF aponta para o endpoint correto do Plugnotas |
| QA | testar cadastro, fallback e consulta com ambientes coerentes |

---

## 7. Requisitos funcionais

| ID | Requisito |
|----|-----------|
| **FR-ENDP-01** | O backend deve usar **`POST /empresa`** como operação principal de cadastro de empresa no Plugnotas. |
| **FR-ENDP-02** | O frontend deve continuar chamando apenas o BFF em `POST /api/mei-notas/setup/emissao-fiscal/empresa`, sem integração direta com o Plugnotas. |
| **FR-ENDP-03** | O ambiente deve permitir configurar corretamente `PLUGNOTAS_API_BASE_URL`, `PLUGNOTAS_API_PATH_PREFIX` e `PLUGNOTAS_API_KEY`, preservando coerência entre host, token e ambiente. |
| **FR-ENDP-04** | A equipa deve conseguir distinguir se a falha de cadastro decorre de endpoint/configuração ou de validação do payload antes de abrir correções contraditórias. |
| **FR-ENDP-05** | Em caso de conflito no `POST /empresa`, o fluxo de fallback para `PATCH /empresa/:cnpj` deve permanecer coerente com o cenário “empresa já existente”. |
| **FR-ENDP-06** | A consulta posterior à empresa deve refletir corretamente o resultado do cadastro upstream, evitando interpretar `GET` negativo como problema de rota quando o `POST` falhou antes. |

---

## 8. Requisitos não funcionais

| ID | Requisito |
|----|-----------|
| **NFR-ENDP-01** | Nenhum segredo Plugnotas deve ser exposto ao browser. |
| **NFR-ENDP-02** | Logs e evidências de diagnóstico devem ser redigidos, sem expor credenciais ou payload sensível completo. |
| **NFR-ENDP-03** | A solução deve preservar a arquitetura BFF existente e não introduzir nova dependência de UI para controlar integração. |
| **NFR-ENDP-04** | A correção deve ser validável localmente e em ambiente de teste com separação clara entre sandbox e produção. |

---

## 9. Decisões de produto

| ID | Decisão |
|----|---------|
| **DP-ENDP-01** | O termo `addCompany` é tratado como semântica documental do Plugnotas; no produto, a experiência continua centralizada na Guia MEI e no BFF. |
| **DP-ENDP-02** | O endpoint upstream canónico do cadastro é `POST /empresa`; o produto não deve criar abstração paralela que contradiga esse contrato. |
| **DP-ENDP-03** | O diagnóstico deve primeiro verificar configuração/ambiente e payload real antes de propor alteração arquitetural. |

---

## 10. Critérios de aceite

- [ ] O PRD deixa explícito que o endpoint upstream canónico é `POST /empresa`.
- [ ] O PRD deixa explícito que a rota interna da aplicação é `POST /api/mei-notas/setup/emissao-fiscal/empresa`.
- [ ] O PRD diferencia claramente problema de endpoint/configuração de problema de payload.
- [ ] O PRD preserva o BFF como única fronteira externa com o Plugnotas.
- [ ] O PRD não introduz novos requisitos não presentes no brief.

---

## 11. Métricas de sucesso

| Sinal | Interpretação |
|-------|----------------|
| Redução de triagens com hipótese de “rota errada” | entendimento compartilhado do desenho canónico |
| Menos retrabalho em correções de integração | diagnóstico mais preciso entre ambiente e payload |
| Maior consistência entre `POST` cadastro e `GET` consulta | fluxo operacional compreendido corretamente |

---

## 12. Riscos

| Risco | Mitigação |
|-------|-----------|
| Corrigir “rota” sem validar ambiente real | exigir verificação de `PLUGNOTAS_API_BASE_URL` e `PLUGNOTAS_API_PATH_PREFIX` |
| Tratar erro de payload como erro de endpoint | separar explicitamente as trilhas de diagnóstico |
| Introduzir chamada direta ao Plugnotas no frontend | reforçar **FR-ENDP-02** e **NFR-ENDP-01** |
| Misturar sandbox e produção | reforçar **FR-ENDP-03** e **NFR-ENDP-04** |

---

## 13. Dependências e desdobramentos

| Área | Desdobramento esperado |
|------|------------------------|
| @architect | validar se algum ajuste técnico de configuração/contrato precisa de arquitetura complementar |
| @sm | derivar stories de verificação de ambiente, payload e fallback |
| @qa | preparar regressão para `POST` cadastro, `PATCH` fallback e `GET` consulta |
| Operação | confirmar configuração por ambiente e checklist de diagnóstico |

---

## 14. Change log

| Versão | Data | Alteração |
|--------|------|-----------|
| 1.0 | 2026-04-09 | PRD inicial derivado do brief de fix do endpoint canónico de cadastro de empresa Plugnotas |

---

*PRD brownfield para alinhamento de produto e diagnóstico do cadastro de empresa Plugnotas no fluxo Guia MEI.*
