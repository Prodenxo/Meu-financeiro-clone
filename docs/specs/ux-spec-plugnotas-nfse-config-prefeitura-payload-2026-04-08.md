# Especificação de front-end e UX — **`nfse.config.prefeitura`** vs **inscrição municipal** (cadastro empresa Plugnotas)

**Versão:** 1.0  
**Data:** 2026-04-08  
**Autoria:** Uma (UX design expert, fluxo AIOX)  
**Requisitos de origem:** [`docs/prd/PRD-plugnotas-empresa-nfse-config-prefeitura-payload-2026-04-08.md`](../prd/PRD-plugnotas-empresa-nfse-config-prefeitura-payload-2026-04-08.md) (**FR-PREF-UX-01**, **FR-PREF-HINT-01**; alinhamento a **FR-PREF-API-01** quando PO activar trilhos **B/C/D**)  
**Brief de apoio:** [`docs/brief/brief-plugnotas-empresa-nfse-config-prefeitura-payload-2026-04-08.md`](../brief/brief-plugnotas-empresa-nfse-config-prefeitura-payload-2026-04-08.md)

**Relação com specs e código de referência:**

- **NFS-e Nacional (formulário sem IM/prefeitura obrigatória):** [`docs/specs/ux-spec-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md`](ux-spec-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md) — callout de modo nacional e erros municipais genéricos (**FR-NAT-ERR-01**). **Esta spec** aprofunda o caso em que o erro cita **`nfse.config.prefeitura`** e evita equivalência falsa com **IM na raiz** (**FR-PREF-UX-01**).  
- **Orquestração certificado + empresa:** [`docs/specs/ux-spec-empresa-plugnotas-orquestrada-cadastro-certificado-2026-04-07.md`](ux-spec-empresa-plugnotas-orquestrada-cadastro-certificado-2026-04-07.md) — painel de retry, fase 2.  
- **Mensagens de erro (contexto global):** [`docs/specs/ux-spec-mensagens-erro-usuario-final-2026-04-07.md`](ux-spec-mensagens-erro-usuario-final-2026-04-07.md).  
- **Operação:** [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md) — **FR-PREF-DOC-01** (entrega doc; esta spec cita âncoras e copy alinhadas).  
- **Implementação de referência:**  
  - `frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts` — `isPlugnotasEmpresaMunicipalRequirementMessage`, `shouldOfferNfseNacionalOperacaoDocHint`, `getNfseNacionalOperacaoHelpHref`.  
  - `frontend/src/utils/nfEmissionCompany.ts` — `inscricaoMunicipal` opcional na raiz; `nfse.config` sem `prefeitura` no baseline actual.  
  - `frontend/src/pages/GuidesMei.tsx` — painel âmbar de retry, `GuiaMeiEmpresaCadastroErrorPanel`.

**Nota:** não usar o carácter “§” em *strings* de UI. Em documentação interna, usar “secção” ou número do PRD.

---

## 1. Objetivo deste documento

Contrato de **experiência, microcopy, hierarquia de mensagens de erro, ajuda contextual e acessibilidade** para:

1. Quando o Plugnotas (ou o BFF) devolver erro ligado a **`nfse.config.prefeitura`** / **“prefeitura” na configuração NFS-e**, o utilizador **não** concluir que “faltou só preencher inscrição municipal” no formulário (**FR-PREF-UX-01**).  
2. O campo opcional **inscrição municipal** (se visível) ter **texto de apoio** que **não** sugira que substitui a **configuração de prefeitura** no bloco NFS-e (**PRD secção 6.3**).  
3. Manter **FR-PREF-HINT-01**: heurísticas e painéis continuam coerentes com **FR-NAT-ERR-01**, com **variante de copy** quando o erro for **especificamente** sobre `config` / `prefeitura` no JSON de empresa.  
4. Prever **UI condicional** para trilhos **C** ou **D** (PO), sem implementar catálogo municipal completo fora de story dedicada.

Serve para critérios de aceite de story, *file list* e QA de conteúdo; **não** define o schema JSON (**@architect** / ADR).

---

## 2. Princípios de UX

| Princípio | Aplicação |
|-----------|-----------|
| **Dois conceitos, duas frases** | **Inscrição municipal** (dados da empresa) ≠ **configuração de prefeitura no NFS-e** (o que o emissor pede em `nfse.config`). Explicar em linguagem simples, sem expor `POST /empresa` no título. |
| **Sem culpa pela IM opcional** | Se o utilizador já preencheu IM e o erro fala em prefeitura/config, a mensagem **reconhece** que são coisas diferentes (“o emissor pediu outro tipo de dado”). |
| **Próximo passo visível** | Sempre: painel Plugnotas (NFS-e Nacional), ambiente produção/homologação, suporte Plugnotas, **ou** (se trilho C/D activo) passo guiado adicional — conforme PRD trilho **A** vs **B/C/D**. |
| **404 após falha de POST** | Se a UI mostrar “empresa não encontrada” após um cadastro falhado, contextualizar: o registo **ainda não foi criado**; não culpar o utilizador por “CNPJ errado” sem evidência. |
| **A11y** | Conteúdo novo de ajuda: região com título; erros: `role="alert"` onde já existir padrão; não duplicar o mesmo alerta em dois sítios com texto idêntico sem necessidade. |

---

## 3. Arquitetura de informação (IA)

### 3.1 Área afetada (MVP)

**Workspace:** Guia MEI — painel **DAS** / **Certificado digital**, fluxo de **registro da empresa** no emissor (fase 2 da orquestração), incluindo:

- Painel âmbar de retry (“Não foi possível concluir o registro da empresa”).  
- `GuiaMeiEmpresaCadastroErrorPanel` (erro vermelho genérico).  
- Campos de emitente onde exista **inscrição municipal opcional** (rótulo + *hint*).  
- (Futuro trilho **C/D**) bloco colapsável ou passo extra **abaixo** do callout nacional existente, **sem** tornar IM/prefeitura obrigatórios para contas estritamente nacionais.

### 3.2 Hierarquia de mensagens (ordem de especificidade)

| Prioridade | Gatilho (mensagem normalizada contém) | Comportamento UX |
|------------|----------------------------------------|------------------|
| **PREF-L1** | `nfse.config.prefeitura`, `config.prefeitura`, “prefeitura” + “obrigatório” + contexto empresa/NFS-e (já coberto por `isPlugnotasEmpresaMunicipalRequirementMessage`) | Mostrar **bloco principal** da secção **§5.1** (copy “configuração da prefeitura no NFS-e”). |
| **PREF-L2** | Outras exigências municipais (só IM, sem menção a prefeitura/config) | Manter copy da spec NAT **§5.2** (cadastro municipal genérico) **sem** afirmar que IM resolve `prefeitura`. |
| **PREF-L3** | Erro genérico sem palavras-chave | Não inventar explicação municipal; link de ajuda só se outra regra disparar. |

---

## 4. Microcopy — formulário (inscrição municipal opcional)

**Objetivo PRD:** não documentar nem sugerir que IM substitui **`nfse.config.prefeitura`**.

| Elemento | Especificação |
|----------|----------------|
| **Hint abaixo do campo** (se o campo existir na UI) | Texto sugerido (1 linha, `text-xs`): *“Opcional. É o número da inscrição na prefeitura; não substitui configurações extras que o emissor possa pedir no cadastro NFS-e.”* |
| **O que evitar** | Frases do tipo *“Se o Plugnotas pedir prefeitura, preencha aqui”* ou *“Resolve erros de prefeitura”*. |
| **Validação local** | Continua **opcional**; não tornar obrigatório por causa deste PRD. |

**Teste de conteúdo:** utilizador lê só o *hint* e consegue dizer que “ainda pode pedir outra coisa no emissor”.

---

## 5. Microcopy — erro de cadastro da empresa

### 5.1 Variante **“prefeitura na configuração NFS-e”** (**FR-PREF-UX-01**)

Usar quando **PREF-L1** (secção 3.2) for verdadeiro — **em substituição ou acréscimo** ao parágrafo municipal genérico da spec NAT, para **não** sugerir que faltou IM.

**Título do bloco auxiliar** (opcional, `text-sm font-semibold`):  
*O emissor pediu dados de configuração da prefeitura no NFS-e*

**Corpo** (2–3 frases curtas, tom calmo):

1. *Isto é diferente da inscrição municipal opcional que você pode ter preenchido acima.*  
2. *Em muitos casos, o cadastro em modo NFS-e Nacional não deveria exigir esse passo — confira no painel Plugnotas se “NFS-e Nacional” está ativo para este CNPJ e se o ambiente (produção ou homologação) é o mesmo.*  
3. *Se estiver tudo certo, fale com o suporte Plugnotas ou siga o guia de operação abaixo.*

**CTAs:** manter **Editar dados** e **Tentar registrar empresa novamente** conforme spec orquestrada; não exigir preenchimento de IM como “correção” única.

**Link de ajuda:** mesmo padrão que `getNfseNacionalOperacaoHelpHref()` + texto do *link* já usado no fluxo nacional (ex.: “Ver guia de operação fiscal”).

### 5.2 Coexistência com a spec NAT

- Se **apenas** `inscricaoMunicipal` aparecer na mensagem (sem `prefeitura` / `config`), usar bloco **NAT §5.2** **sem** a frase que implica que preencher IM resolve `nfse.config.prefeitura`.  
- Se a mensagem mencionar **ambos**, **priorizar §5.1 desta spec** (PREF-L1) como bloco principal e **omitir** redundância “preencha IM”.

### 5.3 Painel vermelho (`GuiaMeiEmpresaCadastroErrorPanel`)

Aplicar a **mesma** regra de prioridade (PREF-L1 → §5.1) via função partilhada ou *slot* “dica municipal”, alinhado à spec NAT **§5.3**, para **uma única** fonte de verdade de copy.

### 5.4 “Empresa não encontrada” / 404 após falha

Se a UI consultar cadastro e receber 404 **depois** de um `POST` empresa falhado:

- **Microcopy sugerida** (contexto de *empty state* ou alerta): *“O cadastro ainda não foi concluído no emissor. Se você acabou de enviar os dados e viu um erro, resolva o erro acima e tente registrar de novo.”*  
- **Evitar:** *“CNPJ não encontrado”* como única linha, sem contexto de tentativa recente (quando o produto souber que houve falha na fase 2 — condição técnica a validar com @dev).

---

## 6. FR-PREF-HINT-01 — alinhamento técnico de disparo

| Requisito | Orientação UX |
|-----------|----------------|
| Mensagens com `fields.nfse.config.prefeitura` | Devem continuar a disparar `isPlugnotasEmpresaMunicipalRequirementMessage` (já inclui `config.prefeitura`). **Story @dev:** garantir teste unitário com *string* real do incidente. |
| `shouldOfferNfseNacionalOperacaoDocHint` | Mantém-se **true** para essas mensagens; a **diferença** é a **variante de copy §5.1** no componente de UI, não necessariamente nova função pública — desde que a UI distinga PREF-L1 vs PREF-L2. |
| Regressão FR-NAT-ERR-01 | Não remover *patterns* existentes; apenas **especializar** texto quando PREF-L1. |

**Sugestão de API de UI (opcional na story):**  
`getPlugnotasEmpresaCadastroErrorUxVariant(message: 'generic' | 'municipal-generic' | 'prefeitura-config')` — nomes internos; **não** expor estes nomes ao utilizador.

---

## 7. Trilhos B / C / D (PO) — orientação de UI

| Trilho | Papel da UX |
|--------|-------------|
| **A** (só conta/suporte) | Entrega = **§4**, **§5**, link operação; sem novos campos. |
| **B** (derivação servidor) | Idealmente **sem** novos campos; opcional *toast* informativo “Ajustamos a configuração com base no município informado” **só** se PO aprovar e for verdade após implementação. |
| **C** (campos explícitos) | Novo bloco **“Só se o emissor exigir”** (`role="region"`), com 1–2 campos mínimos definidos no ADR; texto introdutório: *“O Plugnotas pediu dados de prefeitura no cadastro NFS-e. Preencha apenas se a mensagem de erro indicar essa necessidade.”* |
| **D** (híbrido) | Após primeiro 400 PREF-L1, mostrar bloco **C** ou CTA “Ver passos no guia” — fluxo em **story** com máquina de estados; wireframe textual em **§10**. |

**Contenção de escopo:** catálogo nacional de prefeituras — fora deste MVP salvo PRD explícito; preferir *combobox* com busca só se backend fornecer lista acordada.

---

## 8. Rastreabilidade PRD → UX

| ID PRD | Entrega UX (esta spec) |
|--------|-------------------------|
| **FR-PREF-UX-01** | Secções **§4**, **§5.1**, **§5.2**, **§5.3** |
| **FR-PREF-HINT-01** | Secção **§6** + prioridade **§3.2** |
| **FR-PREF-API-01** | Secção **§7** (trilhos **B/C/D**) — UI condicional e labels |
| **FR-PREF-DOC-01** | Copy alinhada a âncoras em `operacao-mei-nfse.md` (entrega doc) |
| Critério release 2 (PRD secção 10) | QA com mensagem simulada contendo `nfse.config.prefeitura` → utilizador vê **§5.1** |

---

## 9. Lista de ficheiros prováveis (@dev)

1. `frontend/src/pages/GuidesMei.tsx` — variantes de copy no painel âmbar / erro vermelho; *empty state* 404 contextual **§5.4** se aplicável.  
2. `frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts` — função de variante ou testes adicionais; **não** enfraquecer `isPlugnotasEmpresaMunicipalRequirementMessage`.  
3. Componente de formulário de emitente (onde estiver IM opcional) — *hint* **§4**.  
4. Testes unitários: mensagem com `fields.nfse.config.prefeitura: Preenchimento obrigatório` → variante PREF-L1.  
5. `docs/operacao-mei-nfse.md` — referência cruzada (doc, **FR-PREF-DOC-01**).

---

## 10. Wireframe textual

**Estado: erro PREF-L1 após fase 2**

```
[ Certificado digital ]

[ Callout NFS-e Nacional — spec NAT §4.1 ]

[ Painel âmbar — título existente ]
[ Detalhe técnico opcional / colapsável ]

[ ▶ O emissor pediu dados de configuração da prefeitura no NFS-e ]  ← §5.1
[   2–3 frases + link guia operação                        ]

[ Campos formulário — IM opcional com hint §4 ]

[ Editar dados ] [ Tentar registrar empresa novamente ]
```

**Estado futuro trilho C (referência)**

```
[ … mesma coluna … ]

[ ▢ Só se o emissor exigir — Configuração de prefeitura no NFS-e ]
[   [ Campo(s) mínimos conforme ADR ]                          ]

[ CTAs inalterados ]
```

---

## 11. Checklist de QA visual / conteúdo

1. Simular erro com texto `fields.nfse.config.prefeitura` e `Preenchimento obrigatório`: aparece bloco **§5.1** (não só “preencha inscrição municipal”).  
2. Simular erro só com `inscricaoMunicipal` obrigatório: copy NAT **sem** prometer que IM resolve `prefeitura`.  
3. Campo IM opcional: *hint* **§4** visível quando o campo existe.  
4. Link “guia de operação” presente quando a dica nacional/municipal dispara.  
5. Tema escuro: legível; leitor de ecrã: uma região principal de erro, sem três alertas redundantes com o mesmo texto.

---

## Change log

| Data | Autor | Nota |
| --- | --- | --- |
| 2026-04-08 | Uma | Spec inicial a partir do PRD `PRD-plugnotas-empresa-nfse-config-prefeitura-payload-2026-04-08.md`; complementa `ux-spec-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md`. |
