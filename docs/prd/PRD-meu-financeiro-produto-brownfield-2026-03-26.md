# PRD — Meu Financeiro (brownfield)

**Versão:** 1.0  
**Data:** 2026-03-26  
**Tipo:** Brownfield (produto em evolução)  
**Fontes:** `docs/brief.md`, `docs/brief-event1-1.md`, `docs/brief/brief-user-mei-certificates-nfse-campos-supabase.md`

---

## 1. Resumo executivo

O **Meu Financeiro** integra gestão financeira, fluxos MEI (DAS, guias), emissão fiscal (NFS-e via Plugnotas) e administração multi-empresa. Este PRD consolida **iniciativas de produto** derivadas dos briefs em `docs/`, com foco em valor para contador/admin e MEI, redução de fricção operacional e **consistência de dados** entre aplicação, Supabase e emissor fiscal.

**Relação com outros documentos**

- **Endurecimento de segurança e qualidade de release:** permanece canónico em `docs/prd.md` (P0–P2). As iniciativas abaixo assumem compatibilidade com esses requisitos (sem expor segredos, gates de release respeitados).
- **Operação MEI/NFS-e:** referência técnica em `docs/operacao-mei-nfse.md` e ADRs em `docs/adr/`.

---

## 2. Visão de produto

Oferecer ao MEI e ao contador **visibilidade confiável**, **automação onde importa** e **cadastros alinhados** entre UI, base de dados e integrações externas (Serpro, Plugnotas), sem obrigar retrabalho manual nem intervenção direta no banco para rotinas recorrentes.

---

## 3. Problemas e oportunidades (síntese dos briefs)

| Iniciativa | Problema | Oportunidade |
|------------|----------|--------------|
| **Automação DAS** (`docs/brief.md`) | Acompanhamento mensal manual por cliente/competência; pouca visibilidade de pendências. | Job mensal, PDF persistido, painel consolidado de pendências para o contador. |
| **Dados NFS-e em `user_mei_certificates`** (`docs/brief/...nfse-campos-supabase.md`) | Dados do formulário “mínimos para NFS-e” não espelhados na app de forma durável; dificulta auditoria e atualização sem novo `.pfx`. | Persistir emitente/endereço/regime no Supabase; API de leitura/escrita e fluxo “só atualizar dados fiscais”. |
| **event1-1** (`docs/brief-event1-1.md`) | Sem cadastro de empresa via UI; bug de download automático de DAE; UX frágil em `/settings/users`. | Modal de empresa + API Brasil; correção de efeitos colaterais em `GuidesMei`; loading e busca utilizáveis em `ManageUsers`. |

---

## 4. Personas e stakeholders

| Persona | Necessidade principal | Brief associado |
|---------|------------------------|-----------------|
| **Contador / Admin** | Ver pendências DAS em massa; operar sem surpresas (downloads, estados de tela). | DAS, event1-1 |
| **Superadmin** | Cadastrar/editar empresa na UI; configurar ambiente sem SQL manual. | event1-1 |
| **MEI (utilizador final)** | Emitir NFS-e com dados corretos; atualizar cadastro fiscal sem reenviar certificado quando possível. | NFS-e / certificado |

**Stakeholders internos:** Produto (priorização), Engenharia (backend/frontend), QA (gates), Operação (segredos, deploy).

---

## 5. Escopo por iniciativa

### 5.1 Iniciativa — Automação mensal do DAS e painel de pendências

**Objetivo de negócio:** automatizar geração/armazenamento do DAS por competência e dar ao contador lista acionável de clientes pendentes.

**Escopo must-have (MVP do brief)**

- Job mensal (ex.: dia 1, horário definido, fuso `America/Sao_Paulo`).
- Utilizadores elegíveis da empresa do admin; documento principal via `cert_document`.
- Persistência do PDF e metadados; estado **pago** / **pendente**.
- Painel consolidado de pendências DAS.

**Fora do MVP do brief:** cobrança automática multicanal, regras avançadas de parcelamento, analytics históricos pesados.

**Critérios de sucesso (produto):** execução confiável do job; cobertura elevada de clientes elegíveis; tempo para identificar pendentes no painel abaixo do limiar definido no brief.

---

### 5.2 Iniciativa — Persistência dos dados mínimos NFS-e (`user_mei_certificates`)

**Objetivo de negócio:** os dados enviados no fluxo de emissão (e espelhados no Plugnotas) ficam **gravados na app** para reabertura de formulário, auditoria e atualização cadastral **sem novo certificado** quando aplicável.

**Escopo funcional**

- Migração aplicada: `supabase/migrations/20260326140000_add_nfse_emitente_fields_to_user_mei_certificates.sql` (colunas razão social, fantasia, email fiscal, regime, IM, endereço, IBGE, UF, optante Simples, etc.).
- Backend: estender `mei-certificate-store` (merge/patch sem apagar `.pfx`); expor leitura para UI; normalização CNPJ/CEP/UF conforme convenção.
- API: upload com dados NFS-e e/ou endpoint dedicado para patch só de dados fiscais (autenticado, MEI habilitado).
- Frontend: formulário ligado ao contrato; unificar **Rua** e **Logradouro** para a coluna `logradouro` se o ecrã tiver dois campos.
- **Decisão de produto a documentar na story:** fonte de verdade (A) Supabase espelha payload enviado ao Plugnotas após sucesso; (B) Supabase primeiro e montagem do payload a partir daí.

**Fora de escopo:** novo motor de emissão; mudança de política fiscal além do fluxo MEI/NFS-e já descrito nos ADRs.

**Critérios de sucesso:** dados persistidos e relidos na UI; fluxo “atualizar sem novo `.pfx`” não corrompe certificado; RLS mantém acesso apenas ao dono da linha.

---

### 5.3 Iniciativa — event1-1 (UX, estabilidade, cadastro de empresa)

**Objetivo de negócio:** reduzir fricção de admin e eliminar comportamentos que quebram confiança.

**Entregas**

1. **Empresa:** card e modal em `/settings`; autopreenchimento via API Brasil; `POST/PUT` empresas no backend; acesso **superadmin** apenas.
2. **GuidesMei:** eliminar download automático de DAE ao “Atualizar histórico”; download só por clique explícito.
3. **ManageUsers:** loading de tela completa até dados prontos; busca sempre visível; estado vazio com termo; busca fuzzy + debounce conforme brief.

**Critérios de sucesso:** critérios de aceite do próprio brief-event1-1 (zero downloads involuntários; cadastro sem SQL; UX de busca/loading validada).

---

## 6. Requisitos funcionais (consolidados)

| ID | Requisito | Iniciativa |
|----|-----------|------------|
| FR-P-01 | Job mensal DAS com escopo e persistência definidos no brief DAS | DAS |
| FR-P-02 | Painel do contador com visão de pendências por cliente/competência | DAS |
| FR-P-03 | Gravar e ler campos NFS-e em `user_mei_certificates` alinhados à migração | NFS-e |
| FR-P-04 | Atualizar só dados fiscais/endereço sem exigir novo `.pfx` | NFS-e |
| FR-P-05 | Cadastrar/editar empresa pela UI com validação de papel superadmin | event1-1 |
| FR-P-06 | Download de guia DAE apenas por ação explícita do utilizador | event1-1 |
| FR-P-07 | Loading global e busca robusta em gestão de utilizadores | event1-1 |

---

## 7. Requisitos não funcionais

| ID | Requisito | Notas |
|----|-----------|--------|
| NFR-01 | Segurança | RLS nas tabelas com PII; senha de certificado nunca em claro (fluxo atual AES-GCM). Alinhado a `docs/prd.md`. |
| NFR-02 | Privacidade | Dados fiscais/endereço apenas para o utilizador autenticado dono da linha. |
| NFR-03 | Qualidade | `npm run lint`, `typecheck`, `test` nos entregáveis tocados; regressão NFSe/DAS conforme QA. |
| NFR-04 | Observabilidade | Erros de integração acionáveis; sem vazar segredos em logs/respostas. |

---

## 8. Métricas de sucesso (produto)

- **DAS:** taxa de execução do job, cobertura de clientes elegíveis, indicadores de pendência pós-competência (KPIs do brief).
- **NFS-e:** percentagem de configurações com dados completos persistidos; redução de suporte por “cadastro só no Plugnotas”.
- **event1-1:** eliminação do bug de download; tempo de cadastro de empresa via UI; satisfação operacional qualitativa em admin.

---

## 9. Riscos e mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Fonte de verdade duplicada (empresa vs certificado vs Plugnotas) | Divergência de dados | Decisão explícita na story NFS-e; ADR se necessário. |
| `regime_tributario` ambíguo entre UI e Plugnotas | Erro de emissão | Documentar códigos aceites; validar no backend. |
| Job DAS falhar em massa | Contadores sem PDFs | Retries, alertas operacionais, runbook. |
| Escopo event1-1 acoplado a refactor grande | Atraso | Entregar por feature com flags se aplicável. |

---

## 10. Priorização sugerida (MoSCoW)

| Prioridade | Item |
|------------|------|
| **Must** | Correção download automático DAE (event1-1); P0 segurança em `docs/prd.md` onde bloqueante |
| **Should** | Persistência NFS-e + API patch; cadastro empresa UI + endpoints |
| **Could** | Automação DAS mensal completa + painel (depende de capacidade de backend/cron) |
| **Won’t (neste ciclo)** | Mensageria automática de cobrança; dashboards analíticos longos |

*(Ajustar com capacidade da equipa e dependências de infraestrutura.)*

---

## 11. Critérios de release (consolidado)

1. Iniciativas entregues cumprem critérios de aceite dos respetivos briefs.
2. Nenhuma regressão nos fluxos MEI/NFSe críticos; evidências QA quando aplicável.
3. Gates de qualidade do repositório (`AGENTS.md`) verdes nos pacotes alterados.
4. Migrações Supabase aplicadas em ordem; RLS revista para novas colunas em `user_mei_certificates`.

---

## 12. Dependências e próximos passos

- **@sm:** desdobrar este PRD em **stories** em `docs/stories/` por iniciativa (IDs FR-P-01…).
- **@architect:** validar desenho da fonte de verdade NFS-e e job DAS (cron, filas).
- **@dev:** implementação alinhada a `docs/brief/...nfse-campos-supabase.md` secção 7 para persistência.

---

## 13. Referências

- `docs/brief.md` — automação DAS  
- `docs/brief-event1-1.md` — UX, empresa, ManageUsers, GuidesMei  
- `docs/brief/brief-user-mei-certificates-nfse-campos-supabase.md` — mapeamento e alterações de código NFS-e  
- `docs/prd.md` — endurecimento segurança e qualidade  
- `docs/operacao-mei-nfse.md` — endpoints e operação NFSe  

---

— *PRD consolidado a partir dos project briefs em `docs/`. Próximo passo recomendado: backlog priorizado e stories.*
