# PRD — Autopreenchimento do prestador via `user_mei_certificates`

**Versão:** 1.0  
**Data:** 2026-03-31  
**Tipo:** Brownfield — melhoria de fluxo existente (NFS-e)  
**Fonte principal:** [`docs/brief/brief-autopreenchimento-prestador-user-mei-certificates.md`](../brief/brief-autopreenchimento-prestador-user-mei-certificates.md)

**Relação com entregas existentes:** complementa a story de persistência de emitente NFS-e em `user_mei_certificates` e formaliza o comportamento de hidratação automática no formulário de emissão.

---

## 1. Resumo executivo

O fluxo de emissão NFS-e já possui dados de emitente persistidos em `user_mei_certificates` e snapshot de leitura (`nfseEmitente`) disponível no backend. Este PRD define como requisito de produto que os campos do **prestador** sejam automaticamente preenchidos no formulário com esses dados, reduzindo retrabalho e erros de digitação.

---

## 2. Análise do estado atual (brownfield)

| Aspeto | Estado atual |
|--------|--------------|
| Persistência de emitente | `user_mei_certificates` contém campos fiscais/endereço relevantes para prestador. |
| Leitura para UI | `GET /mei-guide/certificate/status` já retorna `nfseEmitente`. |
| Formulário de emissão | A UI de NFS-e possui campos de prestador editáveis. |
| Lacuna de produto | Falta especificação formal e consistente para priorizar `user_mei_certificates` como fonte de hidratação inicial do prestador. |

---

## 3. Problema e oportunidade

| Dimensão | Problema | Oportunidade |
|----------|----------|--------------|
| Eficiência | Utilizador redigita dados do prestador já cadastrados. | Menos fricção com autopreenchimento imediato. |
| Qualidade de dados | Diferenças entre cadastro fiscal e emissão manual. | Reuso da mesma fonte de dados por utilizador. |
| UX | Abertura do formulário exige esforço repetitivo. | Formulário inicia preenchido e continua editável. |

---

## 4. Objetivo de produto

Garantir que, ao abrir o fluxo de emissão NFS-e, os campos do prestador sejam preenchidos automaticamente com dados de `user_mei_certificates` (via `nfseEmitente`), mantendo fallback para vazio e possibilidade de edição manual antes do envio.

---

## 5. Escopo

### 5.1 Dentro do escopo (MVP)

- Hidratação automática dos campos do prestador a partir de `nfseEmitente`.
- Fallback seguro quando não houver dados cadastrados.
- Manutenção da edição manual dos campos preenchidos automaticamente.
- Uso dos valores visíveis no formulário como base final do payload de emissão.

### 5.2 Fora do escopo

- Novo modelo de persistência além de `user_mei_certificates`.
- Mudanças de regra fiscal municipal/provedor.
- Reformulação completa da página de emissão (layout amplo, novo wizard).

---

## 6. Requisitos funcionais

| ID | Requisito | Prioridade |
|----|-----------|------------|
| FR-AP-01 | Ao carregar a página, o sistema consulta status do certificado/emitente e tenta hidratar o formulário de emissão com `nfseEmitente`. | P0 |
| FR-AP-02 | Se existir `nfseEmitente`, os campos de prestador são preenchidos automaticamente sem ação manual adicional. | P0 |
| FR-AP-03 | Se `nfseEmitente` estiver ausente, os campos permanecem vazios e editáveis, sem erro de UI. | P0 |
| FR-AP-04 | O utilizador pode sobrescrever qualquer valor autopreenchido antes da emissão. | P0 |
| FR-AP-05 | O payload final de emissão utiliza os valores atuais do formulário (autopreenchidos ou alterados). | P0 |
| FR-AP-06 | O fluxo não exige novo upload de `.pfx` para apenas pré-preencher dados de prestador. | P1 |

---

## 7. Mapeamento canónico de campos

| Origem (`user_mei_certificates`) | Destino (formulário NFS-e) |
|----------------------------------|----------------------------|
| `cert_document` | CNPJ do prestador |
| `razao_social` | Razão social do prestador |
| `fiscal_email` | E-mail do prestador |
| `logradouro` | Logradouro do prestador |
| `numero` | Número do prestador |
| `ibge_municipio` | Código IBGE da cidade do prestador |
| `cep` | CEP do prestador |
| `complemento` | Complemento |
| `bairro` | Bairro |
| `cidade` | Descrição da cidade |
| `uf` | Estado (UF) |

**Regra de normalização:** manter convenções atuais do backend/frontend (CNPJ/CEP em dígitos; UF em maiúsculas).

---

## 8. Requisitos não funcionais

| ID | Requisito | Notas |
|----|-----------|-------|
| NFR-AP-01 | Confiabilidade de carregamento | Falha no carregamento não deve quebrar formulário; degradar para preenchimento manual. |
| NFR-AP-02 | Segurança | Respeitar isolamento por utilizador autenticado (MEI habilitado) no endpoint de status. |
| NFR-AP-03 | Compatibilidade | Não quebrar fluxos atuais de emissão para utilizadores sem cadastro emitente. |
| NFR-AP-04 | Qualidade | Cobertura com testes para cenários com e sem `nfseEmitente`. |

---

## 9. Critérios de aceitação

1. Com `nfseEmitente` disponível, campos de prestador aparecem preenchidos ao abrir o formulário.
2. Sem `nfseEmitente`, formulário abre normalmente com campos vazios e editáveis.
3. Alterações manuais do utilizador em campos autopreenchidos são respeitadas no envio.
4. CNPJ, CEP e IBGE vindos da hidratação passam pelas validações já existentes quando válidos.
5. Não é exigido upload de novo certificado para somente exibir dados do prestador.

---

## 10. Métricas de sucesso

| Objetivo | Métrica |
|----------|---------|
| Menos retrabalho | Redução de campos preenchidos manualmente no fluxo NFS-e (proxy por eventos/UI analytics quando disponível). |
| Melhor experiência | Diminuição de abandono na etapa de dados do prestador. |
| Menos inconsistência | Queda de correções manuais em campos de prestador entre sessões consecutivas. |

---

## 11. Riscos e mitigação

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Dados incompletos no snapshot | Preenchimento parcial pode confundir utilizador | Fallback por campo + manter edição manual clara. |
| Divergência entre origem e edição local | Valores diferentes no envio | Definir regra explícita: payload usa estado atual visível no formulário. |
| Regressão em emissão NFS-e | Bloqueio de emissão | Testes focados em hidratação + regressão de envio. |

---

## 12. Dependências

- Endpoint de status de certificado/emitente disponível e autenticado.
- Snapshot `nfseEmitente` com contrato estável para os campos mapeados.
- UI de emissão NFS-e já integrada com o carregamento de status.

---

## 13. Sequência de implementação sugerida (higiene de entrega)

1. Confirmar contrato final de `nfseEmitente` no backend.
2. Garantir hidratação inicial no formulário com fallback por campo.
3. Validar que edição manual não é sobrescrita indevidamente após hidratação.
4. Cobrir testes de serviço/UI para cenários com e sem dados.
5. Executar gates: `npm run lint`, `npm run typecheck`, `npm test`.

---

## 14. Handoff

| Destino | Ação |
|---------|------|
| @sm | Criar story(s) de implementação e validação com checklist e file list. |
| @dev | Implementar/ajustar hidratação e testes de regressão no fluxo NFS-e. |
| @qa | Validar cenários com e sem `nfseEmitente`, incluindo edição manual e envio. |

---

## 15. Registo de alterações

| Versão | Data | Autor | Descrição |
|--------|------|-------|-----------|
| 1.0 | 2026-03-31 | Morgan (PM) | PRD inicial baseado no brief de autopreenchimento do prestador via `user_mei_certificates`. |

---

**Documento vivo:** atualizar se o contrato de `nfseEmitente` ou a política de fonte de verdade do prestador mudar.
