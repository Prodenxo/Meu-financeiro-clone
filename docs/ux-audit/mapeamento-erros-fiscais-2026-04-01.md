# Mapeamento de erros fiscais / MEI → linguagem humana (UX-GLOBAL-06)

**Data:** 2026-04-01  
**Story:** [story-ux-global-06-p1-mapeamento-erros-fiscais-ui.md](../stories/story-ux-global-06-p1-mapeamento-erros-fiscais-ui.md)  
**Implementação:** `frontend/src/lib/fiscalUserError.ts`, `formatPlugnotasIntegrationError` → `formatMeiFiscalErrorForIntegrations`

## Fallback global

| Situação | Copy (título) | Copy (descrição) | CTA |
|----------|---------------|------------------|-----|
| Payload opaco (JSON), mensagem vazia ou **não mapeada** após regras | Erro no serviço / Operação fiscal | Não foi possível concluir o pedido. Tenta de novo. Se persistir, contacta o suporte. | — |

## Tabela código / padrão → utilizador

| # | Fonte (código ou padrão) | Título | Descrição (resumo) | CTA / link |
|---|---------------------------|--------|--------------------|------------|
| 1 | `errors.plugnotasCode === certificado_409_sem_id` | Certificado e conta Plugnotas | CNPJ, ambiente e API key na mesma conta; reenviar certificado ou suporte Plugnotas. | Documentação: `VITE_MEI_OPERACAO_NFSE_DOC_URL#certificado-plugnotas-409-sem-id` ou fallback estático |
| 2 | HTTP 401, unauthorized, token inválido | Sessão ou permissão | Voltar a iniciar sessão e repetir. | — |
| 3 | HTTP 403, forbidden | Acesso negado | Conta sem permissão; falar com administrador. | — |
| 4 | HTTP 404, not found, não encontrado | Registo não encontrado | Atualizar lista / confirmar identificador. | — |
| 5 | duplicate, unique, já existe, conflict, 23505 | Registo duplicado | Mesmo CPF/CNPJ ou chave única; editar existente. | — |
| 6 | Failed to fetch, NetworkError, rede | Ligação à internet | Verificar rede e repetir. | — |
| 7 | Texto: «Não há cadastro desta empresa no plugnotas» | Empresa no Plugnotas | Preserva texto do emissor (já explícito). | — |
| 8 | «Não localizamos» + empresa/parâmetros | Empresa não encontrada no Plugnotas | Certificado + guia MEI; ambiente/token. | — |
| 9 | «rota» + «não existe» + serviço | Configuração do Plugnotas | URL base e chave no mesmo ambiente (servidor). | — |

## Onde aplica na UI (≥5)

1. **GuidesMei.tsx** — emissão NFS-e, lista/sincronizar/baixar/cancelar/arquivar, catálogo embutido, certificado, consulta/patch empresa, guardar emitente.
2. **MeiCatalogoClientes.tsx** — lista, exclusão + `toast.error`.
3. **MeiCatalogoServicosProdutos.tsx** — lista, exclusão + `toast.error`.
4. **MeiCatalogoClienteModal.tsx** — banner de erro do formulário (sem stack/JSON técnico).
5. **MeiCatalogoProdutoModal.tsx** — idem.

## Nota de produto (PO)

Textos fiscais sensíveis: validar tom «contacta o suporte» e links públicos antes de release final.
