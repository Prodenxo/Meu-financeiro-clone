# Especificação de front-end e UX — cadastro de empresa PlugNotas robusto para cenários de NFS-e Nacional, fallback e exceções municipais

**Versão:** 1.0  
**Data:** 2026-04-10  
**Autoria:** Uma (UX design expert, fluxo AIOX)  
**PRD fonte:** [docs/prd/PRD-cadastro-empresa-plugnotas-robusto-cenarios-nacional-fallback-excecao-2026-04-10.md](../prd/PRD-cadastro-empresa-plugnotas-robusto-cenarios-nacional-fallback-excecao-2026-04-10.md)

**Artefatos de apoio:**

- [docs/brief/brief-cadastro-empresa-plugnotas-robusto-cenarios-nacional-fallback-excecao-2026-04-10.md](../brief/brief-cadastro-empresa-plugnotas-robusto-cenarios-nacional-fallback-excecao-2026-04-10.md)
- [docs/specs/ux-spec-nfse-nacional-padrao-bloqueio-excecao-credenciais-prefeitura-plugnotas-2026-04-10.md](./ux-spec-nfse-nacional-padrao-bloqueio-excecao-credenciais-prefeitura-plugnotas-2026-04-10.md)
- [docs/specs/ux-spec-fix-cadastro-empresa-plugnotas-endpoint-canonico-2026-04-09.md](./ux-spec-fix-cadastro-empresa-plugnotas-endpoint-canonico-2026-04-09.md)
- [docs/operacao-mei-nfse.md](../operacao-mei-nfse.md)

---

## 1. Objetivo deste documento

Traduzir o PRD de robustez em comportamento de frontend e UX para o cadastro da empresa no PlugNotas, garantindo que a interface:

1. preserve **NFS-e Nacional** como narrativa padrão;
2. trate o cadastro como uma jornada única, via Guia MEI e BFF;
3. responda corretamente aos cenários de sucesso, conflito, erro e exceção;
4. mantenha a causalidade correcta entre `POST`, `PATCH` e `GET`;
5. não reintroduza narrativa de endpoint errado nem recolha de credenciais municipais.

---

## 2. Princípios de UX

| Princípio | Aplicação |
|-----------|-----------|
| **Nacional-first** | A jornada continua apresentando NFS-e Nacional como modo padrão da configuração. |
| **Uma única experiência** | O utilizador continua dentro da Guia MEI; não existe nova rota visual de cadastro. |
| **Causalidade correta** | O que acontece no `POST` deve comandar a narrativa; o `GET` posterior não pode apagar a origem do problema. |
| **Sem falso diagnóstico** | A UI não deve chamar problemas de payload, ambiente ou exceção municipal de “rota errada”. |
| **Sem credenciais municipais no produto** | Não existem campos, CTAs ou hints para login/senha de prefeitura neste fluxo. |
| **Erro orientado a ação** | Cada cenário deve apontar um próximo passo útil, sem expor jargão técnico como narrativa principal. |

---

## 3. Escopo da UX

### 3.1 Dentro do escopo

- comportamento da Guia MEI no cadastro da empresa;
- estados de carregamento, sucesso, sincronização e erro;
- copy e hierarquia de alertas para os seis cenários do PRD;
- causalidade entre cadastro, fallback e consulta;
- consistência com o runbook operacional.

### 3.2 Fora do escopo

- redesign integral da Guia MEI;
- nova superfície “add company”;
- integração direta browser -> PlugNotas;
- recolha de credenciais municipais;
- mudança da política nacional-first.

---

## 4. Superfície principal

**Área afetada:** Guia MEI, etapa de setup da emissão fiscal / certificado / cadastro da empresa.

**Mensagem mental que a interface deve sustentar:**  
“Estou configurando a minha empresa no emissor fiscal num fluxo de NFS-e Nacional. Se falhar, a aplicação deve dizer claramente se foi um problema de ambiente, dados, sincronização ou limitação do emissor.”

---

## 5. Arquitetura de informação

| Ordem | Bloco | Regra |
|------|-------|-------|
| ROB-L0 | Título da área fiscal | Mantido |
| ROB-L1 | Callout de contexto nacional | Reforça NFS-e Nacional como padrão |
| ROB-L2 | Formulário padrão da empresa | Sem campos de login/senha de prefeitura |
| ROB-L3 | Estado de submissão | Fala em cadastro/configuração da empresa no emissor |
| ROB-L4 | Alerta principal de cenário | Varia conforme a classe do resultado |
| ROB-L5 | CTA de continuação/revisão | Ajustado ao cenário, sem abrir fluxo paralelo |

### O que não deve existir

- campo “login da prefeitura”;
- campo “senha da prefeitura”;
- CTA “informar acesso municipal”;
- copy principal com `POST /empresa`, `PATCH /empresa/:cnpj`, `GET /empresa/:cnpj`, “endpoint errado” ou “rota errada”.

---

## 6. Estado base da jornada

### 6.1 Estado neutro

O utilizador vê o setup como configuração de emissão em **NFS-e Nacional**.

**Callout sugerido:**

**Título:** `NFS-e Nacional como padrão`

**Texto:**

> Esta etapa configura o cadastro da empresa no emissor fiscal para o fluxo nacional.  
> Você não precisa informar login ou senha de prefeitura nesta jornada.

### 6.2 Estado de carregamento

**Copy sugerida:**

- `Cadastrando a empresa no emissor...`
- `Verificando o cadastro da empresa...`
- `Sincronizando o cadastro existente...`

Regras:

- o texto não deve mencionar PlugNotas como endpoint;
- o estado deve continuar parecendo uma única tarefa de produto, não uma sequência técnica.

---

## 7. Estados obrigatórios por cenário

### 7.1 Cenário A — sucesso nacional padrão

**Objetivo UX:** confirmar que o cadastro concluiu normalmente.

**Título sugerido:** `Empresa configurada com sucesso`

**Texto sugerido:**

> O cadastro da empresa no emissor fiscal foi concluído com sucesso.

**CTA sugerido:** `Continuar`

### 7.2 Cenário B — erro de ambiente/configuração

**Objetivo UX:** mostrar que a falha parece estrutural do ambiente, não dos dados da empresa.

**Título sugerido:** `Não foi possível concluir a integração neste ambiente`

**Texto sugerido:**

> A aplicação não conseguiu concluir o cadastro da empresa no emissor com a configuração atual do ambiente.  
> Revise o ambiente configurado e tente novamente.

**CTA sugerido:**

- `Tentar novamente`
- `Ver guia de operação`

**Regra:** não sugerir correção manual de login/senha ou acusar rota errada.

### 7.3 Cenário C — erro de payload/contrato

**Objetivo UX:** mostrar que os dados enviados foram rejeitados.

**Título sugerido:** `Não foi possível validar os dados da empresa`

**Texto sugerido:**

> O emissor fiscal rejeitou os dados enviados para o cadastro da empresa.  
> Revise as informações preenchidas e tente novamente.

**CTA sugerido:**

- `Revisar dados`
- `Tentar novamente`

**Regra:** se houver detalhe adicional, ele deve aparecer como apoio, não como narrativa principal.

### 7.4 Cenário D — conflito com fallback / empresa já existente

**Objetivo UX:** tratar fallback bem-sucedido como resolução operacional, não como erro.

**Título sugerido:** `Empresa sincronizada com sucesso`

**Texto sugerido:**

> A empresa já existia no emissor fiscal e foi sincronizada com os dados atuais.

**CTA sugerido:** `Continuar`

**Regra:** se o backend devolver `updated` ou `existing`, a UI deve preferir linguagem de sincronização/atualização.

### 7.5 Cenário E — exceção municipal bloqueada

**Objetivo UX:** comunicar limitação do fluxo nacional sem pedir credenciais.

**Título sugerido:** `Este município exige uma configuração não suportada neste fluxo`

**Texto sugerido:**

> O emissor fiscal informou que este cadastro exige dados de acesso ao portal da prefeitura.  
> O fluxo atual da Guia MEI foi desenhado para NFS-e Nacional e não permite informar esse tipo de credencial.  
> Revise o ambiente configurado e consulte o guia operacional. Se o erro persistir, este município ou conta pode não ser compatível com este fluxo no momento.

**CTA sugerido:**

- `Ver guia de operação`
- `Revisar dados`
- `Tentar novamente`

**Regra:** nunca sugerir “informar login da prefeitura”.

### 7.6 Cenário F — `GET` negativo após `POST` falho

**Objetivo UX:** manter a narrativa causal correta.

**Título sugerido:** `O cadastro da empresa ainda não foi concluído`

**Texto sugerido:**

> A empresa ainda não aparece na consulta porque o cadastro anterior não foi concluído no emissor fiscal.

**CTA sugerido:**

- `Revisar dados`
- `Tentar novamente`
- `Ver guia de operação`

**Regra:** não tratar o `GET` negativo como falha independente se houver falha relevante anterior.

---

## 8. Contrato mínimo consumido pelo frontend

Para classificar corretamente os cenários, o frontend deve consumir, quando disponíveis:

- `plugnotasRequest.method`
- `plugnotasRequest.path`
- `plugnotasCode`
- `httpStatus`

### Regras UX para esse contrato

1. Esses metadados orientam a classificação interna e a copy.
2. Eles não devem aparecer como narrativa principal ao utilizador final.
3. Eles podem sustentar detalhe técnico secundário, logs ou help interno quando o padrão da tela já permitir isso.
4. A classificação de exceção municipal bloqueada tem prioridade sobre interpretações genéricas de payload quando `plugnotasCode = prefeitura_login_required_blocked` ou equivalente textual claro.

---

## 9. Hierarquia de mensagens

Ordem recomendada em qualquer cenário de erro:

1. título orientado a tarefa;
2. descrição curta do que aconteceu;
3. próximo passo seguro;
4. detalhe técnico opcional, se já houver superfície apropriada.

### Copy permitida

Preferir:

- `cadastrar a empresa no emissor`
- `sincronizar cadastro`
- `revisar dados`
- `ver guia de operação`
- `não foi possível concluir`

Evitar:

- `endpoint errado`
- `rota errada`
- `POST /empresa`
- `PATCH /empresa/:cnpj`
- `GET /empresa/:cnpj`
- `adicione login da prefeitura`

---

## 10. Regras de fallback e causalidade

### 10.1 Quando o backend resolver via `PATCH`

- a UI trata como sucesso operacional;
- a linguagem preferida é “sincronizado” ou “atualizado”;
- não mostrar conflito como erro se a operação final foi satisfatória.

### 10.2 Quando houver falha no `POST` seguida de `GET` negativo

- a UI mantém a causa raiz no topo da narrativa;
- o `GET` negativo aparece, quando necessário, como confirmação de que o cadastro ainda não foi persistido;
- não abrir segundo alerta com causalidade invertida.

---

## 11. Acessibilidade

- alertas principais usam `role="alert"` ou padrão equivalente já usado na tela;
- o callout nacional pode usar `role="region"` com `aria-labelledby`;
- foco deve ser direcionado para o primeiro erro relevante após submissão;
- não duplicar dois alertas com o mesmo significado;
- CTAs devem ter rótulos explícitos e acionáveis.

---

## 12. Critérios de aceite UX

- [ ] A jornada continua apresentando **NFS-e Nacional** como padrão.
- [ ] Não existem campos, hints ou CTAs para `login`/`senha` de prefeitura.
- [ ] O frontend distingue corretamente os seis cenários obrigatórios do PRD.
- [ ] O fallback bem-sucedido via conflito é comunicado como sincronização/atualização, não como erro.
- [ ] A exceção municipal bloqueada não é apresentada como endpoint errado.
- [ ] O `GET` negativo posterior não substitui a causa raiz do `POST`.
- [ ] A UI utiliza `plugnotasRequest.method`, `plugnotasRequest.path`, `plugnotasCode` e `httpStatus` como base de classificação quando disponíveis.

---

## 13. Referência de ficheiros para implementação futura

| Área | Ficheiros prováveis |
|------|---------------------|
| Página principal | `frontend/src/pages/GuidesMei.tsx` |
| Serviço BFF | `frontend/src/services/meiNotasService.ts` |
| Orquestração do cadastro | `frontend/src/utils/plugnotasEmitenteSetup.ts` |
| Componentes de alerta/erro | `frontend/src/components/FiscalIntegrationErrorAlert.tsx` e afins |
| Classificação de erro | `frontend/src/lib/fiscalUserError.ts`, `frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts` |

---

## 14. Change log

| Versão | Data | Alteração |
|--------|------|-----------|
| 1.0 | 2026-04-10 | Spec inicial derivada do PRD de robustez do cadastro de empresa PlugNotas por cenários. |

---

*Especificação brownfield de frontend e UX para tornar robusta a jornada de cadastro de empresa PlugNotas na Guia MEI, preservando NFS-e Nacional como padrão, fallback operacional e exceção municipal bloqueada.*
