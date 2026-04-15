# Especificação de front-end e UX — NFS-e Nacional como padrão com bloqueio da exceção `prefeitura.login` no PlugNotas

**Versão:** 1.0  
**Data:** 2026-04-10  
**Autoria:** Uma (UX design expert, fluxo AIOX)  
**Requisitos de origem:** [`docs/prd/PRD-nfse-nacional-padrao-com-excecao-credenciais-prefeitura-plugnotas-2026-04-09.md`](../prd/PRD-nfse-nacional-padrao-com-excecao-credenciais-prefeitura-plugnotas-2026-04-09.md) (**FR-NATEX-01** a **FR-NATEX-09**, **NFR-NATEX-01** a **NFR-NATEX-05**)  
**Brief de apoio:** [`docs/brief/brief-nfse-nacional-padrao-com-excecao-credenciais-prefeitura-plugnotas-2026-04-09.md`](../brief/brief-nfse-nacional-padrao-com-excecao-credenciais-prefeitura-plugnotas-2026-04-09.md)

**Relação com outras specs e documentos:**

| Artefato | Papel |
|----------|-------|
| [`ux-spec-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md`](./ux-spec-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md) | Base da experiência nacional-first sem IM/prefeitura como requisito padrão. |
| [`ux-spec-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md`](./ux-spec-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md) | Contexto do sintoma `prefeitura.login obrigatório`; esta nova spec substitui a hipótese de coletar credenciais neste fluxo. |
| [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md) | Runbook de triagem e comunicação operacional. |
| [`docs/technical/architecture-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md`](../technical/architecture-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md) | Base técnica do caso excepcional; esta spec fixa o comportamento UX de bloqueio. |

**Nota:** esta spec segue a decisão do PRD de **não** introduzir login/senha de prefeitura nem no frontend nem no backend deste fluxo.

---

## 1. Objetivo deste documento

Definir a experiência de frontend e UX para o cenário em que:

1. o fluxo MEI continua **NFS-e Nacional por padrão**;
2. o utilizador **não** vê nem preenche login/senha de prefeitura;
3. quando o PlugNotas exigir `nfse.config.prefeitura.login` / `senha`, o produto **bloqueia** esse caso com mensagem clara, sem reinterpretar o erro como “rota errada”.

O foco desta spec é transformar a decisão de produto em:

- hierarquia de interface;
- comportamento de erro;
- copy;
- acessibilidade;
- critérios de aceite UX.

---

## 2. Princípios de UX

| Princípio | Aplicação |
|-----------|-----------|
| **Nacional-first** | O fluxo principal continua apresentando NFS-e Nacional como modo padrão. |
| **Sem falsa promessa** | A UI não promete que todo emissor aceitará sempre cadastro nacional puro. |
| **Sem credenciais no produto** | Não existem campos, hints ou passos de login/senha de prefeitura na jornada padrão. |
| **Bloqueio claro, não técnico** | Quando a exceção ocorrer, a mensagem explica limitação do emissor/município sem expor JSON cru como narrativa principal. |
| **Causalidade correta** | O erro de cadastro vem antes de qualquer leitura de consulta posterior; `GET` negativo não vira causa raiz. |
| **A11y e foco** | O alerta principal deve ser anunciado claramente e manter a ação seguinte compreensível. |

---

## 3. Escopo da UX

### 3.1 Dentro do escopo

- callout e narrativa de **NFS-e Nacional** como padrão;
- ausência explícita de campos de credenciais municipais;
- tratamento de erro/bloqueio quando o emissor exigir `prefeitura.login` / `senha`;
- alinhamento de painéis de erro, retry e help links;
- critérios de QA visual e textual.

### 3.2 Fora do escopo

- formulário para credenciais municipais;
- qualquer fluxo híbrido “nacional + login da prefeitura”;
- redesign completo da Guia MEI;
- lógica backend de contrato ou segurança.

---

## 4. Arquitetura de informação

### 4.1 Área afetada

**Superfície principal:** Guia MEI, workspace de configuração fiscal / certificado / cadastro da empresa.

### 4.2 Hierarquia recomendada

| Ordem | Bloco | Regra |
|------|-------|-------|
| NATEX-L0 | Título da área fiscal/certificado | Sem mudança estrutural obrigatória |
| NATEX-L1 | Alertas existentes do fluxo | Mantidos |
| NATEX-L2 | Callout “NFS-e em ambiente nacional” | Reforça a política padrão |
| NATEX-L3 | Painel de erro ou retry | Recebe a narrativa de bloqueio da exceção |
| NATEX-L4 | Formulário padrão de empresa | Sem campos de login/senha de prefeitura |
| NATEX-L5 | Ações principais | Mantidas; sem CTA para informar credenciais municipais |

### 4.3 O que não deve existir

- campo “login da prefeitura”;
- campo “senha da prefeitura”;
- CTA “informar acesso municipal”;
- copy que sugira ao utilizador preencher esses dados no produto.

---

## 5. Comportamento do fluxo padrão

### 5.1 Estado neutro

O utilizador vê a configuração como **NFS-e Nacional** e entende que:

- o produto está configurando emissão em modo nacional;
- inscrição municipal e prefeitura não são campos obrigatórios dessa tela;
- o cadastro segue pelo fluxo já existente do emissor fiscal.

### 5.2 Callout informativo

**Título sugerido:** `NFS-e em ambiente nacional`

**Texto sugerido:**

> Esta configuração usa o fluxo de NFS-e Nacional no emissor fiscal.  
> Você não precisa informar inscrição municipal nem escolher prefeitura nesta etapa.

**Nota opcional curta:**

> Se o emissor pedir dados municipais, isso pode indicar uma limitação da conta ou do município para este fluxo.

### 5.3 Tom

- claro;
- direto;
- não defensivo;
- sem jargão JSON como texto principal.

---

## 6. Tratamento da exceção `prefeitura.login obrigatório`

### 6.1 Classificação UX

Nome da variante UX: **`prefeitura-login-required-blocked`**

Significado:

- o emissor exigiu credencial municipal;
- o produto **não suporta** essa credencial neste fluxo;
- o utilizador deve receber orientação clara de limite e próximo passo.

### 6.2 Regra de apresentação

Quando o erro corresponder a `prefeitura.login`, `prefeitura.senha` ou equivalente:

- mostrar um único alerta principal;
- não abrir formulário adicional;
- não sugerir editar a tela para preencher um campo inexistente;
- permitir revisão geral dos dados já existentes, mas sem implicar que isso resolverá a exigência municipal;
- oferecer link para guia operacional quando disponível.

### 6.3 Título do alerta

**Título sugerido:** `Este município exige uma configuração não suportada neste fluxo`

Alternativa aceitável:

`Não foi possível concluir o cadastro no emissor`

com subtítulo explicativo claro.

### 6.4 Corpo do alerta

**Texto sugerido:**

> O emissor fiscal informou que este cadastro exige dados de acesso ao portal da prefeitura.  
> O fluxo atual da Guia MEI foi desenhado para NFS-e Nacional e não permite informar esse tipo de credencial.  
> Revise o ambiente configurado e consulte o guia operacional. Se o erro persistir, este município ou conta pode não ser compatível com este fluxo no momento.

### 6.5 Próximos passos sugeridos na UI

Botões/links aceitáveis:

- `Ver guia de operação`
- `Revisar dados`
- `Tentar novamente`

Observação:

- `Tentar novamente` pode existir por consistência do fluxo, mas não deve ser a única orientação quando o erro for claramente de exceção bloqueada.

### 6.6 O que evitar

- “Preencha seu login da prefeitura”
- “Informe a senha do portal”
- “Cadastre a prefeitura para continuar”
- “Endpoint errado”
- “Rota incorreta”
- “Bug do emissor”

---

## 7. Regras de copy

### 7.1 Deve comunicar

- NFS-e Nacional continua sendo o padrão;
- o emissor pediu algo fora do escopo do fluxo;
- o problema pode estar ligado à conta, município ou configuração do emissor;
- o produto não aceita esse dado neste fluxo;
- existe guia operacional / próximo passo.

### 7.2 Não deve comunicar

- que o utilizador errou por não preencher um campo inexistente;
- que o sistema futuramente aceitará credenciais sem aprovação;
- que basta insistir no retry;
- que o problema é arquitetural ou de endpoint.

---

## 8. Heurística de detecção no frontend

O frontend pode classificar a exceção quando a mensagem normalizada contiver padrões como:

- `prefeitura.login`
- `nfse.config.prefeitura.login`
- `prefeitura.senha`
- `preenchimento obrigatório` em combinação com `prefeitura` e `login`

Prioridade de narrativa:

1. `prefeitura.login` / `senha` obrigatório → **exceção bloqueada**
2. tabela IBGE / cidade inválida → narrativa IBGE
3. ausência genérica de `prefeitura` → narrativa PREFB/trilho B

Esta ordem evita que a UI apresente o problema errado.

---

## 9. Estados de interface

| Estado | Comportamento UX |
|--------|-------------------|
| **Sucesso padrão** | Mantém narrativa nacional; sem menção a exceção municipal |
| **Erro de ambiente** | Orienta revisar host/token/ambiente; não mistura com credencial municipal |
| **Erro de payload** | Orienta revisão de dados enviados; não fala em login municipal se a mensagem não indicar isso |
| **Exceção municipal bloqueada** | Mostra alerta de limite do fluxo com próximos passos |
| **GET posterior sem empresa** | Mantém causalidade: cadastro não concluiu, portanto a consulta não encontrou registro |

---

## 10. Acessibilidade

- o alerta principal usa `role="alert"` ou padrão equivalente já usado na tela;
- o callout informativo nacional pode usar `role="region"` com `aria-labelledby`;
- links e botões devem ter rótulos explícitos;
- foco deve permanecer no primeiro erro relevante após submissão;
- não duplicar múltiplos alertas com o mesmo texto.

---

## 11. Critérios de aceite UX

- [ ] A tela continua apresentando **NFS-e Nacional** como modo padrão.
- [ ] Não existem campos de login/senha de prefeitura na jornada.
- [ ] Um erro com `prefeitura.login obrigatório` gera narrativa de **exceção não suportada**, não de endpoint errado.
- [ ] O alerta orienta próximo passo sem pedir credenciais no produto.
- [ ] O `GET` negativo posterior não é apresentado como causa raiz.
- [ ] A copy distingue esse caso de erro de ambiente e erro de payload genérico.
- [ ] O comportamento é acessível e compatível com o padrão de alertas já usado na Guia MEI.

---

## 12. Arquivos prováveis para implementação

| Arquivo | Papel provável |
|---------|----------------|
| `frontend/src/pages/GuidesMei.tsx` | Callout nacional, painéis de erro e narrativa principal |
| `frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts` | Heurística de classificação da exceção |
| `frontend/src/lib/fiscalUserError.ts` | Mapeamento de copy para a exceção bloqueada |
| `docs/operacao-mei-nfse.md` | Guia operacional e triagem espelhando a decisão de produto |

---

## 13. Wireframe textual

```text
[ Configuração fiscal / Certificado ]

[ alertas existentes ]

[ NFS-e em ambiente nacional ]
[ Texto curto explicando o modo padrão ]

[ Alerta principal de erro, quando houver ]
[ Mensagem de bloqueio da exceção municipal ]
[ Ver guia de operação ] [ Revisar dados ] [ Tentar novamente ]

[ formulário padrão da empresa ]
[ sem campos de login/senha da prefeitura ]

[ CTA principal ]
```

---

## Change log

| Versão | Data | Nota |
|--------|------|------|
| 1.0 | 2026-04-10 | Spec inicial derivada do PRD `PRD-nfse-nacional-padrao-com-excecao-credenciais-prefeitura-plugnotas-2026-04-09.md`, fixando NFS-e Nacional como padrão e o bloqueio da exceção `prefeitura.login` sem coleta de credenciais no frontend. |
