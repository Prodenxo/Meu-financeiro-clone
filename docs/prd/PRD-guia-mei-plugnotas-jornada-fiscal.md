# PRD — Guia MEI: jornada fiscal até o Plugnotas (diagnóstico, conectividade e recuperação de certificado)

| Campo | Valor |
| --- | --- |
| **Produto** | Meu Financeiro |
| **Tipo** | Brownfield (incremento sobre fluxo Guia MEI / mei-notas existente) |
| **Versão do documento** | 1.0 |
| **Data** | 2026-03-24 |
| **Autor** | Morgan (PM) — derivado dos briefs de projeto |
| **Briefs de entrada** | [`docs/brief/brief-failed-to-fetch-guia-mei-certificado.md`](../brief/brief-failed-to-fetch-guia-mei-certificado.md), [`docs/brief/brief-plugnotas-certificado-409-sem-id.md`](../brief/brief-plugnotas-certificado-409-sem-id.md) |

## Status

Proposto para priorização (MoSCoW sugerido no final). Não substitui o [`docs/prd.md`](../prd.md) de endurecimento de segurança/release.

---

## 1. Goals and Background Context

### 1.1 Goals

- Garantir que o operador **distinga com clareza** falha de **conectividade com o aplicativo** de falha **negocial ou da API Plugnotas**, na jornada certificado → cadastro fiscal.
- Reduzir tempo médio de diagnóstico quando o certificado **já existe** no Plugnotas (**409**) mas o sistema **não obtém o ID** automaticamente (`certificado_409_sem_id`).
- Manter **segurança e privacidade**: mensagens e logs sem vazar segredos, PII desnecessária ou tokens em interface de suporte imprópria.
- Oferecer **próximos passos acionáveis** (checklist enxuto, links para doc operacional) alinhados ao que o backend realmente executa.
- Preservar compatibilidade com integração atual (Express, `apiClient`, serviços Plugnotas em `backend/src/services/plugnotas/`).

### 1.2 Background Context

Dois problemas distintos aparecem na mesma jornada de “habilitar emissão” no Guia MEI, mas têm **causas e respostas diferentes**:

1. **Rede / backend indisponível:** o navegador falha antes de obter JSON HTTP útil (`Failed to fetch`, proxy Vite sem alvo, etc.). O operador não deve concluir que o Plugnotas “recusou” o cadastro — vide brief de conectividade.
2. **Certificado duplicado no Plugnotas com falha de recuperação de ID:** o backend já trata **409** tentando **GET empresa**, **GET certificado filtrado** e **listagem**; quando tudo falha ou o payload não permite extrair ID, o usuário vê erro genérico de integração. O brief dedicado descreve o checklist (CNPJ, conta, ambiente API, formatos de resposta).

O produto precisa de uma **narrativa contínua**: primeiro “seu app alcança o servidor?”, depois “o Plugnotas respondeu o quê?” e, no caso **409**, “por que o ID não veio?” — com **mensagens**, **códigos de erro estáveis** e, onde fizer sentido, **melhoria de robustez** na resolução automática.

### 1.3 Change Log

| Date | Version | Description | Author |
| --- | --- | --- | --- |
| 2026-03-24 | 1.0 | Versão inicial a partir dos dois briefs de projeto | PM |

---

## 2. Requirements

### 2.1 Functional

- **FR-01:** Quando a falha for **pré-resposta HTTP** (conectividade / rede até o backend do Meu Financeiro), a UI deve comunicar **categoria “servidor ou conexão”**, em português, **sem** atribuir a rejeição ao Plugnotas por padrão (comportamento alinhado ao épico de conectividade já documentado em `docs/stories/epic-guia-mei-conectividade-backend.md`).
- **FR-02:** Quando o backend responder com **HTTP e corpo** (4xx/5xx negocial), a UI deve preservar ou enriquecer mensagens **específicas** da integração fiscal (incluindo Plugnotas), sem substituí-las pela mensagem de conectividade.
- **FR-03:** Erros do fluxo `POST …/setup/emissao-fiscal/certificado` devem expor, quando disponível, um **código de negócio estável** (ex.: `certificado_409_sem_id`) para suporte, documentação e telemetria — **sem** expor stack trace ou URLs internas sensíveis ao usuário final.
- **FR-04:** Para `certificado_409_sem_id` (ou equivalente), a UI ou doc contextual deve orientar o checklist: CNPJ alinhado ao certificado; mesma **conta** Plugnotas da **API key**; **URL base** e **key** no **mesmo ambiente**; verificação no painel Plugnotas — consistente com o brief técnico.
- **FR-05 (incremento desejável):** O backend deve **registrar de forma auditável** (nível de log configurável) **qual etapa** da cadeia de resolução pós-409 falhou (empresa 404, filtro 400, listagem vazia, formato inesperado), **redigindo** PII/segredos, para acelerar suporte.
- **FR-06 (incremento desejável):** Avaliar **fallback de produto** quando a API permitir: p.ex. campo opcional “ID do certificado no Plugnotas” para operador avançado **apenas** com confirmação explícita de risco, ou retry guiado — sujeito a análise legal/UX e escopo @architect.
- **FR-07:** A documentação operacional (`docs/operacao-mei-nfse.md` ou sucessor) deve permanecer **fonte canônica** ligada na UI para “saiba mais” em erros fiscais críticos.

### 2.2 Non-functional

- **NFR-01:** Mensagens ao usuário final: sem stack trace, sem tokens, sem segredos de certificado; CNPJ pode aparecer mascarado onde hoje o produto já mascara em logs.
- **NFR-02:** Logs e métricas: não armazenar senha de certificado nem corpo completo de `.p12`; seguir padrões existentes de redação em serviços Plugnotas.
- **NFR-03:** Compatibilidade com desenvolvimento local: proxy Vite `/api` e, quando aplicável, health na raiz do backend — já estabelecido; novas verificações não devem exigir CORS adicional em dev além do já acordado.
- **NFR-04:** Testabilidade: alterações no fluxo devem incluir testes automatizados (Vitest frontend, Node test backend) para classificação de erro e, no backend, para ramos de resolução de certificado quando mockável.
- **NFR-05:** Acessibilidade: alertas com papel/região adequados (`role="alert"` onde já padronizado) e texto compreensível sem jargão interno obrigatório.

---

## 3. User Interface Design Goals

### 3.1 Visão de UX

Jornada **linear e calma**: o usuário entende **em qual “camada”** falhou (rede → aplicativo → Plugnotas) e o que tentar na ordem certa. Tom **profissional**, orientado a resolver, sem culpar o usuário.

### 3.2 Paradigmas de interação

- **Alertas diferenciados por categoria** (conectividade vs integração fiscal) com link “Saiba mais” para doc interna.
- **Detalhes expansíveis** apenas para mensagem segura (sem payload bruto com segredos).
- Opcional: **indicador DEV** de saúde da API (já especificado em histórias de épico; mantém-se como apoio ao desenvolvedor, não ao usuário final).

### 3.3 Telas / vistas nucleares

- Guia MEI — workspace **Certificado digital** e bloco **Dados mínimos para emissão**.
- Estados de erro pós-upload e pós-configuração fiscal (banner vermelho atual refinado por categoria).

### 3.4 Acessibilidade

Alvo: **WCAG 2.1 AA** onde aplicável às mudanças (contraste de alertas, foco, rótulos).

### 3.5 Branding

Manter padrão visual admin existente (`admin-alert-*`, badges).

### 3.6 Plataformas

**Web responsivo** (Vite + React), foco desktop no fluxo MEI.

---

## 4. Technical Assumptions

| Decisão | Escolha | Racional |
| --- | --- | --- |
| Repositório | Monorepo existente (`frontend/`, `backend/`) | Brownfield |
| Arquitetura | Express + rotas `/api`; integração Plugnotas em serviços dedicados | Já implementado |
| Frontend | React, `apiClient`, serviços por domínio | Já implementado |
| Testes | Vitest (frontend), `node --test` (backend) | Gates na raiz (`AGENTS.md`) |
| Configuração sensível | `PLUGNOTAS_*` só no servidor | Nunca expor ao browser |

**Premissas adicionais:** mudanças na extração de ID devem respeitar variações documentadas da API Plugnotas (filtros 400, formatos de lista). Qualquer novo endpoint ou campo manual exige revisão com @architect.

---

## 5. Epic List (alto nível)

1. **Épico A — Diagnóstico claro na jornada Guia MEI → fiscal:** Unificar mensagens, códigos estáveis e links para doc; garantir que conectividade não seja confundida com Plugnotas (completar/refinar entregas já iniciadas nos briefs e épico de conectividade).
2. **Épico B — Robustez da recuperação de ID de certificado (409):** Instrumentação segura, possíveis heurísticas adicionais ou fluxos alternativos aprovados; critérios de aceite atrelados a cenários do brief `brief-plugnotas-certificado-409-sem-id.md`.

*(MoSCoW sugerido: Épico A = Must; Épico B — parte mínima de logs/códigos = Should; fallback manual / heurísticas avançadas = Could.)*

---

## 6. Detalhamento dos épicos e histórias

### Épico A — Diagnóstico claro na jornada Guia MEI → fiscal

**Objetivo:** O operador reconhece rapidamente se o problema é **local/rede**, **configuração** ou **resposta Plugnotas**, e segue passos documentados.

| ID | História | Critérios de aceite (resumo) |
| --- | --- | --- |
| A.1 | **Como** usuário do Guia MEI, **quero** ver erro categorizado quando não há conexão com o backend, **para** não assumir rejeição Plugnotas. | Dado falha de rede até `/api`, a UI mostra mensagem de conectividade + link doc; dado 4xx/5xx com corpo JSON do backend, mantém fluxo de erro fiscal. |
| A.2 | **Como** suporte, **quero** código estável `certificado_409_sem_id` visível ou rastreável na resposta, **para** cruzar com base de conhecimento. | Respostas de API incluem campo/código identificável; UI ou logs de suporte permitem correlacionar sem expor segredos. |
| A.3 | **Como** usuário com erro pós-certificado, **quero** texto com checklist (CNPJ, conta, ambiente API), **para** corrigir sem abrir código. | Copy alinhada ao brief; link para `docs/operacao-mei-nfse.md` ou âncora equivalente. |

### Épico B — Robustez da recuperação de ID de certificado (409)

**Objetivo:** Maximizar taxa de resolução automática do ID após 409 e, quando impossível, falhar com **diagnóstico acionável** e **telemetria interna**.

| ID | História | Critérios de aceite (resumo) |
| --- | --- | --- |
| B.1 | **Como** engenheiro, **quero** logs estruturados da cadeia GET pós-409 (**sem** dados sensíveis), **para** saber qual passo falhou. | Dado 409, logs indicam etapa falha (empresa / filtro / lista / parse) com nível configurável; testes com mocks. |
| B.2 | **Como** sistema, **quero** reavaliar heurísticas de listagem quando a API mudar formato, **para** extrair ID com mais confiabilidade. | Matriz de testes com payloads representativos (sandbox); regressão nos testes existentes de `empresa.service` / certificado. |
| B.3 | *(Could)* **Como** operador avançado, **quero** caminho explícito para informar ID do certificado quando a automação falhar, **para** desbloquear cadastro — **somente** após decisão de produto/risco. | Feature flag ou papel; texto de risco; backend valida formato; audit trail. |

---

## 7. Métricas de sucesso (propostas)

- **Taxa de tickets** classificados como “falso Plugnotas” (na verdade rede local) **reduzida** após FR-01/FR-04 (baseline a capturar com suporte).
- **Tempo médio** de resolução de incidente `certificado_409_sem_id` (antes/depois de B.1).
- **Taxa de sucesso** da resolução automática pós-409 (métrica interna, se instrumentada).

---

## 8. Riscos e dependências

- **API Plugnotas** pode alterar contratos sem aviso prévio → exigir monitoramento e testes de contrato onde possível.
- **Fallback manual de ID** pode introduzir erro humano ou inconsistency fiscal → exige avaliação jurídica/compliance e UX.
- **Duplicidade** com trabalho já feito no épico de conectividade: este PRD **referencia** entregas existentes; @sm deve mapear overlap antes de novas stories.

---

## 9. Fora de escopo

- Troca de provedor de emissão (não-Plugnotas).
- Redesign completo do Guia MEI.
- Alteração do modelo de dados fiscal além do necessário para novos campos de diagnóstico (se B.3 for aprovado).

---

## 10. Next steps (handoff)

| Destino | Ação |
| --- | --- |
| **@sm** | Quebrar épicos A e B em stories em `docs/stories/`, marcando dependências com épico de conectividade existente. |
| **@architect** | Revisar B.2/B.3 contra limites da API e segurança de logs. |
| **@qa** | Casos Given-When-Then: backend parado vs 409 sem ID vs 400 validação empresa. |
| **Suporte** | Publicar/atualizar artigo a partir dos briefs + seção FR-04 deste PRD |

---

— **Morgan**, planejando o futuro 📊
