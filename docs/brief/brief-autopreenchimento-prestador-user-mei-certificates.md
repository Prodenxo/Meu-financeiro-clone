# Brief: autopreenchimento do prestador via `user_mei_certificates`

**Data:** 2026-03-31  
**Origem:** pedido de produto (analyst)  
**Produto:** Meu Financeiro (fluxo de emissão NFS-e)

---

## 1. Resumo executivo

No formulário de emissão NFS-e, os dados do **prestador** devem ser carregados automaticamente a partir da tabela `user_mei_certificates`, reduzindo preenchimento manual e inconsistências entre cadastro fiscal e emissão.

---

## 2. Problema / oportunidade

- **Dor atual:** o utilizador precisa digitar novamente campos do prestador (CNPJ, razão social, e-mail e endereço) mesmo já tendo cadastrado esses dados.
- **Impacto:** retrabalho, chance maior de erro de digitação e divergência com os dados fiscais já persistidos.
- **Oportunidade:** usar `user_mei_certificates` como fonte para hidratar o formulário e acelerar a emissão.

---

## 3. Estado atual (brownfield)

| Aspeto | Situação |
|--------|----------|
| Persistência fiscal | `user_mei_certificates` já contém campos de emitente NFS-e (`razao_social`, `fiscal_email`, `logradouro`, `numero`, `cep`, `ibge_municipio`, etc.). |
| Endpoint de leitura | `GET /mei-guide/certificate/status` já devolve `nfseEmitente` para hidratação de UI. |
| UI emissão NFS-e | `GuidesMei.tsx` possui campos de prestador no formulário de emissão. |
| Lacuna | O comportamento desejado precisa ficar explícito e consistente: sempre tentar preencher os campos do prestador com base em `user_mei_certificates` para o utilizador autenticado. |

---

## 4. Objetivo funcional

Garantir que, ao abrir o formulário de emissão NFS-e, os campos do prestador sejam preenchidos automaticamente usando os dados já gravados em `user_mei_certificates` (via `nfseEmitente`), com fallback para vazio quando não houver cadastro.

---

## 5. Mapeamento de campos (origem → formulário)

| Origem (`user_mei_certificates`) | Campo no formulário NFS-e |
|----------------------------------|---------------------------|
| `cert_document` | CNPJ do prestador |
| `razao_social` | Razão social do prestador |
| `fiscal_email` | E-mail do prestador |
| `logradouro` | Logradouro do prestador |
| `numero` | Número do prestador |
| `ibge_municipio` | Código IBGE da cidade do prestador |
| `cep` | CEP do prestador |
| `complemento` | Complemento (quando houver no payload da emissão) |
| `bairro` | Bairro (quando houver no payload da emissão) |
| `cidade` | Descrição da cidade (quando usada pela UI) |
| `uf` | UF/estado do prestador |

**Observação:** manter normalizações existentes (CNPJ/CEP com dígitos; UF em maiúsculas).

---

## 6. Regras de negócio

1. A hidratação deve ocorrer para o utilizador autenticado com MEI habilitado.
2. Se existir snapshot em `nfseEmitente`, os campos do prestador devem ser preenchidos automaticamente.
3. Se não existir snapshot, os campos permanecem vazios para preenchimento manual.
4. O utilizador pode editar os campos antes de emitir; o autopreenchimento não deve bloquear alterações manuais.
5. O fluxo não deve depender de novo upload de `.pfx` para preencher os dados.

---

## 7. Critérios de aceitação (testáveis)

1. Ao abrir a página com `nfseEmitente` disponível no status, os campos de prestador aparecem preenchidos automaticamente.
2. CNPJ, CEP e IBGE preenchidos automaticamente passam nas validações do formulário sem ajustes manuais, quando os dados de origem forem válidos.
3. Sem dados em `user_mei_certificates`, a UI não quebra e mantém os campos editáveis vazios.
4. O utilizador consegue sobrescrever manualmente qualquer campo autopreenchido antes de emitir.
5. O payload final de emissão usa os valores visíveis no formulário (autopreenchidos ou alterados).

---

## 8. Riscos e mitigação

| Risco | Mitigação |
|-------|-----------|
| Divergência entre cadastro e formulário | Definir `user_mei_certificates` como fonte principal para hidratação inicial. |
| Dados incompletos no snapshot | Fallback por campo (preenche o que existir, mantém restante editável). |
| Regressão no fluxo de emissão | Cobrir com testes de UI/serviço para cenário com e sem `nfseEmitente`. |

---

## 9. Handoff sugerido

- **@pm/@po:** validar se `user_mei_certificates` será a fonte oficial de pré-cadastro do prestador.
- **@architect:** confirmar contrato de leitura (`GET /mei-guide/certificate/status`) e normalização.
- **@dev:** garantir hidratação automática consistente em `GuidesMei.tsx` e testes associados.
- **@sm:** quebrar em story específica de UX/integração, caso necessário.

---

**Documento vivo:** atualizar após decisão final de produto sobre prioridade de fonte de verdade entre status local e resposta de integração externa.
