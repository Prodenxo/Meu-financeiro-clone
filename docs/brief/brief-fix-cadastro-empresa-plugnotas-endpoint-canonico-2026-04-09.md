# Brief: fix — cadastro de empresa Plugnotas no endpoint canónico `POST /empresa`

**Data:** 2026-04-09  
**Origem:** alinhamento entre documentação oficial Plugnotas, fluxo Guia MEI e incidente de cadastro de empresa não concluído no emissor.  
**Escopo:** confirmar endpoint correcto de cadastro de empresa no Plugnotas, distinguir rota interna do BFF vs rota upstream do provedor, e orientar a correção sem inventar nova arquitetura.

**Referência externa:** [Documentação Plugnotas (Postman) — Empresa](https://documenter.getpostman.com/view/3720339/2sB3WpSh1R?version=latest#54bcc736-6cd3-4e96-bc51-cab153c2f976)

---

## 1. Resumo executivo

- O endpoint canónico de cadastro de empresa no Plugnotas é **`POST https://api.plugnotas.com.br/empresa`**.
- No sandbox, o host muda, mas o path funcional continua **`POST /empresa`**.
- No Meu Financeiro, o frontend **não** deve chamar o Plugnotas diretamente; ele chama o **BFF** em **`POST /api/mei-notas/setup/emissao-fiscal/empresa`**.
- O backend então materializa o cadastro upstream em **`requestJson('POST', '/empresa', payload)`**.

**Conclusão:** a correção não é criar uma nova rota de aplicação; é garantir que o fluxo actual continue apontando para o endpoint canónico do Plugnotas, com `base URL`, `path prefix` e payload coerentes com a documentação oficial.

---

## 2. Problema que este brief evita

Durante a triagem, surgiu a hipótese de que o cadastro não estaria funcionando por “rota errada”. A análise do código e da documentação indica que:

1. A rota **interna** do produto é a do BFF: `POST /api/mei-notas/setup/emissao-fiscal/empresa`.
2. A rota **externa** do provedor é `POST /empresa` no host Plugnotas configurado.
3. O problema operacional observado pode ocorrer mesmo com a rota correta, por exemplo:
   - `base URL` errada para o ambiente;
   - `PLUGNOTAS_API_PATH_PREFIX` configurado indevidamente;
   - payload rejeitado pelo Plugnotas;
   - exigência de `nfse.config.prefeitura.login/senha`;
   - mistura de token/base entre sandbox e produção.

---

## 3. Mapeamento canónico

| Camada | Método / rota | Papel |
|--------|----------------|-------|
| Frontend → BFF | `POST /api/mei-notas/setup/emissao-fiscal/empresa` | Enviar dados do emitente para cadastro via backend |
| Backend → Plugnotas | `POST /empresa` | Cadastrar empresa no emissor |
| Fallback backend | `PATCH /empresa/:cnpj` | Atualizar empresa existente quando aplicável |
| Consulta | `GET /api/mei-notas/setup/emissao-fiscal/empresa?cpfCnpj=...` | Verificar no BFF se a empresa existe |
| Consulta upstream | `GET /empresa/:cnpj` | Conferir cadastro já persistido no Plugnotas |

---

## 4. Fontes no repositório

- `backend/src/services/plugnotas/empresa.service.js`
  - `cadastrarEmpresaPlugNotas(...)`
  - `requestJson('POST', '/empresa', payload)`
- `frontend/src/services/meiNotasService.ts`
  - cliente HTTP do BFF para `.../setup/emissao-fiscal/empresa`
- `frontend/src/utils/plugnotasEmitenteSetup.ts`
  - orquestração certificado → empresa
- `docs/technical/architecture-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md`
  - consolidação do desenho atual

---

## 5. Hipóteses de correção

### A. Verificação de endpoint/configuração

Confirmar no ambiente actual:

- `PLUGNOTAS_API_BASE_URL`
- `PLUGNOTAS_API_PATH_PREFIX`
- `PLUGNOTAS_API_KEY`
- coerência sandbox vs produção

**Objetivo:** evitar `host` ou prefixo incompatível com o contrato público `POST /empresa`.

### B. Verificação de payload

Inspeccionar o JSON imediatamente antes do `fetch` ao Plugnotas:

- presença de `cpfCnpj`, `certificado`, `endereco`;
- bloco `nfse.config`;
- `prefeitura.login` / `senha` quando o município/conta exigir;
- ausência de campos incompatíveis com o modo apenas NFS-e.

### C. Verificação de fallback

Se o `POST /empresa` retornar conflito, validar se o fluxo de `PATCH /empresa/:cnpj` segue coerente com o cenário de empresa já existente.

---

## 6. Critério objetivo para considerar a fix correta

A fix está correta quando:

1. o frontend continua usando o BFF, sem chamada direta browser → Plugnotas;
2. o backend usa o host configurado e invoca **`POST /empresa`** como endpoint principal;
3. o `GET` de verificação deixa de retornar ausência por falha prévia de cadastro;
4. o ambiente e o payload ficam alinhados ao contrato do Plugnotas para o município/conta testados.

---

## 7. Fora de âmbito

- criar nova UI “addCompany” separada;
- expor segredo Plugnotas no browser;
- redefinir a arquitetura BFF;
- assumir que todo erro de cadastro se resolve só trocando rota.

---

## 8. Próximos passos sugeridos

1. Validar `PLUGNOTAS_API_BASE_URL` e `PLUGNOTAS_API_PATH_PREFIX` no ambiente activo.
2. Capturar log redigido do payload enviado ao `POST /empresa`.
3. Confirmar se o erro actual é de endpoint/configuração ou de validação do payload.
4. Se necessário, abrir story de correção técnica a partir deste brief.

---

*Brief de alinhamento brownfield para correção do cadastro de empresa Plugnotas no fluxo Guia MEI.*
