# Brief: NFS-e Nacional ativa por padrão no cadastro (Plugnotas / Guia MEI)

**Data:** 2026-03-24  
**Origem:** Após correção de erro no cadastro fiscal, o stakeholder deseja que **ao cadastrar a empresa no emissor**, a opção equivalente a **“Ativar emissão de NFS-e Nacional”** (conforme UI do painel Plugnotas) fique **ligada por padrão**, para que as notas sejam direcionadas ao **ambiente da NFS-e Nacional**.

**Referência visual:** checkbox no painel Plugnotas com o rótulo *“Ativar emissão de NFS-e Nacional”* e texto de apoio *“Com este campo ativo, as notas serão enviadas para o ambiente da NFS-e Nacional.”*

---

## 1. Objetivo de produto

1. **Padrão ON:** novos cadastros de empresa feitos pelo fluxo deste aplicativo (Guia MEI → certificado → dados mínimos / `POST` empresa no Plugnotas) devem resultar no Plugnotas com **emissão NFS-e Nacional habilitada**, salvo decisão explícita futura de feature flag ou exceção por município/UF.
2. **Consistência:** alinhar o comportamento **API/payload** ao que o usuário espera ao ver o painel Plugnotas (evitar “cadastrei pelo app e no painel a opção nacional está desligada”).
3. **Transparência:** se houver casos em que a nacional **não** pode ser ativada (prefeitura ainda não integrada, CNPJ inelegível, etc.), a mensagem de erro ou o copy deve orientar — fora do escopo mínimo deste brief, mas risco a mapear na story.

---

## 2. Estado atual no repositório (brownfield)

- O cadastro da empresa no Plugnotas é montado principalmente em:
  - `frontend/src/utils/nfEmissionCompany.ts` — `buildNfEmissionEmpresaPayload` → bloco **`nfse`** com `ativo: true`, `tipoContrato: 0`, `config: { producao: true }`.
  - `backend/src/services/plugnotas/empresa.service.js` — normalização “apenas NFS-e” (ver ADR abaixo).
- **Não há** no código, até a data deste brief, referência explícita a string ou campo nomeado “NFS-e Nacional” / `nacional` (busca textual vazia). Ou seja: o requisito **ainda não está modelado** como campo de API; é **descoberta obrigatória** antes de implementar.

**Hipótese:** o toggle do painel Plugnotas corresponde a um campo dentro de `nfse` ou `nfse.config` na API `POST /empresa` / `PATCH /empresa` (nome e tipo a confirmar na documentação oficial Plugnotas ou suporte técnico).

---

## 3. Perguntas em aberto (descoberta — @architect / @dev)

1. **Contrato API:** qual é o nome exato do campo (e valores permitidos) para “NFS-e Nacional” no JSON de empresa Plugnotas? Há diferença entre sandbox e produção?
2. **Default do provedor:** se o campo for omitido, o Plugnotas assume nacional desligada? (justifica default explícito no nosso payload.)
3. **Empresas já cadastradas:** `PATCH` deve **ligar** nacional quando o usuário atualizar cadastro pelo app, ou só afetar **POST** de criação? (evitar sobrescrever intenção feita manualmente no painel.)
4. **Compatibilidade municipal:** MEIs em municípios ainda só no modelo municipal — o provedor rejeita `nacional: true` ou apenas ignora? Critério de fallback.
5. **Admin / outros fluxos:** o painel `AdminUserData` (emissão NFSe em nome do usuário) depende do mesmo cadastro — mesmo default aplica?

---

## 4. Critérios de aceite sugeridos (para story / PRD)

1. **Cadastro novo (Guia MEI):** após fluxo completo de certificado + empresa, no painel Plugnotas a opção **NFS-e Nacional** aparece **ativada** (ou o campo de API equivalente reflete “ligado”), em ambiente de homologação validado.
2. **Payload versionado / testado:** teste automatizado (unitário ou integração com mock) garante que o bloco `nfse` enviado inclui o parâmetro acordado com valor **default ON** para o fluxo MEI.
3. **Documentação:** `docs/operacao-mei-nfse.md` (ou ADR complementar) descreve o default e o link para doc Plugnotas.
4. **Regressão:** emissão NFSe existente e cadastro “apenas NFS-e” (ADR) continuam passando; não reativar NF-e/NFC-e.

---

## 5. Riscos e NFRs

| Risco | Mitigação sugerida |
| --- | --- |
| Rejeição 400 por município não suportado na nacional | Tratamento de erro amigável + eventual flag ou detecção documentada |
| Divergência painel × API | Validar com conta real em sandbox antes de produção |
| Sobrescrita em `PATCH` | Definir regra explícita (só POST vs. PATCH condicional) |

---

## 6. Rastreabilidade sugerida

- Épico fiscal: `docs/stories/epic-guia-mei-apenas-nfse-prd.md` ou épico Plugnotas legado, conforme priorização @po.
- ADR relacionado: `docs/adr/ADR-plugnotas-empresa-payload-apenas-nfse.md` (extensão do bloco `nfse`, não conflitar com `nfe`/`nfce` inativos).

---

## 7. Próximos passos recomendados

1. **@po / @sm:** fatiar story com spike de 0,5–1 dia se o campo API não estiver óbvio na documentação pública.  
2. **@dev:** após nome do campo confirmado, alterar `buildNfEmissionEmpresaPayload` e, se necessário, `empresa.service.js` para default ON e testes.  
3. **@qa:** cenário E2E ou checklist manual no painel Plugnotas pós-cadastro.

---

— Brief elaborado para apoiar priorização e escrita de story; **não** substitui validação do contrato oficial Plugnotas.
