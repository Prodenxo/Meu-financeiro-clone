# Brief: certificado já no Plugnotas — não foi possível obter o ID automaticamente

**Contexto:** Guia MEI → envio do certificado A1 para emissão fiscal (integração Plugnotas).  
**Sintoma na tela:** mensagem no sentido de *certificado enviado no MEI*, porém *falhou a configuração automática da integração fiscal*; o corpo cita que o certificado **já está cadastrado** no Plugnotas, mas **não foi possível obter o ID automaticamente** (código de negócio no backend: `certificado_409_sem_id`).  
**Exemplo de chamada que falha:** `POST /api/mei-notas/setup/emissao-fiscal/certificado` → **400** com essa mensagem.

---

## O que o sistema tenta fazer (em ordem)

1. Enviar o certificado para o Plugnotas (`POST .../certificado`).
2. Se a API responder **409** (certificado duplicado / já existente), o backend **não desiste**: ele tenta **recuperar o ID** já existente:
   - `GET .../empresa/{CNPJ}` e extrair referência ao certificado na empresa;
   - se não der, `GET .../certificado?cpfCnpj={CNPJ}`;
   - se não der, `GET .../certificado` (listagem) e localizar o item pelo CNPJ (e heurísticas da listagem).
3. Só se **todas** essas leituras falharem ou não trouxerem um ID utilizável é que você vê o erro **“não foi possível obter o ID automaticamente”**.

Ou seja: o problema **não** é só “deu 409”. É **409 + recuperação do ID via GET falhou**.

---

## “Foi o certificado que cadastrei agora?”

Pode ser **sim** no sentido de que você acabou de subir o `.p12` **neste fluxo**; o Plugnotas pode responder que **esse certificado (mesmo conteúdo/CNPJ) já estava** cadastrado **antes** na **mesma conta/API** — daí o 409.  
Também é possível que o certificado tenha sido cadastrado **em outra sessão** ou **outro canal** (painel Plugnotas, outra integração), e o POST atual apenas **confirma** duplicidade.

O ponto decisivo para você: na **mesma** conta Plugnotas ligada ao `PLUGNOTAS_API_KEY` do seu backend, esse CNPJ já tem certificado vinculado; o app precisava só do **ID** retornado pelos GETs e não conseguiu.

---

## Checklist de diagnóstico (ordem sugerida)

1. **CNPJ do formulário**  
   Deve ser **exatamente** o CNPJ do certificado e o mesmo que está na empresa no Plugnotas (**14 dígitos**, sem máscara na API — conferir se não há dígito trocado).

2. **Conta e ambiente Plugnotas**  
   Abrir [app2.plugnotas.com.br](https://app2.plugnotas.com.br) na **mesma conta** que corresponde à **API key** do servidor. Confirmar:
   - se o certificado **aparece** para aquele CNPJ;
   - se não há **duas contas** (sandbox vs produção, ou duas empresas/chaves diferentes).

3. **Variáveis do backend (`PLUGNOTAS_API_BASE_URL` e `PLUGNOTAS_API_KEY`)**  
   A mensagem oficial do produto pede para conferir se **base URL e API key são do mesmo ambiente** (ex.: sandbox com key de sandbox, produção com key de produção).  
   Mistura típica: certificado cadastrado no painel **A** e requisições indo para **B** → listagens/empresa não batem → ID não resolvido.

4. **Permissões / filtros da API**  
   Alguns ambientes retornam **400** em `GET /certificado?cpfCnpj=...` (mensagem tipo “filtro não suportado”). O código tenta rotas alternativas; se a API estiver **restrita** ou o payload da listagem vier em formato **inesperado**, a extração do ID falha.

5. **Empresa ainda não cadastrada no Plugnotas**  
   Se `GET /empresa/{CNPJ}` dá 404, o fluxo depende mais da **listagem de certificados**. Vale tentar **cadastrar a empresa** no painel ou garantir que o CNPJ exista como empresa naquela conta, se a documentação do provedor exigir isso para amarrar certificado e empresa.

---

## O que fazer na prática (passos de negócio)

1. No painel Plugnotas, **localizar o certificado** pelo CNPJ e anotar **ID interno** se estiver visível (opcional — o app espera obter isso via API).  
2. Garantir **alinhamento**: uma única **API key**, um único **ambiente (URL base)**, CNPJ **correto**.  
3. **Repetir o fluxo** no app após corrigir ambiente/CNPJ (às vezes basta isso para os GETs passarem a devolver o ID).  
4. Se ainda falhar: **logs do servidor** no momento do 409 (equipe técnica pode ver qual GET falhou e qual corpo veio, sem expor segredo em ticket público).

---

## Escopo fora deste brief

- Erro de **rede** ou **backend local parado** (aparece como *failed to fetch* / conectividade) — ver épico Guia MEI conectividade / doc `docs/operacao-mei-nfse.md`.  
- Erros **400** com texto de **validação de JSON** ou campos fiscais — outro fluxo (cadastro de empresa / payload), não necessariamente `certificado_409_sem_id`.

---

## Referência no código (para time técnico)

- Resolução após 409: `backend/src/services/plugnotas/empresa.service.js` — `resolverCertificadoIdAposConflito409`, `cadastrarCertificadoPlugNotas`.  
- Mensagem `certificado_409_sem_id` emitida quando a resolução não obtém ID.

---

*Brief elaborado para apoio a suporte e produto; complementa a mensagem exibida na UI.*
