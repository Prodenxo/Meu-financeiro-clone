# Brief: mensagens de erro compreensíveis para o utilizador final (MEI / app geral)

**Data:** 2026-04-07  
**Origem:** pedido de produto — reduzir desorientação quando algo falha (copy e estrutura de erro na UI).  
**Produto:** Meu Financeiro — especialmente **Guia MEI**, emissão fiscal, cadastros e fluxos que dependem de **rede**, **sessão** e **provedor externo (Plugnotas)**.

**Documentos e código relacionados (não substituídos por este brief):**

- `frontend/src/lib/fiscalUserError.ts` — `mapMeiFiscalErrorToCopy`, fallbacks e heurísticas (mensagem útil vs JSON opaco).  
- `frontend/src/components/FiscalIntegrationErrorAlert.tsx` — blocos de falha com texto longo do provedor + aviso “veio do emissor”.  
- `frontend/src/components/FetchErrorBanner.tsx` — padrão de erro de carregamento + “Tentar novamente”.  
- `frontend/src/utils/buildApiErrorMessage.ts` — concatenação de `message`, `details`, método/path e tentativas Plugnotas (hoje pode soar **técnica** na string única mostrada ao utilizador).  
- Especificações UX: `docs/specs/ux-spec-mei-nfse-workspace-2026-04-01.md`, `docs/specs/ux-spec-guia-mei-emissao-nfe-nfce-2026-04-06.md` (secções de erro, quando existirem).

**Próximos passos típicos:** `@pm` — critérios de aceite e inventário de superfícies; `@ux-design-expert` — tom, hierarquia título/descrição/ação; `@dev` — unificar caminho de erro API → UI e testes de copy.

---

## 1. Resumo executivo

Hoje o produto já **protege** em parte o utilizador (ex.: não promover JSON opaco como mensagem principal; copy mapeada em `mapMeiFiscalErrorToCopy`; avisos de que a falha pode vir do **provedor fiscal**). Ainda assim, em vários fluxos a pessoa vê **mensagens genéricas** (“Erro na requisição”), **jargão** (HTTP, paths, “emissor”), ou **textos longos** sem um **próximo passo** claro — o que gera abandono, contactos de suporte repetitivos e sensação de “o site partiu-se”.

Este brief pede uma **atualização coordenada de UX e engenharia**: toda mensagem de erro visível ao utilizador final deve comunicar **o que falhou em linguagem simples**, **o que pode fazer a seguir** (incluindo “tentar de novo” / “verificar internet” / “voltar ao passo X”), e **quem é a fonte** (app vs rede vs emissor), sem expor detalhes internos desnecessários.

---

## 2. Problema / oportunidade

| Dimensão | Situação atual | Risco ou oportunidade |
|----------|----------------|------------------------|
| **Literacia técnica** | Parte das strings vem de APIs ou de `Error.message` agregado. | Utilizadores **não técnicos** não sabem se devem repetir, corrigir dados ou esperar. |
| **Consistência** | Há componentes bons (`FetchErrorBanner`, alertas fiscais) mas o mesmo tipo de falha pode aparecer com **tons diferentes** noutros ecrãs. | Confiança baixa; parece “sistema instável” em vez de “problema pontual recuperável”. |
| **Hierarquia** | Título + corpo + CTA nem sempre existem; às vezes só um parágrafo denso. | **Carga cognitiva** alta; utilizador não escaneia a solução. |
| **Provedor vs app** | Já existe explicação em alertas fiscais; noutros sítios pode parecer **culpa da app**. | Frustração e reputação; falta de “o que muda no meu lado”. |
| **Acessibilidade** | `role="alert"` já aparece em vários blocos. | Garantir que **título** e **ação** são anunciados de forma útil (revisão com critérios de aceite). |

**Público-alvo explícito:** microempreendedor e utilizador **sem** familiaridade com HTTP, logs ou integrações — sem pejorativos; tratar como **requisito de clareza universal** (beneficia todos).

---

## 3. Objetivos

1. **Definir um padrão único de mensagem de erro** na UI: *título curto* (o que aconteceu) + *explicação em frases curtas* (porquê, em linguagem de utilizador) + *ação primária* (botão ou link) + *ação secundária opcional* (ex.: “Saiba mais”, documentação MEI).  
2. **Inventariar e classificar** erros por origem: rede/indisponível, sessão/expirada, validação de dados, rejeição SEFAZ/provedor, erro desconhecido — com **copy aprovada** por categoria.  
3. **Evitar** mostrar ao utilizador: stack traces, JSON bruto, paths internos, códigos opacos **sem** tradução; quando o código for útil ao suporte, colocá-lo em **área colapsável** ou “detalhes para suporte” (decisão de produto).  
4. **Alinhar backend e frontend** onde `buildApiErrorMessage` ou mensagens cruas chegam diretamente à UI — separar **mensagem humana** de **metadados técnicos** (ou mapear no cliente).  
5. **Medir** (mínimo): checklist de revisão manual nos fluxos críticos Guia MEI / emissão / cadastro; opcional: eventos analíticos “erro mostrado” com `category` estável (sem PII).

---

## 4. Fora de âmbito (por agora)

- Substituir completamente o texto técnico que o **contabilista** ou suporte precisa de ver nos painéis admin (se existirem) — pode coexistir com vista “utilizador”.  
- Internacionalização completa (i18n) — a menos que a story derivada o inclua explicitamente.  
- Garantir **zero** erros do provedor — apenas **como** os comunicamos.

---

## 5. Princípios de redação (rascunho para UX/PM)

1. **Uma ideia por frase**; evitar duplo negativo.  
2. **Verbos no imperativo amigável**: “Verifique…”, “Tente…”, “Confirme…”.  
3. **Não culpar** o utilizador; quando for erro de sistema/rede, dizer isso com neutralidade.  
4. **Fonte da mensagem**: quando for do emissor, manter ou reforçar a ideia “a validação veio do serviço de notas” + o que pode corrigir nos dados.  
5. **Fallback seguro**: se não soubermos classificar, mensagem genérica **mas** com passos: repetir, verificar ligação, contactar suporte com descrição do que estava a fazer.

---

## 6. Superfícies prioritárias (para inventário na story)

1. Guia MEI — certificado, capacidade fiscal, emissão NFSe / NF-e / NFC-e.  
2. Catálogos / modais MEI (cliente, produto) — erros de gravação e rede.  
3. Transações / calendário — mensagens atualmente derivadas de `Error.message` na store.  
4. Definições e fluxos de sessão (401/403 já mapeados em `fiscalUserError`; replicar padrão noutros ecrãs).  
5. Qualquer uso direto de `buildApiErrorMessage` ou `throw new Error(text)` que vá parar a toast/banner sem passar por mapeamento humano.

---

## 7. Critérios de aceite sugeridos (para a story / QA)

- [ ] Nenhum utilizador **só** vê “Erro na requisição” sem segunda linha de orientação em fluxos P0 (lista acima).  
- [ ] Mensagens prioritárias passam por **revisão de legibilidade** (ex.: índice de leitura ou checklist interno de copy).  
- [ ] Onde houver texto do provedor longo, existe **título** em linguagem simples **acima** do detalhe técnico (ou colapsável “Detalhes técnicos”).  
- [ ] CTAs de recuperação (retry, “voltar ao passo”, link de ajuda) estão presentes quando a falha for **recuperável**.  
- [ ] Testes automatizados ou snapshots cobrem **pelo menos** o mapeamento central (`mapMeiFiscalErrorToCopy` / novos mapeadores equivalentes para API geral).

---

## 8. Riscos e dependências

- **Dependência** de respostas estáveis do backend (`success: false`, códigos de negócio) para mapear sem adivinhar texto em inglês do provedor.  
- **Risco** de esconder demais e impedir suporte — mitigar com “copiar detalhes” ou ID de correlação (se política de privacidade permitir).  
- **Esforço** disperso se cada página tratar erro isoladamente — preferir **camada única** (hook, helper, componente) após o inventário.

---

## 9. Entregáveis esperados

1. Documento de **inventário de erros** (tabela: origem, exemplo atual, copy proposta, CTA).  
2. **Componente ou contrato** único para “erro ao utilizador” (props: `variant`, `source`, `recoverable`, `technicalDetail?`).  
3. Atualização das **specs UX** referenciadas com exemplos de copy.  
4. PR de implementação com testes nos mapeamentos críticos.

---

— Brief preparado para handoff AIOX (analyst → pm / dev).
