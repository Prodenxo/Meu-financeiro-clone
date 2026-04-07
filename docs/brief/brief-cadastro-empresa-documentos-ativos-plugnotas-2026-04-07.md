# Brief: escolha de **documentos ativos** no cadastro da empresa (Plugnotas)

**Data:** 2026-04-07  
**Origem:** pedido de produto (Atlas — analista)  
**Produto:** Meu Financeiro — área de **cadastro do emitente** na integração fiscal (certificado A1 + dados mínimos para emissão via **Plugnotas**).

**Documentos relacionados (não substituídos por este brief):**

- `docs/operacao-mei-nfse.md` — escopo atual da Guia MEI (UI centrada em NFS-e), política de payload `POST`/`PATCH` empresa, blocos `nfe`/`nfce`/`nfse`.  
- `docs/adr/ADR-plugnotas-empresa-payload-apenas-nfse.md` — decisão técnica de normalização do cadastro (quando aplicável).  
- `docs/brief/brief-emissao-nfe-nfce-plugnotas-aba-emissao-2026-04-06.md` — emissão NF-e/NFC-e na aba de emissão; **dependência lógica:** habilitar tipos no cadastro alinha com emissão futura.  
- `docs/brief/brief-user-mei-certificates-nfse-campos-supabase.md` — espelhamento Supabase ↔ dados de emitente.

**Próximos passos típicos:** `@pm` — PRD, critérios de aceite e impacto na **Limitação D-01** (apenas NFS-e na UI); `@architect` — contrato API/UI ↔ `plugnotas-mei-empresa-policy`, `POST|PATCH …/empresa`; `@sm` — story com file list e gates.

---

## 1. Resumo executivo

Pretende-se que, na **área de cadastrar a empresa** no fluxo fiscal (upload de certificado + **dados mínimos** para o emissor), o utilizador possa **indicar quais tipos de documento eletrónico pretende emitir** via **Plugnotas** — por exemplo **NFS-e**, **NF-e** e **NFC-e** — de forma explícita (ex.: checkboxes ou equivalente acessível), em linha com referência de UI tipo separador **“Documentos ativos”**.

Hoje o ecrã e a copy estão orientados a **NFS-e**; o backend, no modo focado MEI, **inativa** `nfe` e `nfce` no `POST` de empresa e trata `nfse` com regras próprias (incl. NFS-e Nacional). Esta evolução exige **decisão de produto** sobre o que significa “ativar” cada tipo (contrato Plugnotas, pré-requisitos fiscais, CSC, IE, etc.) e **alteração coordenada** de UI, API e persistência.

---

## 2. Problema / oportunidade

| Dimensão | Situação atual | Oportunidade |
|----------|----------------|--------------|
| **Expectativa do utilizador** | O cadastro não comunica claramente **quais** canais fiscais ficarão habilitados no provedor; o utilizador pode assumir apenas NFS-e ou ignorar NF-e/NFC-e. | **Transparência:** escolha explícita dos “documentos ativos” reduz surpresas e alinha expectativa com o painel Plugnotas. |
| **Cobertura de negócio** | MEIs que **também vendem mercadorias** podem precisar de **NF-e** / **NFC-e** no mesmo cadastro emitente. | Um controlo no **cadastro** evita desalinhamento entre o que o utilizador quer emitir e o que o `POST /empresa` envia (`ativo`, `tipoContrato`, `config` quando existir). |
| **Produto vs política atual** | Documentação de produto restringe a **interface** da Guia MEI a NFS-e (**Limitação D-01**). | Definir se a **seleção no cadastro** é só “configuração técnica no Plugnotas” (sem mudar ainda as telas de emissão) ou se antecipa **emissão** NF-e/NFC-e na UI — evita scope creep não intencional. |
| **Manutenção e suporte** | Erros que citam `nfce`/`nfe` no JSON confundem quem só opera NFS-e. | Copy e ajuda contextual por tipo selecionado (o que falta para “ativar” de forma válida). |

---

## 3. Objetivos

1. **Seleção explícita:** o utilizador marca quais documentos devem ficar **ativos** no cadastro Plugnotas (mínimo sugerido na referência: **NFS-e**, **NF-e**, **NFC-e**; outros tipos — ex. **CT-e** — só entram se o produto e a API do provedor o justificarem).  
2. **Sincronização com o backend:** a escolha deve refletir-se no **payload** enviado a `POST …/empresa` e, quando aplicável, em `PATCH …/empresa` (respeitando regras atuais de não sobrescrever blocos omitidos).  
3. **Formulário contextual:** campos “dados mínimos” e rótulos podem variar por tipo (ex.: NFS-e vs NF-e); ocultar ou desativar secções irrelevantes quando só um tipo estiver marcado.  
4. **Generalização de copy:** títulos como “Dados mínimos para emissão de NFS-e” podem evoluir para algo neutro (ex. **“Configuração fiscal do emitente”** ou **“Dados para emissão no Plugnotas”**) quando mais de um tipo estiver selecionado.  
5. **Persistência:** se existir tabela/espelho local dos dados de emitente, guardar a **lista de tipos ativos** escolhida (ou flags canónicas) para pré-preenchimento e auditoria — alinhado a `brief-user-mei-certificates-nfse-campos-supabase.md` quando relevante.

---

## 4. Fora de âmbito ou fase 2 (a validar com PO)

- Substituir o integrador Plugnotas.  
- Implementação completa da **aba de emissão** para NF-e/NFC-e (pode ser story separada; ver brief de aba de emissão).  
- **CT-e** ou outros documentos sem requisito explícito de negócio.  
- Validação fiscal profunda no app no lugar do contador (o produto continua a **orquestrar** dados, não a substituir obrigações legais).

---

## 5. Decisões em aberto (críticas antes da story)

1. **Relação com Limitação D-01:** permitir seleção NF-e/NFC-e no cadastro **sem** ainda expor emissão desses tipos na Guia MEI, ou exigir **paridade** com telas de emissão na mesma release.  
2. **Defaults:** pré-marcar só **NFS-e** (compatível com MEI prestador) vs última escolha guardada vs espelho do que já existe no Plugnotas (`GET empresa`).  
3. **Contrato Plugnotas por tipo:** quais campos mínimos e `config` são obrigatórios para `nfe`/`nfce` **ativos** (CSC NFC-e, ambiente, IE, CFOP padrão, etc.) — validar com documentação oficial e ADRs existentes.  
4. **PATCH sem certificado:** “Atualizar cadastro (sem novo certificado)” deve aplicar alteração de **documentos ativos** da mesma forma que o cadastro completo; definir idempotência e mensagens de erro.  
5. **Acessibilidade:** padrão para a lista de tipos — grupo de checkboxes com `fieldset`/`legend`, ou `aria-describedby` ligado ao aviso do certificado A1.

---

## 6. Proposta de experiência (UX)

### 6.1 Colocação na página

- Secção dedicada **“Documentos ativos”** (ou integrada no fluxo existente): pode ser **sub-aba** junto de detalhes/endereço/contato **ou** bloco destacado **antes** dos dados mínimos, conforme padrão visual do produto (referência: tabs *Detalhes / Endereço / Contato / Documentos ativos*).

### 6.2 Controles

- **Checkboxes** (ou switches com mesmo significado semântico) por tipo: **NFS-e**, **NF-e**, **NFC-e**.  
- Estado **indeterminado** não é necessário; validar que **pelo menos um** tipo permanece selecionado quando o produto exigir emissão fiscal (ou permitir zero apenas em modo rascunho — decisão de negócio).

### 6.3 Feedback

- Texto curto sob a seleção: o que cada tipo implica (serviço vs produto vs consumidor).  
- Se o utilizador desmarcar NFS-e mas o restante do fluxo MEI assumir NFS-e, mostrar **confirmação** ou bloqueio coerente com a regra de produto.

---

## 7. Critérios de aceite (rascunho para story)

- [ ] O utilizador seleciona **quais** tipos de documento devem ficar ativos no Plugnotas antes ou durante o envio do cadastro da empresa.  
- [ ] O backend envia payload coerente com a seleção (`nfse` / `nfe` / `nfce` com `ativo` e demais campos exigidos pelo policy layer), sem regressão para quem só usa NFS-e.  
- [ ] Consulta **“Consultar cadastro no emissor”** reflete, na medida do possível, o estado dos tipos (ou mensagem clara se a API não expuser simetria).  
- [ ] Atualização sem novo certificado aplica mudanças de documentos ativos quando permitido pela API.  
- [ ] Testes: unitários no normalizador de empresa e/ou testes de integração conforme padrão do repositório; `lint` / `typecheck` / `test` conforme `AGENTS.md`.

---

## 8. Riscos e mitigações

| Risco | Mitigação |
|-------|-----------|
| Ativar NF-e/NFC-e sem dados fiscais completos → **400** Plugnotas | Wizard de campos obrigatórios por tipo; bloqueio com mensagens mapeadas (`fiscalUserError` / integração). |
| Divergência painel Plugnotas vs app | Checklist manual pós-cadastro (similar a `operacao-mei-nfse.md` para NFS-e Nacional). |
| Conflito com épico “apenas NFS-e na UI” | Documentar no PRD se a seleção é **só backend** ou também **mudança de escopo de UI** de emissão. |

---

## 9. Referência visual (contexto)

Mockups ou capturas de ecrã fornecidos pelo utilizador ilustram: (1) formulário de dados mínimos NFS-e com aviso de certificado A1; (2) separador **Documentos ativos** com NFS-e, NF-e e NFC-e selecionáveis. O desenho final deve seguir tokens e padrões já usados em `GuidesMei` / área fiscal.

---

— *Brief preparado para handoff a PM / arquitetura / story. Não substitui ADR nem PRD.*
